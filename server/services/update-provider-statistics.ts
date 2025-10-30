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

    // Calcular estatísticas baseadas nos trades
    const [stats]: any = await connection.execute(
      `SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN status = 'closed' AND (close_price - open_price) * lots > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN status = 'closed' AND (close_price - open_price) * lots <= 0 THEN 1 ELSE 0 END) as losing_trades,
        SUM(CASE WHEN status = 'closed' THEN (close_price - open_price) * lots ELSE 0 END) as total_profit,
        MAX(closed_at) as last_trade_at
      FROM copy_trades
      WHERE account_number = ? AND status = 'closed'`,
      [masterAccountNumber]
    );

    if (!stats || stats.length === 0) {
      return;
    }

    const {
      total_trades = 0,
      winning_trades = 0,
      losing_trades = 0,
      total_profit = 0,
      last_trade_at = null
    } = stats[0];

    const win_rate = total_trades > 0 ? (winning_trades / total_trades) * 100 : 0;
    const avg_profit = total_trades > 0 ? total_profit / total_trades : 0;

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
