import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Calendar } from "lucide-react";

interface AccountReportDialogProps {
  account: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountReportDialog({ account, open, onOpenChange }: AccountReportDialogProps) {
  const { data: trades } = trpc.trades.list.useQuery(
    { accountId: account?.id, limit: 100 },
    { enabled: !!account }
  );
  
  const { data: stats } = trpc.trades.statistics.useQuery(
    {},
    { enabled: !!account }
  );

  if (!account) return null;

  const formatCurrency = (value: number) => {
    // CENT: dividir por 100, STANDARD: usar direto
    const finalValue = account.accountType === 'CENT' ? value / 100 : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: account.currency || 'USD',
    }).format(finalValue);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const profitLoss = (account.equity || 0) - (account.balance || 0);
  const profitLossPercent = account.balance ? ((profitLoss / account.balance) * 100) : 0;

  const accountTrades = trades?.filter(t => t.accountId === account.id) || [];
  const openTrades = accountTrades.filter(t => t.closeTime === null);
  const closedTrades = accountTrades.filter(t => t.closeTime !== null);
  
  const winningTrades = closedTrades.filter(t => (t.profit || 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.profit || 0) < 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  const totalProfit = closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const averageProfit = closedTrades.length > 0 ? totalProfit / closedTrades.length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[1600px] h-[95vh] overflow-y-auto sm:!max-w-[1600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Relatório Completo - {account.broker} #{account.accountNumber}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="trades">Trades</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          {/* TAB: Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(account.balance || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Equity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(account.equity || 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Lucro/Prejuízo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(profitLoss)}
                  </div>
                  <div className={`text-sm ${profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(profitLossPercent)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Margem Livre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(account.marginFree || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Activity className="h-4 w-4 inline mr-2" />
                    Posições Abertas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{account.openPositions || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <BarChart3 className="h-4 w-4 inline mr-2" />
                    Alavancagem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">1:{account.leverage || 100}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <DollarSign className="h-4 w-4 inline mr-2" />
                    Nível de Margem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{(account.marginLevel || 0) / 100}%</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: Trades */}
          <TabsContent value="trades" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total de Trades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{closedTrades.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 inline mr-1" />
                    Vencedores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{winningTrades.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600">
                    <TrendingDown className="h-4 w-4 inline mr-1" />
                    Perdedores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{losingTrades.length}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Trades Abertos ({openTrades.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {openTrades.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum trade aberto</p>
                ) : (
                  <div className="space-y-2">
                    {openTrades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{trade.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {trade.type} • Lote: {(trade.volume || 0) / 100}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${(trade.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trade.profit || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(trade.openTime).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimos Trades Fechados</CardTitle>
              </CardHeader>
              <CardContent>
                {closedTrades.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum trade fechado</p>
                ) : (
                  <div className="space-y-2">
                    {closedTrades.slice(0, 10).map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{trade.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {trade.type} • Lote: {(trade.volume || 0) / 100}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${(trade.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trade.profit || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {trade.closeTime ? new Date(trade.closeTime).toLocaleDateString() : '-'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Performance */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Acerto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{winRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {winningTrades.length} vitórias de {closedTrades.length} trades
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lucro Médio por Trade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-4xl font-bold ${averageProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(averageProfit)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Total: {formatCurrency(totalProfit)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Resultados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Trades Vencedores</span>
                      <span className="text-sm font-medium">{winningTrades.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${winRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Trades Perdedores</span>
                      <span className="text-sm font-medium">{losingTrades.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${100 - winRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Detalhes */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Corretora</div>
                    <div className="font-medium">{account.broker}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Número da Conta</div>
                    <div className="font-medium">{account.accountNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Plataforma</div>
                    <div className="font-medium">{account.platform}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Tipo de Conta</div>
                    <div className="font-medium">{account.accountType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Servidor</div>
                    <div className="font-medium">{account.server || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Moeda</div>
                    <div className="font-medium">{account.currency || 'USD'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge variant={account.status === 'connected' ? 'default' : 'destructive'}>
                      {account.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Último Heartbeat</div>
                    <div className="font-medium">
                      {account.lastHeartbeat
                        ? new Date(account.lastHeartbeat).toLocaleString()
                        : 'Nunca'}
                    </div>
                  </div>
                  {account.classification && (
                    <div className="col-span-2">
                      <div className="text-sm text-muted-foreground">Classificação</div>
                      <div className="font-medium">{account.classification}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Margem e Risco</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Margem Usada</div>
                    <div className="font-medium">{formatCurrency(account.marginUsed || 0)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Margem Livre</div>
                    <div className="font-medium">{formatCurrency(account.marginFree || 0)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Nível de Margem</div>
                    <div className="font-medium">{(account.marginLevel || 0) / 100}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Alavancagem</div>
                    <div className="font-medium">1:{account.leverage || 100}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

