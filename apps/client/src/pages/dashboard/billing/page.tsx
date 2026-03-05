import { t } from "@lingui/macro";
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
import { cn, formatPrice } from "@my-saas/utils";
import { ArrowRightIcon, CheckIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router";
import { toast } from "@/client/hooks/use-toast";
import {
  useBillingItems,
  useCreateBillingPortalSession,
  useCreateCheckoutSession,
  useSubscription,
} from "@/client/services/billing";
import { BillingItemDto, BillingItemMetadataDto } from "@my-saas/dto";

type BillingInterval = BillingItemDto["interval"];

const defaultBillingItemMetadata: BillingItemMetadataDto = {
  title: "Title",
  description: "Description",
  features: [
    "Feature 1",
    "Feature 2",
    "Feature 3",
  ],
  badge: {
    label: "Badge Label",
    variant: "secondary",
  },
  buttonText: "Button Text",
  buttonVariant: "secondary",
  buttonIcon: true,
};

export const BillingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { items: billingItems, loading: itemsLoading } = useBillingItems();
  const { createCheckout, loading: checkoutLoading } = useCreateCheckoutSession();
  const { createPortal, loading: portalLoading } = useCreateBillingPortalSession();

  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [loadingBillingItemId, setLoadingBillingItemId] = useState<string | null>(null);

  let monthlyPlans: BillingItemDto[] = [];
  let yearlyPlans: BillingItemDto[] = [];
  billingItems.forEach((item: BillingItemDto) => {
    if (item.interval === "monthly") {
      monthlyPlans.push(item);
    } else {
      yearlyPlans.push(item);
    }
  });

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        variant: "success",
        title: t`Subscription successful!`,
        description: t`Thank you for subscribing. Your plan is now active.`,
      });
      setSearchParams({});
    } else if (searchParams.get("canceled") === "true") {
      toast({
        variant: "info",
        title: t`Checkout canceled`,
        description: t`Your subscription checkout was canceled.`,
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleSubscribe = async (billingItemId: string) => {
    setLoadingBillingItemId(billingItemId);
    try {
      await createCheckout({ billingItemId });
    } catch (error) {
      toast({
        variant: "error",
        title: t`Error subscribing`,
        description: t`An error occurred while subscribing to the plan.`,
      });
    } finally {
      setLoadingBillingItemId(null);
    }
  }


  const handleManageSubscription = async () => {
    await createPortal();
  };

  const dataLoading = subscriptionLoading || itemsLoading;

  const getBillingCycle = () => {
    return billingInterval === "monthly" ? t`Billed Monthly` : t`Billed Yearly`;
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
            value={billingInterval}
            className="space-y-8"
            onValueChange={(value) => {
              if (value) setBillingInterval(value as BillingInterval);
            }}
          >
            <div className="space-y-4">
              {/* Current Subscription Status */}
              {subscription && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{t`Current Subscription`}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm opacity-75">{t`Status`}</span>
                      <Badge variant={subscription.status === "active" ? "success" : "secondary"}>
                        {subscription.status}
                      </Badge>
                    </div>
                    {subscription.currentPeriodEnd && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm opacity-75">{t`Renews on`}</span>
                        <span className="text-sm">
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {subscription.cancelAtPeriodEnd && (
                      <p className="text-sm text-warning-accent">
                        {t`Your subscription will be canceled at the end of the billing period.`}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <SpinnerGapIcon size={16} className="animate-spin" />
                      ) : (
                        t`Manage Subscription`
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )}

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
                          billingInterval === "monthly" ? "opacity-100" : "opacity-0",
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
                          billingInterval === "yearly" ? "opacity-100" : "opacity-0",
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
              {itemsLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center py-12"
                >
                  <SpinnerGapIcon size={32} className="animate-spin opacity-50" />
                </motion.div>
              ) : (billingInterval === "monthly" && monthlyPlans.length === 0) ||
                (billingInterval === "yearly" && yearlyPlans.length === 0) ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center opacity-75"
                >
                  {t`No plans available`}
                </motion.div>
              ) : (
                <motion.div
                  key={billingInterval}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="grid gap-6 md:grid-cols-3"
                >
                  {(billingInterval === "monthly" ? monthlyPlans : yearlyPlans).map((plan) => {
                    const metadata = plan.metadata || defaultBillingItemMetadata;

                    return (
                      <Card key={plan.id} className="relative flex flex-col">
                        <CardHeader className="space-y-2 pb-4">
                          <CardTitle className="text-2xl font-bold">{metadata.title}</CardTitle>
                          <CardDescription className="text-sm leading-relaxed">
                            {metadata.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-1 space-y-4">
                          {/* Price */}
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-x-1">
                              <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                              <span className="text-sm opacity-75">/{billingInterval.slice(0, -2)}</span>
                            </div>
                            <p className="text-xs opacity-75">{getBillingCycle()}</p>
                          </div>

                          {/* Separator */}
                          <Separator className="border-dashed" />

                          {/* Features */}
                          <ul className="space-y-3">
                            {metadata.features.map((feature, index) => (
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
                            variant={metadata.buttonVariant}
                            className={cn(
                              "w-full",
                              metadata.buttonVariant === "primary" &&
                              "bg-primary text-primary-foreground",
                            )}
                            disabled={loadingBillingItemId === plan.id || dataLoading}
                            onClick={() => {
                              handleSubscribe(plan.id);
                            }}
                          >
                            {loadingBillingItemId === plan.id ? (
                              <SpinnerGapIcon size={16} className="animate-spin" />
                            ) : (
                              <>
                                {metadata.buttonText}
                                {metadata.buttonIcon && (
                                  <ArrowRightIcon size={16} className="ml-2" />
                                )}
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs>
        </ScrollArea>
      </div>
    </>
  );
};
