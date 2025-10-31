import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface AuthenticatedClient {
  ws: WebSocket;
  userId: number;
  email: string;
  lastHeartbeat: Date;
}

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

const clients = new Map<WebSocket, AuthenticatedClient>();
const connectedAccounts = new Map<string, ConnectedAccount>();
const activeTrades = new Map<string, LiveTrade>();

// Mapeamento de accountId -> userId para validação
const accountToUser = new Map<string, number>();

export function setupCopyTradingWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/copy-trading'
  });

  console.log('✅ WebSocket Copy Trading iniciado em /ws/copy-trading');

  wss.on('connection', (ws: WebSocket) => {
    console.log('🔌 Nova conexão WebSocket');

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'AUTHENTICATE':
            handleAuthenticate(ws, data);
            break;
            
          case 'GET_CONNECTED_ACCOUNTS':
            handleGetConnectedAccounts(ws, data);
            break;
            
          case 'GET_RECENT_TRADES':
            handleGetRecentTrades(ws, data);
            break;
            
          case 'ACCOUNT_HEARTBEAT':
            handleAccountHeartbeat(ws, data);
            break;
            
          case 'NEW_MASTER_SIGNAL':
            handleNewMasterSignal(ws, data);
            break;
            
          case 'SLAVE_COPY_RESULT':
            handleSlaveCopyResult(ws, data);
            break;
            
          default:
            ws.send(JSON.stringify({
              type: 'ERROR',
              message: 'Tipo de mensagem desconhecido'
            }));
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
        ws.send(JSON.stringify({
          type: 'ERROR',
          message: 'Erro ao processar mensagem'
        }));
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      if (client) {
        console.log(`👋 Cliente desconectado: ${client.email}`);
        
        // Remover contas conectadas deste cliente
        for (const [accountId, account] of connectedAccounts.entries()) {
          if (account.userId === client.userId) {
            connectedAccounts.delete(accountId);
            accountToUser.delete(accountId);
            
            // Notificar outros clientes do mesmo usuário
            broadcastToUser(client.userId, {
              type: 'ACCOUNT_DISCONNECTED',
              accountId,
              userId: client.userId
            });
          }
        }
        
        clients.delete(ws);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ Erro WebSocket:', error);
    });
  });

  // Heartbeat checker - remove contas offline
  setInterval(() => {
    const now = new Date();
    const timeout = 30000; // 30 segundos

    for (const [accountId, account] of connectedAccounts.entries()) {
      const timeSinceHeartbeat = now.getTime() - account.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > timeout && account.status === 'online') {
        account.status = 'offline';
        
        // Notificar usuário
        broadcastToUser(account.userId, {
          type: 'ACCOUNT_DISCONNECTED',
          accountId,
          userId: account.userId
        });
      }
    }
  }, 10000); // Check a cada 10 segundos

  return wss;
}

function handleAuthenticate(ws: WebSocket, data: any) {
  const { userId, email } = data;
  
  if (!userId || !email) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'userId e email são obrigatórios'
    }));
    return;
  }

  // Registrar cliente autenticado
  clients.set(ws, {
    ws,
    userId,
    email,
    lastHeartbeat: new Date()
  });

  console.log(`✅ Cliente autenticado: ${email} (ID: ${userId})`);

  ws.send(JSON.stringify({
    type: 'AUTHENTICATED',
    userId,
    email
  }));
}

async function handleGetConnectedAccounts(ws: WebSocket, data: any) {
  const client = clients.get(ws);
  if (!client) {
    console.log('⚠️ GET_CONNECTED_ACCOUNTS: Cliente não autenticado');
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Cliente não autenticado'
    }));
    return;
  }

  console.log(`🔍 GET_CONNECTED_ACCOUNTS chamado para: ${client.email} (ID: ${client.userId})`);

  try {
    const { getRawConnection } = await import('../db.js');
    const connection = await getRawConnection();
    
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const userAccounts: ConnectedAccount[] = [];

    // Buscar contas Master (copy_signals)
    const [masterAccounts]: any = await connection.execute(
      `SELECT master_email, account_number, broker, last_heartbeat, is_connected, failed_attempts
       FROM copy_signals 
       WHERE master_email = ?
       ORDER BY last_heartbeat DESC`,
      [client.email]
    );

    for (const master of masterAccounts) {
      userAccounts.push({
        accountId: master.account_number,
        accountName: `Master ${master.account_number}`,
        type: 'master',
        status: master.is_connected ? 'online' : 'offline',
        lastHeartbeat: new Date(master.last_heartbeat),
        balance: 0,
        equity: 0,
        userId: client.userId
      });
    }

    // Buscar contas Slave (slave_heartbeats)
    const [slaveAccounts]: any = await connection.execute(
      `SELECT account_number, master_account_id, broker, balance, equity, last_heartbeat, is_connected, failed_attempts
       FROM slave_heartbeats 
       WHERE slave_email = ?
       ORDER BY last_heartbeat DESC`,
      [client.email]
    );

    for (const slave of slaveAccounts) {
      userAccounts.push({
        accountId: slave.account_number,
        accountName: `Slave ${slave.account_number}`,
        type: 'slave',
        status: slave.is_connected ? 'online' : 'offline',
        lastHeartbeat: new Date(slave.last_heartbeat),
        balance: parseFloat(slave.balance) || 0,
        equity: parseFloat(slave.equity) || 0,
        userId: client.userId
      });
    }

    console.log(`📊 Contas encontradas para ${client.email}: ${userAccounts.length} (${userAccounts.filter(a => a.status === 'online').length} online)`);

    ws.send(JSON.stringify({
      type: 'CONNECTED_ACCOUNTS',
      accounts: userAccounts,
      userId: client.userId
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar contas conectadas:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Erro ao buscar contas conectadas'
    }));
  }
}

function handleGetRecentTrades(ws: WebSocket, data: any) {
  const client = clients.get(ws);
  if (!client) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Cliente não autenticado'
    }));
    return;
  }

  // Filtrar trades do usuário
  const userTrades = Array.from(activeTrades.values())
    .filter(trade => trade.userId === client.userId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 50);

  ws.send(JSON.stringify({
    type: 'RECENT_TRADES',
    trades: userTrades,
    userId: client.userId
  }));
}

function handleAccountHeartbeat(ws: WebSocket, data: any) {
  const client = clients.get(ws);
  if (!client) return;

  const { 
    accountId, 
    accountName, 
    type, 
    balance, 
    equity 
  } = data;

  // Validar que a conta pertence ao usuário
  const existingUserId = accountToUser.get(accountId);
  if (existingUserId && existingUserId !== client.userId) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Esta conta pertence a outro usuário'
    }));
    return;
  }

  // Registrar conta ao usuário
  accountToUser.set(accountId, client.userId);

  // Atualizar ou criar conta conectada
  const account: ConnectedAccount = {
    accountId,
    accountName,
    type,
    status: 'online',
    lastHeartbeat: new Date(),
    balance: balance || 0,
    equity: equity || 0,
    userId: client.userId
  };

  const wasNew = !connectedAccounts.has(accountId);
  connectedAccounts.set(accountId, account);

  if (wasNew) {
    // Notificar todos os clientes do usuário sobre nova conta
    broadcastToUser(client.userId, {
      type: 'ACCOUNT_CONNECTED',
      account,
      userId: client.userId
    });
    
    console.log(`📡 Conta conectada: ${accountName} (${accountId}) - Usuário: ${client.email}`);
  }
}

function handleNewMasterSignal(ws: WebSocket, data: any) {
  const client = clients.get(ws);
  if (!client) return;

  const {
    masterAccountId,
    symbol,
    orderType,
    volume,
    openPrice,
    stopLoss,
    takeProfit,
    slaveAccountIds
  } = data;

  // Validar que a conta Master pertence ao usuário
  const masterUserId = accountToUser.get(masterAccountId);
  if (!masterUserId || masterUserId !== client.userId) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Conta Master não pertence a você'
    }));
    return;
  }

  // Gerar ID único para o trade
  const tradeId = `${masterAccountId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Preparar lista de slaves para copiar (filtrar apenas slaves do mesmo usuário)
  const slaveStatuses = slaveAccountIds
    .filter((slaveId: string) => accountToUser.get(slaveId) === client.userId)
    .map((slaveId: string) => ({
      slaveAccountId: slaveId,
      slaveAccountName: connectedAccounts.get(slaveId)?.accountName || slaveId,
      status: 'pending' as const
    }));

  const trade: LiveTrade = {
    id: tradeId,
    masterAccountId,
    symbol,
    type: orderType,
    volume,
    openPrice,
    timestamp: new Date(),
    userId: client.userId,
    slaveStatuses
  };

  // Armazenar trade ativo
  activeTrades.set(tradeId, trade);

  // Broadcast para todos os clientes do usuário
  broadcastToUser(client.userId, {
    type: 'NEW_TRADE',
    trade,
    userId: client.userId
  });

  console.log(`📈 Novo trade Master: ${symbol} ${orderType} - Usuário: ${client.email} - ID: ${tradeId}`);
}

function handleSlaveCopyResult(ws: WebSocket, data: any) {
  const client = clients.get(ws);
  if (!client) return;

  const {
    tradeId,
    slaveAccountId,
    status,
    executionTime,
    slippage,
    error
  } = data;

  // Validar que o slave pertence ao usuário
  const slaveUserId = accountToUser.get(slaveAccountId);
  if (!slaveUserId || slaveUserId !== client.userId) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Conta Slave não pertence a você'
    }));
    return;
  }

  // Atualizar trade ativo
  const trade = activeTrades.get(tradeId);
  if (trade) {
    const slaveStatus = trade.slaveStatuses.find(s => s.slaveAccountId === slaveAccountId);
    if (slaveStatus) {
      slaveStatus.status = status;
      slaveStatus.executionTime = executionTime;
      slaveStatus.slippage = slippage;
      slaveStatus.error = error;
    }
  }

  // Broadcast resultado da cópia para todos os clientes do usuário
  broadcastToUser(client.userId, {
    type: 'TRADE_COPIED',
    tradeId,
    slaveAccountId,
    status: {
      status,
      executionTime,
      slippage,
      error
    },
    userId: client.userId
  });

  const statusEmoji = status === 'success' ? '✅' : '❌';
  console.log(`${statusEmoji} Cópia ${status}: Trade ${tradeId} → Slave ${slaveAccountId} (${executionTime}ms)`);
}

export function broadcastToUser(userId: number, message: any) {
  for (const [ws, client] of clients.entries()) {
    if (client.userId === userId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

// Função auxiliar para broadcast para todos (admin)
export function broadcastToAll(message: any) {
  for (const [ws, client] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

// Função para obter estatísticas
export function getCopyTradingStats() {
  const totalClients = clients.size;
  const totalAccounts = connectedAccounts.size;
  const onlineAccounts = Array.from(connectedAccounts.values())
    .filter(acc => acc.status === 'online').length;

  return {
    totalClients,
    totalAccounts,
    onlineAccounts,
    activeTrades: activeTrades.size,
    clients: Array.from(clients.values()).map(c => ({
      userId: c.userId,
      email: c.email,
      lastHeartbeat: c.lastHeartbeat
    })),
    accounts: Array.from(connectedAccounts.values())
  };
}

// Função para obter contas Master públicas (para exibir no painel)
export function getMasterAccounts() {
  return Array.from(connectedAccounts.values())
    .filter(acc => acc.type === 'master' && acc.status === 'online')
    .map(acc => ({
      accountId: acc.accountId,
      accountName: acc.accountName,
      userId: acc.userId
    }));
}
