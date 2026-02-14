import { Prisma, PrismaClient, SubscriptionInterval } from "@prisma/client";
import Stripe from "stripe";

// Prisma auto-loads .env from the project root
const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type PlanConfig = {
  planKey: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  badge: { label: string; variant: string } | null;
  buttonText: string;
  buttonVariant: string;
  buttonIcon: boolean;
  isContactSales: boolean;
};

const PLANS: PlanConfig[] = [
  {
    planKey: "starter",
    name: "Starter",
    monthlyPrice: 9,
    yearlyPrice: 90,
    description: "Basic features for individuals getting started.",
    features: [
      "1 user",
      "5 projects",
      "Basic analytics",
      "Email support",
    ],
    badge: null,
    buttonText: "Subscribe",
    buttonVariant: "secondary",
    buttonIcon: false,
    isContactSales: false,
  },
  {
    planKey: "pro",
    name: "Pro",
    monthlyPrice: 19,
    yearlyPrice: 190,
    description: "Advanced features for growing teams.",
    features: [
      "5 users",
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
    ],
    badge: { label: "Popular", variant: "primary" },
    buttonText: "Subscribe",
    buttonVariant: "primary",
    buttonIcon: true,
    isContactSales: false,
  },
  {
    planKey: "enterprise",
    name: "Enterprise",
    monthlyPrice: 49,
    yearlyPrice: 490,
    description: "Unlimited features for large organizations.",
    features: [
      "Unlimited users",
      "Unlimited projects",
      "Advanced analytics",
      "Dedicated support",
      "Custom integrations",
      "SSO & SAML",
      "SLA guarantee",
    ],
    badge: null,
    buttonText: "Contact Sales",
    buttonVariant: "outline",
    buttonIcon: false,
    isContactSales: true,
  },
];

const INTERVALS: { interval: SubscriptionInterval; stripeInterval: "month" | "year" }[] = [
  { interval: "monthly", stripeInterval: "month" },
  { interval: "yearly", stripeInterval: "year" },
];

// Find or create a Stripe product by metadata lookup
const findOrCreateProduct = async (plan: PlanConfig): Promise<Stripe.Product> => {
  const existing = await stripe.products.search({
    query: `metadata["planKey"]:"${plan.planKey}"`,
  });

  if (existing.data.length > 0) {
    console.log(`  Found existing Stripe product for "${plan.name}"`);
    return existing.data[0];
  }

  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { planKey: plan.planKey },
  });

  console.log(`  Created Stripe product for "${plan.name}" (${product.id})`);
  return product;
};

// Create a Stripe price (prices are immutable, so we always create new ones unless one already exists)
const findOrCreatePrice = async (
  product: Stripe.Product,
  unitAmount: number,
  interval: "month" | "year",
  planKey: string,
): Promise<Stripe.Price> => {
  const existing = await stripe.prices.list({
    product: product.id,
    active: true,
    type: "recurring",
  });

  const match = existing.data.find(
    (price) =>
      price.recurring?.interval === interval &&
      price.unit_amount === unitAmount * 100,
  );

  if (match) {
    console.log(`  Found existing Stripe price for "${planKey}" (${interval})`);
    return match;
  }

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: unitAmount * 100,
    currency: "usd",
    recurring: { interval },
    metadata: { planKey },
  });

  console.log(`  Created Stripe price for "${planKey}" (${interval}): ${price.id}`);
  return price;
};

const seed = async () => {
  console.log("Seeding billing plans...\n");

  for (const plan of PLANS) {
    console.log(`Processing plan: ${plan.name}`);
    const product = await findOrCreateProduct(plan);

    for (const { interval, stripeInterval } of INTERVALS) {
      const price = stripeInterval === "month" ? plan.monthlyPrice : plan.yearlyPrice;
      const stripePrice = await findOrCreatePrice(product, price, stripeInterval, plan.planKey);

      // Upsert BillingItem by stripePriceId
      const billingItem = await prisma.billingItem.upsert({
        where: { stripePriceId: stripePrice.id },
        update: {
          planKey: plan.planKey,
          price,
          interval,
        },
        create: {
          planKey: plan.planKey,
          stripePriceId: stripePrice.id,
          price,
          interval,
        },
      });

      // Upsert BillingItemMetadata
      await prisma.billingItemMetadata.upsert({
        where: { billingItemId: billingItem.id },
        update: {
          title: plan.name,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          badge: plan.badge ?? Prisma.JsonNull,
          features: plan.features,
          buttonText: plan.buttonText,
          buttonVariant: plan.buttonVariant,
          buttonIcon: plan.buttonIcon,
          isContactSales: plan.isContactSales,
        },
        create: {
          billingItemId: billingItem.id,
          title: plan.name,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          badge: plan.badge ?? Prisma.JsonNull,
          features: plan.features,
          buttonText: plan.buttonText,
          buttonVariant: plan.buttonVariant,
          buttonIcon: plan.buttonIcon,
          isContactSales: plan.isContactSales,
        },
      });

      console.log(`  Upserted BillingItem + Metadata for "${plan.name}" (${interval})\n`);
    }
  }

  console.log("Seeding complete!");
};

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
