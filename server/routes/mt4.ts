import express, { Request, Response } from "express";
import { getDb, createOrUpdateAccount, getAccountByNumberAndUser, createOrUpdateTrade, recordBalanceSnapshot } from "../db";
import { getUserByEmail } from "../auth";

const router = express.Router();

/**
 * POST /api/mt/heartbeat
 * Recebe dados da conta MT4/MT5 (JSON ou form-urlencoded)
 */
router.post("/heartbeat", async (req: Request, res: Response) => {
  try {
    const {
      user_email,
      account_number,
      broker,
      server,
      account_name,
      balance,
      equity,
      currency = "USD",
      leverage,
      margin_free,
      open_positions,
      platform = "MT4",
      account_type,
    } = req.body;

    if (!user_email || !account_number) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros obrigatórios: user_email, account_number",
      });
    }

    console.log("[MT4] Heartbeat recebido:", {
      email: user_email,
      account_number,
      broker,
      balance,
      equity,
      account_type,
    });

    // Buscar usuário
    const user = await getUserByEmail(user_email);
    if (!user) {
      console.log("[MT4] Usuário não encontrado:", user_email);
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado. Cadastre-se na plataforma primeiro.",
      });
    }

    // Detectar tipo de conta
    let isCentAccount = false;
    let accountTypeStr = "STANDARD";
    
    if (account_type) {
      // Se veio explicitamente do EA
      isCentAccount = account_type === "CENT";
      accountTypeStr = account_type;
    } else if (server) {
      // Detecta pelo nome do servidor
      isCentAccount = server.toLowerCase().includes('cent') || server.toLowerCase().includes('micro');
      accountTypeStr = isCentAccount ? "CENT" : "STANDARD";
    }
    
    // Backend salva valores direto como vêm do MT4/MT5 (sem multiplicar)
    const balanceInt = Math.round(parseFloat(balance));
    const equityInt = Math.round(parseFloat(equity));
    const marginFreeInt = margin_free ? Math.round(parseFloat(margin_free)) : 0;

    // Criar ou atualizar conta
    const accountData = {
      userId: user.id,
      accountNumber: account_number.toString(),
      broker: broker || "Unknown",
      server: server || "",
      platform: platform as "MT4" | "MT5",
      accountType: accountTypeStr as "DEMO" | "REAL" | "CENT",
      isCentAccount,
      balance: balanceInt,
      equity: equityInt,
      marginUsed: 0,
      marginFree: marginFreeInt,
      marginLevel: 0,
      leverage: parseInt(leverage) || 100,
      openPositions: parseInt(open_positions) || 0,
      currency,
      status: "connected" as const,
      lastHeartbeat: new Date(),
    };

    await createOrUpdateAccount(accountData);
    
    // Pega a conta atualizada
    const account = await getAccountByNumberAndUser(account_number.toString(), user.id);

    console.log("[MT4] ✅ Conta sincronizada:", account_number);

    // Registrar histórico de saldo
    if (account) {
      await recordBalanceSnapshot({
        accountId: account.id,
        userId: user.id,
        balance: balanceInt,
        equity: equityInt,
        isCentAccount: account.isCentAccount || false,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      message: "Heartbeat recebido",
    });
  } catch (error: any) {
    console.error("[MT4] Erro ao processar heartbeat:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/mt/trade
 * Recebe um trade individual (form-urlencoded)
 */
router.post("/trade", async (req: Request, res: Response) => {
  try {
    const {
      user_email,
      account_number,
      trade_id,
      ticket,
      symbol,
      type,
      volume,
      open_price,
      close_price,
      stop_loss,
      take_profit,
      profit,
      commission,
      swap,
      status,
      open_time,
      close_time,
    } = req.body;

    const tradeTicket = trade_id || ticket;

    if (!user_email || !account_number || !tradeTicket) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros obrigatórios: user_email, account_number, trade_id/ticket",
      });
    }

    // Buscar usuário
    const user = await getUserByEmail(user_email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Buscar conta
    const account = await getAccountByNumberAndUser(account_number.toString(), user.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Conta não encontrada. Envie heartbeat primeiro.",
      });
    }

    // Backend salva valores direto (sem multiplicar)

    // Converte timestamps (Unix timestamp)
    const parseTimestamp = (ts: any): Date | null => {
      if (!ts || ts === 0 || ts === "0") return null;
      const num = parseInt(ts);
      if (!isNaN(num) && num > 0) return new Date(num * 1000);
      return null;
    };

    const openTimeDate = parseTimestamp(open_time) || new Date();
    const closeTimeDate = parseTimestamp(close_time);

    // Detecta tipo
    let tradeType = "buy";
    if (typeof type === 'string') {
      tradeType = type.toUpperCase() === 'SELL' ? 'sell' : 'buy';
    }

    // Determina status
    let tradeStatus = status || (closeTimeDate ? "closed" : "open");

    await createOrUpdateTrade({
      accountId: account.id,
      userId: user.id,
      ticket: tradeTicket.toString(),
      symbol: symbol || "UNKNOWN",
      type: tradeType,
      volume: volume ? Math.round(parseFloat(volume) * 100) : 0,
      openPrice: open_price ? Math.round(parseFloat(open_price) * 100000) : 0,
      openTime: openTimeDate,
      closePrice: close_price ? Math.round(parseFloat(close_price) * 100000) : null,
      closeTime: closeTimeDate,
      stopLoss: stop_loss ? Math.round(parseFloat(stop_loss) * 100000) : null,
      takeProfit: take_profit ? Math.round(parseFloat(take_profit) * 100000) : null,
      profit: Math.round(parseFloat(profit)),
      commission: commission ? Math.round(parseFloat(commission)) : 0,
      swap: swap ? Math.round(parseFloat(swap)) : 0,
      comment: "",
      magicNumber: 0,
    });

    // Detectar se é conta CENT pelo símbolo (termina com 'c')
    if (symbol && symbol.toLowerCase().endsWith('c') && !account.isCentAccount) {
      const db = await getDb();
      const { accounts } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      await db.update(accounts)
        .set({ 
          accountType: "CENT",
          isCentAccount: true 
        })
        .where(eq(accounts.id, account.id));
      
      console.log(`[MT4] ✅ Conta ${account_number} atualizada para CENT (símbolo: ${symbol})`);
    }

    res.json({
      success: true,
      message: "Trade sincronizado",
    });
  } catch (error: any) {
    console.error("[MT4] Erro ao salvar trade:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/mt/positions
 * Recebe array de posições abertas (JSON)
 */
router.post("/positions", async (req: Request, res: Response) => {
  try {
    const { user_email, account_number, positions } = req.body;

    if (!user_email || !account_number || !positions) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros obrigatórios: user_email, account_number, positions",
      });
    }

    console.log("[MT4] Posições recebidas:", {
      email: user_email,
      account_number,
      count: positions.length,
    });

    // Buscar usuário
    const user = await getUserByEmail(user_email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Buscar conta
    const account = await getAccountByNumberAndUser(account_number.toString(), user.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Conta não encontrada. Envie heartbeat primeiro.",
      });
    }

    // Backend salva valores direto (sem multiplicar)

    // Processar cada posição
    let saved = 0;
    for (const pos of positions) {
      try {
        await createOrUpdateTrade({
          accountId: account.id,
          userId: user.id,
          ticket: pos.ticket.toString(),
          symbol: pos.symbol || "UNKNOWN",
          type: pos.type === "buy" ? "buy" : "sell",
          volume: pos.volume ? Math.round(parseFloat(pos.volume) * 100) : 0,
          openPrice: pos.open_price ? Math.round(parseFloat(pos.open_price) * 100000) : 0,
          openTime: new Date(pos.open_time),
          closePrice: null,
          closeTime: null,
          stopLoss: null,
          takeProfit: null,
          profit: Math.round(parseFloat(pos.profit)),
          commission: pos.commission ? Math.round(parseFloat(pos.commission)) : 0,
          swap: pos.swap ? Math.round(parseFloat(pos.swap)) : 0,
          comment: "",
          magicNumber: 0,
        });
        saved++;
      } catch (err) {
        console.error("[MT4] Erro ao salvar posição:", pos.ticket, err);
      }
    }

    console.log("[MT4] ✅", saved, "posições salvas");

    res.json({
      success: true,
      message: `${saved} posições sincronizadas`,
    });
  } catch (error: any) {
    console.error("[MT4] Erro ao processar posições:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/mt/trades
 * Recebe array de trades históricos (JSON)
 */
router.post("/trades", async (req: Request, res: Response) => {
  try {
    const { user_email, account_number, trades } = req.body;

    if (!user_email || !account_number || !trades) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros obrigatórios: user_email, account_number, trades",
      });
    }

    console.log("[MT4] Trades recebidos:", {
      email: user_email,
      account_number,
      count: trades.length,
    });

    // Buscar usuário
    const user = await getUserByEmail(user_email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Buscar conta
    const account = await getAccountByNumberAndUser(account_number.toString(), user.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Conta não encontrada. Envie heartbeat primeiro.",
      });
    }

    // Backend salva valores direto (sem multiplicar)

    // Processar cada trade
    let saved = 0;
    for (const trade of trades) {
      try {
        await createOrUpdateTrade({
          accountId: account.id,
          userId: user.id,
          ticket: trade.ticket.toString(),
          symbol: trade.symbol || "UNKNOWN",
          type: trade.type === "buy" ? "buy" : "sell",
          volume: trade.volume ? Math.round(parseFloat(trade.volume) * 100) : 0,
          openPrice: trade.open_price ? Math.round(parseFloat(trade.open_price) * 100000) : 0,
          openTime: new Date(trade.open_time),
          closePrice: trade.close_price ? Math.round(parseFloat(trade.close_price) * 100000) : null,
          closeTime: trade.close_time ? new Date(trade.close_time) : null,
          stopLoss: null,
          takeProfit: null,
          profit: Math.round(parseFloat(trade.profit)),
          commission: trade.commission ? Math.round(parseFloat(trade.commission)) : 0,
          swap: trade.swap ? Math.round(parseFloat(trade.swap)) : 0,
          comment: "",
          magicNumber: 0,
        });
        saved++;
      } catch (err) {
        console.error("[MT4] Erro ao salvar trade:", trade.ticket, err);
      }
    }

    console.log("[MT4] ✅", saved, "trades salvos");

    res.json({
      success: true,
      message: `${saved} trades sincronizados`,
    });
  } catch (error: any) {
    console.error("[MT4] Erro ao processar trades:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});



export default router;
