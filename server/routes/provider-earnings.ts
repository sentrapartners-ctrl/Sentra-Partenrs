import express from "express";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

const router = express.Router();

// GET /api/provider-earnings - Obter ganhos do provedor logado
router.get("/", async (req, res) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ success: false, error: "Database not available" });
    }

    // Buscar signal provider do usuário
    const providers = await db.execute(
      sql`SELECT id FROM signal_providers WHERE user_id = ${userId}`
    );

    if (!providers.rows || providers.rows.length === 0) {
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

    const providerId = (providers.rows[0] as any).id;

    // Buscar estatísticas de ganhos
    const stats = await db.execute(sql`
      SELECT 
        SUM(provider_earnings) as total_earnings,
        SUM(CASE WHEN status = 'pending' THEN provider_earnings ELSE 0 END) as pending_earnings,
        SUM(CASE WHEN status = 'paid' THEN provider_earnings ELSE 0 END) as paid_earnings,
        COUNT(DISTINCT subscriber_id) as total_subscribers
      FROM provider_commissions
      WHERE provider_id = ${providerId}
    `);

    // Buscar carteira do provedor
    const wallets = await db.execute(
      sql`SELECT * FROM provider_wallets WHERE provider_id = ${providerId}`
    );

    // Buscar histórico de comissões
    const commissions = await db.execute(sql`
      SELECT 
        pc.*,
        u.username as subscriber_username,
        u.email as subscriber_email
      FROM provider_commissions pc
      LEFT JOIN users u ON pc.subscriber_id = u.id
      WHERE pc.provider_id = ${providerId}
      ORDER BY pc.created_at DESC
      LIMIT 50
    `);

    const statsRow = stats.rows?.[0] as any;

    res.json({
      success: true,
      isProvider: true,
      earnings: {
        total: parseFloat(statsRow?.total_earnings || 0),
        pending: parseFloat(statsRow?.pending_earnings || 0),
        paid: parseFloat(statsRow?.paid_earnings || 0),
        subscribers: statsRow?.total_subscribers || 0
      },
      wallet: wallets.rows?.[0] || null,
      commissions: commissions.rows || []
    });

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

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ success: false, error: "Database not available" });
    }

    // Buscar signal provider do usuário
    const providers = await db.execute(
      sql`SELECT id FROM signal_providers WHERE user_id = ${userId}`
    );

    if (!providers.rows || providers.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Você precisa ser um provedor de sinais" 
      });
    }

    const providerId = (providers.rows[0] as any).id;

    // Inserir ou atualizar carteira
    await db.execute(sql`
      INSERT INTO provider_wallets (provider_id, wallet_address, network, currency)
      VALUES (${providerId}, ${wallet_address}, ${network}, ${currency || 'USDT'})
      ON DUPLICATE KEY UPDATE 
        wallet_address = VALUES(wallet_address),
        network = VALUES(network),
        currency = VALUES(currency),
        verified = FALSE
    `);

    res.json({ 
      success: true, 
      message: "Carteira cadastrada com sucesso! Aguarde verificação." 
    });

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

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ success: false, error: "Database not available" });
    }

    const platformFee = (amount * 0.10).toFixed(2); // 10% para plataforma
    const providerEarnings = (amount * 0.90).toFixed(2); // 90% para provedor

    await db.execute(sql`
      INSERT INTO provider_commissions 
      (provider_id, subscriber_id, subscription_id, amount, platform_fee, provider_earnings, status)
      VALUES (${provider_id}, ${subscriber_id}, ${subscription_id}, ${amount}, ${platformFee}, ${providerEarnings}, 'pending')
    `);

    res.json({ success: true, message: "Comissão registrada" });

  } catch (error) {
    console.error("Erro ao registrar comissão:", error);
    res.status(500).json({ success: false, error: "Erro ao registrar comissão" });
  }
});

// GET /api/admin/provider-earnings - Admin: Obter ganhos de todos os provedores
router.get("/admin/provider-earnings", async (req, res) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ success: false, error: "Database not available" });
    }

    // Verificar se é admin ou manager
    const userCheck = await db.execute(
      sql`SELECT role FROM users WHERE id = ${userId}`
    );
    
    const userRole = (userCheck.rows[0] as any)?.role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ success: false, error: "Acesso negado" });
    }

    // Buscar earnings de todos os provedores
    const providersData = await db.execute(sql`
      SELECT 
        sp.id as provider_id,
        sp.provider_name,
        sp.master_account_number,
        COALESCE(SUM(pc.provider_earnings), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN pc.status = 'pending' THEN pc.provider_earnings ELSE 0 END), 0) as pending_earnings,
        COALESCE(SUM(CASE WHEN pc.status = 'paid' THEN pc.provider_earnings ELSE 0 END), 0) as paid_earnings,
        COUNT(DISTINCT ss.subscriber_user_id) as active_subscribers,
        pw.wallet_address,
        pw.network as wallet_network
      FROM signal_providers sp
      LEFT JOIN provider_commissions pc ON sp.id = pc.provider_id
      LEFT JOIN signal_subscriptions ss ON sp.id = ss.provider_id AND ss.status = 'active'
      LEFT JOIN provider_wallets pw ON sp.user_id = pw.user_id
      GROUP BY sp.id, sp.provider_name, sp.master_account_number, pw.wallet_address, pw.network
      HAVING COALESCE(SUM(pc.provider_earnings), 0) > 0
      ORDER BY pending_earnings DESC
    `);

    // Estatísticas gerais
    const statsData = await db.execute(sql`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'pending' THEN provider_earnings ELSE 0 END), 0) as total_pending,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN provider_earnings ELSE 0 END), 0) as total_paid,
        COUNT(DISTINCT provider_id) as total_providers,
        COUNT(DISTINCT subscriber_id) as total_subscribers
      FROM provider_commissions
    `);

    const stats = statsData.rows[0] as any;

    res.json({
      success: true,
      providers: providersData.rows,
      stats: {
        totalPending: parseFloat(stats.total_pending || 0),
        totalPaid: parseFloat(stats.total_paid || 0),
        totalProviders: parseInt(stats.total_providers || 0),
        totalSubscribers: parseInt(stats.total_subscribers || 0)
      }
    });

  } catch (error: any) {
    console.error("[Admin Provider Earnings] Erro:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/provider-commissions - Admin: Obter todas as comissões
router.get("/admin/provider-commissions", async (req, res) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ success: false, error: "Database not available" });
    }

    // Verificar se é admin ou manager
    const userCheck = await db.execute(
      sql`SELECT role FROM users WHERE id = ${userId}`
    );
    
    const userRole = (userCheck.rows[0] as any)?.role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ success: false, error: "Acesso negado" });
    }

    // Buscar todas as comissões
    const commissionsData = await db.execute(sql`
      SELECT 
        pc.*,
        sp.provider_name,
        u.username as subscriber_username
      FROM provider_commissions pc
      JOIN signal_providers sp ON pc.provider_id = sp.id
      JOIN users u ON pc.subscriber_id = u.id
      ORDER BY pc.created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      commissions: commissionsData.rows
    });

  } catch (error: any) {
    console.error("[Admin Provider Commissions] Erro:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/provider-commissions/:id/mark-paid - Admin: Marcar comissão como paga
router.post("/admin/provider-commissions/:id/mark-paid", async (req, res) => {
  try {
    const userId = req.session?.userId;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ success: false, error: "Database not available" });
    }

    // Verificar se é admin ou manager
    const userCheck = await db.execute(
      sql`SELECT role FROM users WHERE id = ${userId}`
    );
    
    const userRole = (userCheck.rows[0] as any)?.role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ success: false, error: "Acesso negado" });
    }

    // Atualizar status da comissão
    await db.execute(sql`
      UPDATE provider_commissions 
      SET status = 'paid', paid_at = NOW()
      WHERE id = ${id}
    `);

    res.json({
      success: true,
      message: "Comissão marcada como paga"
    });

  } catch (error: any) {
    console.error("[Admin Mark Paid] Erro:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
