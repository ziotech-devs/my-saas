import { Injectable } from "@nestjs/common";
import type Stripe from "stripe";

import { StripeSdkService } from "./stripe-sdk.service";

@Injectable()
export class StripeService {
  constructor(private readonly stripeSdk: StripeSdkService) {}

  get client(): Stripe {
    return this.stripeSdk.client;
  }

  get isConfigured(): boolean {
    return this.stripeSdk.isConfigured;
  }

  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    return this.client.customers.create({ email, name });
  }

  async getCustomer(stripeCustomerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    return this.client.customers.retrieve(stripeCustomerId);
  }

  async createCheckoutSession(params: {
    stripeCustomerId: string;
    stripePriceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.client.checkout.sessions.create({
      customer: params.stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: params.stripePriceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  async createBillingPortalSession(params: {
    stripeCustomerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    return this.client.billingPortal.sessions.create({
      customer: params.stripeCustomerId,
      return_url: params.returnUrl,
    });
  }

  constructEvent(payload: Buffer, signature: string, secret: string): Stripe.Event {
    return this.client.webhooks.constructEvent(payload, signature, secret);
  }
}
