import { useState, useEffect, useRef, useMemo } from "react";
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
  AlertCircle,
  Copy
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
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // Memoizar estatísticas para evitar recálculos
  const stats = useMemo(() => {
    const masterAccounts = connectedAccounts.filter(acc => acc.type === 'master');
    const slaveAccounts = connectedAccounts.filter(acc => acc.type === 'slave');
    
    const totalCopies = liveTrades.reduce((acc, trade) => 
      acc + trade.slaveStatuses.length, 0
    );
    
    const successfulCopies = liveTrades.reduce((acc, trade) => 
      acc + trade.slaveStatuses.filter(s => s.status === 'success').length, 0
    );
    
    const successRate = totalCopies > 0 
      ? ((successfulCopies / totalCopies) * 100).toFixed(1) 
      : '0';

    return {
      masterCount: masterAccounts.length,
      masterOnline: masterAccounts.filter(a => a.status === 'online').length,
      slaveCount: slaveAccounts.length,
      slaveOnline: slaveAccounts.filter(a => a.status === 'online').length,
      tradesCount: liveTrades.length,
      successRate,
      masterAccounts,
      slaveAccounts
    };
  }, [connectedAccounts, liveTrades]);

  const connectWebSocket = () => {
    if (!isAuthenticated || !user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/copy-trading`;
    
    const websocket = new WebSocket(wsUrl);
    wsRef.current = websocket;

    websocket.onopen = () => {
      setWsStatus('connected');
      
      websocket.send(JSON.stringify({ 
        type: 'AUTHENTICATE',
        userId: user.id,
        email: user.email
      }));
      
      websocket.send(JSON.stringify({ 
        type: 'GET_CONNECTED_ACCOUNTS',
        userId: user.id
      }));
      
      websocket.send(JSON.stringify({ 
        type: 'GET_RECENT_TRADES',
        userId: user.id,
        limit: 50
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.userId && data.userId !== user.id) return;
      
      switch (data.type) {
        case 'CONNECTED_ACCOUNTS':
          setConnectedAccounts(data.accounts);
          break;
          
        case 'RECENT_TRADES':
          setLiveTrades(data.trades);
          break;
          
        case 'ACCOUNT_CONNECTED':
          setConnectedAccounts(prev => {
            const exists = prev.some(acc => acc.accountId === data.account.accountId);
            if (exists) return prev;
            return [...prev, data.account];
          });
          break;
          
        case 'ACCOUNT_DISCONNECTED':
          setConnectedAccounts(prev => 
            prev.filter(acc => acc.accountId !== data.accountId)
          );
          break;
          
        case 'NEW_TRADE':
          setLiveTrades(prev => {
            const exists = prev.some(t => t.id === data.trade.id);
            if (exists) return prev;
            return [data.trade, ...prev.slice(0, 49)];
          });
          break;
          
        case 'TRADE_COPIED':
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
          break;
      }
    };

    websocket.onerror = () => {
      setWsStatus('disconnected');
    };

    websocket.onclose = () => {
      setWsStatus('disconnected');
      wsRef.current = null;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isAuthenticated && user) {
          connectWebSocket();
        }
      }, 5000);
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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

  return (
    <div className="space-y-4">
      {/* Header com Estatísticas */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Master
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.masterCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.masterOnline} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Slave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.slaveCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.slaveOnline} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tradesCount}</div>
            <p className="text-xs text-muted-foreground">Últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.successRate}%
            </div>
            <p className="text-xs text-muted-foreground">Taxa de cópia</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Contas Conectadas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Contas Conectadas
              {wsStatus === 'connected' && (
                <div className="h-2 w-2 bg-green-500 rounded-full" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {/* Master Accounts */}
                {stats.masterAccounts.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
                      Master
                    </h3>
                    {stats.masterAccounts.map((account) => (
                      <div
                        key={account.accountId}
                        className="p-2 border rounded mb-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            {account.status === 'online' ? (
                              <Wifi className="h-4 w-4 text-green-500 mt-0.5" />
                            ) : (
                              <WifiOff className="h-4 w-4 text-red-500 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{account.accountName}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <p className="text-xs font-mono text-muted-foreground">
                                  {account.accountId}
                                </p>
                                <button
                                  onClick={() => copyToClipboard(account.accountId)}
                                  className="p-0.5 hover:bg-accent rounded"
                                  title="Copiar ID"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs font-medium whitespace-nowrap">
                              ${account.equity.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Slave Accounts */}
                {stats.slaveAccounts.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
                      Slave
                    </h3>
                    {stats.slaveAccounts.map((account) => (
                      <div
                        key={account.accountId}
                        className="p-2 border rounded mb-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 flex-1">
                            {account.status === 'online' ? (
                              <Wifi className="h-4 w-4 text-green-500 mt-0.5" />
                            ) : (
                              <WifiOff className="h-4 w-4 text-red-500 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{account.accountName}</p>
                              <p className="text-xs font-mono text-muted-foreground">
                                {account.accountId}
                              </p>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs font-medium whitespace-nowrap">
                              ${account.equity.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {connectedAccounts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <WifiOff className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma conta conectada</p>
                    <p className="text-xs mt-1">Aguardando EAs...</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Trades em Tempo Real */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Trades em Tempo Real
              {wsStatus === 'connected' && (
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {liveTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="border rounded p-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {trade.type === 'BUY' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-semibold text-sm">{trade.symbol}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(trade.timestamp).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={trade.type === 'BUY' ? 'default' : 'destructive'} className="text-xs">
                          {trade.type}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {trade.volume} lotes
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {trade.slaveStatuses.map((status) => (
                        <div
                          key={status.slaveAccountId}
                          className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30"
                        >
                          <div className="flex items-center gap-1.5">
                            {status.status === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                            {status.status === 'failed' && <XCircle className="h-3 w-3 text-red-500" />}
                            {status.status === 'pending' && <Clock className="h-3 w-3 text-yellow-500" />}
                            <span className="font-mono truncate max-w-[100px]">
                              {status.slaveAccountId}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {status.executionTime && (
                              <span className="text-muted-foreground">
                                {status.executionTime}ms
                              </span>
                            )}
                            {status.slippage !== undefined && (
                              <span className={
                                Math.abs(status.slippage) > 2 
                                  ? 'text-red-500' 
                                  : 'text-green-500'
                              }>
                                {status.slippage > 0 ? '+' : ''}
                                {status.slippage.toFixed(1)}p
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
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aguardando trades...</p>
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
