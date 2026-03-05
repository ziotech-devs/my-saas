import { t } from "@lingui/macro";
import { Card, CardContent, CardHeader, CardTitle, ScrollArea, Skeleton } from "@my-saas/ui";
import { cn } from "@my-saas/utils";
import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

import { useStockData } from "@/client/services/stock-chat/data";

export const StockChatPage = () => {
  const { data, loading, error } = useStockData();

  return (
    <>
      <Helmet>
        <title>
          {t`Stock Chat`} - {t`Reactive Resume`}
        </title>
      </Helmet>

      <div className="max-w-4xl space-y-4">
        <motion.h1
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-bold tracking-tight"
        >
          {t`Stock Chat`}
        </motion.h1>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">
                {t`Error loading stock data:`}
                {error.message}
              </p>
            </CardContent>
          </Card>
        )}

        {data && !loading && (
          <ScrollArea className="h-[calc(100vh-140px)] lg:h-[calc(100vh-88px)]">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {t`Last updated: `}
                {new Date(data.timestamp).toLocaleString()}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {data.stocks.map((stock) => {
                  const isPositive = stock.change >= 0;
                  return (
                    <Card key={stock.symbol}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold">{stock.symbol}</div>
                            <div className="text-sm text-muted-foreground">{stock.name}</div>
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-1 text-lg font-semibold",
                              isPositive ? "text-green-600" : "text-red-600",
                            )}
                          >
                            {isPositive ? (
                              <ArrowUpIcon className="size-4" />
                            ) : (
                              <ArrowDownIcon className="size-4" />
                            )}
                            {isPositive ? "+" : ""}
                            {stock.changePercent.toFixed(2)}%
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t`Price`}</span>
                            <span className="font-semibold">${stock.price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t`Change`}</span>
                            <span
                              className={cn(
                                "font-semibold",
                                isPositive ? "text-green-600" : "text-red-600",
                              )}
                            >
                              {isPositive ? "+" : ""}${stock.change.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t`Volume`}</span>
                            <span className="font-semibold">
                              {stock.volume.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  );
};
