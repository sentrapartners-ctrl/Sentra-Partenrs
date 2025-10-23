import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getForexFactoryEvents } from "./forex-calendar";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ===== DASHBOARD =====
  dashboard: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const summary = await db.getAccountSummary(ctx.user.id);
      const stats = await db.getTradeStatistics(ctx.user.id);
      const openTrades = await db.getOpenTrades(ctx.user.id);
      const recentTrades = await db.getUserTrades(ctx.user.id, 10);
      
      return {
        summary,
        stats,
        openTrades,
        recentTrades,
      };
    }),
  }),

  // ===== ACCOUNTS =====
  accounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAccounts(ctx.user.id);
    }),

    active: protectedProcedure.query(async ({ ctx }) => {
      return await db.getActiveAccounts(ctx.user.id);
    }),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getAccountByTerminalId(input.id.toString());
      }),

    updateClassification: protectedProcedure
      .input(z.object({
        terminalId: z.string(),
        classification: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const account = await db.getAccountByTerminalId(input.terminalId);
        if (!account || account.userId !== ctx.user.id) {
          throw new Error("Account not found or unauthorized");
        }
        
        await db.createOrUpdateAccount({
          ...account,
          classification: input.classification,
        });
        
        return { success: true };
      }),
  }),

  // ===== TRADES =====
  trades: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(100),
        accountId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (input.startDate && input.endDate) {
          return await db.getTradesByDateRange(ctx.user.id, input.startDate, input.endDate);
        }
        if (input.accountId) {
          return await db.getAccountTrades(input.accountId, input.limit);
        }
        return await db.getUserTrades(ctx.user.id, input.limit);
      }),

    open: protectedProcedure.query(async ({ ctx }) => {
      return await db.getOpenTrades(ctx.user.id);
    }),

    byDateRange: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getTradesByDateRange(ctx.user.id, input.startDate, input.endDate);
      }),

    statistics: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getTradeStatistics(ctx.user.id, input.startDate, input.endDate);
      }),
  }),

  // ===== TRADE NOTES =====
  tradeNotes: router({
    list: protectedProcedure
      .input(z.object({ tradeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTradeNotes(input.tradeId);
      }),

    create: protectedProcedure
      .input(z.object({
        tradeId: z.number(),
        note: z.string().optional(),
        tags: z.array(z.string()).optional(),
        screenshot: z.string().optional(),
        emotion: z.enum(["confident", "nervous", "greedy", "fearful", "neutral"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createTradeNote({
          ...input,
          userId: ctx.user.id,
          tags: input.tags ? JSON.stringify(input.tags) : undefined,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        note: z.string().optional(),
        tags: z.array(z.string()).optional(),
        screenshot: z.string().optional(),
        emotion: z.enum(["confident", "nervous", "greedy", "fearful", "neutral"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTradeNote(id, {
          ...data,
          tags: data.tags ? JSON.stringify(data.tags) : undefined,
        });
        return { success: true };
      }),
  }),

  // ===== STRATEGIES =====
  strategies: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserStrategies(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        rules: z.record(z.string(), z.any()).optional(),
        entryConditions: z.string().optional(),
        exitConditions: z.string().optional(),
        riskManagement: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const strategyData: any = {
          userId: ctx.user.id,
          name: input.name,
        };
        if (input.description) strategyData.description = input.description;
        if (input.rules) strategyData.rules = JSON.stringify(input.rules);
        if (input.entryConditions) strategyData.entryConditions = input.entryConditions;
        if (input.exitConditions) strategyData.exitConditions = input.exitConditions;
        if (input.riskManagement) strategyData.riskManagement = input.riskManagement;
        
        const id = await db.createStrategy(strategyData);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        rules: z.record(z.string(), z.any()).optional(),
        entryConditions: z.string().optional(),
        exitConditions: z.string().optional(),
        riskManagement: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.rules) {
          updateData.rules = JSON.stringify(data.rules);
        }
        await db.updateStrategy(id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStrategy(input.id);
        return { success: true };
      }),
  }),

  // ===== BALANCE HISTORY =====
  balanceHistory: router({
    get: protectedProcedure
      .input(z.object({
        accountId: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ ctx, input }) => {
        if (input.accountId) {
          return await db.getBalanceHistory(input.accountId, input.startDate, input.endDate);
        }
        return await db.getUserBalanceHistory(ctx.user.id, input.startDate, input.endDate);
      }),
  }),

  // ===== ECONOMIC EVENTS =====
  economicEvents: router({
    upcoming: protectedProcedure
      .input(z.object({ hours: z.number().optional().default(24) }))
      .query(async ({ input }) => {
        return await db.getUpcomingEvents(input.hours);
      }),

    byDateRange: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getEconomicEvents(input.startDate, input.endDate);
      }),
  }),

  // ===== COPY TRADING =====
  copyTrading: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserCopyConfigs(ctx.user.id);
    }),

    active: protectedProcedure.query(async ({ ctx }) => {
      return await db.getActiveCopyConfigs(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        sourceAccountId: z.number(),
        targetAccountId: z.number(),
        copyRatio: z.number().optional().default(10000), // 100.00%
        maxLotSize: z.number().optional().default(0),
        minLotSize: z.number().optional().default(0),
        stopOnDrawdown: z.number().optional().default(0),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCopyTradingConfig({
          ...input,
          userId: ctx.user.id,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        copyRatio: z.number().optional(),
        maxLotSize: z.number().optional(),
        minLotSize: z.number().optional(),
        stopOnDrawdown: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCopyConfig(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCopyConfig(input.id);
        return { success: true };
      }),
  }),

  // ===== ALERTS =====
  alerts: router({
    list: protectedProcedure
      .input(z.object({}))
      .query(async ({ ctx }) => {
        return await db.getUserAlerts(ctx.user.id);
      }),

    unread: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadAlerts(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markAlertAsRead(input.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllAlertsAsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ===== USER SETTINGS =====
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserSettings(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        theme: z.enum(["light", "dark"]).optional(),
        displayCurrency: z.string().optional(),
        dateFormat: z.string().optional(),
        timezone: z.string().optional(),
        decimalPrecision: z.number().optional(),
        heartbeatInterval: z.number().optional(),
        alertsEnabled: z.boolean().optional(),
        alertBalance: z.boolean().optional(),
        alertDrawdown: z.boolean().optional(),
        alertTrades: z.boolean().optional(),
        alertConnection: z.boolean().optional(),
        drawdownThreshold: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createOrUpdateUserSettings({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
  }),

  // ===== CALENDAR =====
  calendar: router({
    getEvents: publicProcedure.query(async (): Promise<Array<{
      date: string;
      time: string;
      country: string;
      impact: string;
      title: string;
      forecast?: string;
      previous?: string;
    }>> => {
      return await getForexFactoryEvents();
    }),
  }),
});

export type AppRouter = typeof appRouter;

