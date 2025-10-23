import { drizzle } from "drizzle-orm/mysql2";
import { trades } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function checkTrades() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);
  
  const allTrades = await db.select().from(trades)
    .where(eq(trades.status, "closed"))
    .limit(50);
  
  console.log("\n=== TRADES COM PROFIT = 0 MAS PREÇOS DIFERENTES ===\n");
  
  let foundIssues = 0;
  
  for (const trade of allTrades) {
    const priceDiff = Math.abs((trade.openPrice || 0) - (trade.closePrice || 0));
    
    if (trade.profit === 0 && priceDiff > 0) {
      foundIssues++;
      console.log(`Trade ${trade.ticket}:`);
      console.log(`  Tipo: ${trade.type}`);
      console.log(`  Abertura: ${trade.openPrice}`);
      console.log(`  Fechamento: ${trade.closePrice}`);
      console.log(`  Diferença: ${priceDiff}`);
      console.log(`  Profit (raw): ${trade.profit}`);
      console.log(`  Volume: ${trade.volume}`);
      console.log(`---`);
    }
  }
  
  if (foundIssues === 0) {
    console.log("✅ Nenhum problema encontrado! Todos os trades com profit=0 têm preços iguais.");
  } else {
    console.log(`\n⚠️  Encontrados ${foundIssues} trades com problema!`);
  }
  
  process.exit(0);
}

checkTrades();
