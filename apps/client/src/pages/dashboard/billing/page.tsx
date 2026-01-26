import { t } from "@lingui/macro";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ScrollArea,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@my-saas/ui";
import { cn } from "@my-saas/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useState } from "react";

type BillingFrequency = "monthly" | "yearly";

type Plan = {
  id: string;
  title: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  badge?: {
    label: string;
    variant: "primary" | "secondary" | "success" | "warning" | "error" | "info";
  };
  features: string[];
  buttonText: string;
  buttonVariant: "primary" | "secondary" | "outline";
  buttonIcon?: boolean;
};

const plans: Plan[] = [
  {
    id: "starter",
    title: t`Starter`,
    description: t`Perfect for individuals and small teams`,
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    badge: {
      label: t`Value`,
      variant: "secondary",
    },
    features: [
      t`Up to 3 team members`,
      t`50K AI tokens/month`,
      t`Core features`,
      t`Email support`,
      t`14-day free trial`,
    ],
    buttonText: t`Subscribe`,
    buttonVariant: "secondary",
  },
  {
    id: "pro",
    title: t`Pro`,
    description: t`Best for growing teams and professionals`,
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    badge: {
      label: t`Popular`,
      variant: "secondary",
    },
    features: [
      t`Up to 10 team members`,
      t`200K AI tokens/month`,
      t`All Starter features`,
      t`Priority support`,
      t`Advanced analytics`,
      t`14-day free trial`,
    ],
    buttonText: t`Subscribe`,
    buttonVariant: "secondary",
  },
  {
    id: "enterprise",
    title: t`Enterprise`,
    description: t`For large organizations with unlimited scale`,
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    features: [
      t`Unlimited team members`,
      t`Unlimited AI tokens`,
      t`All Pro features`,
      t`Dedicated support`,
      t`Custom integrations`,
      t`SLA guarantee`,
    ],
    buttonText: t`Contact Sales`,
    buttonVariant: "primary",
    buttonIcon: true,
  },
];

export const BillingPage = () => {
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>("monthly");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const getPrice = (plan: Plan) => {
    return billingFrequency === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getBillingCycle = () => {
    return billingFrequency === "monthly" ? t`Billed Monthly` : t`Billed Yearly`;
  };

  return (
    <>
      <Helmet>
        <title>
          {t`Billing`} - {t`My SaaS`}
        </title>
      </Helmet>

      <div className="space-y-4">
        <motion.h1
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-bold tracking-tight"
        >
          {t`Billing`}
        </motion.h1>

        <ScrollArea hideScrollbar className="h-[calc(100vh-140px)] lg:h-[calc(100vh-88px)]">
          <Tabs
            value={billingFrequency}
            onValueChange={(value) => {
              if (value) setBillingFrequency(value as BillingFrequency);
            }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div>
                <p className="leading-relaxed opacity-75">
                  {t`Choose a plan that works best for you. You can change or cancel your subscription at any time.`}
                </p>
              </div>

              {/* Billing Frequency Tabs */}
              <div className="flex justify-center">
                <TabsList className="inline-flex h-auto items-center justify-center rounded border bg-secondary p-1">
                  <TabsTrigger
                    value="monthly"
                    className={cn(
                      "w-full px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm",
                    )}
                  >
                    <div className="flex items-center gap-x-2">
                      <CheckIcon
                        size={16}
                        className={cn(
                          "transition-opacity",
                          billingFrequency === "monthly" ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="text-sm whitespace-nowrap">{t`Billed Monthly`}</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="yearly"
                    className={cn(
                      "w-full px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm",
                    )}
                  >
                    <div className="flex items-center gap-x-2">
                      <CheckIcon
                        size={16}
                        className={cn(
                          "transition-opacity",
                          billingFrequency === "yearly" ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="text-sm whitespace-nowrap">{t`Billed Yearly`}</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Pricing Cards */}
            <AnimatePresence mode="wait">
              <motion.div
                key={billingFrequency}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="grid gap-6 md:grid-cols-3"
              >
              {plans.map((plan) => {
                const price = getPrice(plan);
                const pricePerMonth = billingFrequency === "yearly" ? price / 12 : price;

                return (
                  <Card key={plan.id} className="relative flex flex-col">
                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <Badge variant={plan.badge.variant} className="px-3 py-1">
                          {plan.badge.label}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="space-y-2 pb-4">
                      <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-4">
                      {/* Price */}
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-x-1">
                          <span className="text-4xl font-bold">{formatPrice(pricePerMonth)}</span>
                          <span className="text-sm opacity-75">/month</span>
                        </div>
                        <p className="text-xs opacity-75">{getBillingCycle()}</p>
                      </div>

                      {/* Separator */}
                      <Separator className="border-dashed" />

                      {/* Features */}
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-x-2">
                            <CheckIcon
                              size={20}
                              className="mt-0.5 shrink-0 text-success-accent"
                              weight="bold"
                            />
                            <span className="text-sm leading-relaxed opacity-75">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter>
                      <Button
                        variant={plan.buttonVariant}
                        className={cn(
                          "w-full",
                          plan.buttonVariant === "primary" && "bg-primary text-primary-foreground",
                        )}
                      >
                        {plan.buttonText}
                        {plan.buttonIcon && <ArrowRightIcon size={16} className="ml-2" />}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </ScrollArea>
      </div>
    </>
  );
};
