import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Wifi,
  WifiOff,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConnectedAccount {
  accountId: string;
  accountName: string;
  type: 'master' | 'slave';
  status: 'online' | 'offline';
  lastHeartbeat: Date;
  balance: number;
  equity: number;
  userId: number;
}

interface LiveTrade {
  id: string;
  masterAccountId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  timestamp: Date;
  userId: number;
  slaveStatuses: {
    slaveAccountId: string;
    slaveAccountName: string;
    status: 'pending' | 'success' | 'failed';
    executionTime?: number;
    slippage?: number;
    error?: string;
  }[];
}

export default function CopyTradingDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Conectar ao WebSocket com autenticação
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/copy-trading`;
    
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket conectado');
      setWsStatus('connected');
      
      // Autenticar com userId
      websocket.send(JSON.stringify({ 
        type: 'AUTHENTICATE',
        userId: user.id,
        email: user.email
      }));
      
      // Solicitar lista de contas conectadas do usuário
      websocket.send(JSON.stringify({ 
        type: 'GET_CONNECTED_ACCOUNTS',
        userId: user.id
      }));
      
      // Solicitar trades recentes do usuário
      websocket.send(JSON.stringify({ 
        type: 'GET_RECENT_TRADES',
        userId: user.id,
        limit: 50
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Verificar se a mensagem é para este usuário
      if (data.userId && data.userId !== user.id) {
        return; // Ignorar mensagens de outros usuários
      }
      
      switch (data.type) {
        case 'AUTHENTICATED':
          console.log('Autenticado no WebSocket');
          break;
          
        case 'CONNECTED_ACCOUNTS':
          // Apenas contas do usuário atual
          setConnectedAccounts(data.accounts.filter((acc: ConnectedAccount) => 
            acc.userId === user.id
          ));
          break;
          
        case 'RECENT_TRADES':
          // Apenas trades do usuário atual
          setLiveTrades(data.trades.filter((trade: LiveTrade) => 
            trade.userId === user.id
          ));
          break;
          
        case 'ACCOUNT_CONNECTED':
          // Adicionar apenas se for conta do usuário
          if (data.account.userId === user.id) {
            setConnectedAccounts(prev => {
              // Evitar duplicatas
              const exists = prev.some(acc => acc.accountId === data.account.accountId);
              if (exists) return prev;
              return [...prev, data.account];
            });
          }
          break;
          
        case 'ACCOUNT_DISCONNECTED':
          // Remover apenas se for conta do usuário
          if (data.userId === user.id) {
            setConnectedAccounts(prev => 
              prev.filter(acc => acc.accountId !== data.accountId)
            );
          }
          break;
          
        case 'NEW_TRADE':
          // Adicionar novo trade apenas se for do usuário
          if (data.trade.userId === user.id) {
            setLiveTrades(prev => {
              // Evitar duplicatas
              const exists = prev.some(t => t.id === data.trade.id);
              if (exists) return prev;
              return [data.trade, ...prev.slice(0, 49)]; // Manter últimos 50
            });
          }
          break;
          
        case 'TRADE_COPIED':
          // Atualizar status de cópia do slave apenas se for trade do usuário
          if (data.userId === user.id) {
            setLiveTrades(prev => prev.map(trade => {
              if (trade.id === data.tradeId) {
                return {
                  ...trade,
                  slaveStatuses: trade.slaveStatuses.map(status => 
                    status.slaveAccountId === data.slaveAccountId
                      ? { ...status, ...data.status }
                      : status
                  )
                };
              }
              return trade;
            }));
          }
          break;
          
        case 'ERROR':
          console.error('WebSocket erro:', data.message);
          break;
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket erro:', error);
      setWsStatus('disconnected');
    };

    websocket.onclose = () => {
      console.log('WebSocket desconectado');
      setWsStatus('disconnected');
      
      // Tentar reconectar após 5 segundos
      setTimeout(() => {
        if (isAuthenticated && user) {
          window.location.reload();
        }
      }, 5000);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Faça login para visualizar o dashboard de Copy Trading
        </AlertDescription>
      </Alert>
    );
  }

  const masterAccounts = connectedAccounts.filter(acc => acc.type === 'master');
  const slaveAccounts = connectedAccounts.filter(acc => acc.type === 'slave');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'success': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'pending': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getCopyStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default: return null;
    }
  };

  const calculateSuccessRate = () => {
    if (liveTrades.length === 0) return 0;
    
    const totalCopies = liveTrades.reduce((acc, trade) => 
      acc + trade.slaveStatuses.length, 0
    );
    
    if (totalCopies === 0) return 0;
    
    const successfulCopies = liveTrades.reduce((acc, trade) => 
      acc + trade.slaveStatuses.filter(s => s.status === 'success').length, 0
    );
    
    return ((successfulCopies / totalCopies) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Status de Conexão */}
      {wsStatus !== 'connected' && (
        <Alert variant={wsStatus === 'connecting' ? 'default' : 'destructive'}>
          <Activity className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            {wsStatus === 'connecting' 
              ? 'Conectando ao servidor em tempo real...' 
              : 'Desconectado. Tentando reconectar...'}
          </AlertDescription>
        </Alert>
      )}

      {/* Header com Estatísticas do Usuário */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Minhas Contas Master
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{masterAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              {masterAccounts.filter(a => a.status === 'online').length} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Minhas Contas Slave
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{slaveAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              {slaveAccounts.filter(a => a.status === 'online').length} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Meus Trades Hoje
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveTrades.length}</div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Sucesso
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {calculateSuccessRate()}%
            </div>
            <p className="text-xs text-muted-foreground">
              Cópias bem-sucedidas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Minhas Contas Conectadas */}
        <Card>
          <CardHeader>
            <CardTitle>Minhas Contas Conectadas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Usuário: {user.email}
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* Master Accounts */}
                {masterAccounts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                      MASTER ACCOUNTS
                    </h3>
                    {masterAccounts.map((account) => (
                      <div
                        key={account.accountId}
                        className="flex items-center justify-between p-3 border rounded-lg mb-2 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {account.status === 'online' ? (
                            <Wifi className="h-5 w-5 text-green-500" />
                          ) : (
                            <WifiOff className="h-5 w-5 text-red-500" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{account.accountName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground font-mono">
                                ID: {account.accountId}
                              </p>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(account.accountId);
                                }}
                                className="text-xs text-blue-500 hover:text-blue-700"
                                title="Copiar ID da conta"
                              >
                                📋 Copiar
                              </button>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Configure seus Slaves com este ID para copiar
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            ${account.equity.toFixed(2)}
                          </p>
                          <Badge 
                            variant={account.status === 'online' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {account.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Slave Accounts */}
                {slaveAccounts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                      SLAVE ACCOUNTS
                    </h3>
                    {slaveAccounts.map((account) => (
                      <div
                        key={account.accountId}
                        className="flex items-center justify-between p-3 border rounded-lg mb-2 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {account.status === 'online' ? (
                            <Wifi className="h-5 w-5 text-green-500" />
                          ) : (
                            <WifiOff className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{account.accountName}</p>
                            <p className="text-xs text-muted-foreground">
                              {account.accountId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            ${account.equity.toFixed(2)}
                          </p>
                          <Badge 
                            variant={account.status === 'online' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {account.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {connectedAccounts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <WifiOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma conta conectada</p>
                    <p className="text-xs mt-1">
                      Aguardando conexão dos seus EAs...
                    </p>
                    <p className="text-xs mt-2 font-mono text-xs bg-muted p-2 rounded">
                      Configure seus EAs com: {user.email}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Meus Trades em Tempo Real */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Meus Trades em Tempo Real
              {wsStatus === 'connected' && (
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {liveTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="border rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
                  >
                    {/* Header do Trade */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {trade.type === 'BUY' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-semibold">{trade.symbol}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(trade.timestamp).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={trade.type === 'BUY' ? 'default' : 'destructive'}>
                          {trade.type}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {trade.volume} lotes
                        </p>
                      </div>
                    </div>

                    {/* Informações do Trade */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="font-medium">{trade.openPrice.toFixed(5)}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Master:</span>
                      <span className="font-mono text-xs">{trade.masterAccountId}</span>
                    </div>

                    {/* Status de Cópia por Slave */}
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-semibold text-muted-foreground">
                        STATUS DE CÓPIA:
                      </p>
                      {trade.slaveStatuses.map((slaveStatus) => (
                        <div
                          key={slaveStatus.slaveAccountId}
                          className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            {getCopyStatusIcon(slaveStatus.status)}
                            <div>
                              <span className="font-medium text-xs">
                                {slaveStatus.slaveAccountName}
                              </span>
                              <p className="font-mono text-xs text-muted-foreground">
                                {slaveStatus.slaveAccountId}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {slaveStatus.executionTime && (
                              <span className="text-xs text-muted-foreground">
                                ⚡ {slaveStatus.executionTime}ms
                              </span>
                            )}
                            {slaveStatus.slippage !== undefined && (
                              <span className={`text-xs font-medium ${
                                Math.abs(slaveStatus.slippage) > 2 
                                  ? 'text-red-500' 
                                  : 'text-green-500'
                              }`}>
                                {slaveStatus.slippage > 0 ? '+' : ''}
                                {slaveStatus.slippage.toFixed(1)} pips
                              </span>
                            )}
                            {slaveStatus.error && (
                              <span className="text-xs text-red-500 max-w-[150px] truncate" title={slaveStatus.error}>
                                ❌ {slaveStatus.error}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {liveTrades.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aguardando seus trades...</p>
                    <p className="text-xs mt-1">
                      Trades aparecerão aqui em tempo real
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
