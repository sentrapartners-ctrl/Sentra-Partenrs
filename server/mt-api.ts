import { Router, Request, Response } from "express";
import * as db from "./db";

const router = Router();

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
router.post("/heartbeat", async (req: Request, res: Response) => {
  try {
    const {
      terminal_id,
      account,
      broker,
      balance,
      equity,
      margin_free,
      open_positions,
      timestamp
    } = req.body;

    if (!terminal_id || !account) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Busca ou cria a conta
    let existingAccount = await db.getAccountByTerminalId(terminal_id);
    
    if (!existingAccount) {
      // Primeira vez que vemos este terminal - precisa ser associado a um usuário
      // Por enquanto, vamos criar com userId = 1 (admin)
      // TODO: Implementar sistema de registro de terminais
      const accountId = await db.createOrUpdateAccount({
        userId: 1, // Temporário - deve ser configurado pelo usuário
        terminalId: terminal_id,
        accountNumber: account.toString(),
        broker: broker || "Unknown",
        platform: terminal_id.startsWith("MT5") ? "MT5" : "MT4",
        accountType: "STANDARD",
        balance: toCents(balance || 0),
        equity: toCents(equity || 0),
        marginFree: toCents(margin_free || 0),
        openPositions: open_positions || 0,
        status: "connected",
        lastHeartbeat: new Date(timestamp * 1000),
      });
      
      existingAccount = await db.getAccountByTerminalId(terminal_id);
    } else {
      // Atualiza a conta existente
      await db.createOrUpdateAccount({
        ...existingAccount,
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
    const terminalId = req.headers["x-terminal-id"] as string;
    
    if (!terminalId) {
      return res.status(400).json({ error: "Missing X-Terminal-ID header" });
    }

    const account = await db.getAccountByTerminalId(terminalId);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const history = req.body;
    if (!Array.isArray(history)) {
      return res.status(400).json({ error: "Expected array of trades" });
    }

    // Processa cada trade histórico
    for (const trade of history) {
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

      // MT4 usa close_time, MT5 pode usar time
      const tradeCloseTime = close_time || time;
      const isClosed = tradeCloseTime && tradeCloseTime > 0;

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
        openTime: new Date(open_time * 1000),
        closeTime: isClosed ? new Date(tradeCloseTime * 1000) : undefined,
        status: isClosed ? "closed" : "open",
      });
    }

    res.json({ success: true, message: `Processed ${history.length} trades` });
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

