import { protectedProcedure, router } from "./_core/trpc";
import * as analyticsDb from "./analytics-db";
import { z } from "zod";

export const analyticsRouter = router({
  /**
   * Retorna crescimento mensal percentual
   */
  getMonthlyGrowth: protectedProcedure
    .input(z.object({ 
      accountId: z.number(), 
      year: z.number() 
    }))
    .query(async ({ input }) => {
      return await analyticsDb.getMonthlyGrowth(input.accountId, input.year);
    }),

  /**
   * Retorna histórico de drawdown
   */
  getDrawdownHistory: protectedProcedure
    .input(z.object({ 
      accountId: z.number() 
    }))
    .query(async ({ input }) => {
      return await analyticsDb.getDrawdownHistory(input.accountId);
    }),

  /**
   * Retorna métricas de risco avançadas
   */
  getRiskMetrics: protectedProcedure
    .input(z.object({ 
      accountId: z.number() 
    }))
    .query(async ({ input }) => {
      const profitFactor = await analyticsDb.getProfitFactor(input.accountId);
      const sharpRatio = await analyticsDb.getSharpRatio(input.accountId);
      const recoveryFactor = await analyticsDb.getRecoveryFactor(input.accountId);
      const riskMetrics = await analyticsDb.getRiskMetrics(input.accountId);

      return {
        profitFactor,
        sharpRatio,
        recoveryFactor,
        ...riskMetrics,
      };
    }),

  /**
   * Retorna estatísticas de trades consecutivos
   */
  getConsecutiveStats: protectedProcedure
    .input(z.object({ 
      accountId: z.number() 
    }))
    .query(async ({ input }) => {
      return await analyticsDb.getConsecutiveStats(input.accountId);
    }),

  /**
   * Retorna performance por dia da semana
   */
  getWeeklyPerformance: protectedProcedure
    .input(z.object({ 
      accountId: z.number() 
    }))
    .query(async ({ input }) => {
      return await analyticsDb.getWeeklyPerformance(input.accountId);
    }),

  /**
   * Retorna distribuição de trades por origem
   */
  getTradesByOrigin: protectedProcedure
    .input(z.object({ 
      accountId: z.number() 
    }))
    .query(async ({ input }) => {
      return await analyticsDb.getTradesByOrigin(input.accountId);
    }),

  /**
   * Retorna análise de Profit & Loss
   */
  getProfitLossAnalysis: protectedProcedure
    .input(z.object({ 
      accountId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      return await analyticsDb.getProfitLossAnalysis(
        input.accountId, 
        input.startDate, 
        input.endDate
      );
    }),
});

