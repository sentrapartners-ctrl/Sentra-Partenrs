import express, { Request, Response } from "express";
import { getDb } from "../db";

const router = express.Router();

/**
 * POST /api/setup/create-licenses-table
 * Cria a tabela ea_licenses (usar apenas uma vez)
 */
router.post("/create-licenses-table", async (req: Request, res: Response) => {
  try {
    console.log("[Setup] Criando tabela ea_licenses...");

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Criar tabela
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ea_licenses (
        id int AUTO_INCREMENT PRIMARY KEY,
        user_id int NOT NULL,
        license_key varchar(255) NOT NULL UNIQUE,
        ea_name varchar(100) NOT NULL,
        license_type enum('trial', 'monthly', 'yearly', 'lifetime') DEFAULT 'trial',
        status enum('active', 'inactive', 'expired') DEFAULT 'active',
        allowed_accounts text,
        expires_at datetime,
        last_used_at datetime,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("[Setup] Tabela ea_licenses criada");

    // Criar índices
    try {
      await db.execute("CREATE INDEX idx_license_key ON ea_licenses(license_key)");
      console.log("[Setup] Índice idx_license_key criado");
    } catch (e: any) {
      if (!e.message.includes("Duplicate key name")) {
        console.log("[Setup] Índice idx_license_key já existe");
      }
    }

    try {
      await db.execute("CREATE INDEX idx_user_id ON ea_licenses(user_id)");
      console.log("[Setup] Índice idx_user_id criado");
    } catch (e: any) {
      if (!e.message.includes("Duplicate key name")) {
        console.log("[Setup] Índice idx_user_id já existe");
      }
    }

    try {
      await db.execute("CREATE INDEX idx_status ON ea_licenses(status)");
      console.log("[Setup] Índice idx_status criado");
    } catch (e: any) {
      if (!e.message.includes("Duplicate key name")) {
        console.log("[Setup] Índice idx_status já existe");
      }
    }

    // Verificar estrutura
    const [columns]: any = await db.execute("DESCRIBE ea_licenses");

    console.log("[Setup] ✅ Tabela ea_licenses configurada com sucesso!");

    res.json({
      success: true,
      message: "Tabela ea_licenses criada com sucesso",
      columns: columns.map((c: any) => ({
        field: c.Field,
        type: c.Type,
        null: c.Null,
        key: c.Key,
      })),
    });
  } catch (error: any) {
    console.error("[Setup] Erro ao criar tabela:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
