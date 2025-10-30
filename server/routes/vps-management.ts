import { Router } from 'express';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';

const router = Router();

/**
 * VPS Management API
 * 
 * Integra com provedores de VPS (ForexVPS.net, FxSVPS, etc)
 * para oferecer VPS white label aos clientes
 */

// ==================== ForexVPS.net Integration ====================

/**
 * POST /api/vps/forexvps/request
 * 
 * Cliente solicita VPS via iframe ou formulário
 * Sistema envia email para admin aprovar
 */
router.post('/forexvps/request', async (req, res) => {
  try {
    const {
      user_email,
      client_name,
      client_email,
      plan = 'standard', // standard, premium, enterprise
      datacenter = 'ny', // ny, london, tokyo, etc
      volume_requirement, // Volume mínimo de trading
      funds_requirement, // Fundos mínimos na conta
    } = req.body;

    if (!user_email || !client_name || !client_email) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: user_email, client_name, client_email'
      });
    }

    // Salvar solicitação no banco
    const vpsRequest = await db.insert('vps_requests').values({
      user_email,
      client_name,
      client_email,
      provider: 'forexvps',
      plan,
      datacenter,
      volume_requirement,
      funds_requirement,
      status: 'pending',
      created_at: new Date()
    }).returning();

    // TODO: Enviar email para admin aprovar
    // TODO: Integrar com ForexVPS.net API quando disponível

    res.json({
      success: true,
      message: 'Solicitação de VPS enviada com sucesso',
      request_id: vpsRequest[0].id,
      status: 'pending',
      note: 'Você receberá um email para aprovar esta solicitação'
    });

  } catch (error) {
    console.error('Erro ao solicitar VPS ForexVPS:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar solicitação de VPS'
    });
  }
});

/**
 * POST /api/vps/forexvps/approve
 * 
 * Admin aprova solicitação de VPS
 */
router.post('/forexvps/approve', async (req, res) => {
  try {
    const { request_id, user_email } = req.body;

    if (!request_id || !user_email) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: request_id, user_email'
      });
    }

    // Buscar solicitação
    const request = await db.query.vpsRequests.findFirst({
      where: and(
        eq('id', request_id),
        eq('user_email', user_email),
        eq('status', 'pending')
      )
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Solicitação não encontrada ou já processada'
      });
    }

    // Atualizar status
    await db.update('vps_requests')
      .set({ 
        status: 'approved',
        approved_at: new Date()
      })
      .where(eq('id', request_id));

    // TODO: Chamar API ForexVPS.net para provisionar VPS
    // TODO: Enviar email para cliente com credenciais

    res.json({
      success: true,
      message: 'VPS aprovado e provisionado com sucesso',
      request_id,
      status: 'approved',
      note: 'Cliente receberá email com instruções de acesso'
    });

  } catch (error) {
    console.error('Erro ao aprovar VPS:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao aprovar VPS'
    });
  }
});

/**
 * POST /api/vps/forexvps/reject
 * 
 * Admin rejeita solicitação de VPS
 */
router.post('/forexvps/reject', async (req, res) => {
  try {
    const { request_id, user_email, reason } = req.body;

    if (!request_id || !user_email) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: request_id, user_email'
      });
    }

    // Atualizar status
    await db.update('vps_requests')
      .set({ 
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date()
      })
      .where(and(
        eq('id', request_id),
        eq('user_email', user_email)
      ));

    // TODO: Enviar email para cliente informando rejeição

    res.json({
      success: true,
      message: 'Solicitação rejeitada',
      request_id,
      status: 'rejected'
    });

  } catch (error) {
    console.error('Erro ao rejeitar VPS:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao rejeitar VPS'
    });
  }
});

/**
 * GET /api/vps/forexvps/requests
 * 
 * Lista solicitações de VPS do usuário
 */
router.get('/forexvps/requests', async (req, res) => {
  try {
    const { user_email } = req.query;

    if (!user_email) {
      return res.status(400).json({
        success: false,
        error: 'Campo obrigatório: user_email'
      });
    }

    const requests = await db.query.vpsRequests.findMany({
      where: eq('user_email', user_email as string),
      orderBy: (vpsRequests, { desc }) => [desc(vpsRequests.created_at)]
    });

    res.json({
      success: true,
      requests
    });

  } catch (error) {
    console.error('Erro ao listar solicitações VPS:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar solicitações'
    });
  }
});

// ==================== FxSVPS Integration ====================

/**
 * POST /api/vps/fxsvps/create
 * 
 * Cria VPS via FxSVPS API (automático)
 */
router.post('/fxsvps/create', async (req, res) => {
  try {
    const {
      user_email,
      client_email,
      plan, // basic, standard, premium
      ram, // 1, 2, 4, 8, 12 GB
      storage, // 20, 40, 80, 120, 250 GB
      cpu_cores, // 1, 2, 4, 8, 12
      datacenter = 'ny',
      os = 'windows_2022'
    } = req.body;

    if (!user_email || !client_email || !plan) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: user_email, client_email, plan'
      });
    }

    // TODO: Verificar crédito disponível do usuário
    // TODO: Chamar API FxSVPS para criar VPS
    // TODO: Deduzir crédito do usuário

    // Simular criação (substituir por chamada real à API)
    const vpsId = `fxsvps_${Date.now()}`;

    // Salvar no banco
    await db.insert('vps_instances').values({
      user_email,
      client_email,
      provider: 'fxsvps',
      vps_id: vpsId,
      plan,
      ram,
      storage,
      cpu_cores,
      datacenter,
      os,
      status: 'active',
      created_at: new Date()
    });

    res.json({
      success: true,
      message: 'VPS criado com sucesso',
      vps_id: vpsId,
      status: 'active',
      setup_time: '30 minutes',
      note: 'Cliente receberá email com credenciais em até 30 minutos'
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
 * DELETE /api/vps/fxsvps/:vps_id
 * 
 * Cancela/deleta VPS
 */
router.delete('/fxsvps/:vps_id', async (req, res) => {
  try {
    const { vps_id } = req.params;
    const { user_email } = req.body;

    if (!user_email) {
      return res.status(400).json({
        success: false,
        error: 'Campo obrigatório: user_email'
      });
    }

    // Buscar VPS
    const vps = await db.query.vpsInstances.findFirst({
      where: and(
        eq('vps_id', vps_id),
        eq('user_email', user_email)
      )
    });

    if (!vps) {
      return res.status(404).json({
        success: false,
        error: 'VPS não encontrado'
      });
    }

    // TODO: Chamar API FxSVPS para deletar VPS
    // TODO: Calcular pro rata e creditar de volta se aplicável

    // Atualizar status
    await db.update('vps_instances')
      .set({ 
        status: 'deleted',
        deleted_at: new Date()
      })
      .where(eq('vps_id', vps_id));

    res.json({
      success: true,
      message: 'VPS cancelado com sucesso',
      vps_id
    });

  } catch (error) {
    console.error('Erro ao deletar VPS:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar VPS'
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

    const instances = await db.query.vpsInstances.findMany({
      where: and(
        eq('user_email', user_email as string),
        eq('provider', 'fxsvps')
      ),
      orderBy: (vpsInstances, { desc }) => [desc(vpsInstances.created_at)]
    });

    res.json({
      success: false,
      instances
    });

  } catch (error) {
    console.error('Erro ao listar VPS:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar VPS'
    });
  }
});

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

    const settings = await db.query.vpsSettings.findFirst({
      where: eq('user_email', user_email as string)
    });

    // Retornar configurações padrão se não existir
    if (!settings) {
      return res.json({
        success: true,
        settings: {
          preferred_provider: 'forexvps',
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
    }

    res.json({
      success: true,
      settings
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

    // Upsert configurações
    await db.insert('vps_settings')
      .values({
        user_email,
        preferred_provider,
        auto_approve,
        default_datacenter,
        volume_requirement,
        funds_requirement,
        offer_free_vps,
        vps_pricing,
        updated_at: new Date()
      })
      .onConflictDoUpdate({
        target: 'user_email',
        set: {
          preferred_provider,
          auto_approve,
          default_datacenter,
          volume_requirement,
          funds_requirement,
          offer_free_vps,
          vps_pricing,
          updated_at: new Date()
        }
      });

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

    // Contar VPS ativos
    const activeVPS = await db.query.vpsInstances.findMany({
      where: and(
        eq('user_email', user_email as string),
        eq('status', 'active')
      )
    });

    // Contar solicitações pendentes
    const pendingRequests = await db.query.vpsRequests.findMany({
      where: and(
        eq('user_email', user_email as string),
        eq('status', 'pending')
      )
    });

    // TODO: Calcular custos e receitas

    res.json({
      success: true,
      stats: {
        active_vps: activeVPS.length,
        pending_requests: pendingRequests.length,
        total_cost: 0, // TODO: Calcular
        total_revenue: 0, // TODO: Calcular
        profit: 0 // TODO: Calcular
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

export default router;
