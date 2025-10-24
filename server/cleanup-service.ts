/**
 * Serviço de limpeza automática de contas inativas
 * - Marca contas como offline após 5 minutos sem heartbeat
 * - Remove contas após 1 hora sem heartbeat
 */

import * as db from "./db";

const OFFLINE_TIMEOUT = 5 * 60 * 1000; // 5 minutos
const REMOVE_TIMEOUT = 60 * 60 * 1000; // 1 hora

export function startCleanupService() {
  // Executar a cada 1 minuto
  setInterval(async () => {
    try {
      const now = new Date();
      
      // 1. Marcar contas como offline (sem heartbeat por 5 minutos)
      const offlineThreshold = new Date(now.getTime() - OFFLINE_TIMEOUT);
      await db.markAccountsOffline(offlineThreshold);
      
      // 2. Remover contas inativas (sem heartbeat por 1 hora)
      const removeThreshold = new Date(now.getTime() - REMOVE_TIMEOUT);
      await db.removeInactiveAccounts(removeThreshold);
      
    } catch (error) {
      console.error('[Cleanup Service] Error:', error);
    }
  }, 60 * 1000); // A cada 1 minuto
  
  console.log('[Cleanup Service] Started - checking every 60 seconds');
}

