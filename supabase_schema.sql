-- Sentra Partners - PostgreSQL Schema for Supabase
-- Generated from MySQL schema

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_signed_in TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Trading Accounts table
CREATE TABLE trading_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  terminal_id VARCHAR(128) NOT NULL UNIQUE,
  account_number VARCHAR(64) NOT NULL,
  broker VARCHAR(256),
  platform VARCHAR(50) DEFAULT 'MT5' CHECK (platform IN ('MT4', 'MT5', 'cTrader', 'DXTrade', 'TradeLocker', 'MatchTrade', 'Tradovate')),
  account_type VARCHAR(20) DEFAULT 'STANDARD' CHECK (account_type IN ('CENT', 'STANDARD', 'DEMO', 'LIVE')),
  server VARCHAR(256),
  currency VARCHAR(10) DEFAULT 'USD',
  leverage INTEGER DEFAULT 100,
  balance BIGINT DEFAULT 0,
  equity BIGINT DEFAULT 0,
  margin_free BIGINT DEFAULT 0,
  margin_used BIGINT DEFAULT 0,
  margin_level INTEGER DEFAULT 0,
  open_positions INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  last_heartbeat TIMESTAMP,
  classification VARCHAR(128),
  is_cent_account BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX idx_trading_accounts_status ON trading_accounts(status);

-- Trades table
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES trading_accounts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  ticket VARCHAR(64) NOT NULL,
  symbol VARCHAR(32) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('BUY', 'SELL', 'PENDING', 'OTHER')),
  volume INTEGER NOT NULL,
  open_price BIGINT NOT NULL,
  close_price BIGINT DEFAULT 0,
  current_price BIGINT DEFAULT 0,
  profit INTEGER DEFAULT 0,
  commission INTEGER DEFAULT 0,
  swap INTEGER DEFAULT 0,
  stop_loss BIGINT DEFAULT 0,
  take_profit BIGINT DEFAULT 0,
  magic_number INTEGER DEFAULT 0,
  open_time TIMESTAMP NOT NULL,
  close_time TIMESTAMP,
  duration INTEGER DEFAULT 0,
  comment TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_open_time ON trades(open_time);

-- Balance History table
CREATE TABLE balance_history (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES trading_accounts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  balance INTEGER NOT NULL,
  equity INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_balance_history_account_id ON balance_history(account_id);
CREATE INDEX idx_balance_history_timestamp ON balance_history(timestamp);

-- Transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES trading_accounts(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  comment TEXT,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);

-- Journal Entries table
CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  content TEXT,
  emotion VARCHAR(20) CHECK (emotion IN ('confident', 'nervous', 'greedy', 'fearful', 'neutral', 'disciplined')),
  market_condition VARCHAR(20) CHECK (market_condition IN ('trending', 'ranging', 'volatile', 'quiet')),
  tags TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(date);
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, date);

-- Strategies table
CREATE TABLE strategies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(256) NOT NULL,
  description TEXT,
  rules TEXT,
  entry_conditions TEXT,
  exit_conditions TEXT,
  risk_management TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_strategies_user_id ON strategies(user_id);

-- Trade Notes table
CREATE TABLE trade_notes (
  id SERIAL PRIMARY KEY,
  trade_id INTEGER NOT NULL REFERENCES trades(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  note TEXT,
  tags TEXT,
  screenshot VARCHAR(512),
  emotion VARCHAR(20) CHECK (emotion IN ('confident', 'nervous', 'greedy', 'fearful', 'neutral')),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_trade_notes_trade_id ON trade_notes(trade_id);
CREATE INDEX idx_trade_notes_user_id ON trade_notes(user_id);

-- Alerts table
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('balance', 'drawdown', 'trade', 'connection', 'economic')),
  title VARCHAR(256) NOT NULL,
  message TEXT,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);

-- Economic Events table
CREATE TABLE economic_events (
  id SERIAL PRIMARY KEY,
  event_time TIMESTAMP NOT NULL,
  currency VARCHAR(10) NOT NULL,
  event_name VARCHAR(256) NOT NULL,
  impact VARCHAR(20) NOT NULL CHECK (impact IN ('low', 'medium', 'high')),
  previous_value VARCHAR(64),
  forecast_value VARCHAR(64),
  actual_value VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_economic_events_event_time ON economic_events(event_time);
CREATE INDEX idx_economic_events_currency ON economic_events(currency);
CREATE INDEX idx_economic_events_impact ON economic_events(impact);

-- Copy Trading Configs table
CREATE TABLE copy_trading_configs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(256) NOT NULL,
  source_account_id INTEGER NOT NULL REFERENCES trading_accounts(id),
  target_account_id INTEGER NOT NULL REFERENCES trading_accounts(id),
  copy_ratio INTEGER DEFAULT 100,
  max_lot_size INTEGER DEFAULT 0,
  min_lot_size INTEGER DEFAULT 0,
  stop_on_drawdown INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_copy_trading_configs_user_id ON copy_trading_configs(user_id);
CREATE INDEX idx_copy_trading_configs_source_account_id ON copy_trading_configs(source_account_id);
CREATE INDEX idx_copy_trading_configs_target_account_id ON copy_trading_configs(target_account_id);

-- User Settings table
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  display_currency VARCHAR(10) DEFAULT 'USD',
  date_format VARCHAR(32) DEFAULT 'YYYY-MM-DD',
  timezone VARCHAR(64) DEFAULT 'UTC',
  decimal_precision INTEGER DEFAULT 2,
  heartbeat_interval INTEGER DEFAULT 60,
  alerts_enabled BOOLEAN DEFAULT true,
  alert_balance BOOLEAN DEFAULT true,
  alert_drawdown BOOLEAN DEFAULT true,
  alert_trades BOOLEAN DEFAULT true,
  alert_connection BOOLEAN DEFAULT true,
  drawdown_threshold INTEGER DEFAULT 1000,
  telegram_chat_id VARCHAR(64),
  telegram_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert default admin users
INSERT INTO users (email, password, name, role) VALUES
('adm1@sentra.com', '$2b$10$rZ8qF5vX6YJ9K3mN2pL4eOZGx7wH1tU8sV3cR6dP9fE2aW4bT5yC.', 'Admin 1', 'admin'),
('adm2@sentra.com', '$2b$10$rZ8qF5vX6YJ9K3mN2pL4eOZGx7wH1tU8sV3cR6dP9fE2aW4bT5yC.', 'Admin 2', 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_accounts_updated_at BEFORE UPDATE ON trading_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_notes_updated_at BEFORE UPDATE ON trade_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_copy_trading_configs_updated_at BEFORE UPDATE ON copy_trading_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

