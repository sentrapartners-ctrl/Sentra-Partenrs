import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, Send, Trash2 } from "lucide-react";

export default function WebSocketTest() {
  const { user, isAuthenticated } = useAuth();
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [messages, setMessages] = useState<Array<{ type: 'sent' | 'received', data: any, timestamp: Date }>>([]);
  const [testAccountId, setTestAccountId] = useState('');
  const [testAccountName, setTestAccountName] = useState('');
  const [testAccountType, setTestAccountType] = useState<'master' | 'slave'>('master');
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = () => {
    if (!isAuthenticated || !user) {
      alert('Faça login primeiro');
      return;
    }

    setWsStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/copy-trading`;
    
    console.log('Conectando ao WebSocket:', wsUrl);
    
    const websocket = new WebSocket(wsUrl);
    wsRef.current = websocket;

    websocket.onopen = () => {
      console.log('WebSocket conectado!');
      setWsStatus('connected');
      
      // Autenticar
      const authMsg = {
        type: 'AUTHENTICATE',
        userId: user.id,
        email: user.email
      };
      
      websocket.send(JSON.stringify(authMsg));
      setMessages(prev => [...prev, { type: 'sent', data: authMsg, timestamp: new Date() }]);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Mensagem recebida:', data);
      setMessages(prev => [...prev, { type: 'received', data, timestamp: new Date() }]);
    };

    websocket.onerror = (error) => {
      console.error('Erro WebSocket:', error);
      setWsStatus('disconnected');
    };

    websocket.onclose = () => {
      console.log('WebSocket desconectado');
      setWsStatus('disconnected');
      wsRef.current = null;
    };
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setWsStatus('disconnected');
    }
  };

  const sendHeartbeat = () => {
    if (!wsRef.current || wsStatus !== 'connected') {
      alert('WebSocket não está conectado');
      return;
    }

    if (!testAccountId || !testAccountName) {
      alert('Preencha ID e Nome da conta');
      return;
    }

    const heartbeatMsg = {
      type: 'ACCOUNT_HEARTBEAT',
      accountId: testAccountId,
      accountName: testAccountName,
      accountType: testAccountType,
      balance: 10000,
      equity: 10500
    };

    wsRef.current.send(JSON.stringify(heartbeatMsg));
    setMessages(prev => [...prev, { type: 'sent', data: heartbeatMsg, timestamp: new Date() }]);
  };

  const sendTestTrade = () => {
    if (!wsRef.current || wsStatus !== 'connected') {
      alert('WebSocket não está conectado');
      return;
    }

    if (!testAccountId) {
      alert('Preencha ID da conta Master');
      return;
    }

    const tradeMsg = {
      type: 'NEW_MASTER_SIGNAL',
      masterAccountId: testAccountId,
      symbol: 'EURUSD',
      orderType: 'BUY',
      volume: 0.10,
      openPrice: 1.08550,
      stopLoss: 1.08450,
      takeProfit: 1.08750,
      slaveAccountIds: []
    };

    wsRef.current.send(JSON.stringify(tradeMsg));
    setMessages(prev => [...prev, { type: 'sent', data: tradeMsg, timestamp: new Date() }]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teste de WebSocket Copy Trading</h1>
          <p className="text-muted-foreground">
            Ferramenta de diagnóstico para testar a conexão WebSocket
          </p>
        </div>

        {/* Status */}
        <Alert>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {wsStatus === 'connected' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>
                Status: <Badge variant={wsStatus === 'connected' ? 'default' : 'secondary'}>
                  {wsStatus === 'connected' ? 'Conectado' : wsStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
                </Badge>
              </AlertDescription>
            </div>
            <div className="flex gap-2">
              {wsStatus === 'disconnected' ? (
                <Button onClick={connectWebSocket} size="sm">
                  <Wifi className="h-4 w-4 mr-2" />
                  Conectar
                </Button>
              ) : (
                <Button onClick={disconnectWebSocket} variant="destructive" size="sm">
                  <WifiOff className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              )}
            </div>
          </div>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Controles de Teste */}
          <Card>
            <CardHeader>
              <CardTitle>Simular Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">ID da Conta</label>
                <Input
                  value={testAccountId}
                  onChange={(e) => setTestAccountId(e.target.value)}
                  placeholder="Ex: 12345678"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Nome da Conta</label>
                <Input
                  value={testAccountName}
                  onChange={(e) => setTestAccountName(e.target.value)}
                  placeholder="Ex: Minha Conta Master"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tipo</label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={testAccountType === 'master' ? 'default' : 'outline'}
                    onClick={() => setTestAccountType('master')}
                    className="flex-1"
                  >
                    Master
                  </Button>
                  <Button
                    variant={testAccountType === 'slave' ? 'default' : 'outline'}
                    onClick={() => setTestAccountType('slave')}
                    className="flex-1"
                  >
                    Slave
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={sendHeartbeat} 
                  className="w-full"
                  disabled={wsStatus !== 'connected'}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Heartbeat
                </Button>
                
                <Button 
                  onClick={sendTestTrade} 
                  variant="secondary"
                  className="w-full"
                  disabled={wsStatus !== 'connected' || testAccountType !== 'master'}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Trade de Teste
                </Button>
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Dica:</strong> Envie um heartbeat a cada 10-15 segundos para manter a conta online.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Log de Mensagens */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Log de Mensagens</CardTitle>
                <Button onClick={clearMessages} variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-xs ${
                        msg.type === 'sent' 
                          ? 'bg-blue-100 dark:bg-blue-900' 
                          : 'bg-green-100 dark:bg-green-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={msg.type === 'sent' ? 'default' : 'secondary'}>
                          {msg.type === 'sent' ? 'Enviado' : 'Recebido'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma mensagem ainda
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Informações */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de Conexão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <strong>URL WebSocket:</strong>{' '}
              <code className="bg-muted px-2 py-1 rounded">
                {window.location.protocol === 'https:' ? 'wss://' : 'ws://'}
                {window.location.host}/ws/copy-trading
              </code>
            </div>
            <div>
              <strong>Usuário:</strong> {user?.email || 'Não autenticado'}
            </div>
            <div>
              <strong>User ID:</strong> {user?.id || 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
