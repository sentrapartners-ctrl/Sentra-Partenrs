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
    .query(async ({ ctx, input }) => {
      const { hasDataAccess } = await import('./middleware/access-control');
      const canAccess = await hasDataAccess(ctx.user.id);
      if (!canAccess) return [];
      return await analyticsDb.getMonthlyGrowth(input.accountId, input.year);
    }),

  /**
   * Retorna histórico de drawdown
   */
  getDrawdownHistory: protectedProcedure
    .input(z.object({ 
      accountId: z.number() 
    }))
    .query(async ({ ctx, input }) => {
      const { hasDataAccess } = await import('./middleware/access-control');
      const canAccess = await hasDataAccess(ctx.user.id);
      if (!canAccess) return [];
      return await analyticsDb.getDrawdownHistory(input.accountId);
    }),

  /**
   * Retorna métricas de risco avançadas
   */
  getRiskMetrics: protectedProcedure
    .input(z.object({ 
      accountId: z.number() 
    }))
    .query(async ({ ctx, input }) => {
      const { hasDataAccess } = await import('./middleware/access-control');
      const canAccess = await hasDataAccess(ctx.user.id);
      if (!canAccess) return null;
      return await analyticsDb.getRiskMetrics(input.accountId);
    }),

  /**
   * Retorna estatísticas de trades consecutivos
   */
  getConsecutiveStats: protectedProcedure
    .input(z.object({ 
      accountId: z.number() 
    }))
    .query(async ({ ctx, input }) => {
      const { hasDataAccess } = await import('./middleware/access-control');
      const canAccess = await hasDataAccess(ctx.user.id);
      if (!canAccess) return null;
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
  getProfitLossBreakdown: protectedProcedure
    .input(z.object({ 
      accountId: z.number()
    }))
    .query(async ({ input }) => {
      return await analyticsDb.getProfitLossBreakdown(input.accountId);
    }),
});

