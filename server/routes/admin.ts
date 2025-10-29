import express, { Request, Response } from "express";
import { getDb } from "../db";
import { trades } from "../../drizzle/schema";
import { sql } from "drizzle-orm";
import { populateBalanceHistory } from "../scripts/populate-balance-history";

const router = express.Router();

/**
 * POST /api/admin/delete-all-trades
 * Deleta todos os trades do banco de dados
 * Requer senha de admin
 */
router.post("/delete-all-trades", async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    // Senha de admin (você pode mudar depois)
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sentra2025";

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: "Senha incorreta",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database não disponível",
      });
    }

    console.log("[ADMIN] Deletando todos os trades...");
    
    const result = await db.delete(trades);
    
    console.log("[ADMIN] ✅ Todos os trades foram deletados!");

    res.json({
      success: true,
      message: "Todos os trades foram deletados com sucesso",
      result,
    });
  } catch (error: any) {
    console.error("[ADMIN] Erro ao deletar trades:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/run-migration
 * Aplica migration para adicionar isCentAccount na tabela balance_history
 */
router.post("/run-migration", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Verifica se a coluna já existe
    const checkColumn = await db.execute(sql`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'defaultdb' 
        AND TABLE_NAME = 'balance_history' 
        AND COLUMN_NAME = 'isCentAccount'
    `);

    if (checkColumn.length > 0) {
      return res.json({ 
        success: true, 
        message: "Migration already applied - column isCentAccount exists" 
      });
    }

    // Aplica a migration
    await db.execute(sql`
      ALTER TABLE balance_history 
      ADD COLUMN isCentAccount BOOLEAN NOT NULL DEFAULT FALSE
    `);

    console.log("✅ Migration applied: isCentAccount column added to balance_history");

    res.json({ 
      success: true, 
      message: "Migration applied successfully" 
    });
  } catch (error: any) {
    console.error("❌ Migration error:", error);
    res.status(500).json({ 
      error: "Failed to apply migration", 
      details: error.message 
    });
  }
});

/**
 * POST /api/admin/populate-balance-history
 * Popula a tabela balance_history baseado nos trades existentes
 */
router.post("/populate-balance-history", async (req: Request, res: Response) => {
  try {
    console.log("[ADMIN] Iniciando população de balance_history...");
    
    await populateBalanceHistory();
    
    console.log("[ADMIN] ✅ Balance history populado com sucesso!");

    res.json({
      success: true,
      message: "Balance history populado com sucesso",
    });
  } catch (error: any) {
    console.error("[ADMIN] Erro ao popular balance history:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
