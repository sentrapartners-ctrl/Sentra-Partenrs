import express, { Request, Response } from "express";
import { getDb, getAccountByNumber, createOrUpdateTrade, createOrUpdateAccount } from "../db";
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
    const account = await getAccountByNumber(account_number.toString());
    
    if (!account) {
      console.log("[MT4] Conta não encontrada:", account_number);
      return res.status(404).json({
        success: false,
        error: "Conta não encontrada. Envie heartbeat primeiro.",
      });
    }

    // Verificar se trade já existe e inserir usando createOrUpdateTrade
    const isCentAccount = account.isCentAccount || false;
    const divisor = isCentAccount ? 10000 : 100;

    await createOrUpdateTrade({
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
    const account = await getAccountByNumber(account_number.toString());
    
    if (!account) {
      console.log("[MT4] Conta não encontrada:", account_number);
      return res.status(404).json({
        success: false,
        error: "Conta não encontrada. Envie heartbeat primeiro.",
      });
    }
    const isCentAccount = account.isCentAccount || false;
    const divisor = isCentAccount ? 10000 : 100;

    // Atualizar dados da conta usando createOrUpdateAccount
    await createOrUpdateAccount({
      ...account,
      balance: Math.round(balance * divisor),
      equity: Math.round(equity * divisor),
      marginUsed: margin ? Math.round(margin * divisor) : 0,
      marginFree: free_margin ? Math.round(free_margin * divisor) : 0,
      marginLevel: margin_level ? Math.round(margin_level * 100) : 0,
      openPositions: open_positions || 0,
      lastHeartbeat: new Date(),
      status: "connected" as const,
    });

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

