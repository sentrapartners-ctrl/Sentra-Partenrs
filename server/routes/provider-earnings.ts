import express from "express";
import { pool } from "../_core/database";
import { RowDataPacket } from "mysql2";

const router = express.Router();

// GET /api/provider-earnings - Obter ganhos do provedor logado
router.get("/", async (req, res) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    const connection = await pool.getConnection();

    try {
      // Buscar signal provider do usuário
      const [providers] = await connection.execute<RowDataPacket[]>(
        "SELECT id FROM signal_providers WHERE user_id = ?",
        [userId]
      );

      if (providers.length === 0) {
        return res.json({
          success: true,
          isProvider: false,
          earnings: {
            total: 0,
            pending: 0,
            paid: 0,
            subscribers: 0
          },
          wallet: null,
          commissions: []
        });
      }

      const providerId = providers[0].id;

      // Buscar estatísticas de ganhos
      const [stats] = await connection.execute<RowDataPacket[]>(`
        SELECT 
          SUM(provider_earnings) as total_earnings,
          SUM(CASE WHEN status = 'pending' THEN provider_earnings ELSE 0 END) as pending_earnings,
          SUM(CASE WHEN status = 'paid' THEN provider_earnings ELSE 0 END) as paid_earnings,
          COUNT(DISTINCT subscriber_id) as total_subscribers
        FROM provider_commissions
        WHERE provider_id = ?
      `, [providerId]);

      // Buscar carteira do provedor
      const [wallets] = await connection.execute<RowDataPacket[]>(
        "SELECT * FROM provider_wallets WHERE provider_id = ?",
        [providerId]
      );

      // Buscar histórico de comissões
      const [commissions] = await connection.execute<RowDataPacket[]>(`
        SELECT 
          pc.*,
          u.username as subscriber_username,
          u.email as subscriber_email
        FROM provider_commissions pc
        LEFT JOIN users u ON pc.subscriber_id = u.id
        WHERE pc.provider_id = ?
        ORDER BY pc.created_at DESC
        LIMIT 50
      `, [providerId]);

      res.json({
        success: true,
        isProvider: true,
        earnings: {
          total: parseFloat(stats[0]?.total_earnings || 0),
          pending: parseFloat(stats[0]?.pending_earnings || 0),
          paid: parseFloat(stats[0]?.paid_earnings || 0),
          subscribers: stats[0]?.total_subscribers || 0
        },
        wallet: wallets[0] || null,
        commissions
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Erro ao buscar ganhos:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar ganhos" });
  }
});

// POST /api/provider-earnings/wallet - Cadastrar/atualizar carteira
router.post("/wallet", async (req, res) => {
  try {
    const userId = req.session?.userId;
    const { wallet_address, network, currency } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    if (!wallet_address || !network) {
      return res.status(400).json({ 
        success: false, 
        error: "Endereço de carteira e rede são obrigatórios" 
      });
    }

    const connection = await pool.getConnection();

    try {
      // Buscar signal provider do usuário
      const [providers] = await connection.execute<RowDataPacket[]>(
        "SELECT id FROM signal_providers WHERE user_id = ?",
        [userId]
      );

      if (providers.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: "Você precisa ser um provedor de sinais" 
        });
      }

      const providerId = providers[0].id;

      // Inserir ou atualizar carteira
      await connection.execute(`
        INSERT INTO provider_wallets (provider_id, wallet_address, network, currency)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          wallet_address = VALUES(wallet_address),
          network = VALUES(network),
          currency = VALUES(currency),
          verified = FALSE
      `, [providerId, wallet_address, network, currency || 'USDT']);

      res.json({ 
        success: true, 
        message: "Carteira cadastrada com sucesso! Aguarde verificação." 
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Erro ao cadastrar carteira:", error);
    res.status(500).json({ success: false, error: "Erro ao cadastrar carteira" });
  }
});

// POST /api/provider-earnings/record - Registrar comissão (webhook de pagamento)
router.post("/record", async (req, res) => {
  try {
    const { provider_id, subscriber_id, subscription_id, amount } = req.body;

    if (!provider_id || !subscriber_id || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: "Dados incompletos" 
      });
    }

    const connection = await pool.getConnection();

    try {
      const platformFee = (amount * 0.10).toFixed(2); // 10% para plataforma
      const providerEarnings = (amount * 0.90).toFixed(2); // 90% para provedor

      await connection.execute(`
        INSERT INTO provider_commissions 
        (provider_id, subscriber_id, subscription_id, amount, platform_fee, provider_earnings, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `, [provider_id, subscriber_id, subscription_id, amount, platformFee, providerEarnings]);

      res.json({ success: true, message: "Comissão registrada" });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Erro ao registrar comissão:", error);
    res.status(500).json({ success: false, error: "Erro ao registrar comissão" });
  }
});

export default router;
