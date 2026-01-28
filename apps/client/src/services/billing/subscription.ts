import type { BillingSubscription } from "@my-saas/dto";
import { useQuery } from "@tanstack/react-query";

import { axios } from "@/client/libs/axios";

export const SUBSCRIPTION_KEY = ["billing", "subscription"];

type SubscriptionResponse = { subscription: BillingSubscription | null };

export const getSubscription = async () => {
  const response = await axios.get<SubscriptionResponse>("/billing/subscription");
  return response.data;
};

export const useSubscription = () => {
  const {
    error,
    isPending: loading,
    data,
  } = useQuery({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: getSubscription,
  });

  return { subscription: data?.subscription ?? null, loading, error };
};
