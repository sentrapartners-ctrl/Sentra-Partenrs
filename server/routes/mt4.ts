import express, { Request, Response } from "express";
import { getDb } from "../db";
import { eq } from "drizzle-orm";

const router = express.Router();

// Rota para receber trades do MT4
router.post("/trade", async (req: Request, res: Response) => {
  try {
    const {
      email,
      account_number,
      ticket,
      symbol,
      type,
      lots,
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
    } = req.body;

    console.log("[MT4] Trade recebido:", {
      email,
      account_number,
      ticket,
      symbol,
      profit,
    });

    // Buscar conta pelo número
    const db = await getDb();
    if (!db) {
      console.log("[MT4] Database not available");
      return res.status(500).json({
        success: false,
        error: "Database not available",
      });
    }
    const accounts = await db.query.accounts.findMany({
      where: (accounts, { eq }) => eq(accounts.accountNumber, account_number.toString()),
    });

    if (accounts.length === 0) {
      console.log("[MT4] Conta não encontrada:", account_number);
      return res.status(404).json({
        success: false,
        error: "Conta não encontrada",
      });
    }

    const account = accounts[0];

    // Verificar se trade já existe
    const existingTrades = await db.query.trades.findMany({
      where: (trades, { eq }) => eq(trades.ticket, ticket),
    });

    if (existingTrades.length > 0) {
      console.log("[MT4] Trade já existe:", ticket);
      return res.json({
        success: true,
        message: "Trade já existe",
      });
    }

    // Converter valores
    const isCentAccount = account.isCentAccount || false;
    const divisor = isCentAccount ? 10000 : 100;

    // Inserir trade
    await db.insert(db.schema.trades).values({
      accountId: account.id,
      ticket: ticket,
      symbol: symbol,
      type: type === 0 ? "buy" : "sell",
      volume: Math.round(lots * 100), // Converter para inteiro (lotes * 100)
      openPrice: Math.round(open_price * 100000), // 5 casas decimais
      openTime: new Date(open_time),
      closePrice: close_price ? Math.round(close_price * 100000) : null,
      closeTime: close_time ? new Date(close_time) : null,
      stopLoss: stop_loss ? Math.round(stop_loss * 100000) : null,
      takeProfit: take_profit ? Math.round(take_profit * 100000) : null,
      profit: Math.round(profit * divisor), // Armazenar em cents
      commission: commission ? Math.round(commission * divisor) : 0,
      swap: swap ? Math.round(swap * divisor) : 0,
      comment: comment || "",
      magicNumber: magic_number || 0,
    });

    console.log("[MT4] ✅ Trade salvo:", ticket);

    res.json({
      success: true,
      message: "Trade salvo com sucesso",
    });
  } catch (error: any) {
    console.error("[MT4] Erro ao salvar trade:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Rota para receber heartbeat do MT4
router.post("/heartbeat", async (req: Request, res: Response) => {
  try {
    const {
      email,
      account_number,
      balance,
      equity,
      margin,
      free_margin,
      margin_level,
      open_positions,
    } = req.body;

    console.log("[MT4] Heartbeat recebido:", {
      email,
      account_number,
      balance,
      equity,
      open_positions,
    });

    // Buscar conta pelo número
    const db = await getDb();
    if (!db) {
      console.log("[MT4] Database not available");
      return res.status(500).json({
        success: false,
        error: "Database not available",
      });
    }
    const accounts = await db.query.accounts.findMany({
      where: (accounts, { eq }) => eq(accounts.accountNumber, account_number.toString()),
    });

    if (accounts.length === 0) {
      console.log("[MT4] Conta não encontrada:", account_number);
      return res.status(404).json({
        success: false,
        error: "Conta não encontrada",
      });
    }

    const account = accounts[0];
    const isCentAccount = account.isCentAccount || false;
    const divisor = isCentAccount ? 10000 : 100;

    // Atualizar dados da conta
    await db
      .update(db.schema.accounts)
      .set({
        balance: Math.round(balance * divisor),
        equity: Math.round(equity * divisor),
        margin: margin ? Math.round(margin * divisor) : null,
        freeMargin: free_margin ? Math.round(free_margin * divisor) : null,
        marginLevel: margin_level || null,
        lastUpdate: new Date(),
      })
      .where(eq(db.schema.accounts.id, account.id));

    console.log("[MT4] ✅ Heartbeat processado");

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

export default router;

