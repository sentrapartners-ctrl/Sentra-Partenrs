import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, DollarSign, TrendingUp, TrendingDown, Wallet, BarChart3 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
// PeriodFilter removido - não é usado na Home
import { CurrencyValue, InlineCurrencyValue } from "@/components/CurrencyValue";
import { useAccountConnectionNotifications } from "@/hooks/useAccountConnectionNotifications.tsx";

export default function Home() {
  // Hook para notificações de conexão de contas
  useAccountConnectionNotifications();
  const { isAuthenticated, loading, user } = useAuth();
  
  // Verificar assinatura
  const { data: subscriptionData } = trpc.subscriptions.current.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const hasActiveSubscription = subscriptionData?.hasActiveSubscription || false;
  const hasDashboardPermission = subscriptionData?.manualPermissions?.dashboard || false;
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'vip';
  
  // Apenas carregar dados se tiver assinatura, permissão de Dashboard ou for admin/gerente
  const canAccessData = hasActiveSubscription || hasDashboardPermission || isAdminOrManager;
  
  const { data: dashboardData, isLoading } = trpc.dashboard.summary.useQuery(
    undefined,
    { enabled: isAuthenticated && canAccessData, refetchInterval: 5000 }
  );

  const stats = useMemo(() => {
    if (!dashboardData) return null;

    const { summary, stats: tradeStats } = dashboardData;
    
    // Calcula balanço total aplicando conversão por conta
    const totalBalance = (summary?.accounts || []).reduce((sum, acc: any) => {
      return sum + (acc.isCentAccount ? ((acc.balance || 0) / 100) : (acc.balance || 0));
    }, 0);
    const totalEquity = (summary?.accounts || []).reduce((sum, acc: any) => {
      return sum + (acc.isCentAccount ? ((acc.equity || 0) / 100) : (acc.equity || 0));
    }, 0);
    const profitLoss = totalEquity - totalBalance;
    const profitLossPercent = totalBalance > 0 ? (profitLoss / totalBalance) * 100 : 0;
    
    // Calcula lucro do dia (trades fechados hoje)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayProfit = (dashboardData?.recentTrades || []).reduce((sum, trade: any) => {
      if (!trade.closeTime) return sum;
      const closeDate = new Date(trade.closeTime);
      closeDate.setHours(0, 0, 0, 0);
      if (closeDate.getTime() === today.getTime()) {
        const profit = trade.isCentAccount ? ((trade.profit || 0) / 100) : (trade.profit || 0);
        return sum + profit;
      }
      return sum;
    }, 0);

    return {
      totalBalance,
      totalEquity,
      profitLoss,
      profitLossPercent,
      totalAccounts: summary?.totalAccounts || 0,
      connectedAccounts: summary?.connectedAccounts || 0,
      openPositions: summary?.totalOpenPositions || 0,
      winRate: tradeStats?.winRate || 0,
      totalTrades: tradeStats?.totalTrades || 0,
      netProfit: tradeStats?.netProfit || 0,
      todayProfit,
    };
  }, [dashboardData]);

  const recentTrades = useMemo(() => {
    if (!dashboardData?.recentTrades) return [];
    
    // Aplica conversão baseada em isCentAccount
    return dashboardData.recentTrades.map((trade: any) => ({
      ...trade,
      profit: trade.isCentAccount ? ((trade.profit || 0) / 100) : (trade.profit || 0),
      volume: (trade.volume || 0) / 100,
      openPrice: (trade.openPrice || 0) / 100000,
      closePrice: (trade.closePrice || 0) / 100000,
    }));
  }, [dashboardData?.recentTrades]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das suas contas de trading
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Balanço Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CurrencyValue value={stats?.totalBalance || 0} />
              <p className="text-xs text-muted-foreground">
                {stats?.totalAccounts || 0} contas ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CurrencyValue value={stats?.totalEquity || 0} />
              <div className="flex items-center text-xs">
                {stats && stats.profitLoss >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span
                  className={
                    stats && stats.profitLoss >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }
                >
                  {stats && stats.profitLoss >= 0 ? '+' : '-'}${(Math.abs(stats?.profitLoss || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (
                  {stats?.profitLossPercent.toFixed(2)}%)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Posições Abertas
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.openPositions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.connectedAccounts || 0} contas conectadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro do Dia</CardTitle>
              {(stats?.todayProfit || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                (stats?.todayProfit || 0) >= 0 ? "text-green-500" : "text-red-500"
              }`}>
                <CurrencyValue value={stats?.todayProfit || 0} />
              </div>
              <p className="text-xs text-muted-foreground">
                Trades fechados hoje
              </p>
            </CardContent>
          </Card>


        </div>

        {/* Recent Trades */}
        <Card>
          <CardHeader>
            <CardTitle>Trades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : recentTrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum trade encontrado
              </div>
            ) : (
              <div className="space-y-4">
                {recentTrades.map((trade: any) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{trade.symbol}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            trade.type === "BUY"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {trade.type}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            trade.status === "open"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {trade.status === "open" ? "Aberto" : "Fechado"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {trade.volume.toFixed(2)} lotes • Abertura:{" "}
                        {trade.openPrice.toFixed(5)}
                        {trade.closePrice > 0 &&
                          ` • Fechamento: ${trade.closePrice.toFixed(5)}`}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(trade.openTime).toLocaleString("pt-BR")}
                      </div>
                      {(trade as any).accountNumber && (
                        <div className="text-xs text-muted-foreground font-medium mt-1">
                          {(trade as any).broker} - {(trade as any).accountNumber}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        <InlineCurrencyValue 
                          value={trade.profit} 
                          colored={true}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accounts Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Contas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : !dashboardData?.summary?.accounts ||
              dashboardData.summary.accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma conta encontrada. Configure seus terminais MT4/MT5 para
                começar.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dashboardData.summary.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {account.accountNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {account.broker} • {account.platform}
                        </div>
                      </div>
                      <div
                        className={`h-2 w-2 rounded-full ${
                          account.status === "connected"
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Balanço:</span>
                        <div className="text-right font-medium text-sm">
                          <InlineCurrencyValue 
                            value={account.isCentAccount ? ((account.balance || 0) / 100) : (account.balance || 0)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Equity:</span>
                        <div className="text-right font-medium text-sm">
                          <InlineCurrencyValue 
                            value={account.isCentAccount ? ((account.equity || 0) / 100) : (account.equity || 0)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Posições:</span>
                        <span className="font-medium">
                          {account.openPositions || 0}
                        </span>
                      </div>
                    </div>
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

