import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import * as db from "./db";
import { subscriptionPlans, eaProducts, vpsProducts, clientTransferHistory, users, supportTickets, supportMessages } from "../drizzle/schema";
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
  // ===== SUPPORT MANAGEMENT =====
  getAllTickets: adminProcedure.query(async () => {
    const database = await getDb();
    return await database.select().from(supportTickets).orderBy(supportTickets.createdAt);
  }),

  updateTicketStatus: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      status: z.enum(['open', 'in_progress', 'waiting_user', 'waiting_support', 'resolved', 'closed']),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      await database.update(supportTickets)
        .set({ status: input.status })
        .where(eq(supportTickets.id, input.ticketId));
      return { success: true };
    }),

  assignTicket: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      adminId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      await database.update(supportTickets)
        .set({ assignedTo: input.adminId })
        .where(eq(supportTickets.id, input.ticketId));
      return { success: true };
    }),


  // ===== USER MANAGEMENT =====
  listUsers: adminProcedure.query(async () => {
    return await db.getAllUsers();
  }),

  listAllAccounts: adminProcedure.query(async () => {
    return await db.getAllAccounts();
  }),

  listAccounts: adminProcedure.query(async () => {
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

  toggleAccountActive: adminProcedure
    .input(z.object({ accountId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.updateAccount(input.accountId, { isActive: input.isActive });
      return { success: true };
    }),

  deleteAccount: adminProcedure
    .input(z.object({ accountId: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteAccount(input.accountId);
      return { success: true };
    }),

  // Transferir cliente entre gerentes
  transferClient: adminProcedure
    .input(z.object({
      clientId: z.number(),
      toManagerId: z.number(),
      reason: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();

      // Buscar cliente atual
      const client = await database.select().from(users).where(eq(users.id, input.clientId)).limit(1);
      if (!client[0]) {
        throw new Error('Cliente não encontrado');
      }

      if (client[0].role !== 'client') {
        throw new Error('Usuário não é um cliente');
      }

      // Verificar se o novo gerente existe
      const newManager = await database.select().from(users).where(eq(users.id, input.toManagerId)).limit(1);
      if (!newManager[0]) {
        throw new Error('Gerente de destino não encontrado');
      }

      if (newManager[0].role !== 'manager' && newManager[0].role !== 'admin') {
        throw new Error('Usuário de destino não é um gerente');
      }

      const fromManagerId = client[0].managerId;

      // Registrar transferência no histórico
      await database.insert(clientTransferHistory).values({
        clientId: input.clientId,
        fromManagerId,
        toManagerId: input.toManagerId,
        transferredBy: ctx.user.id,
        reason: input.reason,
        notes: input.notes,
      });

      // Atualizar managerId do cliente
      await database.update(users).set({ managerId: input.toManagerId }).where(eq(users.id, input.clientId));

      return { success: true, fromManagerId, toManagerId: input.toManagerId };
    }),

  // Listar histórico de transferências
  transferHistory: adminProcedure
    .input(z.object({ clientId: z.number().optional() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (input.clientId) {
        return await database.select().from(clientTransferHistory).where(eq(clientTransferHistory.clientId, input.clientId));
      }
      return await database.select().from(clientTransferHistory).limit(100);
    }),

  // ===== SUBSCRIPTION PLANS =====
  subscriptionPlans: router({
    list: adminProcedure.query(async () => {
      const database = await getDb();
      return await database.select().from(subscriptionPlans);
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
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
        const database = await getDb();
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
        const database = await getDb();
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
        const database = await getDb();
        const { id, ...prices } = input;
        await database.update(subscriptionPlans).set(prices).where(eq(subscriptionPlans.id, id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        await database.delete(subscriptionPlans).where(eq(subscriptionPlans.id, input.id));
        return { success: true };
      }),
  }),

  // ===== EA PRODUCTS =====
  eaProducts: router({
    list: adminProcedure.query(async () => {
      const database = await getDb();
      return await database.select().from(eaProducts);
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
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
        const database = await getDb();
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
        const database = await getDb();
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
        const database = await getDb();
        await database.update(eaProducts).set({ price: input.price }).where(eq(eaProducts.id, input.id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        await database.delete(eaProducts).where(eq(eaProducts.id, input.id));
        return { success: true };
      }),
  }),

  // ===== VPS PRODUCTS =====
  vpsProducts: router({
    list: adminProcedure.query(async () => {
      const database = await getDb();
      return await database.select().from(vpsProducts);
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
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
        const database = await getDb();
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
        const database = await getDb();
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
        const database = await getDb();
        const { id, ...prices } = input;
        await database.update(vpsProducts).set(prices).where(eq(vpsProducts.id, id));
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        await database.delete(vpsProducts).where(eq(vpsProducts.id, input.id));
        return { success: true };
      }),
  }),
});

