-- ============================================
-- SCRIPT CONSOLIDADO: Todas as Migrations
-- Executa todas as migrations pendentes do Copy Trading
-- ============================================

-- ============================================
-- MIGRATION 004: Copy Trading v4.0
-- ============================================

-- 1. Atualizar tabela copy_signals (adicionar last_heartbeat)
-- MySQL não suporta IF NOT EXISTS em ADD COLUMN, então vamos ignorar erro se já existir
ALTER TABLE copy_signals 
ADD COLUMN last_heartbeat TIMESTAMP NULL DEFAULT NULL;

-- 2. Criar tabela copy_trades (trades individuais com eventos)
CREATE TABLE IF NOT EXISTS copy_trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    master_email VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    ticket VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    type INT NOT NULL COMMENT '0=BUY, 1=SELL',
    lots DECIMAL(10,2) NOT NULL,
    open_price DECIMAL(20,5) NOT NULL,
    stop_loss DECIMAL(20,5) DEFAULT 0,
    take_profit DECIMAL(20,5) DEFAULT 0,
    open_time TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    status ENUM('open', 'closed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_trade (master_email, account_number, ticket),
    INDEX idx_master (master_email, account_number),
    INDEX idx_status (status),
    INDEX idx_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Criar tabela slave_heartbeats (heartbeats dos Slaves)
CREATE TABLE IF NOT EXISTS slave_heartbeats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slave_email VARCHAR(255) NOT NULL,
    master_account_id VARCHAR(50) NOT NULL COMMENT 'Account number da conta Master',
    account_number VARCHAR(50) NOT NULL COMMENT 'Account number da conta Slave',
    broker VARCHAR(255) DEFAULT '',
    positions_count INT DEFAULT 0,
    balance DECIMAL(15,2) DEFAULT 0,
    equity DECIMAL(15,2) DEFAULT 0,
    last_heartbeat TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_slave (slave_email, account_number),
    INDEX idx_slave (slave_email),
    INDEX idx_master (master_account_id),
    INDEX idx_heartbeat (last_heartbeat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Criar índice adicional em copy_signals para performance
-- MySQL não suporta IF NOT EXISTS em CREATE INDEX, então vamos ignorar erro se já existir
CREATE INDEX idx_heartbeat ON copy_signals(last_heartbeat);

-- ============================================
-- MIGRATION 006: Signal Providers
-- ============================================

-- 1. Signal Providers: Usuários que compartilham sinais
CREATE TABLE IF NOT EXISTS signal_providers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  master_account_number VARCHAR(50) NOT NULL,
  provider_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  subscription_fee DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_provider (user_id, master_account_number),
  INDEX idx_public_active (is_public, is_active),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Signal Subscriptions: Usuários que seguem provedores
CREATE TABLE IF NOT EXISTS signal_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subscriber_user_id INT NOT NULL,
  provider_id INT NOT NULL,
  slave_account_number VARCHAR(50) NOT NULL,
  status ENUM('active', 'paused', 'cancelled') DEFAULT 'active',
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  last_sync_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_subscription (subscriber_user_id, provider_id, slave_account_number),
  INDEX idx_subscriber (subscriber_user_id),
  INDEX idx_provider (provider_id),
  INDEX idx_status (status),
  FOREIGN KEY (provider_id) REFERENCES signal_providers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Provider Statistics: Estatísticas dos provedores
CREATE TABLE IF NOT EXISTS provider_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  total_trades INT DEFAULT 0,
  winning_trades INT DEFAULT 0,
  losing_trades INT DEFAULT 0,
  total_profit DECIMAL(15,2) DEFAULT 0.00,
  total_loss DECIMAL(15,2) DEFAULT 0.00,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_profit DECIMAL(15,2) DEFAULT 0.00,
  avg_loss DECIMAL(15,2) DEFAULT 0.00,
  max_drawdown DECIMAL(15,2) DEFAULT 0.00,
  sharpe_ratio DECIMAL(10,4) DEFAULT 0.00,
  total_subscribers INT DEFAULT 0,
  active_subscribers INT DEFAULT 0,
  last_trade_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_provider_stats (provider_id),
  FOREIGN KEY (provider_id) REFERENCES signal_providers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Provider Reviews: Avaliações dos provedores
CREATE TABLE IF NOT EXISTS provider_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider_id INT NOT NULL,
  subscriber_user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_review (provider_id, subscriber_user_id),
  INDEX idx_provider (provider_id),
  INDEX idx_rating (rating),
  FOREIGN KEY (provider_id) REFERENCES signal_providers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- FIM DAS MIGRATIONS
-- ============================================
