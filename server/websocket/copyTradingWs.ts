import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { db } from '../db';
import { copySignals, accounts } from '../db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

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

const clients = new Map<WebSocket, AuthenticatedClient>();
const connectedAccounts = new Map<string, ConnectedAccount>();

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
            await handleAuthenticate(ws, data);
            break;
            
          case 'GET_CONNECTED_ACCOUNTS':
            await handleGetConnectedAccounts(ws, data);
            break;
            
          case 'GET_RECENT_TRADES':
            await handleGetRecentTrades(ws, data);
            break;
            
          case 'ACCOUNT_HEARTBEAT':
            await handleAccountHeartbeat(ws, data);
            break;
            
          case 'NEW_MASTER_SIGNAL':
            await handleNewMasterSignal(ws, data);
            break;
            
          case 'SLAVE_COPY_RESULT':
            await handleSlaveCopyResult(ws, data);
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

async function handleAuthenticate(ws: WebSocket, data: any) {
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
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Cliente não autenticado'
    }));
    return;
  }

  // Filtrar apenas contas do usuário
  const userAccounts = Array.from(connectedAccounts.values())
    .filter(account => account.userId === client.userId);

  ws.send(JSON.stringify({
    type: 'CONNECTED_ACCOUNTS',
    accounts: userAccounts,
    userId: client.userId
  }));
}

async function handleGetRecentTrades(ws: WebSocket, data: any) {
  const client = clients.get(ws);
  if (!client) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Cliente não autenticado'
    }));
    return;
  }

  const limit = data.limit || 50;
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // Buscar trades recentes do usuário nas últimas 24 horas
    const recentSignals = await db
      .select()
      .from(copySignals)
      .where(
        and(
          eq(copySignals.userId, client.userId),
          gte(copySignals.createdAt, yesterday)
        )
      )
      .orderBy(desc(copySignals.createdAt))
      .limit(limit);

    // Formatar trades para o frontend
    const trades = recentSignals.map(signal => ({
      id: signal.id.toString(),
      masterAccountId: signal.masterAccountId,
      symbol: signal.symbol,
      type: signal.orderType,
      volume: signal.volume,
      openPrice: signal.openPrice,
      timestamp: signal.createdAt,
      userId: signal.userId,
      slaveStatuses: [] // Será preenchido com dados de cópia
    }));

    ws.send(JSON.stringify({
      type: 'RECENT_TRADES',
      trades,
      userId: client.userId
    }));
  } catch (error) {
    console.error('Erro ao buscar trades recentes:', error);
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: 'Erro ao buscar trades recentes'
    }));
  }
}

async function handleAccountHeartbeat(ws: WebSocket, data: any) {
  const client = clients.get(ws);
  if (!client) return;

  const { 
    accountId, 
    accountName, 
    type, 
    balance, 
    equity 
  } = data;

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

async function handleNewMasterSignal(ws: WebSocket, data: any) {
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

  try {
    // Salvar sinal no banco de dados
    const [signal] = await db
      .insert(copySignals)
      .values({
        userId: client.userId,
        masterAccountId,
        slaveAccountId: '', // Será preenchido por cada slave
        symbol,
        orderType,
        volume,
        openPrice,
        stopLoss,
        takeProfit,
        status: 'pending',
        createdAt: new Date()
      })
      .returning();

    // Preparar lista de slaves para copiar
    const slaveStatuses = slaveAccountIds.map((slaveId: string) => ({
      slaveAccountId: slaveId,
      slaveAccountName: connectedAccounts.get(slaveId)?.accountName || slaveId,
      status: 'pending'
    }));

    const trade = {
      id: signal.id.toString(),
      masterAccountId,
      symbol,
      type: orderType,
      volume,
      openPrice,
      timestamp: new Date(),
      userId: client.userId,
      slaveStatuses
    };

    // Broadcast para todos os clientes do usuário
    broadcastToUser(client.userId, {
      type: 'NEW_TRADE',
      trade,
      userId: client.userId
    });

    console.log(`📈 Novo trade Master: ${symbol} ${orderType} - Usuário: ${client.email}`);
  } catch (error) {
    console.error('Erro ao processar novo sinal Master:', error);
  }
}

async function handleSlaveCopyResult(ws: WebSocket, data: any) {
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

function broadcastToUser(userId: number, message: any) {
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
    clients: Array.from(clients.values()).map(c => ({
      userId: c.userId,
      email: c.email,
      lastHeartbeat: c.lastHeartbeat
    })),
    accounts: Array.from(connectedAccounts.values())
  };
}
