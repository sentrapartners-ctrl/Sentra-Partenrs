import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

// GET /api/subscription-plans - Listar todos os planos
router.get("/", async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [plans]: any = await connection.execute(
      `SELECT * FROM subscription_plans ORDER BY price ASC`
    );

    // Converter features de TEXT para array
    const plansWithFeatures = plans.map((plan: any) => ({
      ...plan,
      features: plan.features ? plan.features.split('\n').filter((f: string) => f.trim()) : []
    }));

    res.json({
      success: true,
      plans: plansWithFeatures
    });
  } catch (error: any) {
    console.error('[Subscription Plans] Erro ao listar planos:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /api/subscription-plans - Criar novo plano
router.post("/", async (req, res) => {
  try {
    const { name, slug, price, features, active = true } = req.body;

    if (!name || !slug || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'name, slug e price são obrigatórios'
      });
    }

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    // Converter array de features para TEXT
    const featuresText = Array.isArray(features) ? features.join('\n') : features || '';

    const [result]: any = await connection.execute(
      `INSERT INTO subscription_plans (name, slug, price, features, active)
       VALUES (?, ?, ?, ?, ?)`,
      [name, slug, price, featuresText, active]
    );

    res.json({
      success: true,
      plan_id: result.insertId,
      message: 'Plano criado com sucesso'
    });
  } catch (error: any) {
    console.error('[Subscription Plans] Erro ao criar plano:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// PUT /api/subscription-plans/:id - Atualizar plano
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, price, features, active } = req.body;

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
    if (slug !== undefined) {
      updates.push('slug = ?');
      params.push(slug);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (features !== undefined) {
      const featuresText = Array.isArray(features) ? features.join('\n') : features;
      updates.push('features = ?');
      params.push(featuresText);
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
      `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Plano atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('[Subscription Plans] Erro ao atualizar plano:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// DELETE /api/subscription-plans/:id - Deletar plano
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    await connection.execute(
      `DELETE FROM subscription_plans WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Plano deletado com sucesso'
    });
  } catch (error: any) {
    console.error('[Subscription Plans] Erro ao deletar plano:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
