import { createZodDto } from "nestjs-zod/dto";
import { z } from "zod";

export const checkoutRequestSchema = z.object({
  billingItemId: z.string(),
});

export class CheckoutRequestDto extends createZodDto(checkoutRequestSchema) {}

export const checkoutResponseSchema = z.object({
  url: z.string().url(),
});

export class CheckoutResponseDto extends createZodDto(checkoutResponseSchema) {}

export const portalResponseSchema = z.object({
  url: z.string().url(),
});

export class PortalResponseDto extends createZodDto(portalResponseSchema) {}

export const billingItemMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  features: z.array(z.string()),
  badge: z.object({
    label: z.string(),
    variant: z.enum(["primary", "secondary", "success", "warning", "error", "info"]),
  }),
  buttonText: z.string(),
  buttonVariant: z.enum(["primary", "secondary", "outline"]),
  buttonIcon: z.boolean(),
});

export class BillingItemMetadataDto extends createZodDto(billingItemMetadataSchema) {}

export const billingItemSchema = z.object({
  id: z.string(),
  planKey: z.string(),
  stripePriceId: z.string(),
  price: z.number(),
  interval: z.enum(["monthly", "yearly"]),
  metadata: billingItemMetadataSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export class BillingItemDto extends createZodDto(billingItemSchema) {}

export const billingSubscriptionSchema = z.object({
  id: z.string(),
  stripeSubscriptionId: z.string(),
  status: z.string(),
  currentPeriodEnd: z.coerce.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  billingItem: billingItemSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type BillingSubscription = z.infer<typeof billingSubscriptionSchema>;

export const billingSubscriptionResponseSchema = z.object({
  subscription: billingSubscriptionSchema.nullable(),
});

export class BillingSubscriptionResponseDto extends createZodDto(billingSubscriptionResponseSchema) {}