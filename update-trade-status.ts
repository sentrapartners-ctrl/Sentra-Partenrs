import { drizzle } from "drizzle-orm/mysql2";
import { trades } from "./drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function updateTradeStatus() {
  console.log("=== ATUALIZANDO STATUS DE TRADES FLUTUANTES ===\n");
  
  // Buscar todos os trades com profit = 0 e openPrice = closePrice
  const floatingTrades = await db.select().from(trades)
    .where(and(
      eq(trades.profit, 0),
      sql`${trades.openPrice} = ${trades.closePrice}`
    ));
  
  console.log(`Encontrados ${floatingTrades.length} trades flutuantes (profit=0 e openPrice=closePrice)`);
  
  if (floatingTrades.length === 0) {
    console.log("Nenhum trade para atualizar.");
    return;
  }
  
  // Atualizar status para "open"
  for (const trade of floatingTrades) {
    await db.update(trades)
      .set({ status: "open" })
      .where(eq(trades.id, trade.id));
    
    console.log(`✓ Trade ${trade.ticket} (${trade.symbol}) atualizado para status=open`);
  }
  
  console.log(`\n✅ ${floatingTrades.length} trades atualizados com sucesso!`);
}

updateTradeStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro ao atualizar trades:", error);
    process.exit(1);
  });

