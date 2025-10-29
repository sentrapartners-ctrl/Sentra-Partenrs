import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { notifications } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const notificationsRouter = router({
  // Listar notificações do usuário
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
      
      return userNotifications;
    }),

  // Marcar notificação como lida
  markAsRead: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      await db
        .update(notifications)
        .set({ 
          read: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.user.id)
          )
        );
      
      return { success: true };
    }),

  // Marcar todas como lidas
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      
      await db
        .update(notifications)
        .set({ 
          read: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.read, false)
          )
        );
      
      return { success: true };
    }),

  // Criar notificação (admin ou sistema)
  create: protectedProcedure
    .input(z.object({
      userId: z.number(),
      type: z.enum(["trade", "account", "alert", "system", "support"]),
      title: z.string(),
      message: z.string(),
      metadata: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      const [notification] = await db
        .insert(notifications)
        .values({
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          metadata: input.metadata,
        });
      
      return notification;
    }),

  // Deletar notificação
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.user.id)
          )
        );
      
      return { success: true };
    }),

  // Contar notificações não lidas
  unreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      
      const result = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.read, false)
          )
        );
      
      return { count: result.length };
    }),
});
