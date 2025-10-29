import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InlineCurrencyValue } from "@/components/CurrencyValue";
import { TrendingUp, TrendingDown, Activity, BarChart3, DollarSign, Percent } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AccountDetailsDialogProps {
  account: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountDetailsDialog({ account, open, onOpenChange }: AccountDetailsDialogProps) {
  // Buscar dados de performance reais
  const { data: performance, isLoading } = trpc.accounts.performance.useQuery(
    { accountId: account?.id },
    {
      enabled: !!account?.id && open,
    }
  );

  if (!account) return null;

  // Calcular métricas básicas
  const balance = account.isCentAccount ? ((account.balance || 0) / 100) : (account.balance || 0);
  const equity = account.isCentAccount ? ((account.equity || 0) / 100) : (account.equity || 0);
  const marginFree = account.isCentAccount ? ((account.marginFree || 0) / 100) : (account.marginFree || 0);
  const drawdownPercent = account.balance ? ((equity - balance) / balance * 100) : 0;

  // Usar dados reais ou valores padrão
  const monthlyReturns = performance?.monthlyReturns || [];
  const recentTrades = performance?.recentTrades || [];
  const totalReturn = performance?.totalReturn || 0;
  const totalProfit = performance?.totalProfit || 0;
  const winRate = performance?.winRate || 0;
  const avgProfit = performance?.avgProfit || 0;
  const avgLoss = performance?.avgLoss || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
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
                  <div className="text-2xl font-bold text-blue-500">
                    {winRate.toFixed(0)}%
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
                <CardTitle className="text-lg">Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Broker:</p>
                    <p className="font-medium">{account.broker || "Não definido"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Margem Livre:</p>
                    <p className="font-medium">
                      <InlineCurrencyValue value={marginFree} />
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Margem Usada:</p>
                    <p className="font-medium">
                      <InlineCurrencyValue value={account.isCentAccount ? ((account.marginUsed || 0) / 100) : (account.marginUsed || 0)} />
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Servidor:</p>
                    <p className="font-medium">{account.server || "Não definido"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Alavancagem:</p>
                    <p className="font-medium">1:{account.leverage || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Posições Abertas:</p>
                    <p className="font-medium">{account.openPositions || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Conta:</p>
                    <p className="font-medium">{account.accountType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Terminal ID:</p>
                    <p className="font-medium text-xs">{account.terminalId || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Classificação:</p>
                    <p className="font-medium">{account.classification || "Não definida"}</p>
                  </div>
                </div>
                {account.lastUpdate && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Última atualização: {new Date(account.lastUpdate).toLocaleString('pt-BR')}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Performance */}
          <TabsContent value="performance" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Métricas de Performance */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Retorno Total (6 meses)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        <InlineCurrencyValue value={totalProfit} /> • {performance?.totalTrades || 0} trades
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
                      <div className="text-3xl font-bold text-green-500">
                        +<InlineCurrencyValue value={avgProfit} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
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
                      <div className="text-3xl font-bold text-red-500">
                        <InlineCurrencyValue value={avgLoss} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Por trade perdedor
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Rendimento Mensal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Rendimento Mensal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {monthlyReturns.length > 0 ? (
                      <div className="space-y-3">
                        {monthlyReturns.map((month: any, index: number) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <span className="text-sm font-medium w-12">{month.month}</span>
                              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full ${month.return >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(Math.abs(month.return) * 10, 100)}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className={`text-sm font-medium ${month.return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {month.return >= 0 ? '+' : ''}{month.return}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                +<InlineCurrencyValue value={account.isCentAccount ? (month.profit / 100) : month.profit} />
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum dado de rendimento disponível
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Tab: Trades Recentes */}
          <TabsContent value="trades" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Últimos 5 Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentTrades.length > 0 ? (                    <div className="space-y-2">
                      {recentTrades.slice(0, 5).map((trade) => {
                        console.log('[AccountDetailsDialog] Trade:', { profit: trade.profit, isCentAccount: account.isCentAccount });
                        return (                   <div key={trade.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Badge className={trade.type === "BUY" ? "bg-green-500" : "bg-red-500"}>
                              {trade.type}
                            </Badge>
                            <div>
                              <p className="font-medium">{trade.symbol}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(trade.closeTime).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {trade.profit >= 0 ? '+' : ''}<InlineCurrencyValue value={account.isCentAccount ? (trade.profit / 100) : trade.profit} />
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {trade.pips >= 0 ? '+' : ''}{trade.pips} pips
                            </p>
                          </div>
                        </div>
                      );})}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum trade recente disponível
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

