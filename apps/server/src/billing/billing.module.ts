import { Module } from "@nestjs/common";

import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { StripeSdkService } from "./stripe/stripe-sdk.service";
import { StripeService } from "./stripe/stripe.service";

@Module({
  controllers: [BillingController],
  providers: [StripeSdkService, StripeService, BillingService],
  exports: [BillingService, StripeService],
})
export class BillingModule {}
