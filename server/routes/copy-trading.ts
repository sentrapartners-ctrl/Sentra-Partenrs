import express from "express";
import { getDb } from "../db";
import { getUserByEmail } from "../auth";
import { broadcastToUser } from "../websocket/copyTradingWs";

const router = express.Router();

//====================================================
// POST /api/mt/copy/register-master
// Registra uma conta como Master
//====================================================
router.post("/register-master", async (req, res) => {
  try {
    const { user_email, account_number, account_name } = req.body;
    
    if (!user_email || !account_number) {
      return res.status(400).json({ 
        success: false,
        error: "user_email e account_number são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(user_email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    console.log(`[Copy Trading] ✅ Master registrado: ${account_number} (${user_email})`);
    
    res.json({ 
      success: true, 
      message: "Conta Master registrada",
      account_id: account_number,
      user_id: user.id
    });
    
  } catch (error: any) {
    console.error("[Copy Trading] Erro ao registrar master:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// POST /api/mt/copy/register-slave
// Registra uma conta como Slave
//====================================================
router.post("/register-slave", async (req, res) => {
  try {
    const { user_email, account_number, master_account_id } = req.body;
    
    if (!user_email || !account_number || !master_account_id) {
      return res.status(400).json({ 
        success: false,
        error: "user_email, account_number e master_account_id são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(user_email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    console.log(`[Copy Trading] ✅ Slave registrado: ${account_number} copiando ${master_account_id} (${user_email})`);
    
    res.json({ 
      success: true, 
      message: "Conta Slave registrada",
      account_id: account_number,
      master_account_id,
      user_id: user.id
    });
    
  } catch (error: any) {
    console.error("[Copy Trading] Erro ao registrar slave:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// POST /api/mt/copy/master-signal
// Recebe sinais da conta Master (compatibilidade)
//====================================================
router.post("/master-signal", async (req, res) => {
  try {
    const { 
      master_email, 
      user_email,
      account_number, 
      broker, 
      positions, 
      positions_count 
    } = req.body;
    
    const email = user_email || master_email;
    
    console.log("[Copy Trading] Master signal recebido:", {
      email,
      account_number,
      positions_count
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
    
    const db = await getDb();
    
    // Converter positions para JSON string
    const positionsJson = JSON.stringify(positions || []);
    
    // Verificar se já existe registro para este master
    const [existing]: any = await db.execute(
      "SELECT id FROM copy_signals WHERE master_email = ? AND account_number = ?",
      [email, account_number]
    );
    
    if (existing && existing.length > 0) {
      // Atualizar registro existente
      await db.execute(
        "UPDATE copy_signals SET positions = ?, positions_count = ?, broker = ?, updated_at = NOW() WHERE master_email = ? AND account_number = ?",
        [positionsJson, positions_count || 0, broker || "", email, account_number]
      );
      console.log("[Copy Trading] ✅ Sinais atualizados para", email);
    } else {
      // Inserir novo registro
      await db.execute(
        "INSERT INTO copy_signals (master_email, account_number, broker, positions, positions_count) VALUES (?, ?, ?, ?, ?)",
        [email, account_number, broker || "", positionsJson, positions_count || 0]
      );
      console.log("[Copy Trading] ✅ Novos sinais salvos para", email);
    }
    
    // Broadcast via WebSocket para dashboard em tempo real
    try {
      broadcastToUser(user.id, {
        type: 'MASTER_SIGNAL_UPDATE',
        masterAccountId: account_number,
        positionsCount: positions_count || 0,
        timestamp: new Date()
      });
    } catch (wsError) {
      console.error("[Copy Trading] Erro ao broadcast WebSocket:", wsError);
    }
    
    res.json({ success: true, message: "Sinal recebido e salvo" });
    
  } catch (error: any) {
    console.error("[Copy Trading] Erro ao processar sinal master:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// POST /api/mt/copy/new-trade
// Recebe novo trade do Master e envia para Slaves
//====================================================
router.post("/new-trade", async (req, res) => {
  try {
    const {
      user_email,
      account_number,
      symbol,
      type,
      volume,
      open_price,
      stop_loss,
      take_profit,
      ticket
    } = req.body;
    
    if (!user_email || !account_number || !symbol || !type) {
      return res.status(400).json({ 
        success: false,
        error: "Parâmetros obrigatórios faltando" 
      });
    }
    
    const user = await getUserByEmail(user_email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    console.log(`[Copy Trading] 📈 Novo trade Master: ${symbol} ${type} - Conta: ${account_number}`);
    
    // Broadcast para todos os clientes do usuário via WebSocket
    try {
      broadcastToUser(user.id, {
        type: 'NEW_MASTER_SIGNAL',
        masterAccountId: account_number,
        symbol,
        orderType: type.toUpperCase(),
        volume: parseFloat(volume) || 0,
        openPrice: parseFloat(open_price) || 0,
        stopLoss: stop_loss ? parseFloat(stop_loss) : null,
        takeProfit: take_profit ? parseFloat(take_profit) : null,
        ticket: ticket || null,
        slaveAccountIds: [] // Slaves vão buscar via polling ou WebSocket
      });
      
      console.log(`[Copy Trading] ✅ Trade broadcast via WebSocket para user ${user.id}`);
    } catch (wsError) {
      console.error("[Copy Trading] Erro ao broadcast trade:", wsError);
    }
    
    res.json({ 
      success: true, 
      message: "Trade enviado para Slaves" 
    });
    
  } catch (error: any) {
    console.error("[Copy Trading] Erro ao processar novo trade:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// GET /api/mt/copy/slave-signals
// Retorna sinais para contas Slave (por account_id)
//====================================================
router.get("/slave-signals", async (req, res) => {
  try {
    const { master_account_id, slave_email, user_email } = req.query;
    
    const email = (user_email || slave_email) as string;
    
    console.log("[Copy Trading] Slave solicitando sinais:", {
      master_account_id,
      email
    });
    
    if (!master_account_id || !email) {
      return res.status(400).json({ 
        success: false,
        error: "master_account_id e user_email/slave_email são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    const db = await getDb();
    
    // Buscar sinais mais recentes do master (últimos 5 minutos)
    const [signals]: any = await db.execute(
      "SELECT positions, positions_count, broker, updated_at, master_email FROM copy_signals WHERE account_number = ? AND updated_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE) ORDER BY updated_at DESC LIMIT 1",
      [master_account_id]
    );
    
    if (!signals || signals.length === 0) {
      console.log("[Copy Trading] ℹ️ Nenhum sinal recente para conta", master_account_id);
      return res.json({
        success: true,
        positions: [],
        message: "Nenhum sinal recente do Master"
      });
    }
    
    const signal = signals[0];
    
    // Verificar se o Master pertence ao mesmo usuário
    const masterUser = await getUserByEmail(signal.master_email);
    if (!masterUser || masterUser.id !== user.id) {
      return res.status(403).json({
        success: false,
        error: "Você só pode copiar suas próprias contas Master"
      });
    }
    
    let positions = [];
    
    try {
      positions = JSON.parse(signal.positions);
    } catch (e) {
      console.error("[Copy Trading] Erro ao parse JSON:", e);
    }
    
    console.log("[Copy Trading] ✅ Retornando", positions.length, "posições para", email);
    
    res.json({
      success: true,
      positions: positions,
      positions_count: signal.positions_count,
      broker: signal.broker,
      updated_at: signal.updated_at
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
// POST /api/mt/copy/slave-copy-result
// Recebe resultado da cópia do Slave
//====================================================
router.post("/slave-copy-result", async (req, res) => {
  try {
    const {
      user_email,
      slave_account_id,
      master_account_id,
      symbol,
      status,
      execution_time,
      slippage,
      error_message
    } = req.body;
    
    if (!user_email || !slave_account_id) {
      return res.status(400).json({ 
        success: false,
        error: "user_email e slave_account_id são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(user_email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    const statusEmoji = status === 'success' ? '✅' : '❌';
    console.log(`[Copy Trading] ${statusEmoji} Resultado cópia: Slave ${slave_account_id} - ${status}`);
    
    // Broadcast resultado via WebSocket
    try {
      broadcastToUser(user.id, {
        type: 'TRADE_COPIED',
        tradeId: `${master_account_id}-${Date.now()}`,
        slaveAccountId: slave_account_id,
        status: {
          status,
          executionTime: execution_time || null,
          slippage: slippage || null,
          error: error_message || null
        },
        userId: user.id
      });
    } catch (wsError) {
      console.error("[Copy Trading] Erro ao broadcast resultado:", wsError);
    }
    
    res.json({ 
      success: true, 
      message: "Resultado recebido" 
    });
    
  } catch (error: any) {
    console.error("[Copy Trading] Erro ao processar resultado:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
