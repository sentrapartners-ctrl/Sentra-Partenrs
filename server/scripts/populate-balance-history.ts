import { getDb } from "../db";
import { trades, accounts, balanceHistory } from "../../drizzle/schema";
import { eq, and, isNotNull } from "drizzle-orm";

/**
 * Script para popular a tabela balance_history baseado nos trades existentes
 * Reconstrói o histórico de balance calculando o acumulado por data
 */
async function populateBalanceHistory() {
  console.log("🔄 Iniciando população de balance_history...");
  
  const db = await getDb();
  if (!db) {
    console.error("❌ Database não disponível");
    return;
  }

  try {
    // 1. Buscar todas as contas
    const allAccounts = await db.select().from(accounts);
    console.log(`📊 Encontradas ${allAccounts.length} contas`);

    for (const account of allAccounts) {
      console.log(`\n🔄 Processando conta ${account.accountNumber} (${account.isCentAccount ? 'CENT' : 'STANDARD'})...`);

      // 2. Buscar todos os trades fechados desta conta, ordenados por data
      const accountTrades = await db
        .select()
        .from(trades)
        .where(
          and(
            eq(trades.accountId, account.id),
            isNotNull(trades.closeTime)
          )
        )
        .orderBy(trades.closeTime);

      if (accountTrades.length === 0) {
        console.log(`   ⚠️  Nenhum trade fechado encontrado`);
        continue;
      }

      console.log(`   📈 ${accountTrades.length} trades fechados encontrados`);

      // 3. Agrupar trades por data e calcular balance acumulado
      const balanceByDate = new Map<string, { balance: number; equity: number; timestamp: Date }>();
      let accumulatedProfit = 0;

      for (const trade of accountTrades) {
        if (!trade.closeTime) continue;

        const closeDate = new Date(trade.closeTime);
        const dateKey = closeDate.toISOString().split('T')[0]; // YYYY-MM-DD

        // Acumula o profit (já está em centavos no banco)
        accumulatedProfit += (trade.profit || 0);

        // Balance = balance inicial da conta + lucro acumulado
        const currentBalance = (account.balance || 0) - accumulatedProfit + accumulatedProfit;
        const currentEquity = currentBalance; // Simplificação: equity = balance para histórico

        balanceByDate.set(dateKey, {
          balance: currentBalance,
          equity: currentEquity,
          timestamp: closeDate,
        });
      }

      console.log(`   📅 ${balanceByDate.size} datas únicas com trades`);

      // 4. Inserir snapshots na tabela balance_history
      let inserted = 0;
      for (const [dateKey, snapshot] of balanceByDate.entries()) {
        try {
          await db.insert(balanceHistory).values({
            accountId: account.id,
            userId: account.userId,
            balance: snapshot.balance,
            equity: snapshot.equity,
            isCentAccount: account.isCentAccount || false,
            timestamp: snapshot.timestamp,
          });
          inserted++;
        } catch (error: any) {
          // Ignora duplicatas
          if (!error.message.includes('Duplicate')) {
            console.error(`   ❌ Erro ao inserir snapshot para ${dateKey}:`, error.message);
          }
        }
      }

      console.log(`   ✅ ${inserted} snapshots inseridos`);
    }

    console.log("\n✅ População de balance_history concluída!");
  } catch (error: any) {
    console.error("❌ Erro ao popular balance_history:", error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateBalanceHistory()
    .then(() => {
      console.log("✅ Script finalizado com sucesso");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script falhou:", error);
      process.exit(1);
    });
}

export { populateBalanceHistory };
