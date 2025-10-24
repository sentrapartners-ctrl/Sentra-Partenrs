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
  LineChart,
  PieChart,
  Clock,
} from "lucide-react";
import { useState, useMemo } from "react";
import { PeriodFilter, Period } from "@/components/PeriodFilter";
import { InlineCurrencyValue } from "@/components/CurrencyValue";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

export default function Analytics() {
  const { isAuthenticated, loading } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");

  const { data: accounts } = trpc.accounts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: allTrades } = trpc.trades.list.useQuery(
    { limit: 10000 },
    { enabled: isAuthenticated }
  );

  // Filter trades by period
  const trades = useMemo(() => {
    if (!allTrades) return [];
    const now = new Date();
    const daysAgo = parseInt(period.replace('d', ''));
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    return allTrades.filter((trade) => {
      if (!trade.closeTime) return false;
      const tradeDate = new Date(trade.closeTime);
      return tradeDate >= cutoffDate;
    });
  }, [allTrades, period]);

  // Helper to get actual profit
  const getActualProfit = (trade: any) => {
    const divisor = trade.isCentAccount ? 10000 : 100;
    return (trade.profit || 0) / divisor;
  };

  // Calculate basic statistics
  const analytics = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
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
    }

    const winningTrades = trades.filter((t) => getActualProfit(t) > 0);
    const losingTrades = trades.filter((t) => getActualProfit(t) < 0);
    const totalProfit = winningTrades.reduce((sum, t) => sum + getActualProfit(t), 0);
    const totalLoss = losingTrades.reduce((sum, t) => sum + getActualProfit(t), 0);

    return {
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / trades.length) * 100,
      totalProfit,
      totalLoss,
      netProfit: totalProfit + totalLoss,
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

  // Balance evolution chart data
  const balanceEvolutionData = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.closeTime!).getTime() - new Date(b.closeTime!).getTime()
    );

    let runningBalance = 0;
    const data: any[] = [];

    sortedTrades.forEach((trade) => {
      runningBalance += getActualProfit(trade);
      data.push({
        date: new Date(trade.closeTime!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        balance: runningBalance,
      });
    });

    return data;
  }, [trades]);

  // Win rate over time (weekly)
  const winRateOverTimeData = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const weeklyData: Record<string, { wins: number; total: number }> = {};

    trades.forEach((trade) => {
      const date = new Date(trade.closeTime!);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { wins: 0, total: 0 };
      }

      weeklyData[weekKey].total++;
      if (getActualProfit(trade) > 0) {
        weeklyData[weekKey].wins++;
      }
    });

    return Object.entries(weeklyData).map(([week, data]) => ({
      week,
      winRate: (data.wins / data.total) * 100,
    }));
  }, [trades]);

  // Analysis by symbol
  const symbolAnalysisData = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const symbolData: Record<string, { trades: number; wins: number; profit: number }> = {};

    trades.forEach((trade) => {
      if (!symbolData[trade.symbol]) {
        symbolData[trade.symbol] = { trades: 0, wins: 0, profit: 0 };
      }

      symbolData[trade.symbol].trades++;
      symbolData[trade.symbol].profit += getActualProfit(trade);
      if (getActualProfit(trade) > 0) {
        symbolData[trade.symbol].wins++;
      }
    });

    return Object.entries(symbolData)
      .map(([symbol, data]) => ({
        symbol,
        trades: data.trades,
        winRate: (data.wins / data.trades) * 100,
        profit: data.profit,
      }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 10);
  }, [trades]);

  // Analysis by day of week
  const dayOfWeekData = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const dayData: Record<number, { trades: number; wins: number; profit: number }> = {};

    trades.forEach((trade) => {
      const day = new Date(trade.closeTime!).getDay();
      if (!dayData[day]) {
        dayData[day] = { trades: 0, wins: 0, profit: 0 };
      }

      dayData[day].trades++;
      dayData[day].profit += getActualProfit(trade);
      if (getActualProfit(trade) > 0) {
        dayData[day].wins++;
      }
    });

    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    return Object.entries(dayData).map(([day, data]) => ({
      day: dayNames[parseInt(day)],
      trades: data.trades,
      winRate: (data.wins / data.trades) * 100,
      profit: data.profit,
    }));
  }, [trades]);

  // Analysis by hour
  const hourAnalysisData = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const hourData: Record<number, { trades: number; wins: number; profit: number }> = {};

    trades.forEach((trade) => {
      const hour = new Date(trade.closeTime!).getHours();
      if (!hourData[hour]) {
        hourData[hour] = { trades: 0, wins: 0, profit: 0 };
      }

      hourData[hour].trades++;
      hourData[hour].profit += getActualProfit(trade);
      if (getActualProfit(trade) > 0) {
        hourData[hour].wins++;
      }
    });

    return Object.entries(hourData)
      .map(([hour, data]) => ({
        hour: `${hour}h`,
        trades: data.trades,
        winRate: (data.wins / data.trades) * 100,
        profit: data.profit,
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
  }, [trades]);

  // Advanced metrics
  const advancedMetrics = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0,
        recoveryFactor: 0,
      };
    }

    const returns = trades.map((t) => getActualProfit(t));
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );

    // Sharpe Ratio (assuming risk-free rate = 0)
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    // Sortino Ratio (only downside deviation)
    const negativeReturns = returns.filter((r) => r < 0);
    const downsideDev = negativeReturns.length > 0
      ? Math.sqrt(
          negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
        )
      : 0;
    const sortinoRatio = downsideDev > 0 ? avgReturn / downsideDev : 0;

    // Max Drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningBalance = 0;

    trades.forEach((trade) => {
      runningBalance += getActualProfit(trade);
      if (runningBalance > peak) {
        peak = runningBalance;
      }
      const drawdown = peak - runningBalance;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    // Recovery Factor
    const recoveryFactor = maxDrawdown > 0 ? analytics.netProfit / maxDrawdown : 0;

    return {
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      recoveryFactor,
    };
  }, [trades, analytics.netProfit]);

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
          <p className="text-muted-foreground">Faça login para ver análises</p>
        </div>
      </DashboardLayout>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Análises Avançadas</h1>
            <p className="text-muted-foreground">
              Métricas detalhadas e gráficos de performance
            </p>
          </div>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>

        {/* Basic Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Trades</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalTrades}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.winningTrades} vencedores / {analytics.losingTrades} perdedores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.winRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Taxa de acerto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              {analytics.netProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <InlineCurrencyValue
                value={analytics.netProfit}
                className="text-2xl font-bold"
              />
              <p className="text-xs text-muted-foreground">
                Profit Factor: {analytics.profitFactor.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drawdown</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.drawdown.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Atual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Balance Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Evolução do Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balanceEvolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={balanceEvolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="balance" stroke="#8884d8" name="Balance" />
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Win Rate Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Win Rate por Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            {winRateOverTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={winRateOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="winRate" fill="#82ca9d" name="Win Rate %" />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Symbol Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Análise por Símbolo (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {symbolAnalysisData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Símbolo</th>
                      <th className="text-right p-2">Trades</th>
                      <th className="text-right p-2">Win Rate</th>
                      <th className="text-right p-2">Lucro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {symbolAnalysisData.map((item, index) => (
                      <tr key={item.symbol} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{item.symbol}</td>
                        <td className="text-right p-2">{item.trades}</td>
                        <td className="text-right p-2">{item.winRate.toFixed(1)}%</td>
                        <td className="text-right p-2">
                          <InlineCurrencyValue
                            value={item.profit}
                            className={item.profit >= 0 ? 'text-green-600' : 'text-red-600'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Temporal Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Day of Week */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Performance por Dia da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dayOfWeekData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={dayOfWeekData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="profit" fill="#8884d8" name="Lucro" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hour Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Performance por Hora do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hourAnalysisData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={hourAnalysisData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="trades" fill="#82ca9d" name="Trades" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Sem dados para exibir
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Advanced Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas Avançadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                <p className="text-2xl font-bold">{advancedMetrics.sharpeRatio.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Retorno ajustado ao risco</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sortino Ratio</p>
                <p className="text-2xl font-bold">{advancedMetrics.sortinoRatio.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Retorno vs risco negativo</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Drawdown</p>
                <InlineCurrencyValue
                  value={advancedMetrics.maxDrawdown}
                  className="text-2xl font-bold text-red-600"
                />
                <p className="text-xs text-muted-foreground">Maior perda acumulada</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recovery Factor</p>
                <p className="text-2xl font-bold">{advancedMetrics.recoveryFactor.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Lucro / Max Drawdown</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

