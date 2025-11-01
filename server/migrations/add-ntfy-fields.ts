import { getDb } from '../db';

/**
 * Migration: Adicionar campos ntfy.sh na tabela user_settings
 * 
 * Adiciona suporte para notificações push via ntfy.sh
 * que funciona em Android e iPhone
 */
export async function addNtfyFields() {
  const db = await getDb();
  
  try {
    console.log('[Migration] Adicionando campos ntfy.sh...');
    
    await db.execute(`
      ALTER TABLE user_settings
      ADD COLUMN IF NOT EXISTS ntfyEnabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS ntfyTopic VARCHAR(128),
      ADD COLUMN IF NOT EXISTS ntfyDailyEnabled BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS ntfyWeeklyEnabled BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS ntfyTradesEnabled BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS ntfyDrawdownEnabled BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS ntfyConnectionEnabled BOOLEAN DEFAULT TRUE
    `);
    
    console.log('[Migration] ✓ Campos ntfy.sh adicionados com sucesso!');
  } catch (error) {
    console.error('[Migration] Erro ao adicionar campos ntfy.sh:', error);
  }
}
