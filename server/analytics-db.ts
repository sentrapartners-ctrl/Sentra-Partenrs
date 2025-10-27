import { getDb } from "./db";
import { trades, balanceHistory, tradingAccounts } from "../drizzle/schema";
import { eq, and, sql, desc, asc, gte, lte } from "drizzle-orm";

/**
 * Calcula o crescimento percentual mensal de uma conta
 */
export async function getMonthlyGrowth(accountId: number, year: number) {
  const db = await getDb();
  
  // Calcular baseado em trades fechados (closeTime é UNIX timestamp)
  const query = sql`
    WITH monthly_profits AS (
      SELECT 
        DATE_FORMAT(FROM_UNIXTIME(closeTime), '%Y-%m') as month,
        SUM(profit) as monthly_profit,
        COUNT(*) as trade_count
      FROM trades
      WHERE accountId = ${accountId} 
        AND status = 'closed'
        AND YEAR(FROM_UNIXTIME(closeTime)) = ${year}
      GROUP BY DATE_FORMAT(FROM_UNIXTIME(closeTime), '%Y-%m')
    ),
    account_info AS (
      SELECT balance as initial_balance FROM trading_accounts WHERE id = ${accountId} LIMIT 1
    ),
    cumulative_balance AS (
      SELECT 
        month,
        monthly_profit,
        trade_count,
        (SELECT initial_balance FROM account_info) + SUM(monthly_profit) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) as start_balance,
        (SELECT initial_balance FROM account_info) + SUM(monthly_profit) OVER (ORDER BY month) as end_balance
      FROM monthly_profits
    )
    SELECT 
      month,
      COALESCE(start_balance, (SELECT initial_balance FROM account_info)) as start_balance,
      end_balance,
      monthly_profit,
      trade_count,
      CASE 
        WHEN COALESCE(start_balance, (SELECT initial_balance FROM account_info)) > 0 
        THEN (monthly_profit / COALESCE(start_balance, (SELECT initial_balance FROM account_info)) * 100)
        ELSE 0 
      END as growth_percent
    FROM cumulative_balance
    ORDER BY month ASC
  `;
  
  const result = await db.execute(query);
  return result.rows;
}

/**
 * Retorna histórico de drawdown vs balance
 */
export async function getDrawdownHistory(accountId: number) {
  const db = await getDb();
  
  // Usar balance_history se disponível
  const query = sql`
    SELECT 
      timestamp,
      balance,
      equity,
      balance - equity as drawdown
    FROM balance_history
    WHERE accountId = ${accountId}
    ORDER BY timestamp ASC
    LIMIT 1000
  `;
  
  const result = await db.execute(query);
  return result.rows;
}

/**
 * Calcula métricas de risco (Sharp Ratio, Profit Factor, Recovery Factor)
 */
export async function getRiskMetrics(accountId: number) {
  const db = await getDb();
  
  const query = sql`
    WITH trade_stats AS (
      SELECT 
        profit,
        CASE WHEN profit > 0 THEN profit ELSE 0 END as win_profit,
        CASE WHEN profit < 0 THEN ABS(profit) ELSE 0 END as loss_amount
      FROM trades
      WHERE accountId = ${accountId} AND status = 'closed'
    ),
    metrics AS (
      SELECT 
        AVG(profit) as avg_return,
        STDDEV(profit) as std_dev,
        SUM(win_profit) as total_wins,
        SUM(loss_amount) as total_losses,
        COUNT(*) as total_trades
      FROM trade_stats
    ),
    drawdown_calc AS (
      SELECT MAX(balance - equity) as max_drawdown
      FROM balance_history
      WHERE accountId = ${accountId}
    )
    SELECT 
      CASE 
        WHEN m.std_dev > 0 THEN (m.avg_return / m.std_dev) * SQRT(252)
        ELSE 0 
      END as sharp_ratio,
      CASE 
        WHEN m.total_losses > 0 THEN m.total_wins / m.total_losses
        ELSE 0 
      END as profit_factor,
      CASE 
        WHEN d.max_drawdown > 0 THEN (m.total_wins - m.total_losses) / d.max_drawdown
        ELSE 0 
      END as recovery_factor,
      COALESCE(d.max_drawdown, 0) as max_drawdown
    FROM metrics m
    CROSS JOIN drawdown_calc d
  `;
  
  const result = await db.execute(query);
  return result.rows[0] || { sharp_ratio: 0, profit_factor: 0, recovery_factor: 0, max_drawdown: 0 };
}

/**
 * Retorna estatísticas de vitórias/derrotas consecutivas
 */
export async function getConsecutiveStats(accountId: number) {
  const db = await getDb();
  
  const query = sql`
    WITH trade_sequence AS (
      SELECT 
        profit,
        CASE WHEN profit > 0 THEN 1 ELSE 0 END as is_win,
        closeTime
      FROM trades
      WHERE accountId = ${accountId} AND status = 'closed'
      ORDER BY closeTime ASC
    ),
    consecutive_groups AS (
      SELECT 
        profit,
        is_win,
        closeTime,
        SUM(CASE WHEN is_win != LAG(is_win, 1, is_win) OVER (ORDER BY closeTime) THEN 1 ELSE 0 END) 
          OVER (ORDER BY closeTime) as group_id
      FROM trade_sequence
    ),
    streak_stats AS (
      SELECT 
        is_win,
        group_id,
        COUNT(*) as streak_length,
        SUM(profit) as streak_profit
      FROM consecutive_groups
      GROUP BY is_win, group_id
    )
    SELECT 
      MAX(CASE WHEN is_win = 1 THEN streak_length ELSE 0 END) as max_consecutive_wins,
      MAX(CASE WHEN is_win = 0 THEN streak_length ELSE 0 END) as max_consecutive_losses,
      MAX(CASE WHEN is_win = 1 THEN streak_profit ELSE 0 END) as max_consecutive_profit,
      MIN(CASE WHEN is_win = 0 THEN streak_profit ELSE 0 END) as max_consecutive_loss,
      (SELECT profit FROM trades WHERE accountId = ${accountId} AND status = 'closed' ORDER BY profit DESC LIMIT 1) as best_trade,
      (SELECT profit FROM trades WHERE accountId = ${accountId} AND status = 'closed' ORDER BY profit ASC LIMIT 1) as worst_trade
    FROM streak_stats
  `;
  
  const result = await db.execute(query);
  return result.rows[0] || {
    max_consecutive_wins: 0,
    max_consecutive_losses: 0,
    max_consecutive_profit: 0,
    max_consecutive_loss: 0,
    best_trade: 0,
    worst_trade: 0
  };
}

/**
 * Retorna performance por dia da semana
 */
export async function getWeeklyPerformance(accountId: number) {
  const db = await getDb();
  
  const query = sql`
    SELECT 
      DAYNAME(FROM_UNIXTIME(closeTime)) as day_name,
      DAYOFWEEK(FROM_UNIXTIME(closeTime)) as day_num,
      COUNT(*) as trade_count,
      SUM(profit) as total_profit,
      AVG(profit) as avg_profit,
      SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as wins
    FROM trades
    WHERE accountId = ${accountId} AND status = 'closed'
    GROUP BY day_name, day_num
    ORDER BY day_num ASC
  `;
  
  const result = await db.execute(query);
  return result.rows;
}

/**
 * Retorna distribuição de trades por origem (robot/signal/manual)
 */
export async function getTradesByOrigin(accountId: number) {
  const db = await getDb();
  
  const query = sql`
    SELECT 
      origin,
      COUNT(*) as count,
      SUM(profit) as total_profit,
      AVG(profit) as avg_profit,
      SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as wins,
      COUNT(*) * 100.0 / (SELECT COUNT(*) FROM trades WHERE accountId = ${accountId} AND status = 'closed') as percentage
    FROM trades
    WHERE accountId = ${accountId} 
      AND status = 'closed'
      AND origin != 'unknown'
    GROUP BY origin
  `;
  
  const result = await db.execute(query);
  
  // Se não houver dados com origin definido, retornar array vazio
  if (!result.rows || result.rows.length === 0) {
    return [];
  }
  
  return result.rows;
}

/**
 * Retorna profit/loss breakdown
 */
export async function getProfitLossBreakdown(accountId: number) {
  const db = await getDb();
  
  const query = sql`
    SELECT 
      SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END) as gross_profit,
      SUM(CASE WHEN profit < 0 THEN ABS(profit) ELSE 0 END) as gross_loss,
      SUM(profit) as net_profit,
      COUNT(CASE WHEN profit > 0 THEN 1 END) as winning_trades,
      COUNT(CASE WHEN profit < 0 THEN 1 END) as losing_trades
    FROM trades
    WHERE accountId = ${accountId} AND status = 'closed'
  `;
  
  const result = await db.execute(query);
  return result.rows[0] || {
    gross_profit: 0,
    gross_loss: 0,
    net_profit: 0,
    winning_trades: 0,
    losing_trades: 0
  };
}

/**
 * Retorna métricas adicionais
 */
export async function getAdditionalMetrics(accountId: number) {
  const db = await getDb();
  
  const query = sql`
    SELECT 
      AVG(TIMESTAMPDIFF(SECOND, openTime, closeTime)) as avg_hold_time_seconds,
      MAX(volume) as max_deposit_load,
      COUNT(*) / (DATEDIFF(MAX(FROM_UNIXTIME(closeTime)), MIN(FROM_UNIXTIME(closeTime))) / 7) as trades_per_week
    FROM trades
    WHERE accountId = ${accountId} AND status = 'closed'
  `;
  
  const result = await db.execute(query);
  return result.rows[0] || {
    avg_hold_time_seconds: 0,
    max_deposit_load: 0,
    trades_per_week: 0
  };
}

