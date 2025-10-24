CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'manager', 'admin')),
  "loginMethod" VARCHAR(50),
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "managerId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users("managerId");

CREATE TABLE IF NOT EXISTS trading_accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "terminalId" VARCHAR(128) UNIQUE NOT NULL,
  "accountNumber" VARCHAR(64) NOT NULL,
  broker VARCHAR(256),
  platform VARCHAR(50) DEFAULT 'MT5' NOT NULL CHECK (platform IN ('MT4', 'MT5', 'cTrader', 'DXTrade', 'TradeLocker', 'MatchTrade', 'Tradovate')),
  "accountType" VARCHAR(50) DEFAULT 'STANDARD' NOT NULL CHECK ("accountType" IN ('CENT', 'STANDARD', 'DEMO', 'LIVE')),
  server VARCHAR(256),
  currency VARCHAR(10) DEFAULT 'USD',
  leverage INTEGER DEFAULT 100,
  balance BIGINT DEFAULT 0,
  equity BIGINT DEFAULT 0,
  "marginFree" BIGINT DEFAULT 0,
  "marginUsed" BIGINT DEFAULT 0,
  "marginLevel" INTEGER DEFAULT 0,
  "openPositions" INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'disconnected' NOT NULL CHECK (status IN ('connected', 'disconnected', 'error')),
  "lastHeartbeat" TIMESTAMP,
  classification VARCHAR(128),
  "isCentAccount" BOOLEAN DEFAULT false NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trading_accounts_userId ON trading_accounts("userId");
CREATE INDEX IF NOT EXISTS idx_trading_accounts_status ON trading_accounts(status);

CREATE TABLE IF NOT EXISTS account_notes (
  id SERIAL PRIMARY KEY,
  "accountId" INTEGER UNIQUE NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  "mt5Login" VARCHAR(128),
  "mt5Password" TEXT,
  "mt5Server" VARCHAR(256),
  "mt5InvestorPassword" TEXT,
  "vpsProvider" VARCHAR(128),
  "vpsIp" VARCHAR(64),
  "vpsUsername" VARCHAR(128),
  "vpsPassword" TEXT,
  "vpsPort" INTEGER,
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_account_notes_accountId ON account_notes("accountId");

CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "accountId" INTEGER NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  ticket VARCHAR(64) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP')),
  symbol VARCHAR(32) NOT NULL,
  volume DECIMAL(18, 8) NOT NULL,
  "openPrice" BIGINT NOT NULL,
  "closePrice" BIGINT,
  "currentPrice" BIGINT,
  "stopLoss" BIGINT,
  "takeProfit" BIGINT,
  profit BIGINT DEFAULT 0,
  swap BIGINT DEFAULT 0,
  commission BIGINT DEFAULT 0,
  "magicNumber" BIGINT,
  comment TEXT,
  duration INTEGER,
  "openTime" TIMESTAMP NOT NULL,
  "closeTime" TIMESTAMP,
  status VARCHAR(20) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'closed', 'pending')),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE("accountId", ticket)
);

CREATE INDEX IF NOT EXISTS idx_trades_userId ON trades("userId");
CREATE INDEX IF NOT EXISTS idx_trades_accountId ON trades("accountId");
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_openTime ON trades("openTime");
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);

CREATE TABLE IF NOT EXISTS balance_history (
  id SERIAL PRIMARY KEY,
  "accountId" INTEGER NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL,
  equity BIGINT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_balance_history_accountId ON balance_history("accountId");
CREATE INDEX IF NOT EXISTS idx_balance_history_timestamp ON balance_history(timestamp);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  "accountId" INTEGER NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'credit', 'bonus', 'commission', 'swap', 'dividend')),
  amount BIGINT NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  description TEXT,
  "externalId" VARCHAR(128),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions("accountId");
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);

CREATE TABLE IF NOT EXISTS user_settings (
  "userId" INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'pt-BR',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  currency VARCHAR(10) DEFAULT 'BRL',
  "emailNotifications" BOOLEAN DEFAULT true,
  "pushNotifications" BOOLEAN DEFAULT true,
  "tradingAlerts" BOOLEAN DEFAULT true,
  "balanceAlerts" BOOLEAN DEFAULT true,
  "drawdownAlerts" BOOLEAN DEFAULT true,
  "connectionAlerts" BOOLEAN DEFAULT true,
  "economicCalendarAlerts" BOOLEAN DEFAULT false,
  "maxDrawdownPercent" INTEGER DEFAULT 20,
  "minBalanceAlert" BIGINT DEFAULT 0,
  "autoStopLoss" BOOLEAN DEFAULT false,
  "autoTakeProfit" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS strategies (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(256) NOT NULL,
  description TEXT,
  type VARCHAR(50) CHECK (type IN ('scalping', 'day_trading', 'swing', 'position', 'algorithmic', 'copy_trading', 'other')),
  "riskLevel" VARCHAR(20) CHECK ("riskLevel" IN ('low', 'medium', 'high', 'very_high')),
  "targetProfit" DECIMAL(10, 2),
  "maxDrawdown" DECIMAL(10, 2),
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  tags TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_strategies_userId ON strategies("userId");

CREATE TABLE IF NOT EXISTS trade_notes (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tradeId" INTEGER REFERENCES trades(id) ON DELETE CASCADE,
  "strategyId" INTEGER REFERENCES strategies(id) ON DELETE SET NULL,
  title VARCHAR(256),
  content TEXT,
  tags TEXT,
  emotion VARCHAR(50) CHECK (emotion IN ('confident', 'fearful', 'greedy', 'neutral', 'anxious', 'excited')),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trade_notes_userId ON trade_notes("userId");
CREATE INDEX IF NOT EXISTS idx_trade_notes_tradeId ON trade_notes("tradeId");

CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  emotion VARCHAR(50) CHECK (emotion IN ('confident', 'fearful', 'greedy', 'neutral', 'anxious', 'excited', 'disciplined', 'impulsive')),
  "marketCondition" VARCHAR(50) CHECK ("marketCondition" IN ('trending', 'ranging', 'volatile', 'calm', 'news_driven', 'uncertain')),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE("userId", date)
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_userId ON journal_entries("userId");
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);

CREATE TABLE IF NOT EXISTS economic_events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(512) NOT NULL,
  country VARCHAR(10) NOT NULL,
  currency VARCHAR(10),
  impact VARCHAR(20) CHECK (impact IN ('low', 'medium', 'high')),
  forecast VARCHAR(128),
  previous VARCHAR(128),
  actual VARCHAR(128),
  timestamp TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_economic_events_timestamp ON economic_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_economic_events_currency ON economic_events(currency);
CREATE INDEX IF NOT EXISTS idx_economic_events_impact ON economic_events(impact);

CREATE TABLE IF NOT EXISTS copy_trading_configs (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "sourceAccountId" INTEGER REFERENCES trading_accounts(id) ON DELETE CASCADE,
  "targetAccountId" INTEGER NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "copyRatio" DECIMAL(10, 4) DEFAULT 1.0,
  "maxLotSize" DECIMAL(10, 2),
  "minLotSize" DECIMAL(10, 2),
  "allowedSymbols" TEXT,
  "blockedSymbols" TEXT,
  "maxDrawdown" DECIMAL(10, 2),
  "stopOnDrawdown" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_copy_trading_userId ON copy_trading_configs("userId");
CREATE INDEX IF NOT EXISTS idx_copy_trading_sourceAccountId ON copy_trading_configs("sourceAccountId");
CREATE INDEX IF NOT EXISTS idx_copy_trading_targetAccountId ON copy_trading_configs("targetAccountId");

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('balance', 'drawdown', 'trade', 'connection', 'economic')),
  title VARCHAR(256) NOT NULL,
  message TEXT,
  severity VARCHAR(20) DEFAULT 'info' NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  "isRead" BOOLEAN DEFAULT false NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_userId ON alerts("userId");
CREATE INDEX IF NOT EXISTS idx_alerts_isRead ON alerts("isRead");
CREATE INDEX IF NOT EXISTS idx_alerts_createdAt ON alerts("createdAt");

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_accounts_updated_at BEFORE UPDATE ON trading_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_account_notes_updated_at BEFORE UPDATE ON account_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_notes_updated_at BEFORE UPDATE ON trade_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_copy_trading_configs_updated_at BEFORE UPDATE ON copy_trading_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO users ("openId", name, email, role, "loginMethod", "isActive")
VALUES 
  ('admin_default_001', 'Admin 1', 'adm1@sentra.com', 'admin', 'email', true),
  ('admin_default_002', 'Admin 2', 'adm2@sentra.com', 'admin', 'email', true)
ON CONFLICT ("openId") DO NOTHING;

