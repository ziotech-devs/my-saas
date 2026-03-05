import { z } from "zod";

export const analyzeStockDtoSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
});

export type AnalyzeStockDto = z.infer<typeof analyzeStockDtoSchema>;

export const analyzeStockResponseDtoSchema = z.object({
  analysis: z.string(),
});

export type AnalyzeStockResponseDto = z.infer<typeof analyzeStockResponseDtoSchema>;
