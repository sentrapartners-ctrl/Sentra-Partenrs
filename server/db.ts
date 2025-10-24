import { eq, and, desc, asc, gte, lte, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  tradingAccounts, 
  InsertTradingAccount, 
  TradingAccount,
  trades,
  InsertTrade,
  Trade,
  balanceHistory,
  InsertBalanceHistory,
  transactions,
  InsertTransaction,
  Transaction,
  userSettings,
  InsertUserSettings,
  UserSettings,
  strategies,
  InsertStrategy,
  Strategy,
  tradeNotes,
  InsertTradeNote,
  TradeNote,
  economicEvents,
  InsertEconomicEvent,
  EconomicEvent,
  copyTradingConfigs,
  InsertCopyTradingConfig,
  CopyTradingConfig,
  alerts,
  InsertAlert,
  Alert
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    // Priorizar AIVEN_DATABASE_URL se existir, senão usar DATABASE_URL (banco Manus)
    const dbUrl = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;
    
    if (dbUrl) {
      try {
        console.log("[Database] Connecting to:", dbUrl.includes('aiven') ? 'Aiven MySQL' : 'Manus TiDB');
        _db = drizzle(dbUrl);
      } catch (error) {
        console.warn("[Database] Failed to connect:", error);
        _db = null;
      }
    }
  }
  return _db;
}

// ===== USER OPERATIONS =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== TRADING ACCOUNT OPERATIONS =====

/**
 * Detecta se uma conta é do tipo cent usando padrões universais.
 * Funciona para qualquer broker, não depende de lista fixa.
 * 
 * Critérios de detecção:
 * 1. Servidor contém "cent" no nome
 * 2. Tipo de conta é "CENT" (se informado)
 * 3. Análise de magnitude: balance > 1.000.000 cents sugere conta cent
 */
function isCentAccountByBroker(
  broker?: string | null, 
  server?: string | null,
  accountType?: string | null,
  balance?: number | null
): boolean {
  // 1. Verifica tipo de conta explícito
  if (accountType?.toUpperCase() === 'CENT') {
    return true;
  }
  
  // 2. Verifica se o servidor contém "cent" no nome
  const serverLower = (server || '').toLowerCase();
  if (serverLower.includes('cent')) {
    return true;
  }
  
  // 3. Análise de magnitude dos valores
  // Contas cent geralmente têm valores muito altos em cents
  // Ex: $2.955 = 29.551.541 cents (conta cent) vs $103.222 = 10.322.229 cents (conta dollar)
  // Threshold: 20.000.000 cents = $200.000 em conta dollar ou $2.000 em conta cent
  // Se balance > 20.000.000 cents, provavelmente é conta cent
  if (balance && balance > 20000000) {
    return true;
  }
  
  return false;
}

export async function createOrUpdateAccount(account: InsertTradingAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Detecta automaticamente se é conta cent usando padrões universais
  const isCent = isCentAccountByBroker(
    account.broker, 
    account.server, 
    account.accountType,
    account.balance
  );
  const accountWithCentFlag = {
    ...account,
    isCentAccount: isCent,
  };

  const existing = await db.select().from(tradingAccounts)
    .where(eq(tradingAccounts.terminalId, account.terminalId))
    .limit(1);

  if (existing.length > 0) {
    await db.update(tradingAccounts)
      .set({
        ...accountWithCentFlag,
        updatedAt: new Date(),
      })
      .where(eq(tradingAccounts.terminalId, account.terminalId));
    return existing[0].id;
  } else {
    const result = await db.insert(tradingAccounts).values(accountWithCentFlag);
    return Number(result[0].insertId);
  }
}

export async function getAccountByTerminalId(terminalId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tradingAccounts)
    .where(eq(tradingAccounts.terminalId, terminalId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tradingAccounts)
    .where(eq(tradingAccounts.userId, userId))
    .orderBy(desc(tradingAccounts.updatedAt));
}

export async function getActiveAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  // Retorna valores em cents sem conversão - frontend fará a exibição
  return await db.select().from(tradingAccounts)
    .where(and(
      eq(tradingAccounts.userId, userId),
      eq(tradingAccounts.isActive, true)
    ))
    .orderBy(desc(tradingAccounts.updatedAt));
}

export async function updateAccountStatus(terminalId: string, status: "connected" | "disconnected" | "error") {
  const db = await getDb();
  if (!db) return;
  await db.update(tradingAccounts)
    .set({ status, lastHeartbeat: new Date(), updatedAt: new Date() })
    .where(eq(tradingAccounts.terminalId, terminalId));
}

// ===== TRADE OPERATIONS =====

/**
 * Aplica conversão de valores para trades de contas cent
 */
async function applyTradeConversion(trades: Trade[]): Promise<Trade[]> {
  const db = await getDb();
  if (!db || trades.length === 0) return trades;
  
  // Buscar informações das contas para saber quais são cent
  const accountIds = Array.from(new Set(trades.map(t => t.accountId)));
  const accounts = await db.select().from(tradingAccounts)
    .where(inArray(tradingAccounts.id, accountIds));
  
  const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
  
  // Retorna trades com flag isCentAccount da conta associada
  return trades.map(trade => {
    const account = accountMap.get(trade.accountId);
    return {
      ...trade,
      isCentAccount: account?.isCentAccount || false,
    };
  });
}

export async function createOrUpdateTrade(trade: InsertTrade) {
  const db = await getDb();
  if (!db) {
    console.error("[DB] Database not available for createOrUpdateTrade");
    throw new Error("Database not available");
  }

  // Detectar automaticamente se o trade está aberto ou fechado
  // CRITÉRIO DEFINITIVO: closeTime
  // - Se closeTime é null ou undefined → ABERTO (posição flutuante)
  // - Se closeTime existe → FECHADO (histórico)
  let actualStatus: "open" | "closed" = "closed";
  
  if (!trade.closeTime || trade.closeTime === null || trade.closeTime === undefined) {
    actualStatus = "open";
  } else {
    actualStatus = "closed";
  }

  const tradeWithStatus = {
    ...trade,
    status: actualStatus
  };

  try {
    const existing = await db.select().from(trades)
      .where(and(
        eq(trades.accountId, trade.accountId),
        eq(trades.ticket, trade.ticket)
      ))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[DB] Updating trade ticket=${trade.ticket}, status=${actualStatus}`);
      await db.update(trades)
        .set({
          ...tradeWithStatus,
          updatedAt: new Date(),
        })
        .where(eq(trades.id, existing[0].id));
      return existing[0].id;
    } else {
      console.log(`[DB] Inserting new trade ticket=${trade.ticket}, symbol=${trade.symbol}, status=${actualStatus}`);
      const result = await db.insert(trades).values(tradeWithStatus);
      console.log(`[DB] Trade inserted with ID=${result[0].insertId}`);
      return Number(result[0].insertId);
    }
  } catch (error) {
    console.error("[DB] Error in createOrUpdateTrade:", error);
    console.error("[DB] Trade data:", JSON.stringify(trade, null, 2));
    throw error;
  }
}

export async function getUserTrades(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    trade: trades,
    account: tradingAccounts
  }).from(trades)
    .leftJoin(tradingAccounts, eq(trades.accountId, tradingAccounts.id))
    .where(eq(trades.userId, userId))
    .orderBy(desc(trades.openTime))
    .limit(limit);
  
  const tradesWithAccount = result.map(r => ({
    ...r.trade,
    accountNumber: r.account?.accountNumber,
    broker: r.account?.broker,
    accountType: r.account?.accountType
  }));
  
  return await applyTradeConversion(tradesWithAccount);
}

export async function getAccountTrades(accountId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(trades)
    .where(eq(trades.accountId, accountId))
    .orderBy(desc(trades.openTime))
    .limit(limit);
  return await applyTradeConversion(result);
}

export async function getOpenTrades(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select().from(trades)
    .where(and(
      eq(trades.userId, userId),
      eq(trades.status, "open")
    ))
    .orderBy(desc(trades.openTime));
  return await applyTradeConversion(result);
}

export async function getTradesByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    trade: trades,
    account: tradingAccounts
  }).from(trades)
    .leftJoin(tradingAccounts, eq(trades.accountId, tradingAccounts.id))
    .where(and(
      eq(trades.userId, userId),
      gte(trades.openTime, startDate),
      lte(trades.openTime, endDate)
    ))
    .orderBy(desc(trades.openTime));
  
  const tradesWithAccount = result.map(r => ({
    ...r.trade,
    accountNumber: r.account?.accountNumber,
    broker: r.account?.broker,
    accountType: r.account?.accountType
  }));
  
  return await applyTradeConversion(tradesWithAccount);
}

export async function closeTrade(tradeId: number, closePrice: number, closeTime: Date, profit: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(trades)
    .set({
      closePrice,
      closeTime,
      profit,
      status: "closed",
      updatedAt: new Date()
    })
    .where(eq(trades.id, tradeId));
}

// ===== BALANCE HISTORY OPERATIONS =====

export async function recordBalanceSnapshot(snapshot: InsertBalanceHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(balanceHistory).values(snapshot);
}

export async function getBalanceHistory(accountId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(balanceHistory)
    .where(and(
      eq(balanceHistory.accountId, accountId),
      gte(balanceHistory.timestamp, startDate),
      lte(balanceHistory.timestamp, endDate)
    ))
    .orderBy(asc(balanceHistory.timestamp));
}

export async function getUserBalanceHistory(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(balanceHistory)
    .where(and(
      eq(balanceHistory.userId, userId),
      gte(balanceHistory.timestamp, startDate),
      lte(balanceHistory.timestamp, endDate)
    ))
    .orderBy(asc(balanceHistory.timestamp));
}

// ===== USER SETTINGS OPERATIONS =====

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) {
    // Retorna configurações padrão se banco não disponível
    return {
      userId,
      theme: "light" as const,
      displayCurrency: "USD",
      dateFormat: "DD/MM/YYYY",
      timezone: "America/Sao_Paulo",
      decimalPrecision: 2,
      heartbeatInterval: 60,
      alertsEnabled: true,
      alertBalance: true,
      alertDrawdown: true,
      alertTrades: true,
      alertConnection: true,
      drawdownThreshold: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  const result = await db.select().from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  
  // Se não existir, retorna configurações padrão
  if (result.length === 0) {
    return {
      userId,
      theme: "light" as const,
      displayCurrency: "USD",
      dateFormat: "DD/MM/YYYY",
      timezone: "America/Sao_Paulo",
      decimalPrecision: 2,
      heartbeatInterval: 60,
      alertsEnabled: true,
      alertBalance: true,
      alertDrawdown: true,
      alertTrades: true,
      alertConnection: true,
      drawdownThreshold: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  return result[0];
}

export async function createOrUpdateUserSettings(settings: InsertUserSettings) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserSettings(settings.userId);
  
  if (existing) {
    await db.update(userSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(userSettings.userId, settings.userId));
  } else {
    await db.insert(userSettings).values(settings);
  }
}

// ===== STRATEGY OPERATIONS =====

export async function createStrategy(strategy: InsertStrategy) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(strategies).values(strategy);
  return Number(result[0].insertId);
}

export async function getUserStrategies(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(strategies)
    .where(eq(strategies.userId, userId))
    .orderBy(desc(strategies.createdAt));
}

export async function updateStrategy(id: number, strategy: Partial<InsertStrategy>) {
  const db = await getDb();
  if (!db) return;
  await db.update(strategies)
    .set({ ...strategy, updatedAt: new Date() })
    .where(eq(strategies.id, id));
}

export async function deleteStrategy(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(strategies).where(eq(strategies.id, id));
}

// ===== TRADE NOTES OPERATIONS =====

export async function createTradeNote(note: InsertTradeNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tradeNotes).values(note);
  return Number(result[0].insertId);
}

export async function getTradeNotes(tradeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tradeNotes)
    .where(eq(tradeNotes.tradeId, tradeId))
    .orderBy(desc(tradeNotes.createdAt));
}

export async function updateTradeNote(id: number, note: Partial<InsertTradeNote>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tradeNotes)
    .set({ ...note, updatedAt: new Date() })
    .where(eq(tradeNotes.id, id));
}

// ===== ECONOMIC EVENTS OPERATIONS =====

export async function createEconomicEvent(event: InsertEconomicEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(economicEvents).values(event);
  return Number(result[0].insertId);
}

export async function getEconomicEvents(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(economicEvents)
    .where(and(
      gte(economicEvents.eventTime, startDate),
      lte(economicEvents.eventTime, endDate)
    ))
    .orderBy(asc(economicEvents.eventTime));
}

export async function getUpcomingEvents(hours: number = 24) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
  return await db.select().from(economicEvents)
    .where(and(
      gte(economicEvents.eventTime, now),
      lte(economicEvents.eventTime, future)
    ))
    .orderBy(asc(economicEvents.eventTime));
}

// ===== COPY TRADING OPERATIONS =====

export async function createCopyTradingConfig(config: InsertCopyTradingConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(copyTradingConfigs).values(config);
  return Number(result[0].insertId);
}

export async function getUserCopyConfigs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(copyTradingConfigs)
    .where(eq(copyTradingConfigs.userId, userId))
    .orderBy(desc(copyTradingConfigs.createdAt));
}

export async function getActiveCopyConfigs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(copyTradingConfigs)
    .where(and(
      eq(copyTradingConfigs.userId, userId),
      eq(copyTradingConfigs.isActive, true)
    ));
}

export async function updateCopyConfig(id: number, config: Partial<InsertCopyTradingConfig>) {
  const db = await getDb();
  if (!db) return;
  await db.update(copyTradingConfigs)
    .set({ ...config, updatedAt: new Date() })
    .where(eq(copyTradingConfigs.id, id));
}

export async function deleteCopyConfig(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(copyTradingConfigs).where(eq(copyTradingConfigs.id, id));
}

// ===== ALERTS OPERATIONS =====

export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(alerts).values(alert);
  return Number(result[0].insertId);
}

export async function getUserAlerts(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(alerts)
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt))
    .limit(limit);
}

export async function getUnreadAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(alerts)
    .where(and(
      eq(alerts.userId, userId),
      eq(alerts.isRead, false)
    ))
    .orderBy(desc(alerts.createdAt));
}

export async function markAlertAsRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alerts)
    .set({ isRead: true })
    .where(eq(alerts.id, id));
}

export async function markAllAlertsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alerts)
    .set({ isRead: true })
    .where(eq(alerts.userId, userId));
}

// ===== ANALYTICS OPERATIONS =====

export async function getTradeStatistics(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;

  let conditions = [eq(trades.userId, userId), eq(trades.status, "closed")];
  if (startDate) conditions.push(gte(trades.openTime, startDate));
  if (endDate) conditions.push(lte(trades.openTime, endDate));

  const rawTrades = await db.select().from(trades)
    .where(and(...conditions));
  
  const allTrades = await applyTradeConversion(rawTrades);

  if (allTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfit: 0,
      totalLoss: 0,
      netProfit: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
    };
  }

  // Converter profits para dólares antes de calcular estatísticas
  const tradesWithConvertedProfit = allTrades.map(t => ({
    ...t,
    profitDollars: (t.profit || 0) / ((t as any).isCentAccount ? 10000 : 100)
  }));
  
  const winningTrades = tradesWithConvertedProfit.filter(t => t.profitDollars > 0);
  const losingTrades = tradesWithConvertedProfit.filter(t => t.profitDollars < 0);
  
  const totalProfit = winningTrades.reduce((sum, t) => sum + t.profitDollars, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitDollars, 0));
  const netProfit = tradesWithConvertedProfit.reduce((sum, t) => sum + t.profitDollars, 0);

  return {
    totalTrades: allTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: (winningTrades.length / allTrades.length) * 100,
    totalProfit,
    totalLoss,
    netProfit,
    profitFactor: totalLoss > 0 ? totalProfit / totalLoss : 0,
    averageWin: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
    averageLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
    largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profitDollars)) : 0,
    largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profitDollars)) : 0,
  };
}

export async function getAccountSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const accounts = await getActiveAccounts(userId);
  
  // Retorna valores em cents sem conversão - frontend fará a exibição
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalEquity = accounts.reduce((sum, acc) => sum + (acc.equity || 0), 0);
  const totalOpenPositions = accounts.reduce((sum, acc) => sum + (acc.openPositions || 0), 0);
  const connectedAccounts = accounts.filter(acc => acc.status === "connected").length;

  return {
    totalAccounts: accounts.length,
    connectedAccounts,
    totalBalance,
    totalEquity,
    totalOpenPositions,
    accounts,
  };
}



// ============================================================================
// TRANSACTIONS
// ============================================================================

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(transactions).values(transaction);
  return Number(result[0].insertId);
}

export async function getAccountTransactions(accountId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(transactions)
    .where(eq(transactions.accountId, accountId))
    .orderBy(desc(transactions.timestamp))
    .limit(limit);
  
  return result;
}

export async function getUserTransactions(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.timestamp))
    .limit(limit);
  
  return result;
}

export async function getTransactionsByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      gte(transactions.timestamp, startDate),
      lte(transactions.timestamp, endDate)
    ))
    .orderBy(desc(transactions.timestamp));
  
  return result;
}

export async function getTransactionStatistics(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;
  
  let conditions = [eq(transactions.userId, userId)];
  if (startDate) conditions.push(gte(transactions.timestamp, startDate));
  if (endDate) conditions.push(lte(transactions.timestamp, endDate));
  
  const allTransactions = await db.select().from(transactions)
    .where(and(...conditions));
  
  const deposits = allTransactions.filter(t => t.type === "deposit");
  const withdrawals = allTransactions.filter(t => t.type === "withdrawal");
  
  const totalDeposits = deposits.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalWithdrawals = withdrawals.reduce((sum, t) => sum + (t.amount || 0), 0);
  
  return {
    totalDeposits,
    totalWithdrawals,
    netFlow: totalDeposits - totalWithdrawals,
    depositCount: deposits.length,
    withdrawalCount: withdrawals.length,
    totalTransactions: allTransactions.length,
  };
}



// ===== ADMIN FUNCTIONS =====

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users).orderBy(users.createdAt);
}

export async function getAllAccounts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tradingAccounts).orderBy(tradingAccounts.createdAt);
}

export async function getSystemStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalUsers: 0,
      totalAccounts: 0,
      totalTrades: 0,
      connectedAccounts: 0,
    };
  }
  
  const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [accountsCount] = await db.select({ count: sql<number>`count(*)` }).from(tradingAccounts);
  const [tradesCount] = await db.select({ count: sql<number>`count(*)` }).from(trades);
  const [connectedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tradingAccounts)
    .where(eq(tradingAccounts.status, "connected"));
  
  return {
    totalUsers: Number(usersCount.count) || 0,
    totalAccounts: Number(accountsCount.count) || 0,
    totalTrades: Number(tradesCount.count) || 0,
    connectedAccounts: Number(connectedCount.count) || 0,
  };
}

export async function updateUserStatus(userId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}



export async function updateUser(userId: number, data: { email?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return;
  
  const updateData: any = {};
  if (data.email !== undefined) updateData.email = data.email;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  // Deletar todas as contas do usuário
  await db.delete(tradingAccounts).where(eq(tradingAccounts.userId, userId));
  
  // Deletar todos os trades do usuário
  await db.delete(trades).where(eq(trades.userId, userId));
  
  // Deletar histórico de balanço
  await db.delete(balanceHistory).where(eq(balanceHistory.userId, userId));
  
  // Deletar transações
  await db.delete(transactions).where(eq(transactions.userId, userId));
  
  // Deletar usuário
  await db.delete(users).where(eq(users.id, userId));
}

export async function updateAccount(accountId: number, data: { isActive?: boolean }) {
  const db = await getDb();
  if (!db) return;
  
  const updateData: any = {};
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  await db.update(tradingAccounts).set(updateData).where(eq(tradingAccounts.id, accountId));
}

export async function deleteAccount(accountId: number) {
  const db = await getDb();
  if (!db) return;
  
  // Deletar todos os trades da conta
  await db.delete(trades).where(eq(trades.accountId, accountId));
  
  // Deletar histórico de balanço
  await db.delete(balanceHistory).where(eq(balanceHistory.accountId, accountId));
  
  // Deletar conta
  await db.delete(tradingAccounts).where(eq(tradingAccounts.id, accountId));
}


// ===== DAILY JOURNAL =====
export async function getDailyJournal(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { dailyJournal } = await import("@/drizzle/schema");
  
  const entries = await db
    .select()
    .from(dailyJournal)
    .where(eq(dailyJournal.userId, userId))
    .orderBy(desc(dailyJournal.date));
  
  return entries.map(entry => ({
    ...entry,
    date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
  }));
}

export async function saveDailyJournal(
  userId: number,
  data: {
    date: string;
    notes?: string;
    mood?: "excellent" | "good" | "neutral" | "bad" | "terrible";
    marketConditions?: string;
    lessonsLearned?: string;
  }
) {
  const db = await getDb();
  if (!db) return { success: false };
  
  const { dailyJournal } = await import("@/drizzle/schema");
  
  // Verificar se já existe entrada para esta data
  const existing = await db
    .select()
    .from(dailyJournal)
    .where(
      and(
        eq(dailyJournal.userId, userId),
        eq(dailyJournal.date, data.date)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Atualizar entrada existente
    await db
      .update(dailyJournal)
      .set({
        notes: data.notes || null,
        mood: data.mood || null,
        marketConditions: data.marketConditions || null,
        lessonsLearned: data.lessonsLearned || null,
        updatedAt: new Date(),
      })
      .where(eq(dailyJournal.id, existing[0].id));
  } else {
    // Criar nova entrada
    await db.insert(dailyJournal).values({
      userId,
      date: data.date,
      notes: data.notes || null,
      mood: data.mood || null,
      marketConditions: data.marketConditions || null,
      lessonsLearned: data.lessonsLearned || null,
    });
  }
  
  return { success: true };
}

