import { getDb } from "../db";
import { tradingAccounts, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { calculateAccountDrawdown, calculateConsolidatedDrawdown } from "../drawdown-calculator";

/**
 * Job para calcular drawdown de todas as contas ativas
 * Deve ser executado diariamente (ex: 23:59)
 */
export async function calculateDailyDrawdown() {
  console.log('[Drawdown Job] Iniciando cálculo diário de drawdown...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Drawdown Job] Database not available');
    return;
  }

  try {
    const today = new Date();
    
    // Buscar todas as contas ativas
    const activeAccounts = await db.select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.isActive, true));

    console.log(`[Drawdown Job] Encontradas ${activeAccounts.length} contas ativas`);

    // Agrupar contas por usuário
    const accountsByUser = new Map<number, typeof activeAccounts>();
    for (const account of activeAccounts) {
      const userAccounts = accountsByUser.get(account.userId) || [];
      userAccounts.push(account);
      accountsByUser.set(account.userId, userAccounts);
    }

    console.log(`[Drawdown Job] Processando ${accountsByUser.size} usuários`);

    let accountsProcessed = 0;
    let usersProcessed = 0;
    let errors = 0;

    // Processar cada usuário
    for (const [userId, userAccounts] of accountsByUser.entries()) {
      try {
        // Calcular drawdown individual de cada conta
        for (const account of userAccounts) {
          try {
            await calculateAccountDrawdown(account.id, userId, today, 'daily');
            await calculateAccountDrawdown(account.id, userId, today, 'weekly');
            await calculateAccountDrawdown(account.id, userId, today, 'monthly');
            accountsProcessed++;
          } catch (error) {
            console.error(`[Drawdown Job] Erro ao calcular drawdown da conta ${account.id}:`, error);
            errors++;
          }
        }

        // Calcular drawdown consolidado do usuário
        try {
          await calculateConsolidatedDrawdown(userId, today, 'daily');
          await calculateConsolidatedDrawdown(userId, today, 'weekly');
          await calculateConsolidatedDrawdown(userId, today, 'monthly');
          usersProcessed++;
        } catch (error) {
          console.error(`[Drawdown Job] Erro ao calcular drawdown consolidado do usuário ${userId}:`, error);
          errors++;
        }
      } catch (error) {
        console.error(`[Drawdown Job] Erro ao processar usuário ${userId}:`, error);
        errors++;
      }
    }

    console.log('[Drawdown Job] Cálculo concluído!');
    console.log(`[Drawdown Job] Contas processadas: ${accountsProcessed}/${activeAccounts.length}`);
    console.log(`[Drawdown Job] Usuários processados: ${usersProcessed}/${accountsByUser.size}`);
    console.log(`[Drawdown Job] Erros: ${errors}`);

    return {
      success: true,
      accountsProcessed,
      usersProcessed,
      errors,
    };
  } catch (error) {
    console.error('[Drawdown Job] Erro fatal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calcular drawdown sob demanda para um usuário específico
 */
export async function calculateUserDrawdown(userId: number) {
  console.log(`[Drawdown] Calculando drawdown para usuário ${userId}...`);
  
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const today = new Date();
  
  // Buscar contas ativas do usuário
  const userAccounts = await db.select()
    .from(tradingAccounts)
    .where(
      and(
        eq(tradingAccounts.userId, userId),
        eq(tradingAccounts.isActive, true)
      )
    );

  if (userAccounts.length === 0) {
    console.log(`[Drawdown] Usuário ${userId} não tem contas ativas`);
    return {
      success: true,
      accountsProcessed: 0,
    };
  }

  // Calcular drawdown individual de cada conta
  for (const account of userAccounts) {
    await calculateAccountDrawdown(account.id, userId, today, 'daily');
    await calculateAccountDrawdown(account.id, userId, today, 'weekly');
    await calculateAccountDrawdown(account.id, userId, today, 'monthly');
  }

  // Calcular drawdown consolidado
  await calculateConsolidatedDrawdown(userId, today, 'daily');
  await calculateConsolidatedDrawdown(userId, today, 'weekly');
  await calculateConsolidatedDrawdown(userId, today, 'monthly');

  console.log(`[Drawdown] Drawdown calculado para usuário ${userId} (${userAccounts.length} contas)`);

  return {
    success: true,
    accountsProcessed: userAccounts.length,
  };
}
