import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// Middleware para validar API Key
const validateApiKey = async (apiKey: string) => {
  const key = await db.getApiKeyByKey(apiKey);
  
  if (!key) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid API key",
    });
  }
  
  if (!key.isActive) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "API key is inactive",
    });
  }
  
  // Atualizar lastUsedAt
  await db.updateApiKeyLastUsed(key.id);
  
  return key;
};

export const mt4Router = router({
  // Sincronizar dados da conta MT4
  syncAccount: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      accountNumber: z.string(),
      broker: z.string(),
      server: z.string(),
      platform: z.enum(["MT4", "MT5"]),
      accountType: z.enum(["DEMO", "REAL", "CENT"]),
      balance: z.number(),
      equity: z.number(),
      margin: z.number().optional(),
      marginFree: z.number().optional(),
      marginLevel: z.number().optional(),
      marginUsed: z.number().optional(),
      leverage: z.number().optional(),
      openPositions: z.number().optional(),
      currency: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const key = await validateApiKey(input.apiKey);
      
      // Verificar se a conta já existe
      let account = await db.getAccountByNumber(input.accountNumber, key.userId);
      
      const isCentAccount = input.accountType === "CENT";
      
      if (account) {
        // Atualizar conta existente
        await db.updateTradingAccount(account.id, {
          balance: input.balance,
          equity: input.equity,
          margin: input.margin,
          marginFree: input.marginFree,
          marginLevel: input.marginLevel,
          marginUsed: input.marginUsed,
          leverage: input.leverage,
          openPositions: input.openPositions,
          status: "connected",
          lastUpdate: new Date(),
        });
        
        return {
          success: true,
          accountId: account.id,
          message: "Account updated successfully",
        };
      } else {
        // Criar nova conta
        const accountId = await db.createTradingAccount({
          userId: key.userId,
          accountNumber: input.accountNumber,
          broker: input.broker,
          server: input.server,
          platform: input.platform,
          accountType: input.accountType,
          balance: input.balance,
          equity: input.equity,
          margin: input.margin,
          marginFree: input.marginFree,
          marginLevel: input.marginLevel,
          marginUsed: input.marginUsed,
          leverage: input.leverage,
          openPositions: input.openPositions,
          currency: input.currency || "USD",
          status: "connected",
          isCentAccount,
        });
        
        return {
          success: true,
          accountId,
          message: "Account created successfully",
        };
      }
    }),

  // Sincronizar trades
  syncTrade: publicProcedure
    .input(z.object({
      apiKey: z.string(),
      accountNumber: z.string(),
      ticket: z.number(),
      symbol: z.string(),
      type: z.enum(["BUY", "SELL"]),
      volume: z.number(),
      openPrice: z.number(),
      openTime: z.date(),
      closePrice: z.number().optional(),
      closeTime: z.date().optional(),
      stopLoss: z.number().optional(),
      takeProfit: z.number().optional(),
      profit: z.number().optional(),
      commission: z.number().optional(),
      swap: z.number().optional(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const key = await validateApiKey(input.apiKey);
      
      // Buscar conta
      const account = await db.getAccountByNumber(input.accountNumber, key.userId);
      
      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }
      
      // Determinar status do trade
      const status = input.closeTime ? "closed" : "open";
      
      // Criar ou atualizar trade
      const tradeId = await db.createOrUpdateTrade({
        userId: key.userId,
        accountId: account.id,
        ticket: input.ticket,
        symbol: input.symbol,
        type: input.type,
        volume: input.volume,
        openPrice: input.openPrice,
        openTime: input.openTime,
        closePrice: input.closePrice,
        closeTime: input.closeTime,
        stopLoss: input.stopLoss,
        takeProfit: input.takeProfit,
        profit: input.profit,
        commission: input.commission,
        swap: input.swap,
        comment: input.comment,
        status,
      });
      
      return {
        success: true,
        tradeId,
        message: "Trade synced successfully",
      };
    }),

  // Ping para verificar conexão
  ping: publicProcedure
    .input(z.object({
      apiKey: z.string(),
    }))
    .query(async ({ input }) => {
      const key = await validateApiKey(input.apiKey);
      
      return {
        success: true,
        message: "Connection OK",
        userId: key.userId,
      };
    }),
});
