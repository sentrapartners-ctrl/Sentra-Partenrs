import { Router } from 'express';

const router = Router();

/**
 * GET /api/admin/vms
 * Lista todas as VMs (admin only)
 */
router.get('/', async (req, res) => {
  try {
    const userRole = (req as any).user?.role;
    
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado' 
      });
    }

    const { getDb } = await import('../db');
    const db = getDb();
    const { clientVMs, users } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');

    const vms = await db
      .select({
        vm: clientVMs,
        user: users,
      })
      .from(clientVMs)
      .leftJoin(users, eq(clientVMs.userId, users.id));

    const formattedVMs = vms.map((row: any) => ({
      ...row.vm,
      userName: row.user?.name,
      userEmail: row.user?.email,
    }));

    res.json({
      success: true,
      vms: formattedVMs
    });
  } catch (error: any) {
    console.error('[Admin VMs] Erro ao listar VMs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/vms
 * Cria nova VM (admin only)
 */
router.post('/', async (req, res) => {
  try {
    const userRole = (req as any).user?.role;
    
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado' 
      });
    }

    const { getDb } = await import('../db');
    const db = getDb();
    const { clientVMs } = await import('../../drizzle/schema');

    const vmData = {
      userId: req.body.userId,
      productName: req.body.productName,
      hostname: req.body.hostname,
      ipAddress: req.body.ipAddress,
      username: req.body.username,
      password: req.body.password,
      status: req.body.status || 'active',
      cpu: req.body.cpu,
      ram: req.body.ram,
      storage: req.body.storage,
      os: req.body.os,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    };

    await db.insert(clientVMs).values(vmData);

    res.json({
      success: true,
      message: 'VM criada com sucesso'
    });
  } catch (error: any) {
    console.error('[Admin VMs] Erro ao criar VM:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/vms/:id
 * Atualiza VM (admin only)
 */
router.put('/:id', async (req, res) => {
  try {
    const userRole = (req as any).user?.role;
    
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado' 
      });
    }

    const { getDb } = await import('../db');
    const db = getDb();
    const { clientVMs } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');

    const vmId = parseInt(req.params.id);
    const updateData: any = {};

    if (req.body.productName) updateData.productName = req.body.productName;
    if (req.body.hostname) updateData.hostname = req.body.hostname;
    if (req.body.ipAddress) updateData.ipAddress = req.body.ipAddress;
    if (req.body.username) updateData.username = req.body.username;
    if (req.body.password) updateData.password = req.body.password;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.cpu) updateData.cpu = req.body.cpu;
    if (req.body.ram) updateData.ram = req.body.ram;
    if (req.body.storage) updateData.storage = req.body.storage;
    if (req.body.os) updateData.os = req.body.os;
    if (req.body.expiresAt) updateData.expiresAt = new Date(req.body.expiresAt);

    await db
      .update(clientVMs)
      .set(updateData)
      .where(eq(clientVMs.id, vmId));

    res.json({
      success: true,
      message: 'VM atualizada com sucesso'
    });
  } catch (error: any) {
    console.error('[Admin VMs] Erro ao atualizar VM:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/admin/vms/:id
 * Deleta VM (admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const userRole = (req as any).user?.role;
    
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado' 
      });
    }

    const { getDb } = await import('../db');
    const db = getDb();
    const { clientVMs } = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');

    const vmId = parseInt(req.params.id);

    await db
      .delete(clientVMs)
      .where(eq(clientVMs.id, vmId));

    res.json({
      success: true,
      message: 'VM excluída com sucesso'
    });
  } catch (error: any) {
    console.error('[Admin VMs] Erro ao excluir VM:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
