import { getDb } from "./server/db";
import { trades } from "./drizzle/schema";
import { sql } from "drizzle-orm";

async function checkTrades() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  // Total de trades
  const total = await db.select({ count: sql<number>`count(*)` }).from(trades);
  console.log(`Total de trades: ${total[0].count}`);

  // Trade mais antigo
  const oldest = await db.select().from(trades).orderBy(trades.openTime).limit(1);
  if (oldest.length > 0) {
    console.log(`\nTrade mais antigo:`);
    console.log(`  ID: ${oldest[0].id}`);
    console.log(`  Open Time: ${oldest[0].openTime}`);
    console.log(`  Symbol: ${oldest[0].symbol}`);
  }

  // Trade mais recente
  const newest = await db.select().from(trades).orderBy(sql`${trades.openTime} DESC`).limit(1);
  if (newest.length > 0) {
    console.log(`\nTrade mais recente:`);
    console.log(`  ID: ${newest[0].id}`);
    console.log(`  Open Time: ${newest[0].openTime}`);
    console.log(`  Symbol: ${newest[0].symbol}`);
  }

  // Diferença em dias
  if (oldest.length > 0 && newest.length > 0) {
    const oldestDate = new Date(oldest[0].openTime);
    const newestDate = new Date(newest[0].openTime);
    const diffDays = Math.floor((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`\nPeríodo total: ${diffDays} dias`);
  }

  process.exit(0);
}

checkTrades().catch(console.error);
