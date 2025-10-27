import { getDb } from "./db";
import { trades, balanceHistory, tradingAccounts } from "../drizzle/schema";
import { eq, and, sql, desc, asc, gte, lte } from "drizzle-orm";

/**
 * Calcula o crescimento mensal de uma conta (em dólares)
 */
export async function getMonthlyGrowth(accountId: number, year: number) {
  const db = await getDb();
  
  try {
    const query = sql`
      SELECT 
        MONTH(closeTime) as month,
        ROUND(SUM(profit) / 100, 2) as profit_usd,
        COUNT(*) as trade_count
      FROM trades
      WHERE accountId = ${accountId} 
        AND status = 'closed'
        AND YEAR(closeTime) = ${year}
      GROUP BY MONTH(closeTime)
      ORDER BY month ASC
    `;
    
    const result = await db.execute(query);
    return result.rows || [];
  } catch (error) {
    console.error('Error in getMonthlyGrowth:', error);
    return [];
  }
}

/**
 * Retorna histórico de drawdown vs balance
 */
export async function getDrawdownHistory(accountId: number) {
  const db = await getDb();
  
  try {
    const query = sql`
      SELECT 
        timestamp,
        ROUND(balance / 100, 2) as balance,
        ROUND(equity / 100, 2) as equity,
        ROUND((balance - equity) / 100, 2) as drawdown
      FROM balance_history
      WHERE accountId = ${accountId}
      ORDER BY timestamp ASC
      LIMIT 1000
    `;
    
    const result = await db.execute(query);
    return result.rows || [];
  } catch (error) {
    console.error('Error in getDrawdownHistory:', error);
    return [];
  }
}

/**
 * Calcula métricas de risco (Sharp Ratio, Profit Factor, Recovery Factor)
 */
export async function getRiskMetrics(accountId: number) {
  const db = await getDb();
  
  try {
    const query = sql`
      SELECT 
        AVG(profit / 100) as avg_return,
        STDDEV(profit / 100) as std_dev,
        SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END) / 100 as total_wins,
        SUM(CASE WHEN profit < 0 THEN ABS(profit) ELSE 0 END) / 100 as total_losses,
        COUNT(*) as total_trades
      FROM trades
      WHERE accountId = ${accountId} AND status = 'closed'
    `;
    
    const result = await db.execute(query);
    const row: any = result.rows[0] || {};
    
    const avgReturn = parseFloat(row.avg_return || 0);
    const stdDev = parseFloat(row.std_dev || 0);
    const totalWins = parseFloat(row.total_wins || 0);
    const totalLosses = parseFloat(row.total_losses || 0);
    
    const sharpRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
    
    // Calcular max drawdown
    const drawdownQuery = sql`
      SELECT MAX((balance - equity) / 100) as max_drawdown
      FROM balance_history
      WHERE accountId = ${accountId}
    `;
    
    const drawdownResult = await db.execute(drawdownQuery);
    const maxDrawdown = parseFloat((drawdownResult.rows[0] as any)?.max_drawdown || 0);
    
    const recoveryFactor = maxDrawdown > 0 ? (totalWins - totalLosses) / maxDrawdown : 0;
    
    return {
      sharp_ratio: parseFloat(sharpRatio.toFixed(2)),
      profit_factor: parseFloat(profitFactor.toFixed(2)),
      recovery_factor: parseFloat(recoveryFactor.toFixed(2)),
      max_drawdown: parseFloat(maxDrawdown.toFixed(2))
    };
  } catch (error) {
    console.error('Error in getRiskMetrics:', error);
    return {
      sharp_ratio: 0,
      profit_factor: 0,
      recovery_factor: 0,
      max_drawdown: 0
    };
  }
}

/**
 * Retorna estatísticas de vitórias/derrotas consecutivas
 */
export async function getConsecutiveStats(accountId: number) {
  const db = await getDb();
  
  try {
    // Buscar todos os trades ordenados por data
    const tradesQuery = sql`
      SELECT profit / 100 as profit
      FROM trades
      WHERE accountId = ${accountId} AND status = 'closed'
      ORDER BY closeTime ASC
    `;
    
    const tradesResult = await db.execute(tradesQuery);
    const allTrades = tradesResult.rows as any[];
    
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let maxConsecutiveProfit = 0;
    let maxConsecutiveLoss = 0;
    
    let currentWins = 0;
    let currentLosses = 0;
    let currentProfit = 0;
    let currentLoss = 0;
    
    for (const trade of allTrades) {
      const profit = parseFloat(trade.profit);
      
      if (profit > 0) {
        currentWins++;
        currentProfit += profit;
        currentLosses = 0;
        currentLoss = 0;
        
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
        maxConsecutiveProfit = Math.max(maxConsecutiveProfit, currentProfit);
      } else if (profit < 0) {
        currentLosses++;
        currentLoss += Math.abs(profit);
        currentWins = 0;
        currentProfit = 0;
        
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
        maxConsecutiveLoss = Math.max(maxConsecutiveLoss, currentLoss);
      }
    }
    
    // Buscar melhor e pior trade
    const extremesQuery = sql`
      SELECT 
        MAX(profit / 100) as best_trade,
        MIN(profit / 100) as worst_trade
      FROM trades
      WHERE accountId = ${accountId} AND status = 'closed'
    `;
    
    const extremesResult = await db.execute(extremesQuery);
    const row: any = extremesResult.rows[0] || {};
    
    return {
      maxConsecutiveWins,
      maxConsecutiveLosses,
      maxConsecutiveProfit: parseFloat(maxConsecutiveProfit.toFixed(2)),
      maxConsecutiveLoss: parseFloat(maxConsecutiveLoss.toFixed(2)),
      bestTrade: parseFloat(row.best_trade || 0),
      worstTrade: parseFloat(row.worst_trade || 0)
    };
  } catch (error) {
    console.error('Error in getConsecutiveStats:', error);
    return {
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      maxConsecutiveProfit: 0,
      maxConsecutiveLoss: 0,
      bestTrade: 0,
      worstTrade: 0
    };
  }
}

/**
 * Retorna performance por dia da semana
 */
export async function getWeeklyPerformance(accountId: number) {
  const db = await getDb();
  
  try {
    const query = sql`
      SELECT 
        DAYOFWEEK(closeTime) as day_of_week,
        ROUND(SUM(profit) / 100, 2) as total_profit,
        COUNT(*) as trade_count
      FROM trades
      WHERE accountId = ${accountId} AND status = 'closed'
      GROUP BY DAYOFWEEK(closeTime)
      ORDER BY day_of_week ASC
    `;
    
    const result = await db.execute(query);
    return result.rows || [];
  } catch (error) {
    console.error('Error in getWeeklyPerformance:', error);
    return [];
  }
}

/**
 * Retorna distribuição de trades por origem (robot/manual)
 */
export async function getTradesByOrigin(accountId: number) {
  const db = await getDb();
  
  try {
    const query = sql`
      SELECT 
        origin,
        COUNT(*) as count,
        ROUND(SUM(profit) / 100, 2) as total_profit
      FROM trades
      WHERE accountId = ${accountId} 
        AND status = 'closed'
        AND origin != 'unknown'
      GROUP BY origin
    `;
    
    const result = await db.execute(query);
    return result.rows || [];
  } catch (error) {
    console.error('Error in getTradesByOrigin:', error);
    return [];
  }
}

/**
 * Retorna análise de Profit & Loss
 */
export async function getProfitLossBreakdown(accountId: number) {
  const db = await getDb();
  
  try {
    const query = sql`
      SELECT 
        ROUND(SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END) / 100, 2) as gross_profit,
        ROUND(SUM(CASE WHEN profit < 0 THEN ABS(profit) ELSE 0 END) / 100, 2) as gross_loss,
        COUNT(CASE WHEN profit > 0 THEN 1 END) as winning_trades,
        COUNT(CASE WHEN profit < 0 THEN 1 END) as losing_trades
      FROM trades
      WHERE accountId = ${accountId} AND status = 'closed'
    `;
    
    const result = await db.execute(query);
    const row: any = result.rows[0] || {};
    
    return {
      grossProfit: parseFloat(row.gross_profit || 0),
      grossLoss: parseFloat(row.gross_loss || 0),
      winningTrades: parseInt(row.winning_trades || 0),
      losingTrades: parseInt(row.losing_trades || 0)
    };
  } catch (error) {
    console.error('Error in getProfitLossBreakdown:', error);
    return {
      grossProfit: 0,
      grossLoss: 0,
      winningTrades: 0,
      losingTrades: 0
    };
  }
}

