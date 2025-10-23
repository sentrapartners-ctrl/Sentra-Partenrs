import * as db from "./server/db";

async function debugDashboard() {
  const userId = 1; // ID do usuário de teste
  
  console.log("=== DEBUG DASHBOARD ===\n");
  
  // 1. Contas
  console.log("1. CONTAS:");
  const summary = await db.getAccountSummary(userId);
  console.log("Summary:", JSON.stringify(summary, null, 2));
  
  if (summary?.accounts) {
    console.log("\nContas individuais:");
    for (const acc of summary.accounts) {
      const balanceDollar = (acc.balance || 0) / (acc.isCentAccount ? 10000 : 100);
      const equityDollar = (acc.equity || 0) / (acc.isCentAccount ? 10000 : 100);
      const drawdown = acc.balance ? ((acc.equity - acc.balance) / acc.balance * 100) : 0;
      
      console.log(`\n  ${acc.accountNumber} (${acc.broker}):`);
      console.log(`    isCentAccount: ${acc.isCentAccount}`);
      console.log(`    Balance (cents): ${acc.balance}`);
      console.log(`    Balance (dollars): $${balanceDollar.toFixed(2)}`);
      console.log(`    Equity (cents): ${acc.equity}`);
      console.log(`    Equity (dollars): $${equityDollar.toFixed(2)}`);
      console.log(`    Drawdown: ${drawdown.toFixed(2)}%`);
    }
    
    // Total
    const totalBalanceDollar = summary.accounts.reduce((sum, acc) => 
      sum + ((acc.balance || 0) / (acc.isCentAccount ? 10000 : 100)), 0);
    const totalEquityDollar = summary.accounts.reduce((sum, acc) => 
      sum + ((acc.equity || 0) / (acc.isCentAccount ? 10000 : 100)), 0);
    const totalDrawdown = totalBalanceDollar > 0 
      ? ((totalEquityDollar - totalBalanceDollar) / totalBalanceDollar * 100) 
      : 0;
    
    console.log(`\n  TOTAL:`);
    console.log(`    Balance: $${totalBalanceDollar.toFixed(2)}`);
    console.log(`    Equity: $${totalEquityDollar.toFixed(2)}`);
    console.log(`    Profit/Loss: $${(totalEquityDollar - totalBalanceDollar).toFixed(2)}`);
    console.log(`    Drawdown: ${totalDrawdown.toFixed(2)}%`);
  }
  
  // 2. Estatísticas de Trades
  console.log("\n\n2. ESTATÍSTICAS DE TRADES:");
  const stats = await db.getTradeStatistics(userId);
  console.log("Stats:", JSON.stringify(stats, null, 2));
  
  // 3. Trades Recentes
  console.log("\n\n3. TRADES RECENTES:");
  const recentTrades = await db.getUserTrades(userId, 5);
  console.log(`Total de trades recentes: ${recentTrades.length}`);
  
  if (recentTrades.length > 0) {
    for (const trade of recentTrades) {
      const profitDollar = (trade.profit || 0) / ((trade as any).isCentAccount ? 10000 : 100);
      console.log(`\n  ${trade.symbol} (${trade.type}):`);
      console.log(`    Profit (cents): ${trade.profit}`);
      console.log(`    Profit (dollars): $${profitDollar.toFixed(2)}`);
      console.log(`    isCentAccount: ${(trade as any).isCentAccount}`);
    }
  }
  
  process.exit(0);
}

debugDashboard().catch(console.error);

