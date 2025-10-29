import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { 
  supportTickets, 
  supportMessages, 
  supportNotifications,
  users
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Support Router - Sistema de chat de suporte
 */

export const supportRouter = router({
  // Listar meus tickets
  myTickets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    return await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, ctx.user.id))
      .orderBy(desc(supportTickets.createdAt))
      .limit(10);
  }),

  // Criar novo ticket
  createTicket: protectedProcedure
    .input(z.object({
      subject: z.string(),
      message: z.string(),
      priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      // Criar ticket
      const ticketResult = await db.insert(supportTickets).values({
        userId: ctx.user.id,
        subject: input.subject,
        status: 'open',
        priority: input.priority,
        category: input.category,
        lastMessageAt: new Date(),
      });

      const ticketId = Number(ticketResult[0].insertId);

      // Criar primeira mensagem
      await db.insert(supportMessages).values({
        ticketId,
        senderId: ctx.user.id,
        senderType: 'user',
        message: input.message,
      });

      return { ticketId, success: true };
    }),

  // Listar mensagens de um ticket
  messages: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      
      // Verificar se o ticket pertence ao usuário ou se é admin/manager
      const ticket = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, input.ticketId))
        .limit(1);

      if (!ticket[0]) {
        throw new Error('Ticket não encontrado');
      }

      if (
        ticket[0].userId !== ctx.user.id &&
        ctx.user.role !== 'admin' &&
        ctx.user.role !== 'manager'
      ) {
        throw new Error('Acesso negado');
      }

      // 🔥 ATRIBUIÇÃO AUTOMÁTICA: Se admin/manager abrir ticket não atribuído
      if (
        (ctx.user.role === 'admin' || ctx.user.role === 'manager') &&
        !ticket[0].assignedTo &&
        ticket[0].status === 'open'
      ) {
        // Atribuir automaticamente
        await db
          .update(supportTickets)
          .set({ 
            assignedTo: ctx.user.id,
            status: 'in_progress',
          })
          .where(eq(supportTickets.id, input.ticketId));

        // Enviar mensagem automática ao usuário
        await db.insert(supportMessages).values({
          ticketId: input.ticketId,
          senderId: ctx.user.id,
          senderType: 'system',
          message: `${ctx.user.name || ctx.user.email} entrou na conversa e está pronto para ajudar!`,
        });

        // Notificar o usuário
        await db.insert(supportNotifications).values({
          userId: ticket[0].userId,
          ticketId: input.ticketId,
          type: 'ticket_assigned',
          message: `${ctx.user.name || ctx.user.email} foi atribuído ao seu ticket`,
        });
      }

      // Buscar mensagens com dados do remetente
      const messages = await db
        .select({
          id: supportMessages.id,
          ticketId: supportMessages.ticketId,
          senderId: supportMessages.senderId,
          senderType: supportMessages.senderType,
          message: supportMessages.message,
          attachments: supportMessages.attachments,
          isRead: supportMessages.isRead,
          readAt: supportMessages.readAt,
          createdAt: supportMessages.createdAt,
          senderName: users.name,
          senderEmail: users.email,
        })
        .from(supportMessages)
        .leftJoin(users, eq(supportMessages.senderId, users.id))
        .where(eq(supportMessages.ticketId, input.ticketId))
        .orderBy(supportMessages.createdAt);

      // Marcar mensagens como lidas
      if (ctx.user.role === 'client') {
        await db
          .update(supportMessages)
          .set({ isRead: true, readAt: new Date() })
          .where(
            and(
              eq(supportMessages.ticketId, input.ticketId),
              eq(supportMessages.senderType, 'support'),
              eq(supportMessages.isRead, false)
            )
          );
      }

      return messages;
    }),

  // Enviar mensagem
  sendMessage: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      message: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Verificar acesso ao ticket
      const ticket = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, input.ticketId))
        .limit(1);

      if (!ticket[0]) {
        throw new Error('Ticket não encontrado');
      }

      if (
        ticket[0].userId !== ctx.user.id &&
        ctx.user.role !== 'admin' &&
        ctx.user.role !== 'manager'
      ) {
        throw new Error('Acesso negado');
      }

      const senderType = ctx.user.role === 'admin' || ctx.user.role === 'manager' 
        ? 'support' 
        : 'user';

      // Criar mensagem
      await db.insert(supportMessages).values({
        ticketId: input.ticketId,
        senderId: ctx.user.id,
        senderType,
        message: input.message,
      });

      // Atualizar timestamp do ticket
      await db
        .update(supportTickets)
        .set({ 
          lastMessageAt: new Date(),
          status: senderType === 'user' ? 'waiting_support' : 'waiting_user',
        })
        .where(eq(supportTickets.id, input.ticketId));

      // Criar notificação para o outro lado
      const notifyUserId = senderType === 'user' 
        ? ticket[0].assignedTo 
        : ticket[0].userId;

      if (notifyUserId) {
        await db.insert(supportNotifications).values({
          userId: notifyUserId,
          ticketId: input.ticketId,
          type: 'new_message',
          message: `Nova mensagem no ticket #${input.ticketId}`,
        });
      }

      return { success: true };
    }),

  // Fechar ticket
  closeTicket: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Verificar acesso
      const ticket = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, input.ticketId))
        .limit(1);

      if (!ticket[0]) {
        throw new Error('Ticket não encontrado');
      }

      if (
        ticket[0].userId !== ctx.user.id &&
        ctx.user.role !== 'admin' &&
        ctx.user.role !== 'manager'
      ) {
        throw new Error('Acesso negado');
      }

      // Fechar ticket
      await db
        .update(supportTickets)
        .set({ 
          status: 'closed',
          closedAt: new Date(),
        })
        .where(eq(supportTickets.id, input.ticketId));

      return { success: true };
    }),

  // Admin: Listar todos os tickets
  allTickets: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin' && ctx.user.role !== 'manager') {
      throw new Error('Acesso negado');
    }

    const db = await getDb();
    return await db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt))
      .limit(100);
  }),

  // Admin: Atribuir ticket
  assignTicket: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      assignedTo: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'manager') {
        throw new Error('Acesso negado');
      }

      const db = await getDb();
      await db
        .update(supportTickets)
        .set({ 
          assignedTo: input.assignedTo,
          status: 'in_progress',
        })
        .where(eq(supportTickets.id, input.ticketId));

      return { success: true };
    }),
});

