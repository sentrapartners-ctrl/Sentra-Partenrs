import { drizzle } from "drizzle-orm/mysql2";
import { tradingAccounts } from "./drizzle/schema";

async function debugAccounts() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);
  
  const accounts = await db.select().from(tradingAccounts);
  
  console.log("\n=== CONTAS NO BANCO ===\n");
  
  for (const acc of accounts) {
    console.log(`Conta: ${acc.accountNumber}`);
    console.log(`Broker: ${acc.broker}`);
    console.log(`Balance (raw cents): ${acc.balance}`);
    console.log(`isCentAccount: ${acc.isCentAccount}`);
    console.log(`Divisor: ${acc.isCentAccount ? 10000 : 100}`);
    console.log(`Valor exibido: $${((acc.balance || 0) / (acc.isCentAccount ? 10000 : 100)).toFixed(2)}`);
    console.log(`---`);
  }
  
  process.exit(0);
}

debugAccounts();

