import express, { Request, Response } from "express";
import * as db from "../db";

const router = express.Router();

// Helper para descriptografar Base64
const decodeBase64 = (encoded: string): string => {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch (e) {
    return encoded; // Se não for Base64, retorna original
  }
};

/**
 * POST /api/mt4/heartbeat
 * Recebe dados da conta MT4/MT5 e cria/atualiza
 */
router.post("/heartbeat", async (req: Request, res: Response) => {
  try {
    const {
      email,
      user_email,
      account_number,
      broker,
      server,
      platform = "MT4",
      account_type = "STANDARD",
      balance,
      equity,
      margin,
      margin_free,
      margin_level,
      open_positions,
      currency = "USD",
      leverage,
    } = req.body;

    // Aceita tanto email quanto user_email (descriptografa se necessário)
    const userEmail = user_email ? decodeBase64(user_email) : email;

    if (!userEmail || !account_number) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros obrigatórios: email, account_number",
      });
    }

    console.log("[MT4] Heartbeat recebido:", {
      email: userEmail,
      account_number,
      broker,
      balance,
      equity,
    });

    // Buscar usuário
    const user = await db.getUserByEmail(userEmail);
    if (!user) {
      console.log("[MT4] Usuário não encontrado:", userEmail);
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado. Cadastre-se na plataforma primeiro.",
      });
    }

    // Buscar ou criar conta
    let account = await db.getAccountByNumberAndUser(account_number.toString(), user.id);

    const isCentAccount = account_type === "CENT";
    const divisor = isCentAccount ? 10000 : 100;

    const balanceInt = Math.round(parseFloat(balance) * divisor);
    const equityInt = Math.round(parseFloat(equity) * divisor);
    const marginInt = margin ? Math.round(parseFloat(margin) * divisor) : 0;
    const marginFreeInt = margin_free ? Math.round(parseFloat(margin_free) * divisor) : 0;
    const marginLevelInt = margin_level ? Math.round(parseFloat(margin_level) * 100) : 0;

    if (account) {
      // Atualizar conta existente
      await db.updateTradingAccount(account.id, {
        balance: balanceInt,
        equity: equityInt,
        marginUsed: marginInt,
        marginFree: marginFreeInt,
        marginLevel: marginLevelInt,
        openPositions: parseInt(open_positions) || 0,
        status: "connected",
        lastHeartbeat: new Date(),
      });

      console.log("[MT4] ✅ Conta atualizada:", account_number);
    } else {
      // Criar nova conta
      const accountId = await db.createTradingAccount({
        userId: user.id,
        accountNumber: account_number.toString(),
        broker: broker || "Unknown",
        server: server || "",
        platform: platform as "MT4" | "MT5",
        accountType: account_type as "DEMO" | "REAL" | "CENT",
        isCentAccount,
        balance: balanceInt,
        equity: equityInt,
        marginUsed: marginInt,
        marginFree: marginFreeInt,
        marginLevel: marginLevelInt,
        leverage: parseInt(leverage) || 100,
        openPositions: parseInt(open_positions) || 0,
        currency,
        status: "connected",
        lastHeartbeat: new Date(),
      });

      account = await db.getTradingAccount(accountId);
      console.log("[MT4] ✅ Nova conta criada:", account_number);
    }

    // Registrar histórico de saldo
    if (account) {
      await db.createBalanceHistory({
        accountId: account.id,
        userId: user.id,
        balance: balanceInt,
        equity: equityInt,
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
 * POST /api/mt4/trade
 * Recebe dados de um trade MT4/MT5
 */
router.post("/trade", async (req: Request, res: Response) => {
  try {
    const {
      email,
      user_email,
      account_number,
      ticket,
      trade_id,
      symbol,
      type,
      lots,
      volume,
      open_price,
      open_time,
      close_price,
      close_time,
      stop_loss,
      take_profit,
      profit,
      commission,
      swap,
      comment,
      magic_number,
      status,
    } = req.body;

    // Aceita tanto email quanto user_email (descriptografa se necessário)
    const userEmail = user_email ? decodeBase64(user_email) : email;
    const tradeTicket = trade_id || ticket;
    const tradeVolume = volume || lots;

    if (!userEmail || !account_number || !tradeTicket) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros obrigatórios: email, account_number, ticket",
      });
    }

    console.log("[MT4] Trade recebido:", {
      email: userEmail,
      account_number,
      ticket: tradeTicket,
      symbol,
      profit,
      status,
    });

    // Buscar usuário
    const user = await db.getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Buscar conta
    const account = await db.getAccountByNumberAndUser(account_number.toString(), user.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Conta não encontrada. Envie heartbeat primeiro.",
      });
    }

    // Determina divisor baseado no tipo de conta
    const isCentAccount = account.isCentAccount || false;
    const divisor = isCentAccount ? 10000 : 100;

    // Converte timestamps
    const parseTimestamp = (ts: any): Date | null => {
      if (!ts || ts === 0 || ts === "0") return null;
      if (typeof ts === 'number') return new Date(ts * 1000);
      if (typeof ts === 'string') {
        const num = parseInt(ts);
        if (!isNaN(num) && num > 0) return new Date(num * 1000);
      }
      return null;
    };

    const openTimeDate = parseTimestamp(open_time) || new Date();
    const closeTimeDate = parseTimestamp(close_time);

    // Detecta tipo (aceita tanto string quanto número)
    let tradeType: "BUY" | "SELL" = "BUY";
    if (typeof type === 'string') {
      tradeType = type.toUpperCase() === 'SELL' ? 'SELL' : 'BUY';
    } else if (typeof type === 'number') {
      tradeType = type === 1 ? 'SELL' : 'BUY';
    }

    // Determina status
    let tradeStatus: "open" | "closed" = "open";
    if (status) {
      tradeStatus = status === "closed" ? "closed" : "open";
    } else if (closeTimeDate) {
      tradeStatus = "closed";
    }

    await db.createOrUpdateTrade({
      userId: user.id,
      accountId: account.id,
      ticket: parseInt(tradeTicket),
      symbol: symbol || "UNKNOWN",
      type: tradeType,
      volume: tradeVolume ? parseFloat(tradeVolume) : 0,
      openPrice: open_price ? Math.round(parseFloat(open_price) * 100000) : 0,
      openTime: openTimeDate,
      closePrice: close_price ? Math.round(parseFloat(close_price) * 100000) : undefined,
      closeTime: closeTimeDate || undefined,
      stopLoss: stop_loss ? Math.round(parseFloat(stop_loss) * 100000) : undefined,
      takeProfit: take_profit ? Math.round(parseFloat(take_profit) * 100000) : undefined,
      profit: Math.round(parseFloat(profit) * divisor),
      commission: commission ? Math.round(parseFloat(commission) * divisor) : undefined,
      swap: swap ? Math.round(parseFloat(swap) * divisor) : undefined,
      comment: comment || undefined,
      status: tradeStatus,
    });

    console.log("[MT4] ✅ Trade salvo:", tradeTicket);

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
 * POST /api/mt4/ping
 * Verifica conexão
 */
router.post("/ping", async (req: Request, res: Response) => {
  try {
    const { email, user_email, account_number } = req.body;
    const userEmail = user_email ? decodeBase64(user_email) : email;

    if (!userEmail || !account_number) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros obrigatórios: email, account_number",
      });
    }

    const user = await db.getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    const account = await db.getAccountByNumberAndUser(account_number.toString(), user.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Conta não encontrada",
      });
    }

    await db.updateAccountHeartbeat(account.id);

    res.json({
      success: true,
      message: "Conexão ativa",
    });
  } catch (error: any) {
    console.error("[MT4] Ping error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
