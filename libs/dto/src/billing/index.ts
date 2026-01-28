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

// Fake metadata for plans - mapped by planKey
// const planMetadata: Record<string, PlanMetadata> = {
//   basic: {
//     title: t`Basic`,
//     description: t`Perfect for individuals and small teams`,
//     badge: {
//       label: t`Value`,
//       variant: "secondary",
//     },
//     features: [
//       t`Up to 3 team members`,
//       t`50K AI tokens/month`,
//       t`Core features`,
//       t`Email support`,
//       t`14-day free trial`,
//     ],
//     buttonText: t`Subscribe`,
//     buttonVariant: "secondary",
//   },
//   pro: {
//     title: t`Pro`,
//     description: t`Best for growing teams and professionals`,
//     badge: {
//       label: t`Popular`,
//       variant: "secondary",
//     },
//     features: [
//       t`Up to 10 team members`,
//       t`200K AI tokens/month`,
//       t`All Basic features`,
//       t`Priority support`,
//       t`Advanced analytics`,
//       t`14-day free trial`,
//     ],
//     buttonText: t`Subscribe`,
//     buttonVariant: "secondary",
//   },
//   enterprise: {
//     title: t`Enterprise`,
//     description: t`For large organizations with unlimited scale`,
//     features: [
//       t`Unlimited team members`,
//       t`Unlimited AI tokens`,
//       t`All Pro features`,
//       t`Dedicated support`,
//       t`Custom integrations`,
//       t`SLA guarantee`,
//     ],
//     buttonText: t`Contact Sales`,
//     buttonVariant: "primary",
//     buttonIcon: true,
//     isContactSales: true,
//   },
// };