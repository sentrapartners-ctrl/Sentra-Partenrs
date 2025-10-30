import express from "express";
import { getRawConnection } from "../db";

const router = express.Router();

//====================================================
// GET /api/signal-providers
// Lista todos os provedores públicos ativos
//====================================================
router.get("/", async (req, res) => {
  try {
    const { sort = 'subscribers', search } = req.query;
    
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    let query = `
      SELECT 
        sp.id,
        sp.user_id,
        sp.master_account_number,
        sp.provider_name,
        sp.description,
        sp.subscription_fee,
        sp.currency,
        sp.created_at,
        ps.total_trades,
        ps.winning_trades,
        ps.losing_trades,
        ps.win_rate,
        ps.total_profit,
        ps.avg_profit,
        ps.max_drawdown,
        ps.sharpe_ratio,
        ps.total_subscribers,
        ps.active_subscribers,
        ps.last_trade_at,
        COALESCE(AVG(pr.rating), 0) as avg_rating,
        COUNT(DISTINCT pr.id) as review_count
      FROM signal_providers sp
      LEFT JOIN provider_statistics ps ON sp.id = ps.provider_id
      LEFT JOIN provider_reviews pr ON sp.id = pr.provider_id
      WHERE sp.is_public = true AND sp.is_active = true
    `;

    const params: any[] = [];

    if (search) {
      query += ` AND (sp.provider_name LIKE ? OR sp.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY sp.id`;

    // Ordenação
    switch (sort) {
      case 'subscribers':
        query += ` ORDER BY ps.active_subscribers DESC`;
        break;
      case 'winrate':
        query += ` ORDER BY ps.win_rate DESC`;
        break;
      case 'profit':
        query += ` ORDER BY ps.total_profit DESC`;
        break;
      case 'rating':
        query += ` ORDER BY avg_rating DESC`;
        break;
      case 'newest':
        query += ` ORDER BY sp.created_at DESC`;
        break;
      default:
        query += ` ORDER BY ps.active_subscribers DESC`;
    }

    const [providers]: any = await connection.execute(query, params);

    res.json({
      success: true,
      providers
    });

  } catch (error: any) {
    console.error('[Signal Providers] Erro ao listar provedores:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// GET /api/signal-providers/:id
// Detalhes de um provedor específico
//====================================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [providers]: any = await connection.execute(
      `SELECT 
        sp.*,
        ps.*,
        COALESCE(AVG(pr.rating), 0) as avg_rating,
        COUNT(DISTINCT pr.id) as review_count
      FROM signal_providers sp
      LEFT JOIN provider_statistics ps ON sp.id = ps.provider_id
      LEFT JOIN provider_reviews pr ON sp.id = pr.provider_id
      WHERE sp.id = ?
      GROUP BY sp.id`,
      [id]
    );

    if (!providers || providers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Provedor não encontrado'
      });
    }

    // Buscar reviews
    const [reviews]: any = await connection.execute(
      `SELECT pr.*, u.email as reviewer_email
       FROM provider_reviews pr
       LEFT JOIN users u ON pr.subscriber_user_id = u.id
       WHERE pr.provider_id = ?
       ORDER BY pr.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      provider: providers[0],
      reviews
    });

  } catch (error: any) {
    console.error('[Signal Providers] Erro ao buscar provedor:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// POST /api/signal-providers
// Criar novo provedor (compartilhar sinais)
//====================================================
router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      master_account_number,
      provider_name,
      description,
      is_public = true,
      subscription_fee = 0,
      currency = 'USD'
    } = req.body;

    if (!user_id || !master_account_number || !provider_name) {
      return res.status(400).json({
        success: false,
        error: 'user_id, master_account_number e provider_name são obrigatórios'
      });
    }

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    // Criar provedor
    const [result]: any = await connection.execute(
      `INSERT INTO signal_providers 
       (user_id, master_account_number, provider_name, description, is_public, subscription_fee, currency)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, master_account_number, provider_name, description, is_public, subscription_fee, currency]
    );

    const providerId = result.insertId;

    // Criar estatísticas iniciais
    await connection.execute(
      `INSERT INTO provider_statistics (provider_id) VALUES (?)`,
      [providerId]
    );

    res.json({
      success: true,
      provider_id: providerId,
      message: 'Provedor criado com sucesso'
    });

  } catch (error: any) {
    console.error('[Signal Providers] Erro ao criar provedor:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// PUT /api/signal-providers/:id
// Atualizar provedor
//====================================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      provider_name,
      description,
      is_public,
      is_active,
      subscription_fee
    } = req.body;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (provider_name !== undefined) {
      updates.push('provider_name = ?');
      params.push(provider_name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (is_public !== undefined) {
      updates.push('is_public = ?');
      params.push(is_public);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    if (subscription_fee !== undefined) {
      updates.push('subscription_fee = ?');
      params.push(subscription_fee);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar'
      });
    }

    params.push(id);

    await connection.execute(
      `UPDATE signal_providers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Provedor atualizado com sucesso'
    });

  } catch (error: any) {
    console.error('[Signal Providers] Erro ao atualizar provedor:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// POST /api/signal-providers/:id/subscribe
// Assinar um provedor
//====================================================
router.post("/:id/subscribe", async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriber_user_id, slave_account_number } = req.body;

    if (!subscriber_user_id || !slave_account_number) {
      return res.status(400).json({
        success: false,
        error: 'subscriber_user_id e slave_account_number são obrigatórios'
      });
    }

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    // Verificar se provedor existe e está ativo
    const [providers]: any = await connection.execute(
      `SELECT * FROM signal_providers WHERE id = ? AND is_active = true`,
      [id]
    );

    if (!providers || providers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Provedor não encontrado ou inativo'
      });
    }

    // Criar assinatura
    await connection.execute(
      `INSERT INTO signal_subscriptions 
       (subscriber_user_id, provider_id, slave_account_number, status)
       VALUES (?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE status = 'active', updated_at = CURRENT_TIMESTAMP`,
      [subscriber_user_id, id, slave_account_number]
    );

    // Atualizar contadores
    await connection.execute(
      `UPDATE provider_statistics 
       SET total_subscribers = (
         SELECT COUNT(DISTINCT subscriber_user_id) 
         FROM signal_subscriptions 
         WHERE provider_id = ?
       ),
       active_subscribers = (
         SELECT COUNT(*) 
         FROM signal_subscriptions 
         WHERE provider_id = ? AND status = 'active'
       )
       WHERE provider_id = ?`,
      [id, id, id]
    );

    res.json({
      success: true,
      message: 'Assinatura realizada com sucesso'
    });

  } catch (error: any) {
    console.error('[Signal Providers] Erro ao assinar provedor:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// POST /api/signal-providers/:id/unsubscribe
// Cancelar assinatura
//====================================================
router.post("/:id/unsubscribe", async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriber_user_id, slave_account_number } = req.body;

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    await connection.execute(
      `UPDATE signal_subscriptions 
       SET status = 'cancelled'
       WHERE provider_id = ? AND subscriber_user_id = ? AND slave_account_number = ?`,
      [id, subscriber_user_id, slave_account_number]
    );

    // Atualizar contadores
    await connection.execute(
      `UPDATE provider_statistics 
       SET active_subscribers = (
         SELECT COUNT(*) 
         FROM signal_subscriptions 
         WHERE provider_id = ? AND status = 'active'
       )
       WHERE provider_id = ?`,
      [id, id]
    );

    res.json({
      success: true,
      message: 'Assinatura cancelada com sucesso'
    });

  } catch (error: any) {
    console.error('[Signal Providers] Erro ao cancelar assinatura:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// GET /api/signal-providers/my/subscriptions
// Minhas assinaturas
//====================================================
router.get("/my/subscriptions", async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id é obrigatório'
      });
    }

    const connection = await getRawConnection();
    if (!connection) {
      throw new Error('Conexão com banco não disponível');
    }

    const [subscriptions]: any = await connection.execute(
      `SELECT 
        ss.*,
        sp.provider_name,
        sp.master_account_number,
        ps.win_rate,
        ps.total_profit,
        ps.active_subscribers
      FROM signal_subscriptions ss
      JOIN signal_providers sp ON ss.provider_id = sp.id
      LEFT JOIN provider_statistics ps ON sp.id = ps.provider_id
      WHERE ss.subscriber_user_id = ?
      ORDER BY ss.created_at DESC`,
      [user_id]
    );

    res.json({
      success: true,
      subscriptions
    });

  } catch (error: any) {
    console.error('[Signal Providers] Erro ao buscar assinaturas:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
