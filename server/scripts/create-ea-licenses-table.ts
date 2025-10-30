import { getDb } from "../db";
import fs from "fs";
import path from "path";

async function createEaLicensesTable() {
  console.log("🔧 Criando tabela ea_licenses...");

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Ler arquivo SQL da migration
    const migrationPath = path.join(process.cwd(), "drizzle", "0015_create_ea_licenses.sql");
    const sql = fs.readFileSync(migrationPath, "utf-8");

    // Dividir em statements individuais
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    console.log(`📝 Executando ${statements.length} statements...`);

    for (const statement of statements) {
      console.log(`  ➜ ${statement.substring(0, 60)}...`);
      await db.execute(statement);
    }

    console.log("✅ Tabela ea_licenses criada com sucesso!");

    // Verificar se a tabela foi criada
    const [tables]: any = await db.execute("SHOW TABLES LIKE 'ea_licenses'");
    if (tables.length > 0) {
      console.log("✅ Verificação: Tabela existe no banco");
      
      // Mostrar estrutura da tabela
      const [columns]: any = await db.execute("DESCRIBE ea_licenses");
      console.log("\n📋 Estrutura da tabela:");
      columns.forEach((col: any) => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
      });
    }

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro ao criar tabela:", error.message);
    process.exit(1);
  }
}

createEaLicensesTable();
