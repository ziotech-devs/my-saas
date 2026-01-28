import { useMutation } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { axios } from "@/client/libs/axios";

type CheckoutRequest = { billingItemId: string };
type CheckoutResponse = { url: string };

export const createCheckoutSession = async (data: CheckoutRequest) => {
  const response = await axios.post<CheckoutResponse, AxiosResponse<CheckoutResponse>, CheckoutRequest>(
    "/billing/checkout",
    data,
  );

  return response.data;
};

export const useCreateCheckoutSession = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: createCheckout,
  } = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    },
  });

  return { createCheckout, loading, error };
};
