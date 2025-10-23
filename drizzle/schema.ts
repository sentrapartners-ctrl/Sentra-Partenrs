import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Trading accounts table - stores MT4/MT5 account information
 */
export const tradingAccounts = mysqlTable("trading_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  terminalId: varchar("terminalId", { length: 128 }).notNull().unique(),
  accountNumber: varchar("accountNumber", { length: 64 }).notNull(),
  broker: varchar("broker", { length: 256 }),
  platform: mysqlEnum("platform", ["MT4", "MT5", "cTrader", "DXTrade", "TradeLocker", "MatchTrade", "Tradovate"]).notNull(),
  accountType: mysqlEnum("accountType", ["CENT", "STANDARD", "DEMO", "LIVE"]).default("STANDARD").notNull(),
  server: varchar("server", { length: 256 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  leverage: int("leverage").default(100),
  balance: int("balance").default(0), // stored in cents
  equity: int("equity").default(0), // stored in cents
  marginFree: int("marginFree").default(0), // stored in cents
  marginUsed: int("marginUsed").default(0), // stored in cents
  marginLevel: int("marginLevel").default(0), // percentage * 100
  openPositions: int("openPositions").default(0),
  status: mysqlEnum("status", ["connected", "disconnected", "error"]).default("disconnected").notNull(),
  lastHeartbeat: timestamp("lastHeartbeat"),
  classification: varchar("classification", { length: 128 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
}));

export type TradingAccount = typeof tradingAccounts.$inferSelect;
export type InsertTradingAccount = typeof tradingAccounts.$inferInsert;

/**
 * Trades table - stores individual trade records
 */
export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  userId: int("userId").notNull(),
  ticket: varchar("ticket", { length: 64 }).notNull(),
  symbol: varchar("symbol", { length: 32 }).notNull(),
  type: mysqlEnum("type", ["BUY", "SELL", "PENDING", "OTHER"]).notNull(),
  volume: int("volume").notNull(), // stored in lots * 100
  openPrice: int("openPrice").notNull(), // stored as integer (price * 100000)
  closePrice: int("closePrice").default(0), // stored as integer (price * 100000)
  currentPrice: int("currentPrice").default(0), // stored as integer (price * 100000)
  profit: int("profit").default(0), // stored in cents
  commission: int("commission").default(0), // stored in cents
  swap: int("swap").default(0), // stored in cents
  openTime: timestamp("openTime").notNull(),
  closeTime: timestamp("closeTime"),
  comment: text("comment"),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  accountIdIdx: index("accountId_idx").on(table.accountId),
  userIdIdx: index("userId_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
  symbolIdx: index("symbol_idx").on(table.symbol),
  openTimeIdx: index("openTime_idx").on(table.openTime),
}));

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

/**
 * Account balance history - tracks balance changes over time
 */
export const balanceHistory = mysqlTable("balance_history", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  userId: int("userId").notNull(),
  balance: int("balance").notNull(), // stored in cents
  equity: int("equity").notNull(), // stored in cents
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  accountIdIdx: index("accountId_idx").on(table.accountId),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
}));

export type BalanceHistory = typeof balanceHistory.$inferSelect;
export type InsertBalanceHistory = typeof balanceHistory.$inferInsert;

/**
 * User settings and preferences
 */
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  theme: mysqlEnum("theme", ["light", "dark"]).default("light").notNull(),
  displayCurrency: varchar("displayCurrency", { length: 10 }).default("USD"),
  dateFormat: varchar("dateFormat", { length: 32 }).default("YYYY-MM-DD"),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  decimalPrecision: int("decimalPrecision").default(2),
  heartbeatInterval: int("heartbeatInterval").default(60), // seconds
  alertsEnabled: boolean("alertsEnabled").default(true),
  alertBalance: boolean("alertBalance").default(true),
  alertDrawdown: boolean("alertDrawdown").default(true),
  alertTrades: boolean("alertTrades").default(true),
  alertConnection: boolean("alertConnection").default(true),
  drawdownThreshold: int("drawdownThreshold").default(1000), // percentage * 100 (10.00%)
  telegramChatId: varchar("telegramChatId", { length: 64 }),
  telegramEnabled: boolean("telegramEnabled").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

/**
 * Trading strategies/playbooks
 */
export const strategies = mysqlTable("strategies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  rules: text("rules"), // JSON string
  entryConditions: text("entryConditions"),
  exitConditions: text("exitConditions"),
  riskManagement: text("riskManagement"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;

/**
 * Trade notes and journal entries
 */
export const tradeNotes = mysqlTable("trade_notes", {
  id: int("id").autoincrement().primaryKey(),
  tradeId: int("tradeId").notNull(),
  userId: int("userId").notNull(),
  note: text("note"),
  tags: text("tags"), // JSON array string
  screenshot: varchar("screenshot", { length: 512 }), // S3 URL
  emotion: mysqlEnum("emotion", ["confident", "nervous", "greedy", "fearful", "neutral"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tradeIdIdx: index("tradeId_idx").on(table.tradeId),
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type TradeNote = typeof tradeNotes.$inferSelect;
export type InsertTradeNote = typeof tradeNotes.$inferInsert;

/**
 * Economic calendar events
 */
export const economicEvents = mysqlTable("economic_events", {
  id: int("id").autoincrement().primaryKey(),
  eventTime: timestamp("eventTime").notNull(),
  currency: varchar("currency", { length: 10 }).notNull(),
  eventName: varchar("eventName", { length: 256 }).notNull(),
  impact: mysqlEnum("impact", ["low", "medium", "high"]).notNull(),
  previousValue: varchar("previousValue", { length: 64 }),
  forecastValue: varchar("forecastValue", { length: 64 }),
  actualValue: varchar("actualValue", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  eventTimeIdx: index("eventTime_idx").on(table.eventTime),
  currencyIdx: index("currency_idx").on(table.currency),
  impactIdx: index("impact_idx").on(table.impact),
}));

export type EconomicEvent = typeof economicEvents.$inferSelect;
export type InsertEconomicEvent = typeof economicEvents.$inferInsert;

/**
 * Copy trading configurations
 */
export const copyTradingConfigs = mysqlTable("copy_trading_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  sourceAccountId: int("sourceAccountId").notNull(),
  targetAccountId: int("targetAccountId").notNull(),
  copyRatio: int("copyRatio").default(100), // percentage * 100
  maxLotSize: int("maxLotSize").default(0), // lots * 100
  minLotSize: int("minLotSize").default(0), // lots * 100
  stopOnDrawdown: int("stopOnDrawdown").default(0), // percentage * 100
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  sourceAccountIdIdx: index("sourceAccountId_idx").on(table.sourceAccountId),
  targetAccountIdIdx: index("targetAccountId_idx").on(table.targetAccountId),
}));

export type CopyTradingConfig = typeof copyTradingConfigs.$inferSelect;
export type InsertCopyTradingConfig = typeof copyTradingConfigs.$inferInsert;

/**
 * Alerts and notifications
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["balance", "drawdown", "trade", "connection", "economic"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message"),
  severity: mysqlEnum("severity", ["info", "warning", "error"]).default("info").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  isReadIdx: index("isRead_idx").on(table.isRead),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

