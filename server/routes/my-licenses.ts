import express, { Request, Response } from "express";
import { getDb } from "../db";

const router = express.Router();

/**
 * GET /api/my-licenses
 * Retorna as licenças do usuário logado
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // @ts-ignore - user é injetado pelo middleware de autenticação
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Não autenticado",
      });
    }

    console.log("[My Licenses] Buscando licenças do usuário:", userId);

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        error: "Database not available",
      });
    }

    const query = `
      SELECT 
        id,
        license_key as licenseKey,
        ea_name as eaName,
        license_type as licenseType,
        status,
        allowed_accounts as allowedAccounts,
        expires_at as expiresAt,
        last_used_at as lastUsedAt,
        created_at as createdAt
      FROM ea_licenses
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const [licenses]: any = await db.execute(query, [userId]);

    console.log(`[My Licenses] ${licenses.length} licenças encontradas`);

    return res.json({
      success: true,
      licenses,
    });
  } catch (error: any) {
    console.error("[My Licenses] Erro:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
