import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import * as db from "./db";
import { subscriptionPlans, eaProducts, vpsProducts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Admin Router - Gerenciamento completo do sistema
 * Apenas usuários com role 'admin' podem acessar
 */

const adminProcedure = protectedProcedure.use(async (opts) => {
  if (opts.ctx.user.role !== 'admin') {
    throw new Error('Acesso negado. Apenas administradores podem acessar esta funcionalidade.');
  }
  return opts.next();
});

export const adminRouter = router({
  // ===== USER MANAGEMENT =====
  listUsers: adminProcedure.query(async () => {
    return await db.getAllUsers();
  }),

  listAllAccounts: adminProcedure.query(async () => {
    return await db.getAllAccounts();
  }),

  getSystemStats: adminProcedure.query(async () => {
    return await db.getSystemStats();
  }),

  toggleUserStatus: adminProcedure
    .input(z.object({ userId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.updateUserStatus(input.userId, input.isActive);
      return { success: true };
    }),

  updateUser: adminProcedure
    .input(z.object({ 
      userId: z.number(), 
      email: z.string().email().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.updateUser(input.userId, input);
      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteUser(input.userId);
      return { success: true };
    }),

  updateAccount: adminProcedure
    .input(z.object({ 
      accountId: z.number(), 
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      await db.updateAccount(input.accountId, input);
      return { success: true };
    }),

  deleteAccount: adminProcedure
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteAccount(input.accountId);
      return { success: true };
    }),

  // ===== SUBSCRIPTION PLANS =====
  subscriptionPlans: router({
    list: adminProcedure.query(async () => {
      const database = getDb();
      return await database.select().from(subscriptionPlans);
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = getDb();
        const plans = await database.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, input.id));
        return plans[0] || null;
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        priceMonthly: z.number(),
        priceQuarterly: z.number().optional(),
        priceSemestral: z.number().optional(),
        priceYearly: z.number().optional(),
        priceLifetime: z.number().optional(),
        features: z.string().optional(),
        maxAccounts: z.number().default(1),
        copyTradingEnabled: z.boolean().default(false),
        advancedAnalyticsEnabled: z.boolean().default(false),
        freeVpsEnabled: z.boolean().default(false),
        prioritySupport: z.boolean().default(false),
        isActive: z.boolean().default(true),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const database = getDb();
        const result = await database.insert(subscriptionPlans).values(input);
        return { id: Number(result[0].insertId), success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        priceMonthly: z.number().optional(),
        priceQuarterly: z.number().optional(),
        priceSemestral: z.number().optional(),
        priceYearly: z.number().optional(),
        priceLifetime: z.number().optional(),
        features: z.string().optional(),
        maxAccounts: z.number().optional(),
        copyTradingEnabled: z.boolean().optional(),
        advancedAnalyticsEnabled: z.boolean().optional(),
        freeVpsEnabled: z.boolean().optional(),
        prioritySupport: z.boolean().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = getDb();
        const { id, ...data } = input;
        await database.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id));
        return { success: true };
      }),

    updatePrice: adminProcedure
      .input(z.object({
        id: z.number(),
        priceMonthly: z.number().optional(),
        priceQuarterly: z.number().optional(),
        priceSemestral: z.number().optional(),
        priceYearly: z.number().optional(),
        priceLifetime: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = getDb();
        const { id, ...prices } = input;
        await database.update(subscriptionPlans).set(prices).where(eq(subscriptionPlans.id, id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = getDb();
        await database.delete(subscriptionPlans).where(eq(subscriptionPlans.id, input.id));
        return { success: true };
      }),
  }),

  // ===== EA PRODUCTS =====
  eaProducts: router({
    list: adminProcedure.query(async () => {
      const database = getDb();
      return await database.select().from(eaProducts);
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = getDb();
        const products = await database.select().from(eaProducts).where(eq(eaProducts.id, input.id));
        return products[0] || null;
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        longDescription: z.string().optional(),
        platform: z.enum(['MT4', 'MT5', 'BOTH']),
        price: z.number(),
        licenseType: z.enum(['single', 'unlimited', 'rental']).default('single'),
        rentalPeriod: z.number().default(0),
        features: z.string().optional(),
        strategy: z.string().optional(),
        backtestResults: z.string().optional(),
        fileUrl: z.string().optional(),
        version: z.string().optional(),
        imageUrl: z.string().optional(),
        demoUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        isAvailable: z.boolean().default(true),
        isExclusive: z.boolean().default(false),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const database = getDb();
        const result = await database.insert(eaProducts).values(input);
        return { id: Number(result[0].insertId), success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        longDescription: z.string().optional(),
        platform: z.enum(['MT4', 'MT5', 'BOTH']).optional(),
        price: z.number().optional(),
        licenseType: z.enum(['single', 'unlimited', 'rental']).optional(),
        rentalPeriod: z.number().optional(),
        features: z.string().optional(),
        strategy: z.string().optional(),
        backtestResults: z.string().optional(),
        fileUrl: z.string().optional(),
        version: z.string().optional(),
        imageUrl: z.string().optional(),
        demoUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        isAvailable: z.boolean().optional(),
        isExclusive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = getDb();
        const { id, ...data } = input;
        await database.update(eaProducts).set(data).where(eq(eaProducts.id, id));
        return { success: true };
      }),

    updatePrice: adminProcedure
      .input(z.object({
        id: z.number(),
        price: z.number(),
      }))
      .mutation(async ({ input }) => {
        const database = getDb();
        await database.update(eaProducts).set({ price: input.price }).where(eq(eaProducts.id, input.id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = getDb();
        await database.delete(eaProducts).where(eq(eaProducts.id, input.id));
        return { success: true };
      }),
  }),

  // ===== VPS PRODUCTS =====
  vpsProducts: router({
    list: adminProcedure.query(async () => {
      const database = getDb();
      return await database.select().from(vpsProducts);
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = getDb();
        const products = await database.select().from(vpsProducts).where(eq(vpsProducts.id, input.id));
        return products[0] || null;
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        specifications: z.string().optional(),
        price: z.number(),
        billingCycle: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
        location: z.string().optional(),
        provider: z.string().optional(),
        maxMt4Instances: z.number().default(1),
        maxMt5Instances: z.number().default(1),
        setupFee: z.number().default(0),
        isAvailable: z.boolean().default(true),
        stockQuantity: z.number().default(0),
        imageUrl: z.string().optional(),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const database = getDb();
        const result = await database.insert(vpsProducts).values(input);
        return { id: Number(result[0].insertId), success: true };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        specifications: z.string().optional(),
        price: z.number().optional(),
        billingCycle: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
        location: z.string().optional(),
        provider: z.string().optional(),
        maxMt4Instances: z.number().optional(),
        maxMt5Instances: z.number().optional(),
        setupFee: z.number().optional(),
        isAvailable: z.boolean().optional(),
        stockQuantity: z.number().optional(),
        imageUrl: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = getDb();
        const { id, ...data } = input;
        await database.update(vpsProducts).set(data).where(eq(vpsProducts.id, id));
        return { success: true };
      }),

    updatePrice: adminProcedure
      .input(z.object({
        id: z.number(),
        price: z.number(),
        setupFee: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const database = getDb();
        const { id, ...prices } = input;
        await database.update(vpsProducts).set(prices).where(eq(vpsProducts.id, id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = getDb();
        await database.delete(vpsProducts).where(eq(vpsProducts.id, input.id));
        return { success: true };
      }),
  }),
});

