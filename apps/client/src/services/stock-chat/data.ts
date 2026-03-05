import { useQuery } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";

import { axios } from "@/client/libs/axios";

export type StockData = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
};

export type StockChatResponse = {
  stocks: StockData[];
  timestamp: string;
};

export const fetchStockData = async () => {
  const response = await axios.get<StockChatResponse, AxiosResponse<StockChatResponse>>(
    `/stock-chat/data`,
  );

  return response.data;
};

export const useStockData = () => {
  const {
    error,
    isPending: loading,
    data,
  } = useQuery({
    queryKey: ["stock_chat_data"],
    queryFn: () => fetchStockData(),
    refetchOnMount: "always",
  });

  return { data, loading, error };
};
