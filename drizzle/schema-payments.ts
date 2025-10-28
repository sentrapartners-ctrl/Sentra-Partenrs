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

