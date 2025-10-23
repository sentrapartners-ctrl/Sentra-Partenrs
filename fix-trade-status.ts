import { drizzle } from "drizzle-orm/mysql2";
import { trades } from "./drizzle/schema";
import { isNull, isNotNull, eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function fixTradeStatus() {
  console.log("=== CORRIGINDO STATUS DE TRADES BASEADO EM CLOSETIME ===\n");
  
  // 1. Marcar como ABERTO todos os trades com closeTime NULL
  const openTrades = await db.select().from(trades)
    .where(isNull(trades.closeTime));
  
  console.log(`Encontrados ${openTrades.length} trades com closeTime NULL (devem ser ABERTOS)`);
  
  for (const trade of openTrades) {
    await db.update(trades)
      .set({ status: "open" })
      .where(eq(trades.id, trade.id));
  }
  
  console.log(`✓ ${openTrades.length} trades marcados como ABERTOS\n`);
  
  // 2. Marcar como FECHADO todos os trades com closeTime NOT NULL
  const closedTrades = await db.select().from(trades)
    .where(isNotNull(trades.closeTime));
  
  console.log(`Encontrados ${closedTrades.length} trades com closeTime NOT NULL (devem ser FECHADOS)`);
  
  for (const trade of closedTrades) {
    await db.update(trades)
      .set({ status: "closed" })
      .where(eq(trades.id, trade.id));
  }
  
  console.log(`✓ ${closedTrades.length} trades marcados como FECHADOS\n`);
  
  console.log("✅ Status de todos os trades corrigido com sucesso!");
}

fixTradeStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erro ao corrigir trades:", error);
    process.exit(1);
  });

