import { drizzle } from "drizzle-orm/mysql2";
import { tradingAccounts } from "./drizzle/schema";
import { eq } from "drizzle-orm";

// Função de detecção (copiada do db.ts)
function isCentAccountByBroker(
  broker?: string | null, 
  server?: string | null,
  accountType?: string | null,
  balance?: number | null
): boolean {
  if (!broker && !server) return false;
  
  const brokerLower = (broker || '').toLowerCase();
  const serverLower = (server || '').toLowerCase();
  
  // 1. Verifica tipo de conta explícito
  if (accountType?.toUpperCase() === 'CENT') {
    return true;
  }
  
  // 2. Verifica se o servidor contém "cent" no nome
  if (serverLower.includes('cent')) {
    return true;
  }
  
  // 3. Análise de magnitude dos valores
  // Threshold: 20.000.000 cents = $200.000 em conta dollar ou $2.000 em conta cent
  if (balance && balance > 20000000) {
    return true;
  }
  
  return false;
}

async function updateCentAccounts() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);
  
  console.log("Buscando todas as contas...");
  const accounts = await db.select().from(tradingAccounts);
  
  console.log(`Encontradas ${accounts.length} contas`);
  
  for (const account of accounts) {
    const isCent = isCentAccountByBroker(
      account.broker, 
      account.server,
      account.accountType,
      account.balance
    );
    
    console.log(`\nConta ${account.accountNumber} (${account.broker})`);
    console.log(`  isCentAccount atual: ${account.isCentAccount}`);
    console.log(`  isCentAccount detectado: ${isCent}`);
    
    if (account.isCentAccount !== isCent) {
      console.log(`  ✅ Atualizando...`);
      await db.update(tradingAccounts)
        .set({ isCentAccount: isCent })
        .where(eq(tradingAccounts.id, account.id));
    } else {
      console.log(`  ⏭️  Já está correto`);
    }
  }
  
  console.log("\n✅ Atualização concluída!");
  process.exit(0);
}

updateCentAccounts().catch(error => {
  console.error("Erro:", error);
  process.exit(1);
});

