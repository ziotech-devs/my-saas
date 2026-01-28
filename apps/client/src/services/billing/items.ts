import { useQuery } from "@tanstack/react-query";
import type { BillingItemDto } from "@my-saas/dto";

import { AxiosResponse } from "axios";
import { axios } from "@/client/libs/axios";

export const BILLING_ITEMS_KEY = ["billing", "items"];

export const getBillingItems = async () => {
  const response = await axios.get<BillingItemDto[], AxiosResponse<BillingItemDto[]>>("/billing/items");
  return response.data;
};

export const useBillingItems = () => {
  const {
    error,
    isPending: loading,
    data: billingItems,
  } = useQuery({
    queryKey: BILLING_ITEMS_KEY,
    queryFn: getBillingItems,
  });

  return { items: billingItems ?? [], loading, error };
};
