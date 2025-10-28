import { mysqlTable, int, text, varchar, json, timestamp } from "drizzle-orm/mysql-core";

/**
 * Landing Page Configuration
 * Stores all editable content for the landing page
 */
export const landingPageConfig = mysqlTable("landing_page_config", {
  id: int("id").autoincrement().primaryKey(),
  
  // Hero Section
  heroTitle: text("heroTitle").notNull(),
  heroHighlight: text("heroHighlight").notNull(), // palavra destacada
  heroSubtitle: text("heroSubtitle").notNull(),
  heroDescription: text("heroDescription").notNull(),
  
  // Hero Metrics
  heroMetricProfit: varchar("heroMetricProfit", { length: 50 }).notNull(),
  heroMetricTrades: varchar("heroMetricTrades", { length: 50 }).notNull(),
  heroMetricWinRate: varchar("heroMetricWinRate", { length: 50 }).notNull(),
  heroMetricProfitFactor: varchar("heroMetricProfitFactor", { length: 50 }).notNull(),
  
  // Stats Section
  statTradesJournaled: varchar("statTradesJournaled", { length: 50 }).notNull(),
  statBacktestedSessions: varchar("statBacktestedSessions", { length: 50 }).notNull(),
  statTradesShared: varchar("statTradesShared", { length: 50 }).notNull(),
  statTradersOnBoard: varchar("statTradersOnBoard", { length: 50 }).notNull(),
  
  // VPS Plans (JSON)
  vpsPlans: json("vpsPlans").notNull(), // Array de objetos { name, price, features[] }
  
  // Expert Advisors (JSON)
  expertAdvisors: json("expertAdvisors").notNull(), // Array de objetos { name, price, winRate, timeframe, description }
  
  // Subscription Plans (JSON)
  subscriptionPlans: json("subscriptionPlans").notNull(), // Array de objetos { name, price, features[], popular }
  
  // Section Texts
  copyTradingTitle: text("copyTradingTitle").notNull(),
  copyTradingDescription: text("copyTradingDescription").notNull(),
  analyticsTitle: text("analyticsTitle").notNull(),
  analyticsDescription: text("analyticsDescription").notNull(),
  
  // Footer CTA
  footerCtaTitle: text("footerCtaTitle").notNull(),
  footerCtaDescription: text("footerCtaDescription").notNull(),
  
  // Metadata
  updatedBy: int("updatedBy"), // user ID who last updated
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LandingPageConfig = typeof landingPageConfig.$inferSelect;
export type InsertLandingPageConfig = typeof landingPageConfig.$inferInsert;

