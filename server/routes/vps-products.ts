import express from 'express';
import { getRawConnection } from '../db';

const router = express.Router();

// GET /api/vps-products - Listar todos os produtos VPS
router.get("/", async (req, res) => {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [products]: any = await connection.execute(
      `SELECT * FROM vps_products ORDER BY price ASC`
    );

    res.json({
      success: true,
      products
    });
  } catch (error: any) {
    console.error('[VPS Products] Erro ao listar produtos:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /api/vps-products - Criar novo produto VPS
router.post("/", async (req, res) => {
  try {
    const { 
      name, 
      price, 
      ram, 
      cpu, 
      storage, 
      bandwidth,
      max_mt4_instances = 5,
      max_mt5_instances = 5,
      is_free = false,
      is_recommended = false,
      active = true 
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        error: 'name e price são obrigatórios'
      });
    }

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [result]: any = await connection.execute(
      `INSERT INTO vps_products 
       (name, price, ram, cpu, storage, bandwidth, max_mt4_instances, max_mt5_instances, is_free, is_recommended, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        price, 
        ram || null, 
        cpu || null, 
        storage || null, 
        bandwidth || null, 
        max_mt4_instances || null, 
        max_mt5_instances || null, 
        is_free ? 1 : 0, 
        is_recommended ? 1 : 0, 
        active ? 1 : 0
      ]
    );

    res.json({
      success: true,
      product_id: result.insertId,
      message: 'Produto VPS criado com sucesso'
    });
  } catch (error: any) {
    console.error('[VPS Products] Erro ao criar produto:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// PUT /api/vps-products/:id - Atualizar produto VPS
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      price, 
      ram, 
      cpu, 
      storage, 
      bandwidth,
      max_mt4_instances,
      max_mt5_instances,
      is_free,
      is_recommended,
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
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (ram !== undefined) {
      updates.push('ram = ?');
      params.push(ram);
    }
    if (cpu !== undefined) {
      updates.push('cpu = ?');
      params.push(cpu);
    }
    if (storage !== undefined) {
      updates.push('storage = ?');
      params.push(storage);
    }
    if (bandwidth !== undefined) {
      updates.push('bandwidth = ?');
      params.push(bandwidth);
    }
    if (max_mt4_instances !== undefined) {
      updates.push('max_mt4_instances = ?');
      params.push(max_mt4_instances);
    }
    if (max_mt5_instances !== undefined) {
      updates.push('max_mt5_instances = ?');
      params.push(max_mt5_instances);
    }
    if (is_free !== undefined) {
      updates.push('is_free = ?');
      params.push(is_free);
    }
    if (is_recommended !== undefined) {
      updates.push('is_recommended = ?');
      params.push(is_recommended);
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
      `UPDATE vps_products SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Produto VPS atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('[VPS Products] Erro ao atualizar produto:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// DELETE /api/vps-products/:id - Deletar produto VPS
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    await connection.execute(
      `DELETE FROM vps_products WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Produto VPS deletado com sucesso'
    });
  } catch (error: any) {
    console.error('[VPS Products] Erro ao deletar produto:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
