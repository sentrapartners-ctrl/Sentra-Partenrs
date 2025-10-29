import express, { Request, Response } from "express";
import { getDb, createOrUpdateAccount, getAccountByNumberAndUser, createOrUpdateTrade, recordBalanceSnapshot } from "../db";
import { getUserByEmail } from "../auth";

const router = express.Router();

/**
 * POST /api/mt/heartbeat
 * Recebe dados da conta MT4/MT5
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

    // Detectar tipo de conta (CENT se tiver "cent" no nome do servidor)
    const isCentAccount = server && (
      server.toLowerCase().includes('cent') ||
      server.toLowerCase().includes('micro')
    );
    
    const accountType = isCentAccount ? "CENT" : "STANDARD";
    const divisor = isCentAccount ? 10000 : 100;

    const balanceInt = Math.round(parseFloat(balance) * divisor);
    const equityInt = Math.round(parseFloat(equity) * divisor);
    const marginFreeInt = margin_free ? Math.round(parseFloat(margin_free) * divisor) : 0;

    // Criar ou atualizar conta
    const accountData = {
      userId: user.id,
      accountNumber: account_number.toString(),
      broker: broker || "Unknown",
      server: server || "",
      platform: platform as "MT4" | "MT5",
      accountType: accountType as "DEMO" | "REAL" | "CENT",
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
 * POST /api/mt/positions
 * Recebe array de posições abertas
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

    const isCentAccount = account.isCentAccount || false;
    const divisor = isCentAccount ? 10000 : 100;

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
          profit: Math.round(parseFloat(pos.profit) * divisor),
          commission: pos.commission ? Math.round(parseFloat(pos.commission) * divisor) : 0,
          swap: pos.swap ? Math.round(parseFloat(pos.swap) * divisor) : 0,
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
 * Recebe array de trades históricos
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

    const isCentAccount = account.isCentAccount || false;
    const divisor = isCentAccount ? 10000 : 100;

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
          profit: Math.round(parseFloat(trade.profit) * divisor),
          commission: trade.commission ? Math.round(parseFloat(trade.commission) * divisor) : 0,
          swap: trade.swap ? Math.round(parseFloat(trade.swap) * divisor) : 0,
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
