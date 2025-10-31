import { getRawConnection } from "../db";

/**
 * Atualiza as estatísticas de um provedor baseado nos trades da conta Master
 * @param masterAccountNumber - Número da conta Master
 */
export async function updateProviderStatistics(masterAccountNumber: string) {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      console.error('[Provider Stats] Conexão com banco não disponível');
      return;
    }

    // Buscar provedor associado a esta conta Master
    const [providers]: any = await connection.execute(
      `SELECT id FROM signal_providers WHERE master_account_number = ?`,
      [masterAccountNumber]
    );

    if (!providers || providers.length === 0) {
      // Não há provedor para esta conta Master
      return;
    }

    const providerId = providers[0].id;

    // Calcular estatísticas baseadas nos trades com profit real
    const [stats]: any = await connection.execute(
      `SELECT 
        COUNT(*) as total_trades,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_trades,
        COUNT(CASE WHEN status = 'closed' AND profit > 0 THEN 1 END) as winning_trades,
        COUNT(CASE WHEN status = 'closed' AND profit <= 0 THEN 1 END) as losing_trades,
        COALESCE(SUM(CASE WHEN status = 'closed' THEN profit ELSE 0 END), 0) as total_profit,
        COALESCE(AVG(CASE WHEN status = 'closed' THEN profit END), 0) as avg_profit,
        MAX(closed_at) as last_trade_at
      FROM copy_trades
      WHERE account_number = ?`,
      [masterAccountNumber]
    );

    if (!stats || stats.length === 0) {
      return;
    }

    const {
      total_trades = 0,
      closed_trades = 0,
      winning_trades = 0,
      losing_trades = 0,
      total_profit = 0,
      avg_profit = 0,
      last_trade_at = null
    } = stats[0];

    // Calcular win_rate baseado em trades com profit > 0
    const win_rate = closed_trades > 0 ? (winning_trades / closed_trades) * 100 : 0;

    // Buscar total de assinantes
    const [subscriptions]: any = await connection.execute(
      `SELECT 
        COUNT(DISTINCT subscriber_user_id) as total_subscribers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscribers
      FROM signal_subscriptions
      WHERE provider_id = ?`,
      [providerId]
    );

    const {
      total_subscribers = 0,
      active_subscribers = 0
    } = subscriptions[0] || {};

    // Atualizar estatísticas
    await connection.execute(
      `UPDATE provider_statistics 
       SET 
         total_trades = ?,
         winning_trades = ?,
         losing_trades = ?,
         win_rate = ?,
         total_profit = ?,
         avg_profit = ?,
         total_subscribers = ?,
         active_subscribers = ?,
         last_trade_at = ?,
         updated_at = NOW()
       WHERE provider_id = ?`,
      [
        total_trades,
        winning_trades,
        losing_trades,
        win_rate,
        total_profit,
        avg_profit,
        total_subscribers,
        active_subscribers,
        last_trade_at,
        providerId
      ]
    );

    console.log(`[Provider Stats] ✅ Estatísticas atualizadas para provedor ${providerId} (conta ${masterAccountNumber})`);

  } catch (error: any) {
    console.error('[Provider Stats] Erro ao atualizar estatísticas:', error);
  }
}

/**
 * Atualiza estatísticas de todos os provedores
 */
export async function updateAllProviderStatistics() {
  try {
    const connection = await getRawConnection();
    if (!connection) {
      console.error('[Provider Stats] Conexão com banco não disponível');
      return;
    }

    // Buscar todos os provedores ativos
    const [providers]: any = await connection.execute(
      `SELECT master_account_number FROM signal_providers WHERE is_active = true`
    );

    console.log(`[Provider Stats] Atualizando estatísticas de ${providers.length} provedores...`);

    for (const provider of providers) {
      await updateProviderStatistics(provider.master_account_number);
    }

    console.log('[Provider Stats] ✅ Todas as estatísticas atualizadas');

  } catch (error: any) {
    console.error('[Provider Stats] Erro ao atualizar todas as estatísticas:', error);
  }
}
