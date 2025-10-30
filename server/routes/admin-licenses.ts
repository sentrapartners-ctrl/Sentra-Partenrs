import express, { Request, Response } from "express";
import { getDb } from "../db";
import { getUserByEmail } from "../auth";

const router = express.Router();

/**
 * GET /api/admin/licenses
 * Lista todas as licenças
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const [licenses]: any = await db.execute(`
      SELECT 
        l.*,
        u.email as userEmail
      FROM ea_licenses l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `);

    res.json({ licenses });
  } catch (error: any) {
    console.error("[Admin] Erro ao listar licenças:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/licenses
 * Cria uma nova licença
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      userEmail,
      licenseKey,
      eaName,
      licenseType,
      allowedAccounts,
      expiresAt,
    } = req.body;

    if (!userEmail || !licenseKey || !eaName) {
      return res.status(400).json({
        error: "Parâmetros obrigatórios: userEmail, licenseKey, eaName",
      });
    }

    // Buscar usuário pelo email
    const user = await getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Verificar se a chave já existe
    const [existing]: any = await db.execute(
      "SELECT id FROM ea_licenses WHERE license_key = ?",
      [licenseKey]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Chave de licença já existe" });
    }

    // Criar licença
    await db.execute(
      `INSERT INTO ea_licenses 
        (user_id, license_key, ea_name, license_type, allowed_accounts, expires_at, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [
        user.id,
        licenseKey,
        eaName,
        licenseType || "monthly",
        allowedAccounts || null,
        expiresAt || null,
      ]
    );

    console.log("[Admin] Licença criada:", {
      userEmail,
      eaName,
      licenseType,
    });

    res.json({
      success: true,
      message: "Licença criada com sucesso",
    });
  } catch (error: any) {
    console.error("[Admin] Erro ao criar licença:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/admin/licenses/:id
 * Atualiza uma licença
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, allowedAccounts, expiresAt } = req.body;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (status) {
      updates.push("status = ?");
      values.push(status);
    }
    if (allowedAccounts !== undefined) {
      updates.push("allowed_accounts = ?");
      values.push(allowedAccounts || null);
    }
    if (expiresAt !== undefined) {
      updates.push("expires_at = ?");
      values.push(expiresAt || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" });
    }

    values.push(id);

    await db.execute(
      `UPDATE ea_licenses SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
      values
    );

    console.log("[Admin] Licença atualizada:", id);

    res.json({
      success: true,
      message: "Licença atualizada com sucesso",
    });
  } catch (error: any) {
    console.error("[Admin] Erro ao atualizar licença:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/licenses/:id
 * Exclui uma licença
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    await db.execute("DELETE FROM ea_licenses WHERE id = ?", [id]);

    console.log("[Admin] Licença excluída:", id);

    res.json({
      success: true,
      message: "Licença excluída com sucesso",
    });
  } catch (error: any) {
    console.error("[Admin] Erro ao excluir licença:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
