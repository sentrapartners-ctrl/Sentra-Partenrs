import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, index, date, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).unique(),
  password: varchar("password", { length: 255 }), // bcrypt hash - optional for wallet-only users
  name: text("name"),
  walletAddress: varchar("walletAddress", { length: 128 }).unique(), // Web3 wallet address
  authMethod: mysqlEnum("authMethod", ["email", "wallet", "both"]).default("email").notNull(),
  role: mysqlEnum("role", ["client", "manager", "admin"]).default("client").notNull(),
  managerId: int("managerId"), // ID do gerente responsável (null para admin e managers)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Manager Assignments - tracks which manager is responsible for which clients
 */
export const managerAssignments = mysqlTable("manager_assignments", {
  id: int("id").autoincrement().primaryKey(),
  managerId: int("managerId").notNull(),
  clientId: int("clientId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  assignedBy: int("assignedBy"), // admin who made the assignment
  isActive: boolean("isActive").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  managerIdIdx: index("managerId_idx").on(table.managerId),
  clientIdIdx: index("clientId_idx").on(table.clientId),
  isActiveIdx: index("isActive_idx").on(table.isActive),
}));

export type ManagerAssignment = typeof managerAssignments.$inferSelect;
export type InsertManagerAssignment = typeof managerAssignments.$inferInsert;

/**
 * Subscription Plans - defines available subscription tiers
 */
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  priceMonthly: int("priceMonthly").notNull(), // stored in cents
  priceQuarterly: int("priceQuarterly"), // stored in cents (3 months)
  priceSemestral: int("priceSemestral"), // stored in cents (6 months)
  priceYearly: int("priceYearly"), // stored in cents (12 months)
  priceLifetime: int("priceLifetime"), // stored in cents (one-time payment)
  features: text("features"), // JSON array of features
  maxAccounts: int("maxAccounts").default(1),
  copyTradingEnabled: boolean("copyTradingEnabled").default(false),
  advancedAnalyticsEnabled: boolean("advancedAnalyticsEnabled").default(false),
  freeVpsEnabled: boolean("freeVpsEnabled").default(false),
  prioritySupport: boolean("prioritySupport").default(false),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * User Subscriptions - tracks active subscriptions
 */
export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  price: int("price").notNull(), // preço pago em cents
  status: mysqlEnum("status", ["active", "cancelled", "expired", "pending"]).default("pending").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  autoRenew: boolean("autoRenew").default(true),
  pendingPlanId: int("pendingPlanId"), // plano agendado para próxima renovação (downgrade)
  pendingPrice: int("pendingPrice"), // preço do plano agendado
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
  endDateIdx: index("endDate_idx").on(table.endDate),
}));

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

/**
 * VPS Products - available VPS configurations for sale
 */
export const vpsProducts = mysqlTable("vps_products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  description: text("description"),
  specifications: text("specifications"), // JSON: CPU, RAM, Storage, Bandwidth
  price: int("price").notNull(), // stored in cents
  billingCycle: mysqlEnum("billingCycle", ["monthly", "quarterly", "yearly"]).default("monthly").notNull(),
  location: varchar("location", { length: 128 }),
  provider: varchar("provider", { length: 128 }),
  maxMt4Instances: int("maxMt4Instances").default(1),
  maxMt5Instances: int("maxMt5Instances").default(1),
  setupFee: int("setupFee").default(0), // stored in cents
  isAvailable: boolean("isAvailable").default(true).notNull(),
  stockQuantity: int("stockQuantity").default(0),
  imageUrl: varchar("imageUrl", { length: 512 }),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  slugIdx: index("slug_idx").on(table.slug),
  isAvailableIdx: index("isAvailable_idx").on(table.isAvailable),
}));

export type VpsProduct = typeof vpsProducts.$inferSelect;
export type InsertVpsProduct = typeof vpsProducts.$inferInsert;

/**
 * Expert Advisor Products - EAs for sale
 */
export const eaProducts = mysqlTable("ea_products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  description: text("description"),
  longDescription: text("longDescription"),
  platform: mysqlEnum("platform", ["MT4", "MT5", "BOTH"]).notNull(),
  price: int("price").notNull(), // stored in cents
  licenseType: mysqlEnum("licenseType", ["single", "unlimited", "rental"]).default("single").notNull(),
  rentalPeriod: int("rentalPeriod").default(0), // days (0 = not rental)
  features: text("features"), // JSON array
  strategy: text("strategy"),
  backtestResults: text("backtestResults"), // JSON
  fileUrl: varchar("fileUrl", { length: 512 }), // S3 URL
  version: varchar("version", { length: 32 }),
  imageUrl: varchar("imageUrl", { length: 512 }),
  demoUrl: varchar("demoUrl", { length: 512 }),
  videoUrl: varchar("videoUrl", { length: 512 }),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  isExclusive: boolean("isExclusive").default(false), // Exclusive/limited edition
  downloads: int("downloads").default(0),
  rating: int("rating").default(0), // average rating * 100
  reviewCount: int("reviewCount").default(0),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  slugIdx: index("slug_idx").on(table.slug),
  platformIdx: index("platform_idx").on(table.platform),
  isAvailableIdx: index("isAvailable_idx").on(table.isAvailable),
  isExclusiveIdx: index("isExclusive_idx").on(table.isExclusive),
}));

export type EaProduct = typeof eaProducts.$inferSelect;
export type InsertEaProduct = typeof eaProducts.$inferInsert;

/**
 * User Purchases - tracks VPS and EA purchases
 */
export const userPurchases = mysqlTable("user_purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productType: mysqlEnum("productType", ["vps", "ea", "subscription"]).notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 256 }).notNull(),
  amount: int("amount").notNull(), // stored in cents
  status: mysqlEnum("status", ["pending", "completed", "cancelled", "refunded", "confirming"]).default("pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["crypto_btc", "crypto_usdt", "crypto_matic", "crypto_eth", "pix", "card"]),
  cryptoAddress: varchar("cryptoAddress", { length: 256 }), // Receiving address
  cryptoTxHash: varchar("cryptoTxHash", { length: 256 }), // Transaction hash
  cryptoAmount: varchar("cryptoAmount", { length: 64 }), // Amount in crypto
  cryptoNetwork: varchar("cryptoNetwork", { length: 64 }), // BTC, ETH, Polygon, etc
  transactionId: varchar("transactionId", { length: 256 }),
  licenseKey: varchar("licenseKey", { length: 256 }),
  expiresAt: timestamp("expiresAt"),
  downloadUrl: varchar("downloadUrl", { length: 512 }),
  downloadCount: int("downloadCount").default(0),
  maxDownloads: int("maxDownloads").default(3),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  productTypeIdx: index("productType_idx").on(table.productType),
  statusIdx: index("status_idx").on(table.status),
  licenseKeyIdx: index("licenseKey_idx").on(table.licenseKey),
}));

export type UserPurchase = typeof userPurchases.$inferSelect;
export type InsertUserPurchase = typeof userPurchases.$inferInsert;

/**
 * Product Reviews - user reviews for EAs
 */
export const productReviews = mysqlTable("product_reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productType: mysqlEnum("productType", ["vps", "ea"]).notNull(),
  productId: int("productId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 256 }),
  comment: text("comment"),
  isVerifiedPurchase: boolean("isVerifiedPurchase").default(false),
  isApproved: boolean("isApproved").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  productTypeIdx: index("productType_idx").on(table.productType),
  productIdIdx: index("productId_idx").on(table.productId),
  isApprovedIdx: index("isApproved_idx").on(table.isApproved),
}));

export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = typeof productReviews.$inferInsert;

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
  isCentAccount: boolean("isCentAccount").default(false).notNull(),
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
  origin: mysqlEnum("origin", ["robot", "manual", "unknown"]).default("unknown").notNull(),
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
  isCentAccount: boolean("isCentAccount").default(false).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  accountIdIdx: index("accountId_idx").on(table.accountId),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
}));

export type BalanceHistory = typeof balanceHistory.$inferSelect;
export type InsertBalanceHistory = typeof balanceHistory.$inferInsert;

/**
 * Account transactions - tracks deposits and withdrawals
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal"]).notNull(),
  amount: int("amount").notNull(), // stored in cents
  balanceBefore: int("balanceBefore").notNull(), // stored in cents
  balanceAfter: int("balanceAfter").notNull(), // stored in cents
  comment: text("comment"),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  accountIdIdx: index("accountId_idx").on(table.accountId),
  userIdIdx: index("userId_idx").on(table.userId),
  typeIdx: index("type_idx").on(table.type),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
}));

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

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
  barkKey: varchar("barkKey", { length: 255 }), // Bark notification key
  barkDailyEnabled: boolean("barkDailyEnabled").default(true),
  barkWeeklyEnabled: boolean("barkWeeklyEnabled").default(true),
  barkDailyTime: varchar("barkDailyTime", { length: 5 }).default("19:00"),
  barkWeeklyTime: varchar("barkWeeklyTime", { length: 5 }).default("08:00"),
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


/**
 * Daily journal entries - trading diary by date
 */
export const dailyJournal = mysqlTable("daily_journal", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: date("date").notNull(), // YYYY-MM-DD
  notes: text("notes"), // Daily notes/observations
  mood: mysqlEnum("mood", ["excellent", "good", "neutral", "bad", "terrible"]),
  marketConditions: text("marketConditions"),
  lessonsLearned: text("lessonsLearned"),
  tags: text("tags"), // JSON array string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  dateIdx: index("date_idx").on(table.date),
  userDateIdx: index("user_date_idx").on(table.userId, table.date),
}));

export type DailyJournal = typeof dailyJournal.$inferSelect;
export type InsertDailyJournal = typeof dailyJournal.$inferInsert;



/**
 * Crypto Payment Addresses - stores receiving addresses for payments
 */
export const cryptoPaymentAddresses = mysqlTable("crypto_payment_addresses", {
  id: int("id").autoincrement().primaryKey(),
  currency: mysqlEnum("currency", ["BTC", "USDT", "MATIC", "ETH"]).notNull(),
  network: varchar("network", { length: 64 }).notNull(), // Bitcoin, Ethereum, Polygon
  address: varchar("address", { length: 256 }).notNull().unique(),
  label: varchar("label", { length: 128 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  currencyIdx: index("currency_idx").on(table.currency),
  isActiveIdx: index("isActive_idx").on(table.isActive),
}));

export type CryptoPaymentAddress = typeof cryptoPaymentAddresses.$inferSelect;
export type InsertCryptoPaymentAddress = typeof cryptoPaymentAddresses.$inferInsert;

/**
 * Crypto Exchange Rates - stores current exchange rates
 */
export const cryptoExchangeRates = mysqlTable("crypto_exchange_rates", {
  id: int("id").autoincrement().primaryKey(),
  currency: varchar("currency", { length: 16 }).notNull(),
  usdRate: decimal("usdRate", { precision: 20, scale: 8 }).notNull(), // Price in USD
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
}, (table) => ({
  currencyIdx: index("currency_idx").on(table.currency),
  lastUpdatedIdx: index("lastUpdated_idx").on(table.lastUpdated),
}));

export type CryptoExchangeRate = typeof cryptoExchangeRates.$inferSelect;
export type InsertCryptoExchangeRate = typeof cryptoExchangeRates.$inferInsert;

/**
 * Payment Transactions - detailed payment tracking
 */
export const paymentTransactions = mysqlTable("payment_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  purchaseId: int("purchaseId"), // Links to user_purchases
  amount: int("amount").notNull(), // Amount in cents (USD)
  paymentMethod: mysqlEnum("paymentMethod", ["crypto_btc", "crypto_usdt", "crypto_matic", "crypto_eth", "pix", "card"]).notNull(),
  status: mysqlEnum("status", ["pending", "confirming", "completed", "failed", "expired"]).default("pending").notNull(),
  
  // Crypto specific fields
  cryptoCurrency: varchar("cryptoCurrency", { length: 16 }),
  cryptoAmount: varchar("cryptoAmount", { length: 64 }),
  cryptoAddress: varchar("cryptoAddress", { length: 256 }), // Receiving address
  cryptoTxHash: varchar("cryptoTxHash", { length: 256 }),
  cryptoNetwork: varchar("cryptoNetwork", { length: 64 }),
  confirmations: int("confirmations").default(0),
  requiredConfirmations: int("requiredConfirmations").default(3),
  
  // General fields
  expiresAt: timestamp("expiresAt"),
  completedAt: timestamp("completedAt"),
  metadata: text("metadata"), // JSON for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  purchaseIdIdx: index("purchaseId_idx").on(table.purchaseId),
  statusIdx: index("status_idx").on(table.status),
  cryptoTxHashIdx: index("cryptoTxHash_idx").on(table.cryptoTxHash),
}));

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;

/**
 * Wallet Sessions - for Web3 authentication
 */
export const walletSessions = mysqlTable("wallet_sessions", {
  id: int("id").autoincrement().primaryKey(),
  walletAddress: varchar("walletAddress", { length: 128 }).notNull(),
  nonce: varchar("nonce", { length: 256 }).notNull(), // For signature verification
  signature: varchar("signature", { length: 512 }),
  isVerified: boolean("isVerified").default(false).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  walletAddressIdx: index("walletAddress_idx").on(table.walletAddress),
  expiresAtIdx: index("expiresAt_idx").on(table.expiresAt),
}));

export type WalletSession = typeof walletSessions.$inferSelect;
export type InsertWalletSession = typeof walletSessions.$inferInsert;



/**
 * Support Tickets - Customer support ticket system
 */
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 256 }),
  status: mysqlEnum("status", ["open", "in_progress", "waiting_user", "waiting_support", "resolved", "closed"]).default("open").notNull(),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal").notNull(),
  assignedTo: int("assignedTo"),
  category: varchar("category", { length: 128 }),
  lastMessageAt: timestamp("lastMessageAt"),
  resolvedAt: timestamp("resolvedAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
  assignedToIdx: index("assignedTo_idx").on(table.assignedTo),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Support Messages - Messages within support tickets
 */
export const supportMessages = mysqlTable("support_messages", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  senderId: int("senderId").notNull(),
  senderType: mysqlEnum("senderType", ["user", "support", "system"]).default("user").notNull(),
  message: text("message").notNull(),
  attachments: text("attachments"), // JSON array of attachment URLs
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  ticketIdIdx: index("ticketId_idx").on(table.ticketId),
  senderIdIdx: index("senderId_idx").on(table.senderId),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
  isReadIdx: index("isRead_idx").on(table.isRead),
}));
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

/**
 * Support Notifications - Notifications for support events
 */
export const supportNotifications = mysqlTable("support_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ticketId: int("ticketId").notNull(),
  type: mysqlEnum("type", ["new_message", "ticket_assigned", "ticket_resolved", "ticket_closed"]).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  ticketIdIdx: index("ticketId_idx").on(table.ticketId),
  isReadIdx: index("isRead_idx").on(table.isRead),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));
export type SupportNotification = typeof supportNotifications.$inferSelect;
export type InsertSupportNotification = typeof supportNotifications.$inferInsert;



/**
 * Client Transfer History - Tracks client transfers between managers
 */
export const clientTransferHistory = mysqlTable("client_transfer_history", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  fromManagerId: int("fromManagerId"),
  toManagerId: int("toManagerId").notNull(),
  transferredBy: int("transferredBy").notNull(),
  reason: text("reason"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  clientIdIdx: index("clientId_idx").on(table.clientId),
  fromManagerIdIdx: index("fromManagerId_idx").on(table.fromManagerId),
  toManagerIdIdx: index("toManagerId_idx").on(table.toManagerId),
  transferredByIdx: index("transferredBy_idx").on(table.transferredBy),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));
export type ClientTransferHistory = typeof clientTransferHistory.$inferSelect;
export type InsertClientTransferHistory = typeof clientTransferHistory.$inferInsert;



/**
 * EA Licenses - Manages licenses for Expert Advisors
 */
export const eaLicenses = mysqlTable("ea_licenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Usuário dono da licença
  accountNumber: varchar("accountNumber", { length: 64 }).notNull(), // Número da conta MT4/MT5
  eaType: mysqlEnum("eaType", ["master", "slave", "both"]).default("both").notNull(), // Tipo de EA permitido
  expiryDate: timestamp("expiryDate").notNull(), // Data de expiração
  isActive: boolean("isActive").default(true).notNull(), // Licença ativa
  maxSlaves: int("maxSlaves").default(0), // Número máximo de slaves (0 = ilimitado)
  notes: text("notes"), // Notas administrativas
  createdBy: int("createdBy"), // Admin que criou a licença
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt"), // Última vez que a licença foi validada
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  accountNumberIdx: index("accountNumber_idx").on(table.accountNumber),
  expiryDateIdx: index("expiryDate_idx").on(table.expiryDate),
  isActiveIdx: index("isActive_idx").on(table.isActive),
  // Unique constraint: uma licença por conta
  accountNumberUnique: index("accountNumber_unique").on(table.accountNumber),
}));

export type EALicense = typeof eaLicenses.$inferSelect;
export type InsertEALicense = typeof eaLicenses.$inferInsert;

/**
 * EA License Usage Log - Tracks EA license validation attempts
 */
export const eaLicenseUsageLogs = mysqlTable("ea_license_usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  licenseId: int("licenseId").notNull(),
  accountNumber: varchar("accountNumber", { length: 64 }).notNull(),
  eaType: mysqlEnum("eaType", ["master", "slave"]).notNull(),
  validationResult: mysqlEnum("validationResult", ["success", "expired", "invalid", "inactive"]).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 ou IPv6
  terminalInfo: text("terminalInfo"), // Informações do terminal MT4/MT5
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  licenseIdIdx: index("licenseId_idx").on(table.licenseId),
  accountNumberIdx: index("accountNumber_idx").on(table.accountNumber),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
  validationResultIdx: index("validationResult_idx").on(table.validationResult),
}));

export type EALicenseUsageLog = typeof eaLicenseUsageLogs.$inferSelect;
export type InsertEALicenseUsageLog = typeof eaLicenseUsageLogs.$inferInsert;

import { mysqlTable, int, varchar, decimal, timestamp, text, boolean, mysqlEnum } from "drizzle-orm/mysql-core";

export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["ea", "copy_trading", "connector", "vps", "subscription", "strategy"]).notNull(),
  priceUsd: decimal("price_usd", { precision: 10, scale: 2 }).notNull(),
  billingPeriod: mysqlEnum("billing_period", ["one_time", "monthly", "quarterly", "yearly"]).notNull().default("monthly"),
  metadata: text("metadata"), // JSON string
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const payments = mysqlTable("payments", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id"),
  productId: int("product_id"),
  orderId: varchar("order_id", { length: 255 }).notNull().unique(),
  paymentId: varchar("payment_id", { length: 255 }),
  invoiceId: varchar("invoice_id", { length: 255 }),
  
  // Payment details
  priceAmount: decimal("price_amount", { precision: 10, scale: 2 }).notNull(),
  priceCurrency: varchar("price_currency", { length: 10 }).notNull().default("USD"),
  payAmount: decimal("pay_amount", { precision: 20, scale: 8 }),
  payCurrency: varchar("pay_currency", { length: 10 }),
  
  // Status
  status: mysqlEnum("status", ["pending", "waiting", "confirming", "confirmed", "sending", "partially_paid", "finished", "failed", "refunded", "expired"]).notNull().default("pending"),
  
  // Customer info
  customerEmail: varchar("customer_email", { length: 255 }),
  customerData: text("customer_data"), // JSON: account number, EA type, etc
  
  // URLs
  invoiceUrl: varchar("invoice_url", { length: 500 }),
  successUrl: varchar("success_url", { length: 500 }),
  cancelUrl: varchar("cancel_url", { length: 500 }),
  
  // Delivery
  delivered: boolean("delivered").notNull().default(false),
  deliveredAt: timestamp("delivered_at"),
  deliveryData: text("delivery_data"), // JSON: download link, EA file, etc
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  paidAt: timestamp("paid_at"),
});

export const eaOrders = mysqlTable("ea_orders", {
  id: int("id").primaryKey().autoincrement(),
  paymentId: int("payment_id").notNull(),
  orderId: varchar("order_id", { length: 255 }).notNull(),
  
  // EA Details
  eaType: mysqlEnum("ea_type", ["copy_master", "copy_slave", "connector"]).notNull(),
  platform: mysqlEnum("platform", ["MT4", "MT5"]).notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  
  // Generated EA
  sourceCode: text("source_code"), // Generated .mq4/.mq5 code
  compiledFile: varchar("compiled_file", { length: 500 }), // Path to .ex4/.ex5
  downloadUrl: varchar("download_url", { length: 500 }),
  
  // Status
  generated: boolean("generated").notNull().default(false),
  generatedAt: timestamp("generated_at"),
  compiled: boolean("compiled").notNull().default(false),
  compiledAt: timestamp("compiled_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});


/**
 * API Keys - for MT4/MT5 Expert Advisor integration
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(), // User-friendly name
  key: varchar("key", { length: 64 }).notNull().unique(), // The actual API key
  isActive: boolean("isActive").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  keyIdx: index("key_idx").on(table.key),
  isActiveIdx: index("isActive_idx").on(table.isActive),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Notifications - General notification system
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["trade", "account", "alert", "system", "support"]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("readAt"),
  metadata: text("metadata"), // JSON for additional data (e.g., tradeId, accountId)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  readIdx: index("read_idx").on(table.read),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
  typeIdx: index("type_idx").on(table.type),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;


/**
 * Copy Trading Settings - configurações de cópia por relação Master/Slave
 */
export const copyTradingSettings = mysqlTable("copy_trading_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  masterAccountId: varchar("masterAccountId", { length: 64 }).notNull(),
  slaveAccountId: varchar("slaveAccountId", { length: 64 }).notNull(),
  
  // Configurações de SL/TP
  slTpMode: mysqlEnum("slTpMode", ["copy_100", "multiply", "fixed_pips", "none"]).default("copy_100").notNull(),
  slMultiplier: decimal("slMultiplier", { precision: 5, scale: 2 }).default("1.00"),
  tpMultiplier: decimal("tpMultiplier", { precision: 5, scale: 2 }).default("1.00"),
  slFixedPips: int("slFixedPips").default(20),
  tpFixedPips: int("tpFixedPips").default(40),
  
  // Configurações de Volume
  volumeMode: mysqlEnum("volumeMode", ["copy_100", "multiply", "fixed"]).default("copy_100").notNull(),
  volumeMultiplier: decimal("volumeMultiplier", { precision: 5, scale: 2 }).default("1.00"),
  volumeFixed: decimal("volumeFixed", { precision: 10, scale: 2 }).default("0.01"),
  maxVolume: decimal("maxVolume", { precision: 10, scale: 2 }).default("1.00"),
  
  // Filtros
  enableSymbolFilter: boolean("enableSymbolFilter").default(false),
  allowedSymbols: text("allowedSymbols"), // JSON array
  enableDirectionFilter: boolean("enableDirectionFilter").default(false),
  allowedDirections: text("allowedDirections"), // JSON array ["BUY", "SELL"]
  
  // Gerenciamento de Risco
  enableRiskManagement: boolean("enableRiskManagement").default(false),
  maxDailyLoss: decimal("maxDailyLoss", { precision: 10, scale: 2 }).default("100.00"),
  maxDailyTrades: int("maxDailyTrades").default(20),
  
  // Status e controle
  isActive: boolean("isActive").default(true).notNull(),
  dailyLoss: decimal("dailyLoss", { precision: 10, scale: 2 }).default("0.00"), // perda acumulada hoje
  dailyTradesCount: int("dailyTradesCount").default(0), // trades copiados hoje
  lastResetDate: date("lastResetDate"), // data do último reset diário
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  masterAccountIdIdx: index("masterAccountId_idx").on(table.masterAccountId),
  slaveAccountIdIdx: index("slaveAccountId_idx").on(table.slaveAccountId),
  isActiveIdx: index("isActive_idx").on(table.isActive),
  uniqueRelation: index("unique_relation_idx").on(table.userId, table.masterAccountId, table.slaveAccountId),
}));

export type CopyTradingSettings = typeof copyTradingSettings.$inferSelect;
export type InsertCopyTradingSettings = typeof copyTradingSettings.$inferInsert;


/**
 * VPS Requests - solicitações de VPS (ForexVPS.net model)
 */
export const vpsRequests = mysqlTable("vps_requests", {
  id: int("id").autoincrement().primaryKey(),
  userEmail: varchar("user_email", { length: 320 }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 320 }).notNull(),
  provider: mysqlEnum("provider", ["forexvps", "fxsvps", "other"]).default("forexvps").notNull(),
  plan: varchar("plan", { length: 50 }).notNull(), // standard, premium, enterprise
  datacenter: varchar("datacenter", { length: 50 }), // ny, london, tokyo, etc
  volumeRequirement: int("volume_requirement"), // Volume mínimo de trading
  fundsRequirement: decimal("funds_requirement", { precision: 15, scale: 2 }), // Fundos mínimos
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userEmailIdx: index("user_email_idx").on(table.userEmail),
  statusIdx: index("status_idx").on(table.status),
  providerIdx: index("provider_idx").on(table.provider),
}));

export type VpsRequest = typeof vpsRequests.$inferSelect;
export type InsertVpsRequest = typeof vpsRequests.$inferInsert;

/**
 * VPS Instances - VPS ativos (FxSVPS model)
 */
export const vpsInstances = mysqlTable("vps_instances", {
  id: int("id").autoincrement().primaryKey(),
  userEmail: varchar("user_email", { length: 320 }).notNull(),
  clientEmail: varchar("client_email", { length: 320 }).notNull(),
  provider: mysqlEnum("provider", ["forexvps", "fxsvps", "other"]).default("fxsvps").notNull(),
  vpsId: varchar("vps_id", { length: 255 }).unique().notNull(), // ID do VPS no provedor
  plan: varchar("plan", { length: 50 }).notNull(),
  ram: int("ram"), // GB
  storage: int("storage"), // GB
  cpuCores: int("cpu_cores"),
  datacenter: varchar("datacenter", { length: 50 }),
  os: varchar("os", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  status: mysqlEnum("status", ["active", "suspended", "deleted"]).default("active").notNull(),
  monthlyCost: decimal("monthly_cost", { precision: 10, scale: 2 }), // Custo mensal
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }), // Preço cobrado do cliente
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userEmailIdx: index("user_email_idx").on(table.userEmail),
  vpsIdIdx: index("vps_id_idx").on(table.vpsId),
  statusIdx: index("status_idx").on(table.status),
  providerIdx: index("provider_idx").on(table.provider),
}));

export type VpsInstance = typeof vpsInstances.$inferSelect;
export type InsertVpsInstance = typeof vpsInstances.$inferInsert;

/**
 * VPS Settings - configurações de VPS do usuário
 */
export const vpsSettings = mysqlTable("vps_settings", {
  id: int("id").autoincrement().primaryKey(),
  userEmail: varchar("user_email", { length: 320 }).unique().notNull(),
  preferredProvider: mysqlEnum("preferred_provider", ["forexvps", "fxsvps"]).default("forexvps"),
  autoApprove: boolean("auto_approve").default(false).notNull(),
  defaultDatacenter: varchar("default_datacenter", { length: 50 }).default("ny"),
  volumeRequirement: int("volume_requirement").default(10), // 10 lotes
  fundsRequirement: decimal("funds_requirement", { precision: 15, scale: 2 }).default("5000.00"), // $5,000
  offerFreeVps: boolean("offer_free_vps").default(true).notNull(),
  vpsPricing: json("vps_pricing"), // { basic: 20, standard: 40, premium: 80 }
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userEmailIdx: index("user_email_idx").on(table.userEmail),
}));

export type VpsSetting = typeof vpsSettings.$inferSelect;
export type InsertVpsSetting = typeof vpsSettings.$inferInsert;

/**
 * VPS Billing - faturamento de VPS
 */
export const vpsBilling = mysqlTable("vps_billing", {
  id: int("id").autoincrement().primaryKey(),
  userEmail: varchar("user_email", { length: 320 }).notNull(),
  vpsInstanceId: int("vps_instance_id").notNull(),
  provider: mysqlEnum("provider", ["forexvps", "fxsvps", "other"]).notNull(),
  billingPeriodStart: date("billing_period_start").notNull(),
  billingPeriodEnd: date("billing_period_end").notNull(),
  daysUsed: int("days_used").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(), // Custo do provedor
  revenue: decimal("revenue", { precision: 10, scale: 2 }).notNull(), // Receita do cliente
  profit: decimal("profit", { precision: 10, scale: 2 }).notNull(), // Lucro
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userEmailIdx: index("user_email_idx").on(table.userEmail),
  vpsInstanceIdIdx: index("vps_instance_id_idx").on(table.vpsInstanceId),
  statusIdx: index("status_idx").on(table.status),
  billingPeriodIdx: index("billing_period_idx").on(table.billingPeriodStart, table.billingPeriodEnd),
}));

export type VpsBilling = typeof vpsBilling.$inferSelect;
export type InsertVpsBilling = typeof vpsBilling.$inferInsert;
