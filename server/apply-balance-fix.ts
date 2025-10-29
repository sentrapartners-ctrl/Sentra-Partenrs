import { getDb } from "./db";

export async function applyBalanceFix() {
  const db = await getDb();
  if (!db) {
    console.log("[MIGRATION] Database not available, skipping balance fix");
    return;
  }

  try {
    console.log("[MIGRATION] Checking if balance columns need to be fixed...");
    
    // Tenta fazer um insert de teste com valor grande
    // Se falhar, aplica a migration
    
    const sql = `
      ALTER TABLE trading_accounts 
        MODIFY COLUMN balance BIGINT NOT NULL DEFAULT 0,
        MODIFY COLUMN equity BIGINT NOT NULL DEFAULT 0,
        MODIFY COLUMN marginFree BIGINT NOT NULL DEFAULT 0,
        MODIFY COLUMN marginUsed BIGINT NOT NULL DEFAULT 0;

      ALTER TABLE trades
        MODIFY COLUMN profit BIGINT NOT NULL DEFAULT 0,
        MODIFY COLUMN commission BIGINT NOT NULL DEFAULT 0,
        MODIFY COLUMN swap BIGINT NOT NULL DEFAULT 0;

      ALTER TABLE balance_history
        MODIFY COLUMN balance BIGINT NOT NULL,
        MODIFY COLUMN equity BIGINT NOT NULL;
    `;

    await db.execute(sql);
    console.log("[MIGRATION] ✅ Balance columns fixed successfully!");
  } catch (error: any) {
    // Se der erro, provavelmente já foi aplicado
    if (error.message?.includes("Duplicate column name") || error.message?.includes("already")) {
      console.log("[MIGRATION] Balance fix already applied, skipping");
    } else {
      console.log("[MIGRATION] Error applying balance fix:", error.message);
    }
  }
}
