import { Router, Request, Response } from "express";
import * as db from "./db";
import express from "express";

const router = Router();

// O parsing de JSON é feito pelo middleware global express.json() no index.ts
// Não precisa de parsing manual aqui

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
      account_type, // "CENT" ou "STANDARD" enviado pelo EA
      user_email, // Formato antigo
      email // Formato novo (compatibilidade)
    } = req.body;
    
    // Aceita tanto 'email' quanto 'user_email'
    const userEmail = email || user_email;

    // Suporta tanto formato antigo (terminal_id + account) quanto novo (user_email + account_number)
    const accountNum = account_number || account;
    const terminalId = terminal_id || `${userEmail}_${account_number}`; // Gera terminal_id único

    if (!userEmail || !accountNum) {
      console.log("[MT API] Missing required fields. email:", userEmail, "account:", accountNum);
      return res.status(400).json({ 
        error: "Missing required fields: email (or user_email) and account_number are required", 
        received: req.body 
      });
    }

    // Busca usuário pelo email se fornecido
    let userId: number | null = null;
    if (userEmail) {
      const { getUserByEmail } = await import('./auth');
      const user = await getUserByEmail(userEmail);
      if (user) {
        userId = user.id;
        console.log("[MT API] Account associated with user:", user.email);
      } else {
        console.log("[MT API] User not found for email:", userEmail);
        return res.status(404).json({ 
          error: "User not found. Please register first.",
          email: userEmail 
        });
      }
    } else {
      console.log("[MT API] No email provided. Account will not be associated.");
      return res.status(400).json({ 
        error: "email (or user_email) is required to associate account",
        hint: "Add UserEmail parameter to your EA" 
      });
    }

    // Busca ou cria a conta
    let existingAccount = await db.getAccountByTerminalId(terminalId);
    
    // Detecta plataforma: prioriza valor enviado pelo EA, depois tenta detectar pelo servidor
    let detectedPlatform = platform; // Se EA enviou, usa o valor dele
    
    if (!detectedPlatform && server) {
      const serverLower = server.toLowerCase();
      // Busca explicitamente por "mt5" ou "mt4" no nome do servidor
      if (serverLower.includes('mt5')) {
        detectedPlatform = "MT5";
      } else if (serverLower.includes('mt4')) {
        detectedPlatform = "MT4";
      }
    }
    
    // Fallback: usa número de dígitos apenas se ainda não detectou
    if (!detectedPlatform) {
      const accountStr = accountNum.toString();
      detectedPlatform = accountStr.length >= 8 ? "MT5" : "MT4";
      console.log("[MT API] Platform detected by account digits:", detectedPlatform);
    } else {
      console.log("[MT API] Platform from EA:", detectedPlatform);
    }
    
    // Detecta se é uma nova conexão (primeira vez ou reconexão após desconexão)
    const isNewConnection = !existingAccount || existingAccount.status !== "connected";
    
    if (!existingAccount) {
      // Primeira vez que vemos este terminal - cria associado ao usuário
      const accountId = await db.createOrUpdateAccount({
        userId: userId!,
        terminalId: terminalId,
        accountNumber: accountNum.toString(),
        broker: broker || "Unknown",
        server: server || "",
        platform: detectedPlatform,
        accountType: account_type || "STANDARD", // Usa valor do EA ou STANDARD como padrão
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
        accountType: account_type || existingAccount.accountType, // Atualiza tipo se enviado pelo EA
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
        isCentAccount: existingAccount.isCentAccount || false,
        timestamp: new Date(parseInt(timestamp) * 1000),
      });
    }

    // Se é nova conexão, retorna flag para frontend mostrar notificação
    res.json({ 
      success: true, 
      message: "Heartbeat received",
      isNewConnection: isNewConnection,
      accountInfo: isNewConnection ? {
        accountNumber: accountNum.toString(),
        broker: broker || "Unknown",
        server: server || "",
        platform: detectedPlatform,
        balance: balance || 0,
        equity: equity || 0
      } : undefined
    });
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
 * POST /api/mt/trades
 * Recebe trades do terminal MT4/MT5 (mesmo que /history, mas com formato do EA)
 */
router.post("/trades", async (req: Request, res: Response) => {
  try {
    console.log("[MT API] ===== TRADES RECEIVED =====");
    console.log("[MT API] Body:", JSON.stringify(req.body, null, 2));
    console.log("[MT API] ===================================");
    
    const { user_email, email, account_number, trades } = req.body;
    
    // Aceita tanto 'email' quanto 'user_email'
    const userEmail = email || user_email;

    if (!userEmail || !account_number) {
      console.log("[MT API] Missing required fields");
      return res.status(400).json({ 
        error: "Missing required fields: email (or user_email) and account_number are required" 
      });
    }

    // Busca usuário pelo email
    const { getUserByEmail } = await import('./auth');
    const user = await getUserByEmail(userEmail);
    if (!user) {
      console.log("[MT API] User not found for email:", userEmail);
      return res.status(404).json({ 
        error: "User not found",
        email: userEmail 
      });
    }

    // Busca conta pelo terminal_id
    const terminalId = `${userEmail}_${account_number}`;
    const account = await db.getAccountByTerminalId(terminalId);
    
    if (!account) {
      console.log("[MT API] Account not found for terminalId:", terminalId);
      return res.status(404).json({ error: "Account not found. Send heartbeat first." });
    }

    if (!Array.isArray(trades)) {
      console.log("[MT API] Trades is not an array:", typeof trades);
      return res.status(400).json({ error: "Expected array of trades" });
    }

    console.log(`[MT API] Processing ${trades.length} trades for account ${account_number}`);

    // Processa cada trade
    let processedCount = 0;
    let errorCount = 0;
    
    for (const trade of trades) {
      try {
        const {
          ticket,
          type,
          symbol,
          volume,
          open_price,
          close_price,
          profit,
          commission,
          swap,
          open_time,
          close_time
        } = trade;

        // Converte timestamps de string para Date
        const parseDateTime = (dateStr: string) => {
          if (!dateStr) return new Date();
          // Formato: "2025.10.24 13:33:36" ou "2025-10-24 13:33:36"
          const normalized = dateStr.replace(/\./g, '-').replace(' ', 'T');
          return new Date(normalized);
        };

        const openTimeDate = open_time ? parseDateTime(open_time) : new Date();
        const closeTimeDate = close_time ? parseDateTime(close_time) : undefined;
        const isClosed = !!close_time && close_price > 0;

        await db.createOrUpdateTrade({
          accountId: account.id,
          userId: account.userId,
          ticket: ticket.toString(),
          symbol: symbol || "UNKNOWN",
          type: type?.toLowerCase() === "buy" ? "BUY" : type?.toLowerCase() === "sell" ? "SELL" : "OTHER",
          volume: toLotsInt(volume || 0),
          openPrice: toPriceInt(open_price || 0),
          closePrice: isClosed ? toPriceInt(close_price || 0) : 0,
          profit: toCents(profit || 0),
          commission: toCents(commission || 0),
          swap: toCents(swap || 0),
          openTime: openTimeDate,
          closeTime: closeTimeDate,
          status: isClosed ? "closed" : "open",
        });
        
        processedCount++;
      } catch (tradeError) {
        console.error("[MT API] Error processing trade:", trade, tradeError);
        errorCount++;
      }
    }

    console.log(`[MT API] Trades processed: ${processedCount} success, ${errorCount} errors`);
    res.json({ 
      success: true, 
      message: `Processed ${processedCount} trades successfully`,
      processed: processedCount,
      errors: errorCount
    });
  } catch (error) {
    console.error("[MT API] Trades error:", error);
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



/**
 * POST /api/mt/copy-signal
 * Recebe sinais de uma conta Master para copiar
 */
router.post("/copy-signal", async (req: Request, res: Response) => {
  try {
    console.log("[MT API] ===== COPY SIGNAL RECEIVED =====");
    console.log("[MT API] Body:", JSON.stringify(req.body, null, 2));
    
    const { accountNumber, accountToken, timestamp, trades } = req.body;
    
    if (!accountNumber || !accountToken) {
      return res.status(400).json({ 
        error: "Missing required fields: accountNumber and accountToken" 
      });
    }
    
    // Verificar se a conta existe e o token está correto
    const account = await db.getAccountByNumber(accountNumber.toString());
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }
    
    // TODO: Implementar verificação de token
    // Por enquanto, aceita qualquer token para simplificar
    
    if (!Array.isArray(trades)) {
      return res.status(400).json({ error: "Expected array of trades" });
    }
    
    // Armazenar sinais em memória (ou cache Redis no futuro)
    // Por enquanto, vamos usar uma variável global simples
    if (!global.copySignals) {
      global.copySignals = {};
    }
    
    global.copySignals[accountNumber] = {
      timestamp: new Date(timestamp || Date.now()),
      trades: trades,
      lastUpdate: Date.now()
    };
    
    console.log(`[MT API] Stored ${trades.length} signals from account ${accountNumber}`);
    
    res.json({ 
      success: true, 
      message: `Received ${trades.length} signals`,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("[MT API] Copy signal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/mt/get-signals
 * Retorna sinais de uma conta Master para contas Slave copiarem
 */
router.get("/get-signals", async (req: Request, res: Response) => {
  try {
    const { accountNumber, accountToken, masterAccount } = req.query;
    
    if (!accountNumber || !accountToken || !masterAccount) {
      return res.status(400).json({ 
        error: "Missing required parameters: accountNumber, accountToken, and masterAccount" 
      });
    }
    
    // Verificar se a conta slave existe
    const slaveAccount = await db.getAccountByNumber(accountNumber.toString());
    if (!slaveAccount) {
      return res.status(404).json({ error: "Slave account not found" });
    }
    
    // TODO: Implementar verificação de token e permissões de copy trading
    
    // Buscar sinais da conta Master
    if (!global.copySignals || !global.copySignals[masterAccount]) {
      return res.json({ 
        trades: [],
        message: "No signals available from master account"
      });
    }
    
    const signals = global.copySignals[masterAccount];
    
    // Verificar se os sinais não estão muito antigos (máximo 30 segundos)
    const signalAge = Date.now() - signals.lastUpdate;
    if (signalAge > 30000) {
      console.log(`[MT API] Signals from account ${masterAccount} are too old (${signalAge}ms)`);
      return res.json({ 
        trades: [],
        message: "Signals are outdated"
      });
    }
    
    console.log(`[MT API] Sending ${signals.trades.length} signals to slave account ${accountNumber}`);
    
    res.json({ 
      trades: signals.trades,
      timestamp: signals.timestamp,
      masterAccount: masterAccount
    });
  } catch (error) {
    console.error("[MT API] Get signals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


