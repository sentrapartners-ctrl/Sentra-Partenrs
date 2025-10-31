import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

// GET /api/expert-advisors - Listar todos os EAs
router.get("/", async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [eas]: any = await connection.execute(
      `SELECT * FROM expert_advisors ORDER BY name ASC`
    );

    res.json({
      success: true,
      eas
    });
  } catch (error: any) {
    console.error('[Expert Advisors] Erro ao listar EAs:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /api/expert-advisors - Criar novo EA
router.post("/", async (req, res) => {
  try {
    const { 
      name, 
      description,
      price, 
      platform,
      file_url,
      active = true 
    } = req.body;

    if (!name || price === undefined || !platform) {
      return res.status(400).json({
        success: false,
        error: 'name, price e platform são obrigatórios'
      });
    }

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [result]: any = await connection.execute(
      `INSERT INTO expert_advisors 
       (name, description, price, platform, file_url, active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name, 
        description || null, 
        price, 
        platform, 
        file_url || null, 
        active ? 1 : 0
      ]
    );

    res.json({
      success: true,
      ea_id: result.insertId,
      message: 'EA criado com sucesso'
    });
  } catch (error: any) {
    console.error('[Expert Advisors] Erro ao criar EA:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// PUT /api/expert-advisors/:id - Atualizar EA
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description,
      price, 
      platform,
      file_url,
      active 
    } = req.body;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (platform !== undefined) {
      updates.push('platform = ?');
      params.push(platform);
    }
    if (file_url !== undefined) {
      updates.push('file_url = ?');
      params.push(file_url);
    }
    if (active !== undefined) {
      updates.push('active = ?');
      params.push(active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar'
      });
    }

    params.push(id);

    await connection.execute(
      `UPDATE expert_advisors SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'EA atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('[Expert Advisors] Erro ao atualizar EA:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// DELETE /api/expert-advisors/:id - Deletar EA
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    await connection.execute(
      `DELETE FROM expert_advisors WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'EA deletado com sucesso'
    });
  } catch (error: any) {
    console.error('[Expert Advisors] Erro ao deletar EA:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /api/expert-advisors/:id/download - Incrementar contador de downloads
router.post("/:id/download", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    await connection.execute(
      `UPDATE expert_advisors SET downloads = downloads + 1 WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Download registrado'
    });
  } catch (error: any) {
    console.error('[Expert Advisors] Erro ao registrar download:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
