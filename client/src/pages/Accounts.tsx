import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { RefreshCw, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { InlineCurrencyValue } from "@/components/CurrencyValue";

export default function Accounts() {
  const { data: accounts, isLoading, refetch } = trpc.accounts.list.useQuery(
    undefined,
    { refetchInterval: 10000 }
  );
  const updateClassification = trpc.accounts.updateClassification.useMutation({
    onSuccess: () => {
      toast.success("Classificação atualizada com sucesso");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao atualizar classificação");
    },
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [classification, setClassification] = useState("");

  const handleSaveClassification = (terminalId: string) => {
    updateClassification.mutate({ terminalId, classification });
    setEditingId(null);
    setClassification("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-gray-400" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500">Conectado</Badge>;
      case "disconnected":
        return <Badge variant="secondary">Desconectado</Badge>;
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      MT4: "bg-blue-500",
      MT5: "bg-purple-500",
      cTrader: "bg-green-500",
      DXTrade: "bg-orange-500",
      TradeLocker: "bg-pink-500",
      MatchTrade: "bg-indigo-500",
      Tradovate: "bg-yellow-500",
    };
    return (
      <Badge className={colors[platform] || "bg-gray-500"}>{platform}</Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contas</h1>
            <p className="text-muted-foreground">
              Gerencie suas contas de trading
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Accounts Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando contas...
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="text-muted-foreground">
                  Nenhuma conta encontrada
                </div>
                <div className="text-sm text-muted-foreground max-w-md mx-auto">
                  Configure os conectores MT4/MT5 nos seus terminais para
                  começar a monitorar suas contas. Os conectores enviarão dados
                  automaticamente para este sistema.
                </div>
                <div className="bg-muted p-4 rounded-lg text-left max-w-2xl mx-auto">
                  <p className="font-medium mb-2">Configuração do Conector:</p>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>Instale o EA UnifiedAPI_MT4.mq4 ou UnifiedAPI_MT5.mq5</li>
                    <li>Configure o MasterServer para: {window.location.origin}/api/mt</li>
                    <li>Defina um TerminalID único para cada conta</li>
                    <li>Ative o EA no gráfico</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {account.accountNumber}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getPlatformBadge(account.platform)}
                        <Badge variant="outline">{account.accountType}</Badge>
                      </div>
                    </div>
                    {getStatusIcon(account.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    {getStatusBadge(account.status)}
                  </div>

                  {/* Broker */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Broker:</span>
                    <span className="text-sm font-medium">{account.broker || "N/A"}</span>
                  </div>

                  {/* Server */}
                  {account.server && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Servidor:</span>
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {account.server}
                      </span>
                    </div>
                  )}

                  {/* Balance */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Balanço:</span>
                    <div className="text-right text-sm font-bold">
                      <InlineCurrencyValue 
                        value={(account.balance || 0) / (account.isCentAccount ? 10000 : 100)}
                      />
                      <div className="text-[10px] text-muted-foreground">
                        {(account.balance || 0).toLocaleString('pt-BR')} cents
                      </div>
                    </div>
                  </div>

                  {/* Equity */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Equity:</span>
                    <div className="text-right text-sm font-bold">
                      <InlineCurrencyValue 
                        value={(account.equity || 0) / (account.isCentAccount ? 10000 : 100)}
                      />
                      <div className="text-[10px] text-muted-foreground">
                        {(account.equity || 0).toLocaleString('pt-BR')} cents
                      </div>
                    </div>
                  </div>

                  {/* Drawdown */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Drawdown:</span>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        (() => {
                          const balance = account.balance || 0;
                          const equity = account.equity || 0;
                          if (balance === 0) return "text-green-500";
                          const dd = ((equity - balance) / balance * 100);
                          return dd < 0 ? "text-red-500" : "text-green-500";
                        })()
                      }`}>
                        {(() => {
                          const balance = account.balance || 0;
                          const equity = account.equity || 0;
                          if (balance === 0) return "0.00";
                          return (((equity - balance) / balance * 100)).toFixed(2);
                        })()}%
                      </div>
                    </div>
                  </div>

                  {/* Margin */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Margem Livre:</span>
                    <div className="text-right text-sm">
                      <InlineCurrencyValue 
                        value={(account.marginFree || 0) / (account.isCentAccount ? 10000 : 100)}
                      />
                      <div className="text-[10px] text-muted-foreground">
                        {(account.marginFree || 0).toLocaleString('pt-BR')} cents
                      </div>
                    </div>
                  </div>

                  {/* Leverage */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Alavancagem:</span>
                    <span className="text-sm">1:{account.leverage || 0}</span>
                  </div>

                  {/* Open Positions */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Posições Abertas:</span>
                    <span className="text-sm font-medium">{account.openPositions || 0}</span>
                  </div>

                  {/* Classification */}
                  <div className="pt-2 border-t">
                    {editingId === account.id ? (
                      <div className="space-y-2">
                        <Input
                          value={classification}
                          onChange={(e) => setClassification(e.target.value)}
                          placeholder="Ex: Conta Principal"
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveClassification(account.terminalId)}
                            className="flex-1"
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null);
                              setClassification("");
                            }}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">
                            Classificação:
                          </div>
                          <div className="text-sm">
                            {account.classification || "Não definida"}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(account.id);
                            setClassification(account.classification || "");
                          }}
                        >
                          Editar
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Last Update */}
                  {account.lastHeartbeat && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Última atualização:{" "}
                      {new Date(account.lastHeartbeat).toLocaleString("pt-BR")}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

