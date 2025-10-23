import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowDownIcon, ArrowUpIcon, Filter } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { PeriodFilter, Period, getPeriodDates } from "@/components/PeriodFilter";

export default function Trades() {
  const { isAuthenticated, loading } = useAuth();
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [period, setPeriod] = useState<Period>("30d");

  const periodDates = useMemo(() => getPeriodDates(period), [period]);
  
  const { data: allTrades, refetch } = trpc.trades.list.useQuery(
    { 
      limit: 1000,
      startDate: periodDates.start,
      endDate: periodDates.end,
    },
    { enabled: isAuthenticated }
  );

  const trades = allTrades?.filter((trade) => {
    if (filter === "all") return true;
    return trade.status === filter;
  });

  useEffect(() => {
    if (!isAuthenticated || loading) return;
    const interval = setInterval(() => refetch(), 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, loading, refetch]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Faça login para ver seus trades</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Trades</h1>
              <p className="text-muted-foreground">
                Histórico completo de todas as operações
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <PeriodFilter value={period} onChange={setPeriod} />
            <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              size="sm"
            >
              Todos
            </Button>
            <Button
              variant={filter === "open" ? "default" : "outline"}
              onClick={() => setFilter("open")}
              size="sm"
            >
              Abertos
            </Button>
            <Button
              variant={filter === "closed" ? "default" : "outline"}
              onClick={() => setFilter("closed")}
              size="sm"
            >
              Fechados
            </Button>
          </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Lista de Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!trades || trades.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum trade encontrado
              </div>
            ) : (
              <div className="space-y-2">
                {trades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {trade.type === "BUY" ? (
                            <ArrowUpIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-bold">{trade.symbol}</span>
                          <Badge
                            variant={
                              trade.type === "BUY" ? "default" : "destructive"
                            }
                          >
                            {trade.type}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Ticket: {trade.ticket}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">
                          Volume
                        </span>
                        <span className="font-medium">
                          {((trade.volume || 0) / 100).toFixed(2)} lotes
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">
                          Preço Abertura
                        </span>
                        <span className="font-medium">
                          {((trade.openPrice || 0) / 100000).toFixed(5)}
                        </span>
                      </div>

                      {trade.status === "closed" && (
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">
                            Preço Fechamento
                          </span>
                          <span className="font-medium">
                            {((trade.closePrice || 0) / 100000).toFixed(5)}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">
                          Lucro/Prejuízo
                        </span>
                        <span
                          className={`font-bold ${
                            (trade.profit || 0) >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          ${(
                            (trade.profit || 0) / 100
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">
                          Data Abertura
                        </span>
                        <span className="text-sm">
                          {new Date(trade.openTime).toLocaleString("pt-BR")}
                        </span>
                      </div>

                      {trade.status === "closed" && trade.closeTime && (
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">
                            Data Fechamento
                          </span>
                          <span className="text-sm">
                            {new Date(trade.closeTime).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      )}
                    </div>

                    <Badge variant={trade.status === "open" ? "default" : "secondary"}>
                      {trade.status === "open" ? "Aberto" : "Fechado"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

