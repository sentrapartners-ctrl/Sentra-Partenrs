/**
 * Subscription Data Manager
 * Gerencia arquivamento e limpeza de dados de contas sem assinatura
 */

import { getDb } from '../db';
import { eq, and, lt, sql } from 'drizzle-orm';

/**
 * Arquiva dados de uma conta sem assinatura
 * Move is_connected para false e marca última data de assinatura
 */
export async function archiveAccountData(userId: number) {
  try {
    const db = getDb();
    const { tradingAccounts } = await import('../../drizzle/schema');

    console.log(`[Subscription Manager] Arquivando dados do usuário ${userId}`);

    // Desconectar todas as contas do usuário
    await db
      .update(tradingAccounts)
      .set({
        is_connected: false,
        last_heartbeat: new Date(),
      })
      .where(eq(tradingAccounts.userId, userId));

    console.log(`[Subscription Manager] Dados arquivados para usuário ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('[Subscription Manager] Erro ao arquivar dados:', error);
    return { success: false, error };
  }
}

/**
 * Restaura dados de uma conta ao renovar assinatura
 * Permite reconexão das contas
 */
export async function restoreAccountData(userId: number) {
  try {
    const db = getDb();
    const { tradingAccounts } = await import('../../drizzle/schema');

    console.log(`[Subscription Manager] Restaurando dados do usuário ${userId}`);

    // Resetar failed_attempts para permitir reconexão
    await db
      .update(tradingAccounts)
      .set({
        failed_attempts: 0,
      })
      .where(eq(tradingAccounts.userId, userId));

    console.log(`[Subscription Manager] Dados restaurados para usuário ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('[Subscription Manager] Erro ao restaurar dados:', error);
    return { success: false, error };
  }
}

/**
 * Limpa dados de contas sem assinatura há mais de 30 dias
 * Deleta trades, positions, balance_snapshots
 */
export async function cleanupExpiredAccounts() {
  try {
    const db = getDb();
    const { users, tradingAccounts, trades, positions, balanceSnapshots } = await import('../../drizzle/schema');

    console.log('[Subscription Manager] Iniciando limpeza de contas expiradas...');

    // Buscar usuários sem assinatura há mais de 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Query para encontrar usuários sem assinatura ativa
    const usersWithoutSubscription = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          sql`NOT EXISTS (
            SELECT 1 FROM user_subscriptions 
            WHERE user_subscriptions.userId = users.id 
            AND user_subscriptions.status = 'active'
            AND user_subscriptions.endDate > NOW()
          )`,
          sql`users.role = 'client'`, // Não limpar dados de admin/gerentes
          sql`users.manual_permissions IS NULL OR users.manual_permissions = '{}'` // Não limpar se tem permissões manuais
        )
      );

    console.log(`[Subscription Manager] Encontrados ${usersWithoutSubscription.length} usuários sem assinatura`);

    for (const user of usersWithoutSubscription) {
      // Buscar contas do usuário
      const accounts = await db
        .select({ id: tradingAccounts.id, last_heartbeat: tradingAccounts.last_heartbeat })
        .from(tradingAccounts)
        .where(eq(tradingAccounts.userId, user.id));

      for (const account of accounts) {
        // Verificar se última atividade foi há mais de 30 dias
        const lastActivity = account.last_heartbeat || new Date(0);
        if (lastActivity < thirtyDaysAgo) {
          console.log(`[Subscription Manager] Limpando dados da conta ${account.id}`);

          // Deletar trades
          await db
            .delete(trades)
            .where(eq(trades.accountId, account.id));

          // Deletar positions
          await db
            .delete(positions)
            .where(eq(positions.accountId, account.id));

          // Deletar balance snapshots
          await db
            .delete(balanceSnapshots)
            .where(eq(balanceSnapshots.accountId, account.id));

          // Deletar a conta
          await db
            .delete(tradingAccounts)
            .where(eq(tradingAccounts.id, account.id));

          console.log(`[Subscription Manager] Conta ${account.id} limpa com sucesso`);
        }
      }
    }

    console.log('[Subscription Manager] Limpeza concluída');
    return { success: true, cleaned: usersWithoutSubscription.length };
  } catch (error) {
    console.error('[Subscription Manager] Erro na limpeza:', error);
    return { success: false, error };
  }
}

/**
 * Agenda limpeza automática diária
 */
export function scheduleDataCleanup() {
  // Executar limpeza todos os dias às 3h da manhã
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas

  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 3) {
      console.log('[Subscription Manager] Executando limpeza agendada...');
      await cleanupExpiredAccounts();
    }
  }, CLEANUP_INTERVAL);

  console.log('[Subscription Manager] Limpeza automática agendada para 3h da manhã');
}
