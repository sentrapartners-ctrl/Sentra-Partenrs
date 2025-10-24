import { Router, Request, Response } from "express";
import * as db from "./db";
import express from "express";

const router = Router();

// Middleware para debug do body raw
router.use(express.text({ type: 'application/json' }));
router.use((req, res, next) => {
  if (typeof req.body === 'string') {
    try {
      // Remove qualquer caractere nulo ou inválido
      const cleanBody = req.body.replace(/\0/g, '').trim();
      console.log('[MT API] Raw body:', cleanBody);
      req.body = JSON.parse(cleanBody);
    } catch (e) {
      console.error('[MT API] JSON parse error:', e);
      console.error('[MT API] Body that failed:', req.body);
    }
  }
  next();
});

// Helper para converter valores de cents para formato decimal
const fromCents = (value: number) => value / 100;
const toCents = (value: number) => Math.round(value * 100);

// Helper para converter preços (5 casas decimais)
const fromPriceInt = (value: number) => value / 100000;
const toPriceInt = (value: number) => Math.round(value * 100000);

// Helper para converter lots (2 casas decimais)
const fromLotsInt = (value: number) => value / 100;
const toLotsInt = (value: number) => Math.round(value * 100);

/**
 * POST /api/mt/heartbeat
 * Recebe heartbeat do terminal MT4/MT5
 */
/**
 * Detecta se é uma conta cent baseada no símbolo
 * Contas cent têm símbolos terminando com 'c' (ex: USDJPYc, BTCUSDc)
 */
const isCentAccount = (symbol?: string): boolean => {
  if (!symbol) return false;
  return symbol.toLowerCase().endsWith('c');
};

router.post("/heartbeat", async (req: Request, res: Response) => {
  try {
    console.log("[MT API] ===== HEARTBEAT RECEIVED =====");
    console.log("[MT API] Body:", JSON.stringify(req.body, null, 2));
    console.log("[MT API] Headers:", req.headers);
    console.log("[MT API] ===================================");
    
    const {
      terminal_id,
      account,
      account_number, // Novo formato
      broker,
      server,
      account_name,
      balance,
      equity,
      currency,
      leverage,
      margin_free,
      open_positions,
      timestamp,
      platform,
      user_email // Obrigatório para multi-usuário
    } = req.body;

    // Suporta tanto formato antigo (terminal_id + account) quanto novo (user_email + account_number)
    const accountNum = account_number || account;
    const terminalId = terminal_id || `${user_email}_${account_number}`; // Gera terminal_id único

    if (!user_email || !accountNum) {
      console.log("[MT API] Missing required fields. user_email:", user_email, "account:", accountNum);
      return res.status(400).json({ 
        error: "Missing required fields: user_email and account_number are required", 
        received: req.body 
      });
    }

    // Busca usuário pelo email se fornecido
    let userId: number | null = null;
    if (user_email) {
      const { getUserByEmail } = await import('./auth');
      const user = await getUserByEmail(user_email);
      if (user) {
        userId = user.id;
        console.log("[MT API] Account associated with user:", user.email);
      } else {
        console.log("[MT API] User not found for email:", user_email);
        return res.status(404).json({ 
          error: "User not found. Please register first.",
          email: user_email 
        });
      }
    } else {
      console.log("[MT API] No user_email provided. Account will not be associated.");
      return res.status(400).json({ 
        error: "user_email is required to associate account",
        hint: "Add UserEmail parameter to your EA" 
      });
    }

    // Busca ou cria a conta
    let existingAccount = await db.getAccountByTerminalId(terminalId);
    
    // Detecta plataforma automaticamente
    const accountStr = accountNum.toString();
    const detectedPlatform = platform || (accountStr.length >= 8 ? "MT5" : "MT4");
    
    if (!existingAccount) {
      // Primeira vez que vemos este terminal - cria associado ao usuário
      const accountId = await db.createOrUpdateAccount({
        userId: userId!,
        terminalId: terminalId,
        accountNumber: accountNum.toString(),
        broker: broker || "Unknown",
        server: server || "",
        platform: detectedPlatform,
        accountType: "STANDARD",
        currency: currency || "USD",
        leverage: leverage || 100,
        balance: toCents(balance || 0),
        equity: toCents(equity || 0),
        marginFree: toCents(margin_free || 0),
        openPositions: open_positions || 0,
        status: "connected",
        lastHeartbeat: new Date(),
      });
      
      existingAccount = await db.getAccountByTerminalId(terminalId);
      console.log("[MT API] New account created for user", userId);
    } else {
      // Atualiza a conta existente
      await db.createOrUpdateAccount({
        ...existingAccount,
        platform: detectedPlatform, // Atualiza plataforma detectada
        balance: toCents(balance || 0),
        equity: toCents(equity || 0),
        marginFree: toCents(margin_free || 0),
        openPositions: open_positions || 0,
        status: "connected",
        lastHeartbeat: new Date(timestamp * 1000),
      });

      // Registra snapshot de balanço para histórico
      await db.recordBalanceSnapshot({
        accountId: existingAccount.id,
        userId: existingAccount.userId,
        balance: toCents(balance || 0),
        equity: toCents(equity || 0),
        timestamp: new Date(timestamp * 1000),
      });
    }

    res.json({ success: true, message: "Heartbeat received" });
  } catch (error) {
    console.error("[MT API] Heartbeat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/mt/positions
 * Recebe posições abertas do terminal MT4/MT5
 */
router.post("/positions", async (req: Request, res: Response) => {
  try {
    const terminalId = req.headers["x-terminal-id"] as string;
    
    if (!terminalId) {
      return res.status(400).json({ error: "Missing X-Terminal-ID header" });
    }

    const account = await db.getAccountByTerminalId(terminalId);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const positions = req.body;
    if (!Array.isArray(positions)) {
      return res.status(400).json({ error: "Expected array of positions" });
    }

    // Processa cada posição
    for (const pos of positions) {
      const {
        ticket,
        type,
        symbol,
        volume,
        open_price,
        current_price,
        profit,
        open_time
      } = pos;

      await db.createOrUpdateTrade({
        accountId: account.id,
        userId: account.userId,
        ticket: ticket.toString(),
        symbol: symbol || "UNKNOWN",
        type: type === "BUY" ? "BUY" : type === "SELL" ? "SELL" : "OTHER",
        volume: toLotsInt(volume || 0),
        openPrice: toPriceInt(open_price || 0),
        currentPrice: toPriceInt(current_price || 0),
        profit: toCents(profit || 0),
        openTime: new Date(open_time * 1000),
        status: "open",
      });
    }

    res.json({ success: true, message: `Processed ${positions.length} positions` });
  } catch (error) {
    console.error("[MT API] Positions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/mt/history
 * Recebe histórico de trades do terminal MT4/MT5
 */
router.post("/history", async (req: Request, res: Response) => {
  try {
    console.log("[MT API] History received from:", req.headers["x-terminal-id"]);
    console.log("[MT API] History data:", JSON.stringify(req.body, null, 2));
    
    const terminalId = req.headers["x-terminal-id"] as string;
    
    if (!terminalId) {
      return res.status(400).json({ error: "Missing X-Terminal-ID header" });
    }

    const account = await db.getAccountByTerminalId(terminalId);
    if (!account) {
      console.log("[MT API] Account not found for terminalId:", terminalId);
      return res.status(404).json({ error: "Account not found" });
    }

    const history = req.body;
    console.log("[MT API] /history received:", history.length, "items");
    if (!Array.isArray(history)) {
      console.log("[MT API] Body is not an array:", typeof req.body);
      return res.status(400).json({ error: "Expected array of trades" });
    }

    // Processa cada trade histórico
    let processedCount = 0;
    let errorCount = 0;
    
    for (const trade of history) {
      try {
      const {
        ticket,
        type,
        symbol,
        volume,
        open_price,
        close_price,
        price,
        profit,
        open_time,
        close_time,
        time
      } = trade;

      // MT5 envia deals com apenas 'time' e 'price'
      // MT4 envia trades com 'open_time', 'close_time', 'open_price', 'close_price'
      const isDeals = !open_time && time; // MT5 deals
      const isTrade = open_time || open_price; // MT4 trades

      if (isDeals) {
        // MT5 Deal - trata como trade fechado individual
        const dealTime = time && time > 0 ? time * 1000 : Date.now();
        
        await db.createOrUpdateTrade({
          accountId: account.id,
          userId: account.userId,
          ticket: ticket.toString(),
          symbol: symbol || "UNKNOWN",
          type: type === "BUY" ? "BUY" : type === "SELL" ? "SELL" : "OTHER",
          volume: toLotsInt(volume || 0),
          openPrice: toPriceInt(price || 0),
          closePrice: toPriceInt(price || 0),
          profit: toCents(profit || 0),
          openTime: new Date(dealTime),
          closeTime: new Date(dealTime),
          status: "closed",
        });
      } else if (isTrade) {
        // MT4 Trade - formato completo
        const tradeCloseTime = close_time || time;
        const isClosed = tradeCloseTime && tradeCloseTime > 0;
        const openTimeValue = open_time && open_time > 0 ? open_time * 1000 : Date.now();
        const closeTimeValue = isClosed && tradeCloseTime > 0 ? tradeCloseTime * 1000 : undefined;

        await db.createOrUpdateTrade({
          accountId: account.id,
          userId: account.userId,
          ticket: ticket.toString(),
          symbol: symbol || "UNKNOWN",
          type: type === "BUY" ? "BUY" : type === "SELL" ? "SELL" : "OTHER",
          volume: toLotsInt(volume || 0),
          openPrice: toPriceInt(open_price || price || 0),
          closePrice: isClosed ? toPriceInt(close_price || price || 0) : 0,
          profit: toCents(profit || 0),
          openTime: new Date(openTimeValue),
          closeTime: closeTimeValue ? new Date(closeTimeValue) : undefined,
          status: isClosed ? "closed" : "open",
        });
      }
      processedCount++;
      } catch (tradeError) {
        console.error("[MT API] Error processing trade:", trade, tradeError);
        errorCount++;
      }
    }

    console.log(`[MT API] /history processed: ${processedCount} trades, ${errorCount} errors`);
    res.json({ 
      success: true, 
      message: `Processed ${processedCount} trades successfully, ${errorCount} errors`,
      processed: processedCount,
      errors: errorCount
    });
  } catch (error) {
    console.error("[MT API] History error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/mt/status
 * Retorna status da API
 */
router.get("/status", (req: Request, res: Response) => {
  res.json({
    status: "online",
    version: "1.0.0",
    timestamp: Date.now(),
  });
});

export default router;

