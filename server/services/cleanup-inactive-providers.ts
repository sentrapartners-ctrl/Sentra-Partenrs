import { getRawConnection } from "../db";

/**
 * Desativa provedores que não têm trades há 2+ meses
 * Executa diariamente via cron job
 */
export async function cleanupInactiveProviders() {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      console.error('[Provider Cleanup] Conexão com banco não disponível');
      return;
    }

    console.log('[Provider Cleanup] 🧹 Iniciando limpeza de provedores inativos...');

    // Buscar provedores ativos sem trades há 2+ meses
    const [inactiveProviders]: any = await connection.execute(
      `SELECT 
        sp.id,
        sp.provider_name,
        sp.master_account_number,
        ps.last_trade_at,
        DATEDIFF(NOW(), ps.last_trade_at) as days_since_last_trade
      FROM signal_providers sp
      LEFT JOIN provider_statistics ps ON sp.id = ps.provider_id
      WHERE sp.is_active = true
        AND (
          ps.last_trade_at IS NULL 
          OR DATEDIFF(NOW(), ps.last_trade_at) >= 60
        )`
    );

    if (!inactiveProviders || inactiveProviders.length === 0) {
      console.log('[Provider Cleanup] ✅ Nenhum provedor inativo encontrado');
      return;
    }

    console.log(`[Provider Cleanup] 📋 Encontrados ${inactiveProviders.length} provedores inativos:`);

    for (const provider of inactiveProviders) {
      const daysSince = provider.last_trade_at 
        ? provider.days_since_last_trade 
        : 'nunca teve trades';

      console.log(`  - ${provider.provider_name} (${provider.master_account_number}): ${daysSince} dias`);

      // Desativar provedor
      await connection.execute(
        `UPDATE signal_providers 
         SET is_active = false, updated_at = NOW()
         WHERE id = ?`,
        [provider.id]
      );

      // Cancelar todas as assinaturas ativas
      await connection.execute(
        `UPDATE signal_subscriptions 
         SET status = 'cancelled', updated_at = NOW()
         WHERE provider_id = ? AND status = 'active'`,
        [provider.id]
      );

      // Atualizar contadores de assinantes
      await connection.execute(
        `UPDATE provider_statistics 
         SET active_subscribers = 0, updated_at = NOW()
         WHERE provider_id = ?`,
        [provider.id]
      );
    }

    console.log(`[Provider Cleanup] ✅ ${inactiveProviders.length} provedores desativados com sucesso`);

  } catch (error: any) {
    console.error('[Provider Cleanup] ❌ Erro ao limpar provedores inativos:', error);
  }
}

/**
 * Agenda o job de limpeza para executar diariamente às 3h da manhã
 */
export function scheduleProviderCleanup() {
  // Executar imediatamente na inicialização (para teste)
  // cleanupInactiveProviders();

  // Executar diariamente às 3h da manhã
  const HOUR = 3;
  const MINUTE = 0;

  function scheduleNext() {
    const now = new Date();
    const next = new Date(now);
    
    // Configurar para 3h da manhã
    next.setHours(HOUR, MINUTE, 0, 0);
    
    // Se já passou das 3h hoje, agendar para amanhã
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    const delay = next.getTime() - now.getTime();
    
    console.log(`[Provider Cleanup] ⏰ Próxima execução agendada para: ${next.toLocaleString('pt-BR')}`);
    
    setTimeout(() => {
      cleanupInactiveProviders();
      scheduleNext(); // Reagendar para o próximo dia
    }, delay);
  }

  scheduleNext();
}
