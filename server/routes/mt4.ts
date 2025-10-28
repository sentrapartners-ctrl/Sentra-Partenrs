import express, { Request, Response } from "express";
import { getDb, getAccountByNumber, createOrUpdateTrade, createOrUpdateAccount } from "../db";
import { eq } from "drizzle-orm";

const router = express.Router();

// Helper para descriptografar Base64
const decodeBase64 = (encoded: string): string => {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch (e) {
    return encoded; // Se não for Base64, retorna original
  }
};

// Rota para receber trades do MT4
router.post("/trade", async (req: Request, res: Response) => {
  try {
    const {
      email,
      user_email, // Novo formato (pode estar criptografado)
      account_number,
      ticket,
      trade_id, // Novo formato
      symbol,
      type,
      lots,
      volume, // Novo formato
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
      status, // Novo formato
    } = req.body;

    // Aceita tanto email quanto user_email (descriptografa se necessário)
    const userEmail = user_email ? decodeBase64(user_email) : email;
    const tradeTicket = trade_id || ticket;
    const tradeVolume = volume || lots;

    console.log("[MT4] Trade recebido:", {
      email: userEmail,
      account_number,
      ticket: tradeTicket,
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

    // Converte timestamps (aceita tanto Unix timestamp quanto null)
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
    let tradeType = "buy";
    if (typeof type === 'string') {
      tradeType = type.toLowerCase() === 'sell' ? 'sell' : 'buy';
    } else if (typeof type === 'number') {
      tradeType = type === 0 ? 'buy' : 'sell';
    }

    await createOrUpdateTrade({
      accountId: account.id,
      userId: account.userId,
      ticket: tradeTicket ? tradeTicket.toString() : undefined,
      symbol: symbol || "UNKNOWN",
      type: tradeType,
      volume: tradeVolume ? Math.round(parseFloat(tradeVolume) * 100) : 0,
      openPrice: open_price ? Math.round(parseFloat(open_price) * 100000) : 0,
      openTime: openTimeDate,
      closePrice: close_price ? Math.round(parseFloat(close_price) * 100000) : null,
      closeTime: closeTimeDate,
      stopLoss: stop_loss ? Math.round(stop_loss * 100000) : null,
      takeProfit: take_profit ? Math.round(take_profit * 100000) : null,
      profit: Math.round(profit * divisor), // Armazenar em cents
      commission: commission ? Math.round(commission * divisor) : 0,
      swap: swap ? Math.round(swap * divisor) : 0,
      comment: comment || "",
      magicNumber: magic_number || 0,
    });

    console.log("[MT4] ✅ Trade salvo:", tradeTicket);

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
      user_email, // Novo formato (pode estar criptografado)
      account_number,
      balance,
      equity,
      margin,
      free_margin,
      margin_level,
      open_positions,
    } = req.body;

    // Aceita tanto email quanto user_email (descriptografa se necessário)
    const userEmail = user_email ? decodeBase64(user_email) : email;

    console.log("[MT4] Heartbeat recebido:", {
      email: userEmail,
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

