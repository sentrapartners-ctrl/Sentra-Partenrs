import { getDb } from "../db";
import fs from "fs";
import path from "path";

async function runMigrations() {
  console.log("[Migrations] Starting database migrations...");
  
  const db = getDb();
  const migrationPath = path.join(__dirname, "../../drizzle/migrations/0003_add_payments_tables.sql");
  
  try {
    const sql = fs.readFileSync(migrationPath, "utf-8");
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      try {
        await db.execute(statement);
        console.log(`[Migrations] Executed: ${statement.substring(0, 50)}...`);
      } catch (error: any) {
        // Ignore "table already exists" errors
        if (!error.message.includes("already exists")) {
          console.error(`[Migrations] Error executing statement:`, error.message);
        }
      }
    }
    
    console.log("[Migrations] Migrations completed successfully!");
  } catch (error) {
    console.error("[Migrations] Error running migrations:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runMigrations };

