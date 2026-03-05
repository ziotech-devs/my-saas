import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { User } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import type Stripe from "stripe";

import type { Config } from "../config/schema";
import { StripeService } from "./stripe/stripe.service";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService<Config>,
  ) {}

  async getBillingItemById(id: string) {
    return this.prisma.billingItem.findUnique({
      where: { id },
    });
  }

  async getAllBillingItems() {
    return this.prisma.billingItem.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  async getOrCreateStripeCustomer(user: User): Promise<string> {
    const existing = await this.prisma.billingCustomer.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      return existing.stripeCustomerId;
    }

    const stripeCustomer = await this.stripeService.createCustomer(user.email, user.name);

    await this.prisma.billingCustomer.create({
      data: {
        userId: user.id,
        stripeCustomerId: stripeCustomer.id,
      },
    });

    return stripeCustomer.id;
  }

  async createCheckoutSession(
    user: User,
    stripePriceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<string> {
    const stripeCustomerId = await this.getOrCreateStripeCustomer(user);

    const session = await this.stripeService.createCheckoutSession({
      stripeCustomerId,
      stripePriceId,
      successUrl,
      cancelUrl,
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session URL");
    }

    return session.url;
  }

  async createBillingPortalSession(user: User): Promise<string> {
    const billingCustomer = await this.prisma.billingCustomer.findUnique({
      where: { userId: user.id },
    });

    if (!billingCustomer) {
      throw new NotFoundException("No billing customer found for this user");
    }

    const returnUrl =
      this.configService.get("STRIPE_BILLING_PORTAL_RETURN_URL") ||
      this.configService.get("PUBLIC_URL");

    const session = await this.stripeService.createBillingPortalSession({
      stripeCustomerId: billingCustomer.stripeCustomerId,
      returnUrl: returnUrl || "",
    });

    return session.url;
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        await this.handleCheckoutSessionCompleted(session);
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;

    if (!stripeCustomerId) {
      this.logger.warn(`No customer found in checkout session: ${session.id}`);
      return;
    }

    const stripeSubscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

    if (!stripeSubscriptionId) {
      this.logger.warn(`No subscription found in checkout session: ${session.id}`);
      return;
    }

    const billingCustomer = await this.prisma.billingCustomer.findUnique({
      where: { stripeCustomerId },
    });

    if (!billingCustomer) {
      this.logger.warn(`No billing customer found for Stripe customer: ${stripeCustomerId}`);
      return;
    }


    const subscription = (await this.stripeService.client.subscriptions.retrieve(
      stripeSubscriptionId,
    )) as Stripe.Subscription;


    const lineItems = subscription.items.data;
    const firstItem = lineItems[0];
    if (!firstItem) {
      throw new Error("No line items found for checkout session");
    }

    const stripePriceId = firstItem.price?.id;

    let billingItemId: string | undefined;
    if (stripePriceId) {
      const billingItem = await this.prisma.billingItem.findUnique({
        where: { stripePriceId },
      });
      if (billingItem) {
        billingItemId = billingItem.id;
        this.logger.log(
          `Checkout session ${session.id} completed for billing item ${billingItem.id} (${billingItem.planKey})`,
        );
      } else {
        this.logger.warn(`No billing item found for Stripe price: ${stripePriceId}`);
      }
    }

    const currentPeriodEnd = firstItem.current_period_end
      ? new Date(firstItem.current_period_end)
      : null;

    await this.prisma.billingSubscription.upsert({
      where: { stripeSubscriptionId },
      create: {
        billingCustomerId: billingCustomer.id,
        stripeSubscriptionId,
        status: subscription.status,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        billingItemId,
      },
      update: {
        status: subscription.status,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        billingItemId,
      },
    });

    this.logger.log(`Upserted subscription ${stripeSubscriptionId} with status ${subscription.status}`);
  }

  private async deleteSubscription(stripeSubscriptionId: string): Promise<void> {
    try {
      await this.prisma.billingSubscription.delete({
        where: { stripeSubscriptionId },
      });
      this.logger.log(`Deleted subscription ${stripeSubscriptionId}`);
    } catch {
      this.logger.warn(`Subscription ${stripeSubscriptionId} not found for deletion`);
    }
  }

  async getUserSubscription(userId: string) {
    const billingCustomer = await this.prisma.billingCustomer.findUnique({
      where: { userId },
      include: {
        subscription: {
          include: {
            billingItem: true,
          },
        },
      },
    });

    return billingCustomer?.subscription ?? null;
  }
}
