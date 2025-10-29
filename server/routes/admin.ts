import express, { Request, Response } from "express";
import { getDb } from "../db";
import { trades } from "../../drizzle/schema";

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

export default router;
