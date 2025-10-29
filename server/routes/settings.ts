import { Router } from 'express';
import { getDb } from '../db';

const router = Router();
const db = getDb();

// GET /api/settings - Obter todas as configurações
router.get('/', async (req, res) => {
  try {
    const [rows] = await (await db).execute(
      'SELECT `key`, value, description, updated_at FROM system_settings ORDER BY `key`'
    );
    
    // Converter array para objeto
    const settings: Record<string, any> = {};
    (rows as any[]).forEach((row: any) => {
      settings[row.key] = {
        value: row.value,
        description: row.description,
        updatedAt: row.updated_at,
      };
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET /api/settings/:key - Obter configuração específica
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const [rows] = await (await db).execute(
      'SELECT value FROM system_settings WHERE `key` = ?',
      [key]
    );
    
    if ((rows as any[]).length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ value: (rows as any[])[0].value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// PUT /api/settings/:key - Atualizar configuração
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    const [result] = await db.execute(
      'UPDATE system_settings SET value = ? WHERE `key` = ?',
      [String(value), key]
    );
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ success: true, key, value });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// POST /api/settings/bulk - Atualizar múltiplas configurações
router.post('/bulk', async (req, res) => {
  try {
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings object' });
    }
    
    const updates = Object.entries(settings).map(([key, value]) => 
      db.execute(
        'UPDATE system_settings SET value = ? WHERE `key` = ?',
        [String(value), key]
      )
    );
    
    await Promise.all(updates);
    
    res.json({ success: true, updated: Object.keys(settings).length });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
