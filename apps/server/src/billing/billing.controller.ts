import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import type { User } from "@prisma/client";
import type { Request } from "express";

import { JwtGuard } from "../auth/guards/jwt.guard";
import type { Config } from "../config/schema";
import { User as UserDecorator } from "../user/decorators/user.decorator";
import { BillingService } from "./billing.service";
import { StripeService } from "./stripe/stripe.service";
import type { CheckoutRequestDto } from "@my-saas/dto";

@ApiTags("Billing")
@Controller("billing")
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService<Config>,
  ) {}

  @Post("checkout")
  @UseGuards(JwtGuard)
  async createCheckoutSession(
    @UserDecorator() user: User,
    @Body() body: CheckoutRequestDto,
  ): Promise<{ url: string }> {
    if (!body.billingItemId) {
      throw new BadRequestException("billingItemId is required");
    }

    try {
      const billingItem = await this.billingService.getBillingItemById(
        body.billingItemId,
      );

      if (!billingItem) {
        throw new BadRequestException(
          `No billing item found with id "${body.billingItemId}"`,
        );
      }

      const publicUrl = this.configService.getOrThrow("PUBLIC_URL");
      const successUrl = `${publicUrl}/dashboard/billing?success=true`;
      const cancelUrl = `${publicUrl}/dashboard/billing?canceled=true`;

      const url = await this.billingService.createCheckoutSession(
        user,
        billingItem.stripePriceId,
        successUrl,
        cancelUrl,
      );

      return { url };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Post("portal")
  @UseGuards(JwtGuard)
  async createBillingPortalSession(
    @UserDecorator() user: User,
  ): Promise<{ url: string }> {
    const url = await this.billingService.createBillingPortalSession(user);
    return { url };
  }

  @Get("subscription")
  @UseGuards(JwtGuard)
  async getSubscription(@UserDecorator() user: User) {
    const subscription = await this.billingService.getUserSubscription(user.id);
    return { subscription };
  }

  @Get("items")
  @UseGuards(JwtGuard)
  async getBillingItems() {
    const items = await this.billingService.getAllBillingItems();
    return items;
  }

  @Post("webhook")
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ): Promise<{ received: boolean }> {
    const webhookSecret = this.configService.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      throw new BadRequestException("Webhook secret not configured");
    }

    if (!req.rawBody) {
      throw new BadRequestException("Raw body not available");
    }

    const event = this.stripeService.constructEvent(
      req.rawBody,
      signature,
      webhookSecret,
    );

    await this.billingService.handleWebhookEvent(event);

    return { received: true };
  }
}
