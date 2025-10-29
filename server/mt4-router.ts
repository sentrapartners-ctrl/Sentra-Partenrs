import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

/**
 * Router para integração com MT4/MT5 via Expert Advisor
 * Usa email do usuário para autenticação
 */
export const mt4Router = router({
  /**
   * Sincronizar dados da conta MT4/MT5
   */
  syncAccount: publicProcedure
    .input(z.object({
      email: z.string().email(),
      accountNumber: z.string(),
      broker: z.string(),
      server: z.string().optional(),
      platform: z.enum(["MT4", "MT5"]).default("MT4"),
      accountType: z.enum(["DEMO", "REAL", "CENT"]).default("REAL"),
      balance: z.number(),
      equity: z.number(),
      margin: z.number().optional(),
      marginFree: z.number().optional(),
      marginLevel: z.number().optional(),
      leverage: z.number().optional(),
      openPositions: z.number().optional(),
      currency: z.string().default("USD"),
    }))
    .mutation(async ({ input }) => {
      try {
        // Buscar usuário pelo email
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error("Usuário não encontrado com este email");
        }

        // Verificar se a conta já existe
        let account = await db.getAccountByNumberAndUser(input.accountNumber, user.id);

        if (account) {
          // Atualizar conta existente
          await db.updateTradingAccount(account.id, {
            balance: Math.round(input.balance * 100), // Converter para centavos
            equity: Math.round(input.equity * 100),
            margin: input.margin ? Math.round(input.margin * 100) : undefined,
            marginFree: input.marginFree ? Math.round(input.marginFree * 100) : undefined,
            marginLevel: input.marginLevel,
            openPositions: input.openPositions,
            status: "connected",
            lastHeartbeat: new Date(),
          });
        } else {
          // Criar nova conta
          const accountId = await db.createTradingAccount({
            userId: user.id,
            accountNumber: input.accountNumber,
            broker: input.broker,
            server: input.server,
            platform: input.platform,
            accountType: input.accountType,
            isCentAccount: input.accountType === "CENT",
            balance: Math.round(input.balance * 100),
            equity: Math.round(input.equity * 100),
            margin: input.margin ? Math.round(input.margin * 100) : 0,
            marginFree: input.marginFree ? Math.round(input.marginFree * 100) : 0,
            marginLevel: input.marginLevel || 0,
            leverage: input.leverage || 100,
            openPositions: input.openPositions || 0,
            currency: input.currency,
            status: "connected",
            lastHeartbeat: new Date(),
          });

          account = await db.getTradingAccount(accountId);
        }

        // Registrar histórico de saldo
        if (account) {
          await db.createBalanceHistory({
            accountId: account.id,
            userId: user.id,
            balance: Math.round(input.balance * 100),
            equity: Math.round(input.equity * 100),
            timestamp: new Date(),
          });
        }

        return { success: true, accountId: account?.id };
      } catch (error) {
        console.error("[MT4] Error syncing account:", error);
        throw new Error(`Falha ao sincronizar conta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }),

  /**
   * Sincronizar trade individual
   */
  syncTrade: publicProcedure
    .input(z.object({
      email: z.string().email(),
      accountNumber: z.string(),
      ticket: z.number(),
      symbol: z.string(),
      type: z.enum(["BUY", "SELL"]),
      volume: z.number(),
      openPrice: z.number(),
      openTime: z.string(),
      closePrice: z.number().optional(),
      closeTime: z.string().optional(),
      stopLoss: z.number().optional(),
      takeProfit: z.number().optional(),
      profit: z.number(),
      commission: z.number().optional(),
      swap: z.number().optional(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Buscar usuário pelo email
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error("Usuário não encontrado com este email");
        }

        // Buscar conta
        const account = await db.getAccountByNumberAndUser(input.accountNumber, user.id);
        if (!account) {
          throw new Error("Conta não encontrada");
        }

        // Criar ou atualizar trade
        await db.createOrUpdateTrade({
          userId: user.id,
          accountId: account.id,
          ticket: input.ticket,
          symbol: input.symbol,
          type: input.type,
          volume: input.volume,
          openPrice: Math.round(input.openPrice * 100000), // 5 casas decimais
          openTime: new Date(input.openTime),
          closePrice: input.closePrice ? Math.round(input.closePrice * 100000) : undefined,
          closeTime: input.closeTime ? new Date(input.closeTime) : undefined,
          stopLoss: input.stopLoss ? Math.round(input.stopLoss * 100000) : undefined,
          takeProfit: input.takeProfit ? Math.round(input.takeProfit * 100000) : undefined,
          profit: Math.round(input.profit), // Já vem em centavos do MT4
          commission: input.commission ? Math.round(input.commission) : undefined,
          swap: input.swap ? Math.round(input.swap) : undefined,
          comment: input.comment,
          status: input.closeTime ? "closed" : "open",
        });

        return { success: true };
      } catch (error) {
        console.error("[MT4] Error syncing trade:", error);
        throw new Error(`Falha ao sincronizar trade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }),

  /**
   * Ping para verificar conexão
   */
  ping: publicProcedure
    .input(z.object({
      email: z.string().email(),
      accountNumber: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error("Usuário não encontrado");
        }

        const account = await db.getAccountByNumberAndUser(input.accountNumber, user.id);
        if (!account) {
          throw new Error("Conta não encontrada");
        }

        await db.updateAccountHeartbeat(account.id);

        return { success: true, message: "Conexão ativa" };
      } catch (error) {
        console.error("[MT4] Ping error:", error);
        throw new Error(`Falha no ping: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }),
});
