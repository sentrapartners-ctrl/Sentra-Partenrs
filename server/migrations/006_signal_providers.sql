-- Signal Providers: Usuários que compartilham sinais
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
);

-- Signal Subscriptions: Usuários que seguem provedores
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
);

-- Provider Statistics: Estatísticas dos provedores
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
);

-- Provider Reviews: Avaliações dos provedores
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
);
