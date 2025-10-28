import express, { Request, Response } from "express";
import { getDb } from "../db";
import { users, mt4Accounts, trades } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const router = express.Router();

// Rota de autenticação do EA
router.post("/auth", async (req: Request, res: Response) => {
  try {
    const { email, account_number, account_type, broker, account_name } = req.body;

    console.log("[MT4 Connector] Tentativa de autenticação:", {
      email,
      account_number,
      account_type,
      broker,
    });

    // Validar campos obrigatórios
    if (!email || !account_number || !account_type) {
      console.log("[MT4 Connector] Campos obrigatórios faltando");
      return res.status(400).json({
        success: false,
        error: "Campos obrigatórios: email, account_number, account_type",
      });
    }

    // Validar tipo de conta
    if (account_type !== "Cent" && account_type !== "Standard") {
      console.log("[MT4 Connector] Tipo de conta inválido:", account_type);
      return res.status(400).json({
        success: false,
        error: "Tipo de conta deve ser 'Cent' ou 'Standard'",
      });
    }

    const db = await getDb();

    // Buscar usuário por email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.log("[MT4 Connector] Usuário não encontrado:", email);
      return res.status(404).json({
        success: false,
        error: "Email não cadastrado no Sentra Partners",
      });
    }

    console.log("[MT4 Connector] Usuário encontrado:", user.id, user.email);

    // Verificar se conta MT4 já existe
    const [existingAccount] = await db
      .select()
      .from(mt4Accounts)
      .where(
        and(
          eq(mt4Accounts.userId, user.id),
          eq(mt4Accounts.accountNumber, account_number)
        )
      )
      .limit(1);

    let apiKey: string;

    if (existingAccount) {
      // Conta já existe, retornar API Key existente
      apiKey = existingAccount.apiKey;
      console.log("[MT4 Connector] Conta MT4 já existe, retornando API Key existente");

      // Atualizar última conexão
      await db
        .update(mt4Accounts)
        .set({
          lastConnected: new Date(),
          broker,
          accountType: account_type,
        })
        .where(eq(mt4Accounts.id, existingAccount.id));
    } else {
      // Criar nova conta MT4
      apiKey = crypto.randomBytes(32).toString("hex");

      await db.insert(mt4Accounts).values({
        userId: user.id,
        accountNumber: account_number,
        accountName: account_name || `MT4 ${account_number}`,
        broker: broker || "Unknown",
        accountType: account_type,
        apiKey,
        isActive: true,
        lastConnected: new Date(),
      });

      console.log("[MT4 Connector] Nova conta MT4 criada com API Key");
    }

    console.log("[MT4 Connector] ✅ Autenticação bem-sucedida!");

    return res.status(200).json({
      success: true,
      apiKey,
      message: "Autenticação bem-sucedida",
    });
  } catch (error: any) {
    console.error("[MT4 Connector] Erro na autenticação:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

// Rota para receber trades do EA
router.post("/trades", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[MT4 Connector] Authorization header ausente ou inválido");
      return res.status(401).json({
        success: false,
        error: "Authorization header ausente ou inválido",
      });
    }

    const apiKey = authHeader.substring(7); // Remove "Bearer "

    const db = await getDb();

    // Buscar conta MT4 pela API Key
    const [mt4Account] = await db
      .select()
      .from(mt4Accounts)
      .where(eq(mt4Accounts.apiKey, apiKey))
      .limit(1);

    if (!mt4Account) {
      console.log("[MT4 Connector] API Key inválida");
      return res.status(401).json({
        success: false,
        error: "API Key inválida",
      });
    }

    console.log("[MT4 Connector] Conta MT4 autenticada:", mt4Account.accountNumber);

    const {
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
      account,
    } = req.body;

    // Validar campos obrigatórios
    if (
      ticket === undefined ||
      !symbol ||
      type === undefined ||
      lots === undefined ||
      open_price === undefined ||
      !open_time
    ) {
      console.log("[MT4 Connector] Campos obrigatórios do trade faltando");
      return res.status(400).json({
        success: false,
        error: "Campos obrigatórios do trade faltando",
      });
    }

    // Verificar se trade já existe
    const [existingTrade] = await db
      .select()
      .from(trades)
      .where(
        and(
          eq(trades.mt4AccountId, mt4Account.id),
          eq(trades.ticket, ticket)
        )
      )
      .limit(1);

    if (existingTrade) {
      console.log("[MT4 Connector] Trade já existe, ignorando:", ticket);
      return res.status(200).json({
        success: true,
        message: "Trade já existe",
      });
    }

    // Converter preços de float para int (multiplicar por 100000)
    const openPriceInt = Math.round(open_price * 100000);
    const closePriceInt = close_price ? Math.round(close_price * 100000) : 0;
    const stopLossInt = stop_loss ? Math.round(stop_loss * 100000) : 0;
    const takeProfitInt = take_profit ? Math.round(take_profit * 100000) : 0;

    // Converter profit, commission, swap para cents
    const profitCents = Math.round(profit * 100);
    const commissionCents = Math.round((commission || 0) * 100);
    const swapCents = Math.round((swap || 0) * 100);

    // Converter lots para int (multiplicar por 100)
    const volumeInt = Math.round(lots * 100);

    // Converter datas
    const openTimeDate = new Date(open_time.replace(" ", "T") + "Z");
    const closeTimeDate = close_time
      ? new Date(close_time.replace(" ", "T") + "Z")
      : null;

    // Inserir trade no banco
    await db.insert(trades).values({
      mt4AccountId: mt4Account.id,
      ticket,
      symbol,
      type: type === 0 ? "BUY" : "SELL",
      volume: volumeInt,
      openPrice: openPriceInt,
      openTime: openTimeDate,
      closePrice: closePriceInt,
      closeTime: closeTimeDate,
      stopLoss: stopLossInt,
      takeProfit: takeProfitInt,
      profit: profitCents,
      commission: commissionCents,
      swap: swapCents,
      comment: comment || "",
      magicNumber: magic_number || 0,
      status: close_time ? "CLOSED" : "OPEN",
    });

    console.log("[MT4 Connector] ✅ Trade salvo:", ticket, symbol, profit);

    return res.status(201).json({
      success: true,
      message: "Trade salvo com sucesso",
    });
  } catch (error: any) {
    console.error("[MT4 Connector] Erro ao salvar trade:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

// Rota de heartbeat (para verificar se EA está conectado)
router.post("/heartbeat", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authorization header ausente ou inválido",
      });
    }

    const apiKey = authHeader.substring(7);
    const db = await getDb();

    const [mt4Account] = await db
      .select()
      .from(mt4Accounts)
      .where(eq(mt4Accounts.apiKey, apiKey))
      .limit(1);

    if (!mt4Account) {
      return res.status(401).json({
        success: false,
        error: "API Key inválida",
      });
    }

    // Atualizar última conexão
    await db
      .update(mt4Accounts)
      .set({ lastConnected: new Date() })
      .where(eq(mt4Accounts.id, mt4Account.id));

    return res.status(200).json({
      success: true,
      message: "Heartbeat recebido",
    });
  } catch (error: any) {
    console.error("[MT4 Connector] Erro no heartbeat:", error);
    return res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

export default router;

