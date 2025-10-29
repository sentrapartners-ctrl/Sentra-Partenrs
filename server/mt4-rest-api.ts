import type { Express, Request, Response } from "express";
import * as db from "./db";

/**
 * API REST simples para MT4/MT5 (estilo MyFxBook)
 * Endpoints públicos que aceitam POST com form-urlencoded
 */
export function setupMT4RestAPI(app: Express) {
  
  /**
   * POST /api/mt4/heartbeat
   * Envia dados da conta (balance, equity, etc)
   */
  app.post("/api/mt4/heartbeat", async (req: Request, res: Response) => {
    try {
      const {
        email,
        account_number,
        broker,
        server,
        platform = "MT4",
        account_type = "REAL",
        balance,
        equity,
        margin_free,
        open_positions,
        currency = "USD",
        leverage,
      } = req.body;

      // Validação básica
      if (!email || !account_number || !broker) {
        return res.status(400).json({ 
          error: "Parâmetros obrigatórios: email, account_number, broker" 
        });
      }

      // Buscar usuário
      const user = await db.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Buscar ou criar conta
      let account = await db.getAccountByNumberAndUser(account_number, user.id);

      const balanceInt = Math.round(parseFloat(balance) * 100);
      const equityInt = Math.round(parseFloat(equity) * 100);
      const marginFreeInt = margin_free ? Math.round(parseFloat(margin_free) * 100) : 0;

      if (account) {
        // Atualizar
        await db.updateTradingAccount(account.id, {
          balance: balanceInt,
          equity: equityInt,
          marginFree: marginFreeInt,
          openPositions: parseInt(open_positions) || 0,
          status: "connected",
          lastHeartbeat: new Date(),
        });
      } else {
        // Criar
        const accountId = await db.createTradingAccount({
          userId: user.id,
          accountNumber: account_number,
          broker,
          server: server || "",
          platform: platform as "MT4" | "MT5",
          accountType: account_type as "DEMO" | "REAL" | "CENT",
          isCentAccount: account_type === "CENT",
          balance: balanceInt,
          equity: equityInt,
          margin: 0,
          marginFree: marginFreeInt,
          marginLevel: 0,
          leverage: parseInt(leverage) || 100,
          openPositions: parseInt(open_positions) || 0,
          currency,
          status: "connected",
          lastHeartbeat: new Date(),
        });
        account = await db.getTradingAccount(accountId);
      }

      // Registrar histórico
      if (account) {
        await db.createBalanceHistory({
          accountId: account.id,
          userId: user.id,
          balance: balanceInt,
          equity: equityInt,
          timestamp: new Date(),
        });
      }

      res.json({ success: true, message: "Heartbeat recebido" });
    } catch (error) {
      console.error("[MT4 REST] Heartbeat error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno" 
      });
    }
  });

  /**
   * POST /api/mt4/trade
   * Envia dados de um trade
   */
  app.post("/api/mt4/trade", async (req: Request, res: Response) => {
    try {
      const {
        email,
        account_number,
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

      // Validação
      if (!email || !account_number || !ticket || !symbol) {
        return res.status(400).json({ 
          error: "Parâmetros obrigatórios: email, account_number, ticket, symbol" 
        });
      }

      // Buscar usuário
      const user = await db.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Buscar conta
      const account = await db.getAccountByNumberAndUser(account_number, user.id);
      if (!account) {
        return res.status(404).json({ error: "Conta não encontrada" });
      }

      // Criar ou atualizar trade
      await db.createOrUpdateTrade({
        userId: user.id,
        accountId: account.id,
        ticket: parseInt(ticket),
        symbol,
        type: type as "BUY" | "SELL",
        volume: parseFloat(volume),
        openPrice: Math.round(parseFloat(open_price) * 100000),
        openTime: new Date(parseInt(open_time) * 1000),
        closePrice: close_price ? Math.round(parseFloat(close_price) * 100000) : undefined,
        closeTime: close_time && parseInt(close_time) > 0 ? new Date(parseInt(close_time) * 1000) : undefined,
        stopLoss: stop_loss ? Math.round(parseFloat(stop_loss) * 100000) : undefined,
        takeProfit: take_profit ? Math.round(parseFloat(take_profit) * 100000) : undefined,
        profit: Math.round(parseFloat(profit) * 100),
        commission: commission ? Math.round(parseFloat(commission) * 100) : undefined,
        swap: swap ? Math.round(parseFloat(swap) * 100) : undefined,
        status: status as "open" | "closed",
      });

      res.json({ success: true, message: "Trade sincronizado" });
    } catch (error) {
      console.error("[MT4 REST] Trade error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Erro interno" 
      });
    }
  });

  console.log("[MT4 REST API] Endpoints configurados:");
  console.log("  POST /api/mt4/heartbeat");
  console.log("  POST /api/mt4/trade");
}
