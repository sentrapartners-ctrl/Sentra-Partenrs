import { getDb } from "./db";
import { tradingAccounts, balanceHistory, accountDrawdown, consolidatedDrawdown } from "../drizzle/schema";
import { eq, and, gte, lte, inArray, desc } from "drizzle-orm";

/**
 * Calcula o drawdown individual de uma conta em um período
 */
export async function calculateAccountDrawdown(
  accountId: number,
  userId: number,
  date: Date,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Buscar conta
  const [account] = await db.select()
    .from(tradingAccounts)
    .where(eq(tradingAccounts.id, accountId))
    .limit(1);

  if (!account) throw new Error('Account not found');

  // Definir período de busca
  const periodStart = getPeriodStart(date, period);
  const periodEnd = getPeriodEnd(date, period);

  // Buscar histórico de balance no período
  const history = await db.select()
    .from(balanceHistory)
    .where(
      and(
        eq(balanceHistory.accountId, accountId),
        gte(balanceHistory.timestamp, periodStart),
        lte(balanceHistory.timestamp, periodEnd)
      )
    )
    .orderBy(desc(balanceHistory.balance));

  // Determinar pico de balance
  let peakBalance = account.balance || 0;
  if (history.length > 0) {
    peakBalance = history[0].balance;
  }

  const currentBalance = account.balance || 0;
  const drawdownAmount = Math.max(0, peakBalance - currentBalance);
  const drawdownPercent = peakBalance > 0 ? Math.round((drawdownAmount / peakBalance) * 10000) : 0;

  // Salvar no banco
  const dateStr = date.toISOString().split('T')[0];
  
  try {
    await db.insert(accountDrawdown).values({
      accountId,
      userId,
      date: dateStr,
      peakBalance,
      currentBalance,
      drawdownAmount,
      drawdownPercent,
      isCentAccount: account.accountType === 'CENT',
      period,
    }).onDuplicateKeyUpdate({
      set: {
        peakBalance,
        currentBalance,
        drawdownAmount,
        drawdownPercent,
        updatedAt: new Date(),
      }
    });
  } catch (error) {
    console.error('[Drawdown] Error saving account drawdown:', error);
  }

  return {
    accountId,
    peakBalance,
    currentBalance,
    drawdownAmount,
    drawdownPercent: drawdownPercent / 100, // Retornar como decimal
    isCentAccount: account.accountType === 'CENT',
  };
}

/**
 * Calcula o drawdown consolidado de todas as contas do usuário
 */
export async function calculateConsolidatedDrawdown(
  userId: number,
  date: Date,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Buscar todas as contas ativas do usuário
  const accounts = await db.select()
    .from(tradingAccounts)
    .where(
      and(
        eq(tradingAccounts.userId, userId),
        eq(tradingAccounts.isActive, true)
      )
    );

  if (accounts.length === 0) {
    return {
      totalPeakBalance: 0,
      totalCurrentBalance: 0,
      totalDrawdownAmount: 0,
      totalDrawdownPercent: 0,
      accountCount: 0,
    };
  }

  // Definir período de busca
  const periodStart = getPeriodStart(date, period);
  const periodEnd = getPeriodEnd(date, period);

  let totalPeakBalance = 0;
  let totalCurrentBalance = 0;

  // Calcular para cada conta
  for (const account of accounts) {
    // Buscar histórico de balance no período
    const history = await db.select()
      .from(balanceHistory)
      .where(
        and(
          eq(balanceHistory.accountId, account.id),
          gte(balanceHistory.timestamp, periodStart),
          lte(balanceHistory.timestamp, periodEnd)
        )
      )
      .orderBy(desc(balanceHistory.balance))
      .limit(1);

    // Determinar pico de balance
    let peakBalance = account.balance || 0;
    if (history.length > 0) {
      peakBalance = history[0].balance;
    }

    const currentBalance = account.balance || 0;

    // Normalizar valores (CENT: dividir por 100, STANDARD: manter)
    const normalizedPeak = account.accountType === 'CENT' ? peakBalance / 100 : peakBalance;
    const normalizedCurrent = account.accountType === 'CENT' ? currentBalance / 100 : currentBalance;

    totalPeakBalance += normalizedPeak;
    totalCurrentBalance += normalizedCurrent;
  }

  const totalDrawdownAmount = Math.max(0, totalPeakBalance - totalCurrentBalance);
  const totalDrawdownPercent = totalPeakBalance > 0 
    ? Math.round((totalDrawdownAmount / totalPeakBalance) * 10000) 
    : 0;

  // Salvar no banco
  const dateStr = date.toISOString().split('T')[0];
  
  try {
    await db.insert(consolidatedDrawdown).values({
      userId,
      date: dateStr,
      totalPeakBalance: Math.round(totalPeakBalance),
      totalCurrentBalance: Math.round(totalCurrentBalance),
      totalDrawdownAmount: Math.round(totalDrawdownAmount),
      totalDrawdownPercent,
      accountCount: accounts.length,
      period,
    }).onDuplicateKeyUpdate({
      set: {
        totalPeakBalance: Math.round(totalPeakBalance),
        totalCurrentBalance: Math.round(totalCurrentBalance),
        totalDrawdownAmount: Math.round(totalDrawdownAmount),
        totalDrawdownPercent,
        accountCount: accounts.length,
        updatedAt: new Date(),
      }
    });
  } catch (error) {
    console.error('[Drawdown] Error saving consolidated drawdown:', error);
  }

  return {
    totalPeakBalance: Math.round(totalPeakBalance),
    totalCurrentBalance: Math.round(totalCurrentBalance),
    totalDrawdownAmount: Math.round(totalDrawdownAmount),
    totalDrawdownPercent: totalDrawdownPercent / 100, // Retornar como decimal
    accountCount: accounts.length,
  };
}

/**
 * Busca drawdown individual de uma conta
 */
export async function getAccountDrawdown(
  accountId: number,
  date: Date,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const db = await getDb();
  if (!db) return null;

  const dateStr = date.toISOString().split('T')[0];

  const [result] = await db.select()
    .from(accountDrawdown)
    .where(
      and(
        eq(accountDrawdown.accountId, accountId),
        eq(accountDrawdown.date, dateStr),
        eq(accountDrawdown.period, period)
      )
    )
    .limit(1);

  if (!result) return null;

  return {
    ...result,
    drawdownPercent: result.drawdownPercent / 100, // Converter para decimal
  };
}

/**
 * Busca drawdown consolidado do usuário
 */
export async function getConsolidatedDrawdown(
  userId: number,
  date: Date,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const db = await getDb();
  if (!db) return null;

  const dateStr = date.toISOString().split('T')[0];

  const [result] = await db.select()
    .from(consolidatedDrawdown)
    .where(
      and(
        eq(consolidatedDrawdown.userId, userId),
        eq(consolidatedDrawdown.date, dateStr),
        eq(consolidatedDrawdown.period, period)
      )
    )
    .limit(1);

  if (!result) return null;

  return {
    ...result,
    totalDrawdownPercent: result.totalDrawdownPercent / 100, // Converter para decimal
  };
}

/**
 * Busca histórico de drawdown de uma conta
 */
export async function getAccountDrawdownHistory(
  accountId: number,
  startDate: Date,
  endDate: Date,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const db = await getDb();
  if (!db) return [];

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const results = await db.select()
    .from(accountDrawdown)
    .where(
      and(
        eq(accountDrawdown.accountId, accountId),
        gte(accountDrawdown.date, startStr),
        lte(accountDrawdown.date, endStr),
        eq(accountDrawdown.period, period)
      )
    )
    .orderBy(accountDrawdown.date);

  return results.map(r => ({
    ...r,
    drawdownPercent: r.drawdownPercent / 100,
  }));
}

/**
 * Busca histórico de drawdown consolidado do usuário
 */
export async function getConsolidatedDrawdownHistory(
  userId: number,
  startDate: Date,
  endDate: Date,
  period: 'daily' | 'weekly' | 'monthly' = 'monthly'
) {
  const db = await getDb();
  if (!db) return [];

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const results = await db.select()
    .from(consolidatedDrawdown)
    .where(
      and(
        eq(consolidatedDrawdown.userId, userId),
        gte(consolidatedDrawdown.date, startStr),
        lte(consolidatedDrawdown.date, endStr),
        eq(consolidatedDrawdown.period, period)
      )
    )
    .orderBy(consolidatedDrawdown.date);

  return results.map(r => ({
    ...r,
    totalDrawdownPercent: r.totalDrawdownPercent / 100,
  }));
}

// ===== HELPERS =====

function getPeriodStart(date: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (period === 'daily') {
    return d;
  } else if (period === 'weekly') {
    // Início da semana (domingo)
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  } else {
    // Início do mês
    d.setDate(1);
    return d;
  }
}

function getPeriodEnd(date: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);

  if (period === 'daily') {
    return d;
  } else if (period === 'weekly') {
    // Fim da semana (sábado)
    const day = d.getDay();
    d.setDate(d.getDate() + (6 - day));
    return d;
  } else {
    // Fim do mês
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d;
  }
}
