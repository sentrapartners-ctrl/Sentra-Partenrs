import { getDb } from "../db";
import { tradingAccounts, trades, users, notifications } from "../../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { schedule } from "node-cron";

/**
 * Serviço de relatórios automáticos
 * - Diário (18h): Lucro do dia
 * - Semanal (Sábado 18h): Relatório Domingo-Sexta
 */

interface DailyReport {
  userId: number;
  accountId: number;
  accountNumber: string;
  currency: string;
  profitToday: number;
  profitTodayUSD: number;
  tradesCount: number;
}

interface WeeklyReport {
  userId: number;
  accounts: {
    accountNumber: string;
    currency: string;
    profitWeek: number;
    profitWeekUSD: number;
    tradesCount: number;
  }[];
  totalProfitUSD: number;
}

/**
 * Gerar relatório diário para um usuário
 */
async function generateDailyReport(userId: number): Promise<DailyReport[]> {
  const db = getDb();
  if (!db) return [];

  try {
    // Data de hoje (início e fim)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Buscar contas do usuário
    const accounts = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.userId, userId));

    const reports: DailyReport[] = [];

    for (const account of accounts) {
      // Buscar trades do dia
      const dayTrades = await db
        .select()
        .from(trades)
        .where(
          and(
            eq(trades.accountId, account.id),
            gte(trades.closeTime, today),
            lte(trades.closeTime, tomorrow)
          )
        );

      if (dayTrades.length === 0) continue;

      // Calcular lucro total
      const divisor = account.isCentAccount ? 10000 : 100;
      const profitToday = dayTrades.reduce((sum, t) => {
        return sum + (Number(t.profit) / divisor);
      }, 0);

      // Converter para USD (simplificado - assumindo que já está em USD ou conversão 1:1)
      const profitTodayUSD = profitToday;

      reports.push({
        userId,
        accountId: account.id,
        accountNumber: account.accountNumber,
        currency: account.currency || 'USD',
        profitToday,
        profitTodayUSD,
        tradesCount: dayTrades.length,
      });
    }

    return reports;
  } catch (error) {
    console.error(`[Daily Report] Erro ao gerar relatório para usuário ${userId}:`, error);
    return [];
  }
}

/**
 * Gerar relatório semanal para um usuário
 */
async function generateWeeklyReport(userId: number): Promise<WeeklyReport | null> {
  const db = getDb();
  if (!db) return null;

  try {
    // Calcular domingo a sexta da semana passada
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 6 = Sábado
    
    // Se hoje é sábado (6), calcular domingo-sexta da semana atual
    const daysToSunday = dayOfWeek === 6 ? 6 : (dayOfWeek + 1);
    const sunday = new Date(today);
    sunday.setDate(sunday.getDate() - daysToSunday);
    sunday.setHours(0, 0, 0, 0);

    const saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);

    // Buscar contas do usuário
    const accounts = await db
      .select()
      .from(tradingAccounts)
      .where(eq(tradingAccounts.userId, userId));

    const accountReports = [];
    let totalProfitUSD = 0;

    for (const account of accounts) {
      // Buscar trades da semana
      const weekTrades = await db
        .select()
        .from(trades)
        .where(
          and(
            eq(trades.accountId, account.id),
            gte(trades.closeTime, sunday),
            lte(trades.closeTime, saturday)
          )
        );

      if (weekTrades.length === 0) continue;

      // Calcular lucro total
      const divisor = account.isCentAccount ? 10000 : 100;
      const profitWeek = weekTrades.reduce((sum, t) => {
        return sum + (Number(t.profit) / divisor);
      }, 0);

      const profitWeekUSD = profitWeek; // Simplificado

      totalProfitUSD += profitWeekUSD;

      accountReports.push({
        accountNumber: account.accountNumber,
        currency: account.currency || 'USD',
        profitWeek,
        profitWeekUSD,
        tradesCount: weekTrades.length,
      });
    }

    if (accountReports.length === 0) return null;

    return {
      userId,
      accounts: accountReports,
      totalProfitUSD,
    };
  } catch (error) {
    console.error(`[Weekly Report] Erro ao gerar relatório para usuário ${userId}:`, error);
    return null;
  }
}

/**
 * Enviar relatório diário para todos os usuários
 */
async function sendDailyReports() {
  const db = getDb();
  if (!db) {
    console.log("[Daily Reports] Database not available");
    return;
  }

  console.log("[Daily Reports] 📊 Gerando relatórios diários...");

  try {
    // Buscar todos os usuários com contas
    const allUsers = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users);

    let reportsSent = 0;

    for (const user of allUsers) {
      const reports = await generateDailyReport(user.id);

      if (reports.length === 0) continue;

      // Calcular totais
      const totalProfit = reports.reduce((sum, r) => sum + r.profitToday, 0);
      const totalTrades = reports.reduce((sum, r) => sum + r.tradesCount, 0);

      // Criar notificação
      const message = `📊 Relatório Diário\n\n` +
        `Total de lucro hoje: $${totalProfit.toFixed(2)}\n` +
        `Trades executados: ${totalTrades}\n\n` +
        reports.map(r => 
          `Conta ${r.accountNumber}: $${r.profitToday.toFixed(2)} (${r.tradesCount} trades)`
        ).join('\n');

      await db.insert(notifications).values({
        userId: user.id,
        type: 'account',
        title: '📊 Relatório Diário de Trading',
        message,
        metadata: JSON.stringify({ reports, date: new Date().toISOString() }),
      });

      reportsSent++;
    }

    console.log(`[Daily Reports] ✅ ${reportsSent} relatórios enviados`);
  } catch (error: any) {
    console.error("[Daily Reports] ❌ Erro:", error.message);
  }
}

/**
 * Enviar relatório semanal para todos os usuários
 */
async function sendWeeklyReports() {
  const db = getDb();
  if (!db) {
    console.log("[Weekly Reports] Database not available");
    return;
  }

  console.log("[Weekly Reports] 📈 Gerando relatórios semanais...");

  try {
    // Buscar todos os usuários com contas
    const allUsers = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users);

    let reportsSent = 0;

    for (const user of allUsers) {
      const report = await generateWeeklyReport(user.id);

      if (!report) continue;

      // Criar notificação
      const message = `📈 Relatório Semanal (Domingo-Sexta)\n\n` +
        `💰 Lucro Total: $${report.totalProfitUSD.toFixed(2)} USD\n\n` +
        `Contas:\n` +
        report.accounts.map(a => 
          `• ${a.accountNumber}: $${a.profitWeek.toFixed(2)} ${a.currency} ` +
          `($${a.profitWeekUSD.toFixed(2)} USD) - ${a.tradesCount} trades`
        ).join('\n');

      await db.insert(notifications).values({
        userId: user.id,
        type: 'account',
        title: '📈 Relatório Semanal de Trading',
        message,
        metadata: JSON.stringify({ report, date: new Date().toISOString() }),
      });

      reportsSent++;
    }

    console.log(`[Weekly Reports] ✅ ${reportsSent} relatórios enviados`);
  } catch (error: any) {
    console.error("[Weekly Reports] ❌ Erro:", error.message);
  }
}

/**
 * Agendar relatórios automáticos
 */
export function scheduleAutomatedReports() {
  // Relatório diário às 18h (horário do servidor)
  schedule('0 18 * * *', () => {
    console.log("[Automated Reports] ⏰ Executando relatório diário...");
    sendDailyReports();
  });

  // Relatório semanal aos sábados às 18h
  schedule('0 18 * * 6', () => {
    console.log("[Automated Reports] ⏰ Executando relatório semanal...");
    sendWeeklyReports();
  });

  console.log("[Automated Reports] ⏰ Agendamentos configurados:");
  console.log("  - Diário: Todos os dias às 18h");
  console.log("  - Semanal: Sábados às 18h (relatório Domingo-Sexta)");
}
