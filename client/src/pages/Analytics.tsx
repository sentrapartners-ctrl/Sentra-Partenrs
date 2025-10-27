import { useAuth } from "@/_core/hooks/useAuth";
import { MonthlyGrowthTable } from "@/components/MonthlyGrowthTable";
import { DrawdownChart } from "@/components/DrawdownChart";
import { RiskMetricsCard } from "@/components/RiskMetricsCard";
import { ConsecutiveStatsCard } from "@/components/ConsecutiveStatsCard";
import { TradeOriginDonut } from "@/components/TradeOriginDonut";
import { ProfitLossDonut } from "@/components/ProfitLossDonut";
import { WeeklyPerformanceChart } from "@/components/WeeklyPerformanceChart";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AccountFilter } from "@/components/AccountFilter";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Target,
  Clock,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { PeriodFilter, Period, getPeriodDates } from "@/components/PeriodFilter";
import { CurrencyValue, InlineCurrencyValue } from "@/components/CurrencyValue";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Analytics() {
  const { isAuthenticated, loading } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");
  const [selectedAccount, setSelectedAccount] = useState<number | "all">("all");

  // Aplica conversão baseada em isCentAccount
  const getActualProfit = (trade: any) => {
    const divisor = trade.isCentAccount ? 10000 : 100;
    return (trade.profit || 0) / divisor;
  };

  const { data: accounts } = trpc.accounts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: allTrades, refetch } = trpc.trades.list.useQuery(
    { 
      limit: 1000,
      accountId: selectedAccount === "all" ? undefined : selectedAccount,
    },
    { enabled: isAuthenticated }
  );

  const { data: balanceHistoryData } = trpc.balanceHistory.get.useQuery(
    {
      accountId: selectedAccount === "all" ? undefined : selectedAccount,
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
    { enabled: isAuthenticated }
  );

  // Queries para novos dados de analytics
  const currentYear = new Date().getFullYear();
  const { data: monthlyGrowthData } = trpc.analytics.getMonthlyGrowth.useQuery(
    { accountId: selectedAccount === "all" ? (accounts?.[0]?.id || 0) : selectedAccount, year: currentYear },
    { enabled: isAuthenticated && selectedAccount !== "all" }
  );

  const { data: drawdownData } = trpc.analytics.getDrawdownHistory.useQuery(
    { accountId: selectedAccount === "all" ? (accounts?.[0]?.id || 0) : selectedAccount },
    { enabled: isAuthenticated && selectedAccount !== "all" }
  );

  const { data: riskMetrics } = trpc.analytics.getRiskMetrics.useQuery(
    { accountId: selectedAccount === "all" ? (accounts?.[0]?.id || 0) : selectedAccount },
    { enabled: isAuthenticated && selectedAccount !== "all" }
  );

  const { data: consecutiveStats } = trpc.analytics.getConsecutiveStats.useQuery(
    { accountId: selectedAccount === "all" ? (accounts?.[0]?.id || 0) : selectedAccount },
    { enabled: isAuthenticated && selectedAccount !== "all" }
  );

  const { data: weeklyPerformance } = trpc.analytics.getWeeklyPerformance.useQuery(
    { accountId: selectedAccount === "all" ? (accounts?.[0]?.id || 0) : selectedAccount },
    { enabled: isAuthenticated && selectedAccount !== "all" }
  );

  const { data: tradesByOrigin } = trpc.analytics.getTradesByOrigin.useQuery(
    { accountId: selectedAccount === "all" ? (accounts?.[0]?.id || 0) : selectedAccount },
    { enabled: isAuthenticated && selectedAccount !== "all" }
  );

  // Filtrar trades por período
  const trades = useMemo(() => {
    if (!allTrades) return [];
    return allTrades.filter((trade) => {
      if (!trade.closeTime) return false;
      const tradeDate = new Date(trade.closeTime);
      const now = new Date();
      const daysAgo = parseInt(period.replace('d', ''));
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return tradeDate >= cutoffDate;
    });
  }, [allTrades, period]);

  // Calcula estatísticas localmente
  const analytics = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    const winningTrades = trades.filter((t) => getActualProfit(t) > 0);
    const losingTrades = trades.filter((t) => getActualProfit(t) < 0);
    const totalProfit = winningTrades.reduce((sum, t) => sum + getActualProfit(t), 0);
    const totalLoss = losingTrades.reduce((sum, t) => sum + getActualProfit(t), 0);

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      totalProfit,
      totalLoss,
      netProfit: trades.reduce((sum, t) => sum + getActualProfit(t), 0),
      averageWin: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      profitFactor: Math.abs(totalLoss) > 0 ? totalProfit / Math.abs(totalLoss) : 0,
      drawdown: (() => {
        if (!accounts || accounts.length === 0) return 0;
        const totalBalance = accounts.reduce((sum: number, acc: any) => 
          sum + ((acc.balance || 0) / (acc.isCentAccount ? 10000 : 100)), 0);
        const totalEquity = accounts.reduce((sum: number, acc: any) => 
          sum + ((acc.equity || 0) / (acc.isCentAccount ? 10000 : 100)), 0);
        return totalBalance > 0 ? ((totalEquity - totalBalance) / totalBalance * 100) : 0;
      })(),
    };
  }, [trades, accounts]);

  // Dados para gráfico de evolução do balance
  const balanceChartData = useMemo(() => {
    if (!balanceHistoryData || balanceHistoryData.length === 0) return [];
    
    return balanceHistoryData.map((item: any) => ({
      date: new Date(item.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      balance: (item.balance || 0) / (item.isCentAccount ? 10000 : 100),
      equity: (item.equity || 0) / (item.isCentAccount ? 10000 : 100),
    }));
  }, [balanceHistoryData]);

  // Dados para gráfico de performance por dia da semana
  const weekdayData = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const profitByDay: { [key: number]: number } = {};

    trades.forEach((trade) => {
      if (!trade.closeTime) return;
      const day = new Date(trade.closeTime).getDay();
      profitByDay[day] = (profitByDay[day] || 0) + getActualProfit(trade);
    });

    return weekdays.map((name, index) => ({
      name,
      lucro: profitByDay[index] || 0,
    }));
  }, [trades]);

  // Dados para gráfico de performance por hora
  const hourlyData = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const tradesByHour: { [key: number]: number } = {};

    trades.forEach((trade) => {
      if (!trade.closeTime) return;
      const hour = new Date(trade.closeTime).getHours();
      tradesByHour[hour] = (tradesByHour[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      trades: tradesByHour[i] || 0,
    }));
  }, [trades]);

  // Dados para análise por símbolo
  const symbolAnalysis = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const symbolStats: { [key: string]: { count: number; profit: number; wins: number } } = {};

    trades.forEach((trade) => {
      const symbol = trade.symbol || 'UNKNOWN';
      if (!symbolStats[symbol]) {
        symbolStats[symbol] = { count: 0, profit: 0, wins: 0 };
      }
      symbolStats[symbol].count++;
      const profit = getActualProfit(trade);
      symbolStats[symbol].profit += profit;
      if (profit > 0) symbolStats[symbol].wins++;
    });

    return Object.entries(symbolStats)
      .map(([symbol, stats]) => ({
        symbol,
        trades: stats.count,
        winRate: (stats.wins / stats.count) * 100,
        profit: stats.profit,
      }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 10);
  }, [trades]);

  // Métricas avançadas
  const advancedMetrics = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    const returns = trades.map((t) => getActualProfit(t));
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );

    const downside = returns.filter((r) => r < 0);
    const downsideStdDev = downside.length > 0
      ? Math.sqrt(downside.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downside.length)
      : 0;

    // Calcular max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningSum = 0;

    trades.forEach((trade) => {
      runningSum += getActualProfit(trade);
      if (runningSum > peak) peak = runningSum;
      const drawdown = peak - runningSum;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    const netProfit = returns.reduce((sum, r) => sum + r, 0);

    return {
      sharpeRatio: stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0,
      sortinoRatio: downsideStdDev > 0 ? (avgReturn / downsideStdDev) * Math.sqrt(252) : 0,
      maxDrawdown: maxDrawdown,
      recoveryFactor: maxDrawdown > 0 ? netProfit / maxDrawdown : 0,
    };
  }, [trades]);

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
    drawdown: 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Análises Avançadas</h1>
            <p className="text-muted-foreground">
              Métricas detalhadas e gráficos de performance
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <AccountFilter value={selectedAccount} onChange={setSelectedAccount} />
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* Cards de estatísticas */}
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
                {stats.winningTrades} vencedores • {stats.losingTrades} perdedores
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
              <div className={stats.netProfit >= 0 ? "text-2xl font-bold text-green-500" : "text-2xl font-bold text-red-500"}>
                <CurrencyValue value={stats.netProfit} />
              </div>
              <p className="text-xs text-muted-foreground">
                Profit Factor: {stats.profitFactor.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Drawdown
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (stats.drawdown || 0) < 0 ? "text-red-500" : "text-green-500"
              }`}>
                {(stats.drawdown || 0).toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Atual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Evolução do Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução do Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={balanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="balance" stroke="#8b5cf6" name="Balance" />
                  <Line type="monotone" dataKey="equity" stroke="#10b981" name="Equity" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráficos de Performance */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance por Dia da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weekdayData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="lucro" fill="#8b5cf6" name="Lucro" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Performance por Hora do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hourlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="trades" fill="#10b981" name="Trades" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* NOVOS COMPONENTES - ALTA PRIORIDADE */}
        
        {/* Tabela de Crescimento Mensal */}
        {selectedAccount !== "all" && monthlyGrowthData && monthlyGrowthData.length > 0 && (
          <MonthlyGrowthTable data={monthlyGrowthData as any} year={currentYear} />
        )}

        {/* Gráfico de Drawdown vs Balance */}
        {selectedAccount !== "all" && drawdownData && drawdownData.length > 0 && (
          <DrawdownChart data={drawdownData as any} />
        )}

        {/* Grid de métricas de risco e estatísticas consecutivas */}
        {selectedAccount !== "all" && (riskMetrics || consecutiveStats) && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Métricas de Risco Avançadas */}
            {riskMetrics && (
              <RiskMetricsCard
                sharpRatio={riskMetrics.sharpRatio || 0}
                profitFactor={riskMetrics.profitFactor || 0}
                recoveryFactor={riskMetrics.recoveryFactor || 0}
              />
            )}

            {/* Estatísticas de Consecutivos */}
            {consecutiveStats && (
              <ConsecutiveStatsCard
                maxConsecutiveWins={consecutiveStats.maxConsecutiveWins || 0}
                maxConsecutiveLosses={consecutiveStats.maxConsecutiveLosses || 0}
                maxConsecutiveProfit={consecutiveStats.maxConsecutiveProfit || 0}
                maxConsecutiveLoss={consecutiveStats.maxConsecutiveLoss || 0}
                bestTrade={consecutiveStats.bestTrade || 0}
                worstTrade={consecutiveStats.worstTrade || 0}
              />
            )}
          </div>
        )}

        {/* NOVOS COMPONENTES - MÉDIA PRIORIDADE */}
        
        {/* Grid de gráficos Donut */}
        {selectedAccount !== "all" && (tradesByOrigin || analytics) && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gráfico Donut - Tipo de Operação */}
            {tradesByOrigin && tradesByOrigin.length > 0 && (
              <TradeOriginDonut data={tradesByOrigin as any} />
            )}

            {/* Gráfico Donut - Profit/Loss */}
            {analytics && (
              <ProfitLossDonut
                grossProfit={analytics.totalProfit * 100}
                grossLoss={analytics.totalLoss * 100}
              />
            )}
          </div>
        )}

        {/* Performance Semanal */}
        {selectedAccount !== "all" && weeklyPerformance && weeklyPerformance.length > 0 && (
          <WeeklyPerformanceChart data={weeklyPerformance as any} />
        )}

        {/* COMPONENTES EXISTENTES MANTIDOS */}

        {/* Análise por Símbolo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Análise por Símbolo (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {symbolAnalysis.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-4 font-semibold text-sm text-muted-foreground pb-2 border-b">
                  <div>Símbolo</div>
                  <div className="text-right">Trades</div>
                  <div className="text-right">Win Rate</div>
                  <div className="text-right">Lucro</div>
                </div>
                {symbolAnalysis.map((item) => (
                  <div key={item.symbol} className="grid grid-cols-4 gap-4 text-sm">
                    <div className="font-medium">{item.symbol}</div>
                    <div className="text-right">{item.trades}</div>
                    <div className="text-right">{item.winRate.toFixed(1)}%</div>
                    <div className={`text-right font-semibold ${item.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <InlineCurrencyValue value={item.profit} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Métricas Avançadas */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas Avançadas</CardTitle>
          </CardHeader>
          <CardContent>
            {advancedMetrics ? (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-2xl font-bold">{advancedMetrics.sharpeRatio.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Retorno ajustado ao risco</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Sortino Ratio</p>
                  <p className="text-2xl font-bold">{advancedMetrics.sortinoRatio.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Downside risk</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Max Drawdown</p>
                  <p className="text-2xl font-bold text-red-500">
                    <CurrencyValue value={advancedMetrics.maxDrawdown} />
                  </p>
                  <p className="text-xs text-muted-foreground">Maior perda acumulada</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Recovery Factor</p>
                  <p className="text-2xl font-bold">{advancedMetrics.recoveryFactor.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Lucro / Max Drawdown</p>
                </div>
              </div>
            ) : (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

