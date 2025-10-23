import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Target,
  Percent,
} from "lucide-react";
import { useEffect } from "react";

export default function Analytics() {
  const { isAuthenticated, loading } = useAuth();

  const { data: accounts } = trpc.accounts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: trades, refetch } = trpc.trades.list.useQuery(
    { limit: 1000 },
    { enabled: isAuthenticated }
  );

  // Calcula estatísticas localmente
  const analytics = trades
    ? {
        totalTrades: trades.length,
        winningTrades: trades.filter((t) => (t.profit || 0) > 0).length,
        losingTrades: trades.filter((t) => (t.profit || 0) < 0).length,
        winRate:
          trades.length > 0
            ? (trades.filter((t) => (t.profit || 0) > 0).length /
                trades.length) *
              100
            : 0,
        totalProfit: trades
          .filter((t) => (t.profit || 0) > 0)
          .reduce((sum, t) => sum + (t.profit || 0), 0),
        totalLoss: trades
          .filter((t) => (t.profit || 0) < 0)
          .reduce((sum, t) => sum + (t.profit || 0), 0),
        netProfit: trades.reduce((sum, t) => sum + (t.profit || 0), 0),
        averageWin:
          trades.filter((t) => (t.profit || 0) > 0).length > 0
            ? trades
                .filter((t) => (t.profit || 0) > 0)
                .reduce((sum, t) => sum + (t.profit || 0), 0) /
              trades.filter((t) => (t.profit || 0) > 0).length
            : 0,
        averageLoss:
          trades.filter((t) => (t.profit || 0) < 0).length > 0
            ? trades
                .filter((t) => (t.profit || 0) < 0)
                .reduce((sum, t) => sum + (t.profit || 0), 0) /
              trades.filter((t) => (t.profit || 0) < 0).length
            : 0,
        profitFactor:
          Math.abs(
            trades
              .filter((t) => (t.profit || 0) < 0)
              .reduce((sum, t) => sum + (t.profit || 0), 0)
          ) > 0
            ? trades
                .filter((t) => (t.profit || 0) > 0)
                .reduce((sum, t) => sum + (t.profit || 0), 0) /
              Math.abs(
                trades
                  .filter((t) => (t.profit || 0) < 0)
                  .reduce((sum, t) => sum + (t.profit || 0), 0)
              )
            : 0,
      }
    : null;

  useEffect(() => {
    if (!isAuthenticated || loading) return;
    const interval = setInterval(() => refetch(), 15000);
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
          <p className="text-muted-foreground">
            Faça login para ver suas análises
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const stats = analytics || {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalProfit: 0,
    totalLoss: 0,
    netProfit: 0,
    averageWin: 0,
    averageLoss: 0,
    profitFactor: 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Análises</h1>
          <p className="text-muted-foreground">
            Estatísticas detalhadas de performance
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Trades
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrades}</div>
              <p className="text-xs text-muted-foreground">
                {stats.winningTrades} ganhos • {stats.losingTrades} perdas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de acerto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lucro Líquido
              </CardTitle>
              {stats.netProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stats.netProfit >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                ${(stats.netProfit / 100).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {(stats.netProfit || 0).toLocaleString("pt-BR")} cents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Profit Factor
              </CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.profitFactor.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Relação lucro/perda
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Trades Vencedores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total de Ganhos
                </span>
                <span className="text-lg font-bold text-green-500">
                  ${(stats.totalProfit / 100).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Média por Trade
                </span>
                <span className="text-lg font-bold text-green-500">
                  ${(stats.averageWin / 100).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Quantidade
                </span>
                <span className="text-lg font-bold">{stats.winningTrades}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trades Perdedores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total de Perdas
                </span>
                <span className="text-lg font-bold text-red-500">
                  ${(Math.abs(stats.totalLoss) / 100).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Média por Trade
                </span>
                <span className="text-lg font-bold text-red-500">
                  ${(Math.abs(stats.averageLoss) / 100).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Quantidade
                </span>
                <span className="text-lg font-bold">{stats.losingTrades}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

