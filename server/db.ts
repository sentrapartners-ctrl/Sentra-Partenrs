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
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
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

export async function createOrUpdateAccount(account: InsertTradingAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(tradingAccounts)
    .where(eq(tradingAccounts.terminalId, account.terminalId))
    .limit(1);

  if (existing.length > 0) {
    await db.update(tradingAccounts)
      .set({
        ...account,
        updatedAt: new Date(),
      })
      .where(eq(tradingAccounts.terminalId, account.terminalId));
    return existing[0].id;
  } else {
    const result = await db.insert(tradingAccounts).values(account);
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

export async function createOrUpdateTrade(trade: InsertTrade) {
  const db = await getDb();
  if (!db) {
    console.error("[DB] Database not available for createOrUpdateTrade");
    throw new Error("Database not available");
  }

  try {
    const existing = await db.select().from(trades)
      .where(and(
        eq(trades.accountId, trade.accountId),
        eq(trades.ticket, trade.ticket)
      ))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[DB] Updating trade ticket=${trade.ticket}`);
      await db.update(trades)
        .set({
          ...trade,
          updatedAt: new Date(),
        })
        .where(eq(trades.id, existing[0].id));
      return existing[0].id;
    } else {
      console.log(`[DB] Inserting new trade ticket=${trade.ticket}, symbol=${trade.symbol}`);
      const result = await db.insert(trades).values(trade);
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
  return await db.select().from(trades)
    .where(eq(trades.userId, userId))
    .orderBy(desc(trades.openTime))
    .limit(limit);
}

export async function getAccountTrades(accountId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(trades)
    .where(eq(trades.accountId, accountId))
    .orderBy(desc(trades.openTime))
    .limit(limit);
}

export async function getOpenTrades(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(trades)
    .where(and(
      eq(trades.userId, userId),
      eq(trades.status, "open")
    ))
    .orderBy(desc(trades.openTime));
}

export async function getTradesByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(trades)
    .where(and(
      eq(trades.userId, userId),
      gte(trades.openTime, startDate),
      lte(trades.openTime, endDate)
    ))
    .orderBy(desc(trades.openTime));
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

export async function getUserSettings(userId: number): Promise<UserSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
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

  const allTrades = await db.select().from(trades)
    .where(and(...conditions));

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

  const winningTrades = allTrades.filter(t => (t.profit || 0) > 0);
  const losingTrades = allTrades.filter(t => (t.profit || 0) < 0);
  
  const totalProfit = winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit || 0), 0));
  const netProfit = allTrades.reduce((sum, t) => sum + (t.profit || 0), 0);

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
    largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profit || 0)) : 0,
    largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profit || 0)) : 0,
  };
}

export async function getAccountSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const accounts = await getActiveAccounts(userId);
  
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

