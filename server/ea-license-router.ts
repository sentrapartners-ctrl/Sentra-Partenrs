import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { eaLicenses, eaLicenseUsageLogs } from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export const eaLicenseRouter = router({
  /**
   * Listar todas as licenças (apenas admin)
   */
  list: adminProcedure
    .input(z.object({
      isActive: z.boolean().optional(),
      eaType: z.enum(["master", "slave", "both"]).optional(),
      expiringIn: z.number().optional(), // Dias
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(eaLicenses);

      // Aplicar filtros
      const conditions = [];
      
      if (input?.isActive !== undefined) {
        conditions.push(eq(eaLicenses.isActive, input.isActive));
      }
      
      if (input?.eaType) {
        conditions.push(eq(eaLicenses.eaType, input.eaType));
      }
      
      if (input?.expiringIn) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + input.expiringIn);
        conditions.push(
          and(
            gte(eaLicenses.expiryDate, new Date()),
            lte(eaLicenses.expiryDate, futureDate)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const licenses = await query.orderBy(desc(eaLicenses.createdAt));

      // Calcular dias restantes para cada licença
      const now = new Date();
      const licensesWithDays = licenses.map(license => ({
        ...license,
        daysRemaining: Math.ceil(
          (new Date(license.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));

      return licensesWithDays;
    }),

  /**
   * Obter licença por ID
   */
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const licenses = await db
        .select()
        .from(eaLicenses)
        .where(eq(eaLicenses.id, input.id))
        .limit(1);

      if (licenses.length === 0) {
        throw new Error("License not found");
      }

      return licenses[0];
    }),

  /**
   * Criar nova licença
   */
  create: adminProcedure
    .input(z.object({
      userId: z.number(),
      accountNumber: z.string(),
      eaType: z.enum(["master", "slave", "both"]),
      expiryDate: z.string(), // ISO date string
      maxSlaves: z.number().default(0),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verificar se já existe licença para esta conta
      const existing = await db
        .select()
        .from(eaLicenses)
        .where(eq(eaLicenses.accountNumber, input.accountNumber))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("License already exists for this account number");
      }

      const result = await db.insert(eaLicenses).values({
        userId: input.userId,
        accountNumber: input.accountNumber,
        eaType: input.eaType,
        expiryDate: new Date(input.expiryDate),
        isActive: true,
        maxSlaves: input.maxSlaves,
        notes: input.notes || null,
        createdBy: ctx.user?.id || null,
      });

      return {
        success: true,
        id: Number(result.insertId),
      };
    }),

  /**
   * Atualizar licença existente
   */
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      eaType: z.enum(["master", "slave", "both"]).optional(),
      expiryDate: z.string().optional(), // ISO date string
      isActive: z.boolean().optional(),
      maxSlaves: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};

      if (input.eaType !== undefined) updateData.eaType = input.eaType;
      if (input.expiryDate !== undefined) updateData.expiryDate = new Date(input.expiryDate);
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.maxSlaves !== undefined) updateData.maxSlaves = input.maxSlaves;
      if (input.notes !== undefined) updateData.notes = input.notes;

      await db
        .update(eaLicenses)
        .set(updateData)
        .where(eq(eaLicenses.id, input.id));

      return { success: true };
    }),

  /**
   * Desativar licença
   */
  deactivate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(eaLicenses)
        .set({ isActive: false })
        .where(eq(eaLicenses.id, input.id));

      return { success: true };
    }),

  /**
   * Ativar licença
   */
  activate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(eaLicenses)
        .set({ isActive: true })
        .where(eq(eaLicenses.id, input.id));

      return { success: true };
    }),

  /**
   * Renovar licença (estender por X dias)
   */
  renew: adminProcedure
    .input(z.object({
      id: z.number(),
      days: z.number().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Buscar licença atual
      const licenses = await db
        .select()
        .from(eaLicenses)
        .where(eq(eaLicenses.id, input.id))
        .limit(1);

      if (licenses.length === 0) {
        throw new Error("License not found");
      }

      const license = licenses[0];
      const currentExpiry = new Date(license.expiryDate);
      const now = new Date();

      // Se já expirou, renovar a partir de hoje
      // Se ainda não expirou, renovar a partir da data de expiração atual
      const baseDate = currentExpiry > now ? currentExpiry : now;
      
      const newExpiry = new Date(baseDate);
      newExpiry.setDate(newExpiry.getDate() + input.days);

      await db
        .update(eaLicenses)
        .set({ 
          expiryDate: newExpiry,
          isActive: true // Reativar se estava desativada
        })
        .where(eq(eaLicenses.id, input.id));

      return { 
        success: true,
        newExpiryDate: newExpiry.toISOString()
      };
    }),

  /**
   * Deletar licença
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(eaLicenses)
        .where(eq(eaLicenses.id, input.id));

      return { success: true };
    }),

  /**
   * Obter logs de uso de uma licença
   */
  getLogs: adminProcedure
    .input(z.object({
      licenseId: z.number().optional(),
      accountNumber: z.string().optional(),
      limit: z.number().default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(eaLicenseUsageLogs);

      const conditions = [];
      
      if (input.licenseId) {
        conditions.push(eq(eaLicenseUsageLogs.licenseId, input.licenseId));
      }
      
      if (input.accountNumber) {
        conditions.push(eq(eaLicenseUsageLogs.accountNumber, input.accountNumber));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const logs = await query
        .orderBy(desc(eaLicenseUsageLogs.createdAt))
        .limit(input.limit);

      return logs;
    }),

  /**
   * Estatísticas de licenças
   */
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    // Total de licenças ativas
    const activeLicenses = await db
      .select()
      .from(eaLicenses)
      .where(eq(eaLicenses.isActive, true));

    // Licenças expiradas
    const expiredLicenses = await db
      .select()
      .from(eaLicenses)
      .where(
        and(
          eq(eaLicenses.isActive, true),
          lte(eaLicenses.expiryDate, now)
        )
      );

    // Licenças expirando em 7 dias
    const expiringIn7Days = await db
      .select()
      .from(eaLicenses)
      .where(
        and(
          eq(eaLicenses.isActive, true),
          gte(eaLicenses.expiryDate, now),
          lte(eaLicenses.expiryDate, in7Days)
        )
      );

    // Licenças expirando em 30 dias
    const expiringIn30Days = await db
      .select()
      .from(eaLicenses)
      .where(
        and(
          eq(eaLicenses.isActive, true),
          gte(eaLicenses.expiryDate, now),
          lte(eaLicenses.expiryDate, in30Days)
        )
      );

    return {
      total: activeLicenses.length,
      expired: expiredLicenses.length,
      expiringIn7Days: expiringIn7Days.length,
      expiringIn30Days: expiringIn30Days.length,
      byType: {
        master: activeLicenses.filter(l => l.eaType === "master").length,
        slave: activeLicenses.filter(l => l.eaType === "slave").length,
        both: activeLicenses.filter(l => l.eaType === "both").length,
      },
    };
  }),
});

