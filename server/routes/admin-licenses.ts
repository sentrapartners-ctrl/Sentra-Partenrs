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
    console.log("[Admin Licenses] GET / - Iniciando...");
    
    const db = await getDb();
    if (!db) {
      console.error("[Admin Licenses] Database not available");
      return res.status(500).json({ 
        success: false,
        error: "Database not available" 
      });
    }

    console.log("[Admin Licenses] Database conectado");

    // Query simples primeiro
    const query = `
      SELECT 
        l.id,
        l.user_id as userId,
        l.license_key as licenseKey,
        l.ea_name as eaName,
        l.license_type as licenseType,
        l.status,
        l.allowed_accounts as allowedAccounts,
        l.expires_at as expiresAt,
        l.last_used_at as lastUsedAt,
        l.created_at as createdAt,
        u.email as userEmail
      FROM ea_licenses l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `;

    console.log("[Admin Licenses] Executando query...");
    const [rows]: any = await db.execute(query);
    
    console.log(`[Admin Licenses] Query OK - ${rows.length} licenças encontradas`);

    return res.json({ 
      success: true,
      licenses: rows 
    });

  } catch (error: any) {
    console.error("[Admin Licenses] ERRO:", error.message);
    console.error("[Admin Licenses] Stack:", error.stack);
    
    return res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

/**
 * POST /api/admin/licenses
 * Cria uma nova licença
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    console.log("[Admin Licenses] POST / - Criando licença...");
    
    const {
      userEmail,
      licenseKey,
      eaName,
      licenseType,
      allowedAccounts,
      expiresAt,
    } = req.body;

    console.log("[Admin Licenses] Dados recebidos:", {
      userEmail,
      licenseKey: licenseKey ? licenseKey.substring(0, 10) + '...' : 'VAZIO',
      eaName,
      licenseType
    });
    console.log("[Admin Licenses] Body completo:", JSON.stringify(req.body));

    // Validação rigorosa
    if (!userEmail || userEmail.trim() === '') {
      console.log("[Admin Licenses] ❌ userEmail vazio");
      return res.status(400).json({
        success: false,
        error: "userEmail é obrigatório",
      });
    }

    if (!licenseKey || licenseKey.trim() === '') {
      console.log("[Admin Licenses] ❌ licenseKey vazio");
      return res.status(400).json({
        success: false,
        error: "licenseKey é obrigatório",
      });
    }

    if (!eaName || eaName.trim() === '') {
      console.log("[Admin Licenses] ❌ eaName vazio");
      return res.status(400).json({
        success: false,
        error: "eaName é obrigatório",
      });
    }

    // Buscar usuário pelo email
    const user = await getUserByEmail(userEmail);
    if (!user) {
      console.log("[Admin Licenses] Usuário não encontrado:", userEmail);
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }

    console.log("[Admin Licenses] Usuário encontrado:", user.id);

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false,
        error: "Database not available" 
      });
    }

    // Verificar se a chave já existe
    const [existing]: any = await db.execute(
      "SELECT id FROM ea_licenses WHERE license_key = ?",
      [licenseKey]
    );

    if (existing.length > 0) {
      console.log("[Admin Licenses] Chave já existe");
      return res.status(400).json({ 
        success: false,
        error: "Chave de licença já existe" 
      });
    }

    // Criar licença
    console.log("[Admin Licenses] Inserindo no banco...");
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

    console.log("[Admin Licenses] Licença criada com sucesso!");

    return res.json({
      success: true,
      message: "Licença criada com sucesso",
    });
    
  } catch (error: any) {
    console.error("[Admin Licenses] Erro ao criar licença:", error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
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

    console.log("[Admin Licenses] PATCH /:id - Atualizando licença:", id);

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false,
        error: "Database not available" 
      });
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
      return res.status(400).json({ 
        success: false,
        error: "Nenhum campo para atualizar" 
      });
    }

    values.push(id);

    await db.execute(
      `UPDATE ea_licenses SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`,
      values
    );

    console.log("[Admin Licenses] Licença atualizada:", id);

    return res.json({
      success: true,
      message: "Licença atualizada com sucesso",
    });
    
  } catch (error: any) {
    console.error("[Admin Licenses] Erro ao atualizar licença:", error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * DELETE /api/admin/licenses/:id
 * Exclui uma licença
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log("[Admin Licenses] DELETE /:id - Excluindo licença:", id);

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ 
        success: false,
        error: "Database not available" 
      });
    }

    await db.execute("DELETE FROM ea_licenses WHERE id = ?", [id]);

    console.log("[Admin Licenses] Licença excluída:", id);

    return res.json({
      success: true,
      message: "Licença excluída com sucesso",
    });
    
  } catch (error: any) {
    console.error("[Admin Licenses] Erro ao excluir licença:", error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
