import express from "express";
import { getRawConnection } from "../db";
import { broadcastToUser } from "../websocket/copyTradingWs";
import { updateProviderStatistics } from "../services/update-provider-statistics";

const router = express.Router();

//====================================================
// POST /api/mt/copy/master-signal
// Recebe sinais da conta Master (v4.0 com eventos)
//====================================================
router.post("/master-signal", async (req, res) => {
  try {
    const { 
      action,
      master_email, 
      user_email,
      account_number, 
      broker, 
      positions, 
      positions_count,
      ticket,
      symbol,
      type,
      lots,
      open_price,
      stop_loss,
      take_profit,
      open_time,
      comment,
      timestamp
    } = req.body;
    
    const email = user_email || master_email;
    
    console.log("[Copy Trading] Master signal recebido:", {
      action: action || "legacy",
      email,
      account_number,
      positions_count: positions_count || (positions ? positions.length : 0)
    });
    
    if (!email || !account_number) {
      return res.status(400).json({ 
        success: false,
        error: "user_email/master_email e account_number são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    const connection = await getRawConnection();
    if (!connection) {
      return res.status(500).json({ 
        success: false,
        error: "Conexão com banco de dados não disponível" 
      });
    }
    
    // Processar baseado no tipo de action
    if (action === "open") {
      await processOpenEvent(connection, email, account_number, {
        ticket, symbol, type, lots, open_price, stop_loss, take_profit, open_time, comment, timestamp
      }, user.id);
    }
    else if (action === "close") {
      await processCloseEvent(connection, email, account_number, ticket, user.id);
    }
    else if (action === "modify") {
      await processModifyEvent(connection, email, account_number, ticket, stop_loss, take_profit, user.id);
    }
    else if (action === "heartbeat") {
      await processHeartbeat(connection, email, account_number, broker, positions, positions_count, user.id);
    }
    else {
      // Formato legado (compatibilidade)
      await processLegacyFormat(connection, email, account_number, broker, positions, positions_count, user.id);
    }
    
    res.json({ success: true, message: "Sinal recebido e processado" });
    
  } catch (error: any) {
    console.error("[Copy Trading] Erro ao processar sinal master:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// Processar Evento de Abertura
//====================================================
async function processOpenEvent(connection: any, email: string, accountNumber: string, tradeData: any, userId: number) {
  const { ticket, symbol, type, lots, open_price, stop_loss, take_profit, open_time, comment, timestamp } = tradeData;
  
  // Salvar trade individual na tabela de trades
  await connection.execute(
    `INSERT INTO copy_trades (master_email, account_number, ticket, symbol, type, lots, open_price, stop_loss, take_profit, open_time, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?), 'open', NOW())
     ON DUPLICATE KEY UPDATE stop_loss = VALUES(stop_loss), take_profit = VALUES(take_profit), updated_at = NOW()`,
    [email, accountNumber, ticket, symbol, type, lots, open_price, stop_loss, take_profit, open_time]
  );
  
  console.log(`[Copy Trading] ✅ OPEN: ${symbol} ${type === 0 ? 'BUY' : 'SELL'} ${lots} lotes (ticket: ${ticket})`);
  
  // Broadcast via WebSocket
  try {
    broadcastToUser(userId, {
      type: 'TRADE_OPENED',
      action: 'open',
      masterAccountId: accountNumber,
      ticket,
      symbol,
      orderType: type === 0 ? 'BUY' : 'SELL',
      lots,
      openPrice: open_price,
      stopLoss: stop_loss,
      takeProfit: take_profit,
      timestamp: new Date()
    });
  } catch (wsError) {
    console.error("[Copy Trading] Erro ao broadcast OPEN:", wsError);
  }
}

//====================================================
// Processar Evento de Fechamento
//====================================================
async function processCloseEvent(connection: any, email: string, accountNumber: string, ticket: string, userId: number) {
  // Atualizar status do trade
  await connection.execute(
    `UPDATE copy_trades SET status = 'closed', closed_at = NOW(), updated_at = NOW()
     WHERE master_email = ? AND account_number = ? AND ticket = ?`,
    [email, accountNumber, ticket]
  );
  
  console.log(`[Copy Trading] ✅ CLOSE: ticket ${ticket}`);
  
  // Atualizar estatísticas do provedor (se houver)
  updateProviderStatistics(accountNumber).catch(err => 
    console.error('[Copy Trading] Erro ao atualizar estatísticas do provedor:', err)
  );
  
  // Broadcast via WebSocket
  try {
    broadcastToUser(userId, {
      type: 'TRADE_CLOSED',
      action: 'close',
      masterAccountId: accountNumber,
      ticket,
      timestamp: new Date()
    });
  } catch (wsError) {
    console.error("[Copy Trading] Erro ao broadcast CLOSE:", wsError);
  }
}

//====================================================
// Processar Evento de Modificação
//====================================================
async function processModifyEvent(connection: any, email: string, accountNumber: string, ticket: string, stopLoss: number, takeProfit: number, userId: number) {
  // Atualizar S/L e T/P
  await connection.execute(
    `UPDATE copy_trades SET stop_loss = ?, take_profit = ?, updated_at = NOW()
     WHERE master_email = ? AND account_number = ? AND ticket = ?`,
    [stopLoss, takeProfit, email, accountNumber, ticket]
  );
  
  console.log(`[Copy Trading] ✅ MODIFY: ticket ${ticket} SL:${stopLoss} TP:${takeProfit}`);
  
  // Broadcast via WebSocket
  try {
    broadcastToUser(userId, {
      type: 'TRADE_MODIFIED',
      action: 'modify',
      masterAccountId: accountNumber,
      ticket,
      stopLoss,
      takeProfit,
      timestamp: new Date()
    });
  } catch (wsError) {
    console.error("[Copy Trading] Erro ao broadcast MODIFY:", wsError);
  }
}

//====================================================
// Processar Heartbeat
//====================================================
async function processHeartbeat(connection: any, email: string, accountNumber: string, broker: string, positions: any[], positionsCount: number, userId: number) {
  const positionsJson = JSON.stringify(positions || []);
  
  // Atualizar ou inserir heartbeat
  const [existing]: any = await connection.execute(
    "SELECT id FROM copy_signals WHERE master_email = ? AND account_number = ?",
    [email, accountNumber]
  );
  
  if (existing && existing.length > 0) {
    await connection.execute(
      "UPDATE copy_signals SET positions = ?, positions_count = ?, broker = ?, last_heartbeat = NOW(), updated_at = NOW() WHERE master_email = ? AND account_number = ?",
      [positionsJson, positionsCount || 0, broker || "", email, accountNumber]
    );
  } else {
    await connection.execute(
      "INSERT INTO copy_signals (master_email, account_number, broker, positions, positions_count, last_heartbeat) VALUES (?, ?, ?, ?, ?, NOW())",
      [email, accountNumber, broker || "", positionsJson, positionsCount || 0]
    );
  }
  
  console.log(`[Copy Trading] 💓 HEARTBEAT: ${positionsCount} posições`);
  
  // Broadcast via WebSocket
  try {
    broadcastToUser(userId, {
      type: 'MASTER_HEARTBEAT',
      action: 'heartbeat',
      masterAccountId: accountNumber,
      positionsCount: positionsCount || 0,
      timestamp: new Date()
    });
  } catch (wsError) {
    console.error("[Copy Trading] Erro ao broadcast HEARTBEAT:", wsError);
  }
}

//====================================================
// Processar Formato Legado (Compatibilidade)
//====================================================
async function processLegacyFormat(connection: any, email: string, accountNumber: string, broker: string, positions: any[], positionsCount: number, userId: number) {
  const positionsJson = JSON.stringify(positions || []);
  
  const [existing]: any = await connection.execute(
    "SELECT id FROM copy_signals WHERE master_email = ? AND account_number = ?",
    [email, accountNumber]
  );
  
  if (existing && existing.length > 0) {
    await connection.execute(
      "UPDATE copy_signals SET positions = ?, positions_count = ?, broker = ?, updated_at = NOW() WHERE master_email = ? AND account_number = ?",
      [positionsJson, positionsCount || 0, broker || "", email, accountNumber]
    );
    console.log("[Copy Trading] ✅ Sinais atualizados (formato legado)");
  } else {
    await connection.execute(
      "INSERT INTO copy_signals (master_email, account_number, broker, positions, positions_count) VALUES (?, ?, ?, ?, ?)",
      [email, accountNumber, broker || "", positionsJson, positionsCount || 0]
    );
    console.log("[Copy Trading] ✅ Novos sinais salvos (formato legado)");
  }
  
  try {
    broadcastToUser(userId, {
      type: 'MASTER_SIGNAL_UPDATE',
      masterAccountId: accountNumber,
      positionsCount: positionsCount || 0,
      timestamp: new Date()
    });
  } catch (wsError) {
    console.error("[Copy Trading] Erro ao broadcast:", wsError);
  }
}

//====================================================
// POST /api/mt/copy/slave-heartbeat
// Recebe heartbeat da conta Slave
//====================================================
router.post("/slave-heartbeat", async (req, res) => {
  try {
    const { 
      slave_email, 
      master_email,
      master_account_id,
      account_number, 
      broker,
      positions_count,
      balance,
      equity,
      timestamp
    } = req.body;
    
    const masterIdentifier = master_account_id || master_email;
    
    if (!slave_email || !masterIdentifier || !account_number) {
      return res.status(400).json({ 
        success: false,
        error: "slave_email, master_account_id (ou master_email) e account_number são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(slave_email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    const connection = await getRawConnection();
    if (!connection) {
      return res.status(500).json({ 
        success: false,
        error: "Conexão com banco de dados não disponível" 
      });
    }
    
    // Atualizar ou inserir heartbeat do Slave
    const [existing]: any = await connection.execute(
      "SELECT id FROM slave_heartbeats WHERE slave_email = ? AND account_number = ?",
      [slave_email, account_number]
    );
    
    if (existing && existing.length > 0) {
      await connection.execute(
        `UPDATE slave_heartbeats 
         SET master_account_id = ?, broker = ?, positions_count = ?, balance = ?, equity = ?, last_heartbeat = NOW(), updated_at = NOW()
         WHERE slave_email = ? AND account_number = ?`,
        [masterIdentifier, broker || "", positions_count || 0, balance || 0, equity || 0, slave_email, account_number]
      );
    } else {
      await connection.execute(
        `INSERT INTO slave_heartbeats (slave_email, master_account_id, account_number, broker, positions_count, balance, equity, last_heartbeat)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [slave_email, masterIdentifier, account_number, broker || "", positions_count || 0, balance || 0, equity || 0]
      );
    }
    
    console.log(`[Copy Trading] 💓 Slave heartbeat: ${account_number} (${slave_email})`);
    
    // Broadcast via WebSocket
    try {
      broadcastToUser(user.id, {
        type: 'SLAVE_HEARTBEAT',
        slaveAccountId: account_number,
        masterAccountId: masterIdentifier,
        positionsCount: positions_count || 0,
        balance: balance || 0,
        equity: equity || 0,
        timestamp: new Date()
      });
    } catch (wsError) {
      console.error("[Copy Trading] Erro ao broadcast slave heartbeat:", wsError);
    }
    
    res.json({ success: true, message: "Heartbeat recebido" });
    
  } catch (error: any) {
    console.error("[Copy Trading] Erro ao processar slave heartbeat:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// GET /api/mt/copy/slave-signals
// Retorna sinais para contas Slave
//====================================================
router.get("/slave-signals", async (req, res) => {
  try {
    const { master_email, master_account_id, account_number, slave_email } = req.query;
    
    console.log("[Copy Trading] Slave solicitando sinais:", {
      master_email,
      master_account_id,
      slave_email
    });
    
    // Aceitar master_email (legado) ou master_account_id (novo)
    const masterIdentifier = master_account_id || master_email;
    
    if (!masterIdentifier) {
      return res.status(400).json({ 
        success: false,
        error: "master_account_id ou master_email é obrigatório" 
      });
    }
    
    const connection = await getRawConnection();
    if (!connection) {
      return res.status(500).json({ 
        success: false,
        error: "Conexão com banco de dados não disponível" 
      });
    }
    
    // Buscar sinais mais recentes do master
    let query = "SELECT positions, positions_count, broker, updated_at, last_heartbeat FROM copy_signals WHERE ";
    let params: any[] = [];
    
    // Buscar por account_number (preferencial) ou email
    if (master_account_id) {
      query += "account_number = ?";
      params.push(master_account_id);
    } else {
      query += "master_email = ?";
      params.push(master_email);
    }
    
    query += " AND updated_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) ORDER BY updated_at DESC LIMIT 1";
    
    const [signals]: any = await connection.execute(query, params);
    
    if (!signals || signals.length === 0) {
      console.log("[Copy Trading] ℹ️ Nenhum sinal recente");
      return res.json({
        success: true,
        action: "heartbeat",
        positions: [],
        positions_count: 0,
        message: "Nenhum sinal recente do Master"
      });
    }
    
    const signal = signals[0];
    
    let positions = [];
    try {
      // Verificar se já é um objeto ou se é uma string JSON
      if (typeof signal.positions === 'string') {
        positions = JSON.parse(signal.positions);
      } else if (Array.isArray(signal.positions)) {
        positions = signal.positions;
      } else if (signal.positions && typeof signal.positions === 'object') {
        // Se for objeto mas não array, converter para array
        positions = [signal.positions];
      }
    } catch (e) {
      console.error("[Copy Trading] Erro ao parse JSON:", e);
      positions = [];
    }
    
    console.log("[Copy Trading] ✅ Retornando", positions.length, "posições");
    
    res.json({
      success: true,
      action: "heartbeat",
      positions: positions,
      positions_count: signal.positions_count,
      broker: signal.broker,
      updated_at: signal.updated_at,
      last_heartbeat: signal.last_heartbeat
    });
    
  } catch (error: any) {
    console.error("[Copy Trading] Erro ao buscar sinais:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// GET /api/mt/copy/connected-accounts
// Retorna contas Master e Slave online (fallback HTTP)
//====================================================
router.get("/connected-accounts", async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: "email é obrigatório" 
      });
    }
    
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const accounts: any[] = [];

    // Buscar contas Master (copy_signals com heartbeat recente)
    const [masterAccounts]: any = await connection.execute(
      `SELECT master_email, account_number, broker, last_heartbeat, 
              TIMESTAMPDIFF(SECOND, last_heartbeat, NOW()) as seconds_since_heartbeat
       FROM copy_signals 
       WHERE master_email = ?
       AND last_heartbeat IS NOT NULL
       AND last_heartbeat >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
       ORDER BY last_heartbeat DESC`,
      [email]
    );

    for (const master of masterAccounts) {
      const isOnline = master.seconds_since_heartbeat < 60;
      accounts.push({
        accountId: master.account_number,
        accountName: `Master ${master.account_number}`,
        type: 'master',
        status: isOnline ? 'online' : 'offline',
        lastHeartbeat: master.last_heartbeat,
        balance: 0,
        equity: 0
      });
    }

    // Buscar contas Slave (slave_heartbeats com heartbeat recente)
    const [slaveAccounts]: any = await connection.execute(
      `SELECT account_number, master_account_id, broker, balance, equity, last_heartbeat,
              TIMESTAMPDIFF(SECOND, last_heartbeat, NOW()) as seconds_since_heartbeat
       FROM slave_heartbeats 
       WHERE slave_email = ?
       AND last_heartbeat IS NOT NULL
       AND last_heartbeat >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
       ORDER BY last_heartbeat DESC`,
      [email]
    );

    for (const slave of slaveAccounts) {
      const isOnline = slave.seconds_since_heartbeat < 60;
      accounts.push({
        accountId: slave.account_number,
        accountName: `Slave ${slave.account_number}`,
        type: 'slave',
        status: isOnline ? 'online' : 'offline',
        lastHeartbeat: slave.last_heartbeat,
        balance: parseFloat(slave.balance) || 0,
        equity: parseFloat(slave.equity) || 0
      });
    }

    console.log(`📊 HTTP: Contas encontradas para ${email}: ${accounts.length} (${accounts.filter(a => a.status === 'online').length} online)`);

    res.json({
      success: true,
      accounts
    });
    
  } catch (error: any) {
    console.error('[Copy Trading] Erro ao buscar contas conectadas:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
