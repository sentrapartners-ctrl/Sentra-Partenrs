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
-- MIGRATION 008: Admin Products Tables
-- ============================================

-- Tabela de Planos de Assinatura
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  features TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Produtos VPS
CREATE TABLE IF NOT EXISTS vps_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ram VARCHAR(20),
  cpu VARCHAR(50),
  storage VARCHAR(50),
  bandwidth VARCHAR(50),
  max_mt4_instances INT DEFAULT 5,
  max_mt5_instances INT DEFAULT 5,
  is_free BOOLEAN DEFAULT false,
  is_recommended BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (active),
  INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Expert Advisors
CREATE TABLE IF NOT EXISTS expert_advisors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  platform VARCHAR(20) NOT NULL,
  file_url VARCHAR(500),
  downloads INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_platform (platform),
  INDEX idx_active (active),
  INDEX idx_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MIGRATION 009: Landing Page Content
-- ============================================

CREATE TABLE IF NOT EXISTS landing_page_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section VARCHAR(50) NOT NULL UNIQUE,
  content JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_section (section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir conteúdo padrão
INSERT IGNORE INTO landing_page_content (section, content) VALUES
('hero', JSON_OBJECT(
  'title', 'Tudo que você sempre quis saber',
  'highlight', 'sobre trading',
  'subtitle', 'A Sentra Partners mostra as métricas que importam e os comportamentos que levam ao lucro com o poder do copy trading, expert advisors e análise avançada.',
  'cta_text', 'Comece Agora Grátis',
  'cta_secondary', 'Ver Demonstração'
)),
('stats', JSON_OBJECT(
  'stat1_value', '99.9%',
  'stat1_label', 'Uptime Garantido',
  'stat2_value', '< 10ms',
  'stat2_label', 'Latência Média',
  'stat3_value', '24/7',
  'stat3_label', 'Suporte Premium',
  'stat4_value', '1000+',
  'stat4_label', 'Traders Ativos'
)),
('copy_trading', JSON_OBJECT(
  'title', 'Copy Trading Poderoso e Automatizado',
  'subtitle', 'Copie as operações dos melhores traders em tempo real'
)),
('analytics', JSON_OBJECT(
  'title', 'Analise suas estatísticas de trading',
  'subtitle', 'Dashboard completo com métricas avançadas'
)),
('vps', JSON_OBJECT(
  'title', 'Servidores VPS de Alta Performance',
  'subtitle', 'Mantenha seus robôs rodando 24/7 com baixa latência'
)),
('eas', JSON_OBJECT(
  'title', 'Robôs de Trading Profissionais',
  'subtitle', 'Expert Advisors otimizados para MT4 e MT5'
)),
('cta_final', JSON_OBJECT(
  'title', 'Pronto para Transformar Seu Trading?',
  'subtitle', 'Junte-se a milhares de traders que já estão lucrando com a Sentra Partners',
  'cta_text', 'Começar Agora',
  'footer_text', '⚡️ 126 pessoas se inscreveram na Sentra Partners nas últimas 4 horas'
));

-- ============================================
-- FIM DAS MIGRATIONS
-- ============================================
