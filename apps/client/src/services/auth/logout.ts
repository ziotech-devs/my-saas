import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import { axios } from "@/client/libs/axios";
import { queryClient } from "@/client/libs/query-client";
import { useAuthStore } from "@/client/stores/auth";

export const logout = () => axios.post("/auth/logout");

export const useLogout = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const {
    error,
    isPending: loading,
    mutateAsync: logoutFn,
  } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      navigate("/");
    },
    onError: () => {
      setUser(null);
      queryClient.clear();
      navigate("/");
    },
  });

  return { logout: logoutFn, loading, error };
};
