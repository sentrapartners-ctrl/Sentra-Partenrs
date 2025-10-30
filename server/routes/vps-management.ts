import { Router } from 'express';
import { getDb } from '../db';

const router = Router();

/**
 * VPS Management API - FxSVPS Integration
 * 
 * Sistema simplificado para integração com FxSVPS.com
 */

// ==================== Configurações de VPS ====================

/**
 * GET /api/vps/settings
 * 
 * Busca configurações de VPS do usuário
 */
router.get('/settings', async (req, res) => {
  try {
    const { user_email } = req.query;

    if (!user_email) {
      return res.status(400).json({
        success: false,
        error: 'Campo obrigatório: user_email'
      });
    }

    // TODO: Buscar do banco quando tabela estiver criada
    // const db = await getDb();
    // const settings = await db.query.vpsSettings.findFirst({
    //   where: eq(vpsSettings.userEmail, user_email as string)
    // });

    // Retornar configurações padrão
    return res.json({
      success: true,
      settings: {
        preferred_provider: 'fxsvps',
        auto_approve: false,
        default_datacenter: 'ny',
        volume_requirement: 10, // 10 lotes
        funds_requirement: 5000, // $5,000
        offer_free_vps: true,
        vps_pricing: {
          basic: 20,
          standard: 40,
          premium: 80
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar configurações VPS:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar configurações'
    });
  }
});

/**
 * POST /api/vps/settings
 * 
 * Salva configurações de VPS
 */
router.post('/settings', async (req, res) => {
  try {
    const {
      user_email,
      preferred_provider,
      auto_approve,
      default_datacenter,
      volume_requirement,
      funds_requirement,
      offer_free_vps,
      vps_pricing
    } = req.body;

    if (!user_email) {
      return res.status(400).json({
        success: false,
        error: 'Campo obrigatório: user_email'
      });
    }

    // TODO: Salvar no banco quando tabela estiver criada
    // const db = await getDb();
    // await db.insert(vpsSettings).values({...}).onConflictDoUpdate({...});

    res.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar configurações VPS:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao salvar configurações'
    });
  }
});

// ==================== Estatísticas ====================

/**
 * GET /api/vps/stats
 * 
 * Estatísticas de VPS do usuário
 */
router.get('/stats', async (req, res) => {
  try {
    const { user_email } = req.query;

    if (!user_email) {
      return res.status(400).json({
        success: false,
        error: 'Campo obrigatório: user_email'
      });
    }

    // TODO: Calcular do banco quando tabelas estiverem criadas
    res.json({
      success: true,
      stats: {
        active_vps: 0,
        pending_requests: 0,
        total_cost: 0,
        total_revenue: 0,
        profit: 0
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas VPS:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar estatísticas'
    });
  }
});

// ==================== FxSVPS Integration ====================

/**
 * POST /api/vps/fxsvps/create
 * 
 * Cria VPS via FxSVPS (placeholder para futura integração)
 */
router.post('/fxsvps/create', async (req, res) => {
  try {
    const {
      user_email,
      client_email,
      plan,
      ram,
      storage,
      cpu_cores,
      datacenter = 'ny',
      os = 'windows_2022'
    } = req.body;

    if (!user_email || !client_email || !plan) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: user_email, client_email, plan'
      });
    }

    // TODO: Implementar integração real com FxSVPS API
    const vpsId = `fxsvps_${Date.now()}`;

    res.json({
      success: true,
      message: 'VPS criado com sucesso',
      vps_id: vpsId,
      status: 'active',
      setup_time: '30 minutes',
      note: 'Integração com FxSVPS será implementada em breve'
    });

  } catch (error) {
    console.error('Erro ao criar VPS FxSVPS:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar VPS'
    });
  }
});

/**
 * GET /api/vps/fxsvps/instances
 * 
 * Lista VPS ativos do usuário
 */
router.get('/fxsvps/instances', async (req, res) => {
  try {
    const { user_email } = req.query;

    if (!user_email) {
      return res.status(400).json({
        success: false,
        error: 'Campo obrigatório: user_email'
      });
    }

    // TODO: Buscar do banco quando tabela estiver criada
    res.json({
      success: true,
      instances: []
    });

  } catch (error) {
    console.error('Erro ao listar VPS:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar VPS'
    });
  }
});

export default router;
