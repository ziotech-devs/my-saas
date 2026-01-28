import { useMutation } from "@tanstack/react-query";

import { axios } from "@/client/libs/axios";

type PortalResponse = { url: string };

export const createBillingPortalSession = async () => {
  const response = await axios.post<PortalResponse>("/billing/portal");
  return response.data;
};

export const useCreateBillingPortalSession = () => {
  const {
    error,
    isPending: loading,
    mutateAsync: createPortal,
  } = useMutation({
    mutationFn: createBillingPortalSession,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  return { createPortal, loading, error };
};
