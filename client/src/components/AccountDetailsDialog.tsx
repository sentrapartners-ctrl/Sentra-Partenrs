import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InlineCurrencyValue } from "@/components/CurrencyValue";
import { TrendingUp, TrendingDown, Activity, BarChart3, DollarSign, Percent } from "lucide-react";

interface AccountDetailsDialogProps {
  account: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountDetailsDialog({ account, open, onOpenChange }: AccountDetailsDialogProps) {
  if (!account) return null;

  // Calcular métricas
  const balance = (account.balance || 0) / (account.isCentAccount ? 10000 : 100);
  const equity = (account.equity || 0) / (account.isCentAccount ? 10000 : 100);
  const marginFree = (account.marginFree || 0) / (account.isCentAccount ? 10000 : 100);
  const drawdownPercent = account.balance ? ((equity - balance) / balance * 100) : 0;

  // Dados simulados de rendimento mensal (últimos 6 meses)
  // TODO: Buscar dados reais do backend
  const monthlyReturns = [
    { month: "Mai", return: 5.2, profit: 520 },
    { month: "Jun", return: -2.1, profit: -210 },
    { month: "Jul", return: 8.5, profit: 850 },
    { month: "Ago", return: 3.7, profit: 370 },
    { month: "Set", return: 6.1, profit: 610 },
    { month: "Out", return: 4.3, profit: 430 },
  ];

  const totalReturn = monthlyReturns.reduce((acc, m) => acc + m.return, 0);
  const totalProfit = monthlyReturns.reduce((acc, m) => acc + m.profit, 0);

  // Dados simulados de trades recentes
  // TODO: Buscar dados reais do backend
  const recentTrades = [
    { id: 1, symbol: "EURUSD", type: "BUY", profit: 125.50, pips: 45, closeTime: "2024-10-27 14:30" },
    { id: 2, symbol: "GBPUSD", type: "SELL", profit: -85.20, pips: -32, closeTime: "2024-10-27 13:15" },
    { id: 3, symbol: "USDJPY", type: "BUY", profit: 210.75, pips: 68, closeTime: "2024-10-27 11:45" },
    { id: 4, symbol: "AUDUSD", type: "SELL", profit: 95.30, pips: 28, closeTime: "2024-10-27 10:20" },
    { id: 5, symbol: "EURJPY", type: "BUY", profit: -45.60, pips: -15, closeTime: "2024-10-27 09:10" },
  ];

  const winRate = 60; // TODO: Calcular win rate real
  const avgProfit = 150.25; // TODO: Calcular lucro médio real
  const avgLoss = -65.40; // TODO: Calcular perda média real

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                Conta {account.accountNumber}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={account.platform === "MT4" ? "bg-blue-500" : "bg-purple-500"}>
                  {account.platform}
                </Badge>
                <Badge variant="outline">{account.accountType}</Badge>
                <Badge className={account.status === "connected" ? "bg-green-500" : "bg-gray-500"}>
                  {account.status === "connected" ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trades">Trades Recentes</TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            {/* Métricas Principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Saldo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <InlineCurrencyValue value={balance} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {account.balance?.toLocaleString('pt-BR')} cents
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Equity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <InlineCurrencyValue value={equity} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {account.equity?.toLocaleString('pt-BR')} cents
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Drawdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${drawdownPercent < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {drawdownPercent.toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Equity vs Balance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Win Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {winRate}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Últimos 30 dias
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Informações da Conta */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Broker:</span>
                    <span className="text-sm font-medium">{account.broker || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Servidor:</span>
                    <span className="text-sm font-medium">{account.server || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Alavancagem:</span>
                    <span className="text-sm font-medium">1:{account.leverage || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tipo de Conta:</span>
                    <span className="text-sm font-medium">{account.isCentAccount ? "Cent" : "Standard"}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Margem Livre:</span>
                    <span className="text-sm font-medium">
                      <InlineCurrencyValue value={marginFree} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Margem Usada:</span>
                    <span className="text-sm font-medium">
                      <InlineCurrencyValue value={(account.marginUsed || 0) / (account.isCentAccount ? 10000 : 100)} />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Posições Abertas:</span>
                    <span className="text-sm font-medium">{account.openPositions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Terminal ID:</span>
                    <span className="text-sm font-medium font-mono">{account.terminalId}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Performance */}
          <TabsContent value="performance" className="space-y-4">
            {/* Resumo de Performance */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Retorno Total (6 meses)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <InlineCurrencyValue value={totalProfit} />
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Lucro Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    <InlineCurrencyValue value={avgProfit} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por trade vencedor
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Perda Média
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    <InlineCurrencyValue value={avgLoss} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por trade perdedor
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Rendimento Mensal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Rendimento Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyReturns.map((month, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{month.month}</span>
                        <div className="flex items-center gap-4">
                          <span className={month.return >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {month.return >= 0 ? '+' : ''}{month.return.toFixed(2)}%
                          </span>
                          <span className={`font-medium ${month.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            <InlineCurrencyValue value={month.profit} />
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${month.return >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(Math.abs(month.return) * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Trades Recentes */}
          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Últimos 5 Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTrades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${trade.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="font-medium">{trade.symbol}</div>
                          <div className="text-xs text-muted-foreground">{trade.closeTime}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={trade.type === "BUY" ? "default" : "secondary"}>
                          {trade.type}
                        </Badge>
                        <div className="text-right">
                          <div className={`font-medium ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            <InlineCurrencyValue value={trade.profit} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {trade.pips >= 0 ? '+' : ''}{trade.pips} pips
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

