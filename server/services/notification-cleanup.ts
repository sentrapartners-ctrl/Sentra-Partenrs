import { getDb } from "../db";
import { notifications, supportNotifications } from "../../drizzle/schema";
import { lt } from "drizzle-orm";

/**
 * Serviço de limpeza de notificações antigas
 * Remove notificações com mais de 5 dias
 */

export async function cleanupOldNotifications() {
  const db = getDb();
  if (!db) {
    console.log("[Notification Cleanup] Database not available");
    return;
  }

  try {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    console.log(`[Notification Cleanup] Limpando notificações antes de ${fiveDaysAgo.toISOString()}`);

    // Limpar notificações gerais
    const result1 = await db
      .delete(notifications)
      .where(lt(notifications.createdAt, fiveDaysAgo));

    // Limpar notificações de suporte
    const result2 = await db
      .delete(supportNotifications)
      .where(lt(supportNotifications.createdAt, fiveDaysAgo));

    console.log(`[Notification Cleanup] ✅ Limpeza concluída`);
    console.log(`[Notification Cleanup] - Notificações gerais removidas: ${result1[0]?.affectedRows || 0}`);
    console.log(`[Notification Cleanup] - Notificações de suporte removidas: ${result2[0]?.affectedRows || 0}`);

    return {
      success: true,
      generalRemoved: result1[0]?.affectedRows || 0,
      supportRemoved: result2[0]?.affectedRows || 0,
    };
  } catch (error: any) {
    console.error("[Notification Cleanup] ❌ Erro:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Agendar limpeza automática a cada 5 dias
 */
export function scheduleNotificationCleanup() {
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000; // 5 dias em milissegundos

  // Executar imediatamente na inicialização
  cleanupOldNotifications();

  // Agendar execução a cada 5 dias
  setInterval(() => {
    cleanupOldNotifications();
  }, FIVE_DAYS_MS);

  console.log("[Notification Cleanup] ⏰ Agendamento configurado (a cada 5 dias)");
}
