import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

import type { Config } from "../../config/schema";

@Injectable()
export class StripeSdkService implements OnModuleInit {
  private stripe: Stripe | null = null;

  constructor(private readonly configService: ConfigService<Config>) {}

  onModuleInit() {
    const secretKey = this.configService.get("STRIPE_SECRET_KEY");
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
    }
  }

  get client(): Stripe {
    if (!this.stripe) {
      throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY.");
    }
    return this.stripe;
  }

  get isConfigured(): boolean {
    return this.stripe !== null;
  }
}
