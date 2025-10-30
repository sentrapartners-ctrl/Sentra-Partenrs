import express from "express";
import { getDb } from "../db";
import { getUserByEmail } from "../auth";
import { copyTradingSettings } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const router = express.Router();

//====================================================
// GET /api/mt/copy/settings
// Buscar configurações de uma relação Master/Slave
//====================================================
router.get("/settings", async (req, res) => {
  try {
    const { user_email, master_account_id, slave_account_id } = req.query;
    
    if (!user_email || !master_account_id || !slave_account_id) {
      return res.status(400).json({ 
        success: false,
        error: "user_email, master_account_id e slave_account_id são obrigatórios" 
      });
    }
    
    const user = await getUserByEmail(user_email as string);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    const db = await getDb();
    
    const [settings] = await db
      .select()
      .from(copyTradingSettings)
      .where(
        and(
          eq(copyTradingSettings.userId, user.id),
          eq(copyTradingSettings.masterAccountId, master_account_id as string),
          eq(copyTradingSettings.slaveAccountId, slave_account_id as string)
        )
      )
      .limit(1);
    
    if (!settings) {
      // Retornar configurações padrão
      return res.json({
        success: true,
        settings: {
          slTpMode: 'copy_100',
          slMultiplier: 1.0,
          tpMultiplier: 1.0,
          slFixedPips: 20,
          tpFixedPips: 40,
          volumeMode: 'copy_100',
          volumeMultiplier: 1.0,
          volumeFixed: 0.01,
          maxVolume: 1.0,
          enableSymbolFilter: false,
          allowedSymbols: [],
          enableDirectionFilter: false,
          allowedDirections: ['BUY', 'SELL'],
          enableRiskManagement: false,
          maxDailyLoss: 100,
          maxDailyTrades: 20,
          isActive: true
        },
        message: "Usando configurações padrão"
      });
    }
    
    // Parse JSON fields
    const parsedSettings = {
      ...settings,
      allowedSymbols: settings.allowedSymbols ? JSON.parse(settings.allowedSymbols) : [],
      allowedDirections: settings.allowedDirections ? JSON.parse(settings.allowedDirections) : ['BUY', 'SELL'],
      slMultiplier: parseFloat(settings.slMultiplier as string),
      tpMultiplier: parseFloat(settings.tpMultiplier as string),
      volumeMultiplier: parseFloat(settings.volumeMultiplier as string),
      volumeFixed: parseFloat(settings.volumeFixed as string),
      maxVolume: parseFloat(settings.maxVolume as string),
      maxDailyLoss: parseFloat(settings.maxDailyLoss as string),
      dailyLoss: parseFloat(settings.dailyLoss as string)
    };
    
    console.log(`[Copy Settings] ✅ Configurações carregadas para ${master_account_id} → ${slave_account_id}`);
    
    res.json({
      success: true,
      settings: parsedSettings
    });
    
  } catch (error: any) {
    console.error("[Copy Settings] Erro ao buscar configurações:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// POST /api/mt/copy/settings
// Salvar/atualizar configurações de Copy Trading
//====================================================
router.post("/settings", async (req, res) => {
  try {
    const {
      user_email,
      master_account_id,
      slave_account_id,
      settings: settingsData
    } = req.body;
    
    if (!user_email || !master_account_id || !slave_account_id || !settingsData) {
      return res.status(400).json({ 
        success: false,
        error: "Parâmetros obrigatórios faltando" 
      });
    }
    
    const user = await getUserByEmail(user_email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    const db = await getDb();
    
    // Verificar se já existe
    const [existing] = await db
      .select()
      .from(copyTradingSettings)
      .where(
        and(
          eq(copyTradingSettings.userId, user.id),
          eq(copyTradingSettings.masterAccountId, master_account_id),
          eq(copyTradingSettings.slaveAccountId, slave_account_id)
        )
      )
      .limit(1);
    
    const settingsToSave = {
      userId: user.id,
      masterAccountId: master_account_id,
      slaveAccountId: slave_account_id,
      slTpMode: settingsData.slTpMode || 'copy_100',
      slMultiplier: settingsData.slMultiplier?.toString() || '1.00',
      tpMultiplier: settingsData.tpMultiplier?.toString() || '1.00',
      slFixedPips: settingsData.slFixedPips || 20,
      tpFixedPips: settingsData.tpFixedPips || 40,
      volumeMode: settingsData.volumeMode || 'copy_100',
      volumeMultiplier: settingsData.volumeMultiplier?.toString() || '1.00',
      volumeFixed: settingsData.volumeFixed?.toString() || '0.01',
      maxVolume: settingsData.maxVolume?.toString() || '1.00',
      enableSymbolFilter: settingsData.enableSymbolFilter || false,
      allowedSymbols: JSON.stringify(settingsData.allowedSymbols || []),
      enableDirectionFilter: settingsData.enableDirectionFilter || false,
      allowedDirections: JSON.stringify(settingsData.allowedDirections || ['BUY', 'SELL']),
      enableRiskManagement: settingsData.enableRiskManagement || false,
      maxDailyLoss: settingsData.maxDailyLoss?.toString() || '100.00',
      maxDailyTrades: settingsData.maxDailyTrades || 20,
      isActive: settingsData.isActive !== undefined ? settingsData.isActive : true
    };
    
    if (existing) {
      // Atualizar
      await db
        .update(copyTradingSettings)
        .set(settingsToSave)
        .where(eq(copyTradingSettings.id, existing.id));
      
      console.log(`[Copy Settings] ✅ Configurações atualizadas: ${master_account_id} → ${slave_account_id}`);
    } else {
      // Inserir
      await db.insert(copyTradingSettings).values(settingsToSave);
      
      console.log(`[Copy Settings] ✅ Configurações criadas: ${master_account_id} → ${slave_account_id}`);
    }
    
    res.json({
      success: true,
      message: "Configurações salvas com sucesso"
    });
    
  } catch (error: any) {
    console.error("[Copy Settings] Erro ao salvar configurações:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

//====================================================
// POST /api/mt/copy/validate-trade
// Validar se um trade deve ser copiado (aplica filtros e limites)
//====================================================
router.post("/validate-trade", async (req, res) => {
  try {
    const {
      user_email,
      master_account_id,
      slave_account_id,
      symbol,
      type,
      volume
    } = req.body;
    
    if (!user_email || !master_account_id || !slave_account_id) {
      return res.status(400).json({ 
        success: false,
        error: "Parâmetros obrigatórios faltando" 
      });
    }
    
    const user = await getUserByEmail(user_email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado",
        shouldCopy: false
      });
    }
    
    const db = await getDb();
    
    const [settings] = await db
      .select()
      .from(copyTradingSettings)
      .where(
        and(
          eq(copyTradingSettings.userId, user.id),
          eq(copyTradingSettings.masterAccountId, master_account_id),
          eq(copyTradingSettings.slaveAccountId, slave_account_id)
        )
      )
      .limit(1);
    
    if (!settings || !settings.isActive) {
      return res.json({
        success: true,
        shouldCopy: false,
        reason: "Configurações não encontradas ou inativas"
      });
    }
    
    // Verificar filtro de símbolos
    if (settings.enableSymbolFilter && settings.allowedSymbols) {
      const allowedSymbols = JSON.parse(settings.allowedSymbols);
      if (!allowedSymbols.includes(symbol)) {
        return res.json({
          success: true,
          shouldCopy: false,
          reason: `Símbolo ${symbol} não está na whitelist`
        });
      }
    }
    
    // Verificar filtro de direção
    if (settings.enableDirectionFilter && settings.allowedDirections) {
      const allowedDirections = JSON.parse(settings.allowedDirections);
      if (!allowedDirections.includes(type.toUpperCase())) {
        return res.json({
          success: true,
          shouldCopy: false,
          reason: `Direção ${type} não está permitida`
        });
      }
    }
    
    // Verificar volume máximo
    const maxVolume = parseFloat(settings.maxVolume as string);
    if (volume > maxVolume) {
      return res.json({
        success: true,
        shouldCopy: false,
        reason: `Volume ${volume} excede o máximo permitido (${maxVolume})`
      });
    }
    
    // Verificar gerenciamento de risco
    if (settings.enableRiskManagement) {
      // Verificar se precisa reset diário
      const today = new Date().toISOString().split('T')[0];
      const lastReset = settings.lastResetDate ? settings.lastResetDate.toString() : null;
      
      if (lastReset !== today) {
        // Reset diário
        await db
          .update(copyTradingSettings)
          .set({
            dailyLoss: '0.00',
            dailyTradesCount: 0,
            lastResetDate: today as any
          })
          .where(eq(copyTradingSettings.id, settings.id));
        
        console.log(`[Copy Settings] 🔄 Reset diário realizado para ${slave_account_id}`);
      } else {
        // Verificar limites
        const dailyLoss = Math.abs(parseFloat(settings.dailyLoss as string));
        const maxDailyLoss = parseFloat(settings.maxDailyLoss as string);
        
        if (dailyLoss >= maxDailyLoss) {
          return res.json({
            success: true,
            shouldCopy: false,
            reason: `Perda máxima diária atingida ($${dailyLoss}/$${maxDailyLoss})`
          });
        }
        
        if (settings.dailyTradesCount >= settings.maxDailyTrades) {
          return res.json({
            success: true,
            shouldCopy: false,
            reason: `Máximo de trades diários atingido (${settings.dailyTradesCount}/${settings.maxDailyTrades})`
          });
        }
      }
    }
    
    // Trade pode ser copiado
    res.json({
      success: true,
      shouldCopy: true,
      settings: {
        slTpMode: settings.slTpMode,
        slMultiplier: parseFloat(settings.slMultiplier as string),
        tpMultiplier: parseFloat(settings.tpMultiplier as string),
        slFixedPips: settings.slFixedPips,
        tpFixedPips: settings.tpFixedPips,
        volumeMode: settings.volumeMode,
        volumeMultiplier: parseFloat(settings.volumeMultiplier as string),
        volumeFixed: parseFloat(settings.volumeFixed as string)
      }
    });
    
  } catch (error: any) {
    console.error("[Copy Settings] Erro ao validar trade:", error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      shouldCopy: false
    });
  }
});

//====================================================
// POST /api/mt/copy/update-daily-stats
// Atualizar estatísticas diárias após copiar trade
//====================================================
router.post("/update-daily-stats", async (req, res) => {
  try {
    const {
      user_email,
      master_account_id,
      slave_account_id,
      profit
    } = req.body;
    
    if (!user_email || !master_account_id || !slave_account_id) {
      return res.status(400).json({ 
        success: false,
        error: "Parâmetros obrigatórios faltando" 
      });
    }
    
    const user = await getUserByEmail(user_email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "Usuário não encontrado" 
      });
    }
    
    const db = await getDb();
    
    const [settings] = await db
      .select()
      .from(copyTradingSettings)
      .where(
        and(
          eq(copyTradingSettings.userId, user.id),
          eq(copyTradingSettings.masterAccountId, master_account_id),
          eq(copyTradingSettings.slaveAccountId, slave_account_id)
        )
      )
      .limit(1);
    
    if (!settings) {
      return res.json({
        success: true,
        message: "Configurações não encontradas"
      });
    }
    
    const currentDailyLoss = parseFloat(settings.dailyLoss as string);
    const newDailyLoss = currentDailyLoss + (profit < 0 ? Math.abs(profit) : 0);
    const newTradesCount = settings.dailyTradesCount + 1;
    
    await db
      .update(copyTradingSettings)
      .set({
        dailyLoss: newDailyLoss.toFixed(2),
        dailyTradesCount: newTradesCount
      })
      .where(eq(copyTradingSettings.id, settings.id));
    
    console.log(`[Copy Settings] 📊 Stats atualizados: ${slave_account_id} - Perda: $${newDailyLoss.toFixed(2)}, Trades: ${newTradesCount}`);
    
    res.json({
      success: true,
      message: "Estatísticas atualizadas",
      dailyLoss: newDailyLoss,
      dailyTradesCount: newTradesCount
    });
    
  } catch (error: any) {
    console.error("[Copy Settings] Erro ao atualizar stats:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
