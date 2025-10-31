import { Router } from 'express';

const router = Router();

// Mock data para simular VPS enquanto não temos a API real
const mockVPSInstances = new Map();
let nextVPSId = 1;

// Tipos de resposta da API
interface VPSInstance {
  id: string;
  userId: number;
  hostname: string;
  ipAddress: string;
  status: 'active' | 'suspended' | 'terminated' | 'pending';
  plan: string;
  os: string;
  ram: number;
  disk: number;
  cpu: number;
  createdAt: Date;
  username: string;
  password: string;
}

interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// ============================================
// ENDPOINTS MOCK (Enquanto não temos API real)
// ============================================

/**
 * GET /api/vps-management/my-vms
 * Lista VMs do cliente autenticado
 */
router.get('/my-vms', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      });
    }

    const { getDb } = await import('../db');
    const db = getDb();
    const { clientVMs } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');

    const vms = await db
      .select()
      .from(clientVMs)
      .where(eq(clientVMs.userId, userId));

    res.json({
      success: true,
      vms
    });
  } catch (error: any) {
    console.error('[VPS] Erro ao listar VMs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vps/instances
 * Lista todas as instâncias VPS do usuário
 */
router.get('/instances', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      });
    }

    // Filtrar VPS do usuário
    const userInstances = Array.from(mockVPSInstances.values())
      .filter((vps: VPSInstance) => vps.userId === userId);

    res.json({
      success: true,
      data: userInstances
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vps/claim-free
 * Ativa VPS grátis para usuários com plano que inclui freeVpsEnabled
 */
router.post('/claim-free', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      });
    }

    const { vpsProductId } = req.body;

    if (!vpsProductId) {
      return res.status(400).json({
        success: false,
        error: 'vpsProductId é obrigatório'
      });
    }

    // Verificar se usuário tem plano com VPS grátis
    const { getDb } = await import('../db');
    const db = getDb();
    const { userSubscriptions, subscriptionPlans, userPurchases, vpsProducts } = await import('../../drizzle/schema');
    const { eq, and, gt } = await import('drizzle-orm');

    // Buscar assinatura ativa
    const [activeSubscription] = await db
      .select({
        subscription: userSubscriptions,
        plan: subscriptionPlans,
      })
      .from(userSubscriptions)
      .innerJoin(
        subscriptionPlans,
        eq(userSubscriptions.planId, subscriptionPlans.id)
      )
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active'),
          gt(userSubscriptions.endDate, new Date())
        )
      )
      .limit(1);

    if (!activeSubscription || !activeSubscription.plan.freeVpsEnabled) {
      return res.status(403).json({
        success: false,
        error: 'Seu plano não inclui VPS grátis. Faça upgrade para ter acesso.'
      });
    }

    // Verificar se já ativou VPS grátis antes
    const existingPurchases = await db
      .select()
      .from(userPurchases)
      .where(
        and(
          eq(userPurchases.userId, userId),
          eq(userPurchases.productType, 'vps'),
          eq(userPurchases.amount, 0) // VPS grátis tem amount = 0
        )
      );

    if (existingPurchases.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Você já ativou sua VPS grátis. Apenas uma VPS grátis por conta.'
      });
    }

    // Buscar produto VPS
    const [vpsProduct] = await db
      .select()
      .from(vpsProducts)
      .where(eq(vpsProducts.id, vpsProductId))
      .limit(1);

    if (!vpsProduct) {
      return res.status(404).json({
        success: false,
        error: 'Produto VPS não encontrado'
      });
    }

    // Criar purchase com amount = 0 (grátis)
    await db
      .insert(userPurchases)
      .values({
        userId,
        productType: 'vps',
        productId: vpsProductId,
        productName: vpsProduct.name,
        amount: 0, // Grátis!
        status: 'completed',
        paymentMethod: 'crypto_btc', // Placeholder
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        notes: 'VPS grátis incluída no plano de assinatura'
      });

    res.json({
      success: true,
      data: {
        message: 'VPS grátis ativada com sucesso!'
      }
    });
  } catch (error: any) {
    console.error('[VPS] Erro ao ativar VPS grátis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vps/create
 * Cria uma nova instância VPS
 */
router.post('/create', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Usuário não autenticado' 
      });
    }

    const { hostname, plan, os, ram, disk, cpu } = req.body;

    // Validação básica
    if (!hostname || !plan || !os) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: hostname, plan, os'
      });
    }

    // Criar VPS mock
    const vpsId = `vps_${nextVPSId++}`;
    const newVPS: VPSInstance = {
      id: vpsId,
      userId,
      hostname,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      status: 'active',
      plan,
      os,
      ram: ram || 1024,
      disk: disk || 20,
      cpu: cpu || 1,
      createdAt: new Date(),
      username: 'root',
      password: Math.random().toString(36).substring(2, 15)
    };

    mockVPSInstances.set(vpsId, newVPS);

    res.json({
      success: true,
      data: newVPS
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vps/:id/suspend
 * Suspende uma instância VPS
 */
router.post('/:id/suspend', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const vps = mockVPSInstances.get(id);

    if (!vps) {
      return res.status(404).json({
        success: false,
        error: 'VPS não encontrado'
      });
    }

    if (vps.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para acessar este VPS'
      });
    }

    vps.status = 'suspended';
    mockVPSInstances.set(id, vps);

    res.json({
      success: true,
      data: vps
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/vps/:id/unsuspend
 * Reativa uma instância VPS
 */
router.post('/:id/unsuspend', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const vps = mockVPSInstances.get(id);

    if (!vps) {
      return res.status(404).json({
        success: false,
        error: 'VPS não encontrado'
      });
    }

    if (vps.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para acessar este VPS'
      });
    }

    vps.status = 'active';
    mockVPSInstances.set(id, vps);

    res.json({
      success: true,
      data: vps
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/vps/:id
 * Termina (deleta) uma instância VPS
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const vps = mockVPSInstances.get(id);

    if (!vps) {
      return res.status(404).json({
        success: false,
        error: 'VPS não encontrado'
      });
    }

    if (vps.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para acessar este VPS'
      });
    }

    vps.status = 'terminated';
    mockVPSInstances.set(id, vps);

    res.json({
      success: true,
      message: 'VPS terminado com sucesso'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vps/:id/stats
 * Obtém estatísticas de uso do VPS
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const vps = mockVPSInstances.get(id);

    if (!vps) {
      return res.status(404).json({
        success: false,
        error: 'VPS não encontrado'
      });
    }

    if (vps.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para acessar este VPS'
      });
    }

    // Mock stats
    const stats = {
      cpu: Math.random() * 100,
      ram: Math.random() * vps.ram,
      disk: Math.random() * vps.disk,
      bandwidth: Math.random() * 1000,
      uptime: Math.floor(Math.random() * 86400)
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vps/plans
 * Lista planos disponíveis
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic VPS',
        ram: 1024,
        disk: 20,
        cpu: 1,
        bandwidth: 1000,
        price: 5.00
      },
      {
        id: 'standard',
        name: 'Standard VPS',
        ram: 2048,
        disk: 40,
        cpu: 2,
        bandwidth: 2000,
        price: 10.00
      },
      {
        id: 'premium',
        name: 'Premium VPS',
        ram: 4096,
        disk: 80,
        cpu: 4,
        bandwidth: 4000,
        price: 20.00
      }
    ];

    res.json({
      success: true,
      data: plans
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/vps/os-templates
 * Lista templates de OS disponíveis
 */
router.get('/os-templates', async (req, res) => {
  try {
    const templates = [
      { id: 'ubuntu-22.04', name: 'Ubuntu 22.04 LTS' },
      { id: 'ubuntu-20.04', name: 'Ubuntu 20.04 LTS' },
      { id: 'debian-11', name: 'Debian 11' },
      { id: 'centos-8', name: 'CentOS 8' },
      { id: 'windows-2019', name: 'Windows Server 2019' },
      { id: 'windows-2022', name: 'Windows Server 2022' }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
