import { getDb } from "./db";
import { trades } from "../drizzle/schema";

async function deleteAllTrades() {
  console.log("🗑️  Deletando todos os trades...");
  
  const db = await getDb();
  if (!db) {
    console.error("❌ Database não disponível");
    process.exit(1);
  }

  try {
    const result = await db.delete(trades);
    console.log("✅ Todos os trades foram deletados!");
    console.log("📊 Resultado:", result);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao deletar trades:", error);
    process.exit(1);
  }
}

deleteAllTrades();
