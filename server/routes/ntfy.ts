import { Router } from 'express';
import { getDb } from '../db';
import { userSettings } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { ntfyService } from '../services/ntfy-notifications';

const router = Router();

/**
 * GET /api/ntfy/topic
 * Retorna o tópico único do usuário para se inscrever no app ntfy
 */
router.get('/topic', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Banco de dados não disponível' });
    }

    // Buscar ou criar configurações do usuário
    let settings = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    let topic: string;

    if (settings.length === 0 || !settings[0].ntfyTopic) {
      // Gerar tópico único
      topic = ntfyService.getUserTopic(userId);

      // Criar ou atualizar settings
      if (settings.length === 0) {
        await db.insert(userSettings).values({
          userId,
          ntfyTopic: topic,
          ntfyEnabled: false,
        });
      } else {
        await db.update(userSettings)
          .set({ ntfyTopic: topic })
          .where(eq(userSettings.userId, userId));
      }
    } else {
      topic = settings[0].ntfyTopic!;
    }

    res.json({
      topic,
      appStoreUrl: 'https://apps.apple.com/us/app/ntfy/id1625396347',
      googlePlayUrl: 'https://play.google.com/store/apps/details?id=io.heckel.ntfy',
      instructions: [
        '1. Instale o app "ntfy" no seu celular',
        '2. Abra o app e clique em "+"',
        `3. Digite o tópico: ${topic}`,
        '4. Pronto! Você receberá notificações aqui',
      ],
    });
  } catch (error) {
    console.error('[ntfy] Erro ao obter tópico:', error);
    res.status(500).json({ error: 'Erro ao obter tópico' });
  }
});

/**
 * GET /api/ntfy/settings
 * Retorna as configurações de notificações ntfy do usuário
 */
router.get('/settings', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Banco de dados não disponível' });
    }

    const settings = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      return res.json({
        ntfyEnabled: false,
        ntfyTopic: null,
        ntfyDailyEnabled: true,
        ntfyWeeklyEnabled: true,
        ntfyTradesEnabled: true,
        ntfyDrawdownEnabled: true,
        ntfyConnectionEnabled: true,
      });
    }

    res.json({
      ntfyEnabled: settings[0].ntfyEnabled || false,
      ntfyTopic: settings[0].ntfyTopic,
      ntfyDailyEnabled: settings[0].ntfyDailyEnabled ?? true,
      ntfyWeeklyEnabled: settings[0].ntfyWeeklyEnabled ?? true,
      ntfyTradesEnabled: settings[0].ntfyTradesEnabled ?? true,
      ntfyDrawdownEnabled: settings[0].ntfyDrawdownEnabled ?? true,
      ntfyConnectionEnabled: settings[0].ntfyConnectionEnabled ?? true,
    });
  } catch (error) {
    console.error('[ntfy] Erro ao obter configurações:', error);
    res.status(500).json({ error: 'Erro ao obter configurações' });
  }
});

/**
 * POST /api/ntfy/settings
 * Atualiza as configurações de notificações ntfy do usuário
 */
router.post('/settings', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const {
      ntfyEnabled,
      ntfyDailyEnabled,
      ntfyWeeklyEnabled,
      ntfyTradesEnabled,
      ntfyDrawdownEnabled,
      ntfyConnectionEnabled,
    } = req.body;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Banco de dados não disponível' });
    }

    // Verificar se já existe configuração
    const existing = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    const updateData: any = {};
    if (ntfyEnabled !== undefined) updateData.ntfyEnabled = ntfyEnabled;
    if (ntfyDailyEnabled !== undefined) updateData.ntfyDailyEnabled = ntfyDailyEnabled;
    if (ntfyWeeklyEnabled !== undefined) updateData.ntfyWeeklyEnabled = ntfyWeeklyEnabled;
    if (ntfyTradesEnabled !== undefined) updateData.ntfyTradesEnabled = ntfyTradesEnabled;
    if (ntfyDrawdownEnabled !== undefined) updateData.ntfyDrawdownEnabled = ntfyDrawdownEnabled;
    if (ntfyConnectionEnabled !== undefined) updateData.ntfyConnectionEnabled = ntfyConnectionEnabled;

    if (existing.length === 0) {
      // Criar nova configuração
      const topic = ntfyService.getUserTopic(userId);
      await db.insert(userSettings).values({
        userId,
        ntfyTopic: topic,
        ...updateData,
      });
    } else {
      // Atualizar configuração existente
      await db.update(userSettings)
        .set(updateData)
        .where(eq(userSettings.userId, userId));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[ntfy] Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

/**
 * POST /api/ntfy/test
 * Envia uma notificação de teste para o usuário
 */
router.post('/test', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const success = await ntfyService.sendTestNotification(userId);

    if (success) {
      res.json({ success: true, message: 'Notificação de teste enviada!' });
    } else {
      res.status(500).json({ error: 'Erro ao enviar notificação de teste' });
    }
  } catch (error) {
    console.error('[ntfy] Erro ao enviar notificação de teste:', error);
    res.status(500).json({ error: 'Erro ao enviar notificação de teste' });
  }
});

export default router;
