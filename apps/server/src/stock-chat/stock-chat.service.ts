import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosError } from "axios";

import type { Config } from "../config/schema";

@Injectable()
export class StockChatService {
  private readonly logger = new Logger(StockChatService.name);

  constructor(private readonly configService: ConfigService<Config>) {}

  getStockData() {
    // Return fake stock data
    return {
      stocks: [
        {
          symbol: "AAPL",
          name: "Apple Inc.",
          price: 175.43,
          change: 2.34,
          changePercent: 1.35,
          volume: 45_234_567,
        },
        {
          symbol: "GOOGL",
          name: "Alphabet Inc.",
          price: 142.56,
          change: -1.23,
          changePercent: -0.85,
          volume: 23_456_789,
        },
        {
          symbol: "MSFT",
          name: "Microsoft Corporation",
          price: 378.92,
          change: 5.67,
          changePercent: 1.52,
          volume: 34_567_890,
        },
        {
          symbol: "TSLA",
          name: "Tesla, Inc.",
          price: 248.12,
          change: -3.45,
          changePercent: -1.37,
          volume: 56_789_012,
        },
        {
          symbol: "AMZN",
          name: "Amazon.com Inc.",
          price: 145.78,
          change: 1.89,
          changePercent: 1.31,
          volume: 45_678_901,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  async invokeGraph(query: string): Promise<{ analysis: string }> {
    const graphsUrl = this.configService.get<string>("GRAPHS_URL", "http://localhost:8123");

    try {
      // Invoke the graph via MCP HTTP endpoint
      // LangGraph MCP exposes graphs at /graphs/{graph_name}/invoke
      const response = await axios.post(
        `${graphsUrl}/graphs/stock_chat_graph/invoke`,
        {
          input: {
            query,
          },
        },
        {
          timeout: 30_000, // 30 second timeout
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = response.data;

      // Extract analysis from the graph result
      const analysis = result?.output?.analysis ?? result?.analysis ?? "No analysis available";

      return { analysis };
    } catch (error) {
      this.logger.error(
        `Failed to invoke graph: ${error instanceof Error ? error.message : String(error)}`,
      );

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ detail?: string; message?: string }>;

        if (axiosError.response) {
          const errorMessage =
            axiosError.response.data.detail ??
            axiosError.response.data.message ??
            axiosError.message;
          throw new Error(`Graph service error: ${errorMessage}`);
        }

        if (axiosError.code === "ECONNREFUSED") {
          throw new Error(
            "Graph service is not available. Please ensure the graphs service is running.",
          );
        }
      }

      throw new Error(
        `Failed to analyze stock data: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
