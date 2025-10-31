import { getDb } from '../db';
import { userSubscriptions, subscriptionPlans, users, tradingAccounts } from '../../drizzle/schema';
import { eq, and, lt, gte } from 'drizzle-orm';

/**
 * Serviço para gerenciar assinaturas:
 * - Verificar assinaturas expiradas
 * - Processar renovações automáticas
 * - Enviar notificações
 * - Bloquear contas de usuários sem assinatura
 */
export class SubscriptionManager {
  private db: any;

  constructor() {
    this.db = getDb();
  }

  /**
   * Verificar e processar assinaturas expiradas
   * Deve ser executado diariamente via cron
   */
  async processExpiredSubscriptions() {
    try {
      console.log('[Subscription Manager] Verificando assinaturas expiradas...');

      const now = new Date();

      // Buscar assinaturas que expiraram
      const expiredSubscriptions = await this.db
        .select({
          subscription: userSubscriptions,
          user: users,
          plan: subscriptionPlans,
        })
        .from(userSubscriptions)
        .innerJoin(users, eq(userSubscriptions.userId, users.id))
        .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(
          and(
            eq(userSubscriptions.status, 'active'),
            lt(userSubscriptions.endDate, now)
          )
        );

      console.log(`[Subscription Manager] ${expiredSubscriptions.length} assinaturas expiradas encontradas`);

      for (const item of expiredSubscriptions) {
        const { subscription, user, plan } = item;

        console.log(`[Subscription Manager] Processando assinatura expirada:`, {
          userId: user.id,
          email: user.email,
          plan: plan.name,
          endDate: subscription.endDate,
        });

        // Se tem renovação automática, tentar renovar
        if (subscription.autoRenew) {
          console.log(`[Subscription Manager] Tentando renovação automática...`);
          // TODO: Integrar com gateway de pagamento para cobrar
          // Por enquanto, apenas marca como expirada
          await this.markAsExpired(subscription.id);
          
          // Enviar notificação de falha na renovação
          await this.sendRenewalFailedNotification(user, plan);
        } else {
          // Marcar como expirada
          await this.markAsExpired(subscription.id);
          
          // Enviar notificação de expiração
          await this.sendExpiredNotification(user, plan);
        }

        // Desconectar contas do usuário
        await this.disconnectUserAccounts(user.id);
      }

      console.log('[Subscription Manager] Processamento concluído');
    } catch (error) {
      console.error('[Subscription Manager] Erro ao processar assinaturas expiradas:', error);
    }
  }

  /**
   * Enviar notificações de assinaturas próximas do vencimento
   * Executar diariamente: 7 dias, 3 dias e 1 dia antes
   */
  async sendExpirationReminders() {
    try {
      console.log('[Subscription Manager] Enviando lembretes de expiração...');

      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

      // Assinaturas que expiram em 7 dias
      await this.sendRemindersForDate(in7Days, '7 dias');
      
      // Assinaturas que expiram em 3 dias
      await this.sendRemindersForDate(in3Days, '3 dias');
      
      // Assinaturas que expiram em 1 dia
      await this.sendRemindersForDate(in1Day, '1 dia');

      console.log('[Subscription Manager] Lembretes enviados');
    } catch (error) {
      console.error('[Subscription Manager] Erro ao enviar lembretes:', error);
    }
  }

  private async sendRemindersForDate(targetDate: Date, period: string) {
    const subscriptions = await this.db
      .select({
        subscription: userSubscriptions,
        user: users,
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .innerJoin(users, eq(userSubscriptions.userId, users.id))
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(
        and(
          eq(userSubscriptions.status, 'active'),
          gte(userSubscriptions.endDate, targetDate),
          lt(userSubscriptions.endDate, new Date(targetDate.getTime() + 24 * 60 * 60 * 1000))
        )
      );

    for (const item of subscriptions) {
      const { subscription, user, plan } = item;
      console.log(`[Subscription Manager] Enviando lembrete (${period}):`, user.email);
      await this.sendExpirationReminderNotification(user, plan, subscription.endDate, period);
    }
  }

  /**
   * Marcar assinatura como expirada
   */
  private async markAsExpired(subscriptionId: number) {
    await this.db
      .update(userSubscriptions)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, subscriptionId));
  }

  /**
   * Desconectar todas as contas de um usuário
   */
  private async disconnectUserAccounts(userId: number) {
    try {
      await this.db
        .update(tradingAccounts)
        .set({
          status: 'disconnected',
          updatedAt: new Date(),
        })
        .where(eq(tradingAccounts.userId, userId));

      console.log(`[Subscription Manager] Contas do usuário ${userId} desconectadas`);
    } catch (error) {
      console.error(`[Subscription Manager] Erro ao desconectar contas:`, error);
    }
  }

  /**
   * Enviar notificação de assinatura expirada
   */
  private async sendExpiredNotification(user: any, plan: any) {
    // TODO: Implementar envio de email/notificação
    console.log(`[Subscription Manager] Notificação de expiração enviada:`, {
      email: user.email,
      plan: plan.name,
    });
  }

  /**
   * Enviar notificação de falha na renovação
   */
  private async sendRenewalFailedNotification(user: any, plan: any) {
    // TODO: Implementar envio de email/notificação
    console.log(`[Subscription Manager] Notificação de falha na renovação enviada:`, {
      email: user.email,
      plan: plan.name,
    });
  }

  /**
   * Enviar lembrete de expiração
   */
  private async sendExpirationReminderNotification(
    user: any,
    plan: any,
    endDate: Date,
    period: string
  ) {
    // TODO: Implementar envio de email/notificação
    console.log(`[Subscription Manager] Lembrete de expiração (${period}) enviado:`, {
      email: user.email,
      plan: plan.name,
      endDate,
    });
  }
}

/**
 * Agendar verificações automáticas
 */
export function scheduleSubscriptionChecks() {
  const manager = new SubscriptionManager();

  // Executar a cada 6 horas
  setInterval(async () => {
    await manager.processExpiredSubscriptions();
  }, 6 * 60 * 60 * 1000);

  // Executar lembretes uma vez por dia às 10h
  const now = new Date();
  const next10AM = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + (now.getHours() >= 10 ? 1 : 0),
    10,
    0,
    0
  );
  const timeUntil10AM = next10AM.getTime() - now.getTime();

  setTimeout(() => {
    manager.sendExpirationReminders();
    // Depois executar a cada 24 horas
    setInterval(() => {
      manager.sendExpirationReminders();
    }, 24 * 60 * 60 * 1000);
  }, timeUntil10AM);

  console.log('[Subscription Manager] Agendamentos configurados');
}
