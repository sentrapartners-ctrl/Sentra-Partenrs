-- Script de criação de todas as tabelas do Sentra Partners
-- Execute este script no banco de dados MySQL

-- 1. Verificar e atualizar tabela users
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS walletAddress VARCHAR(128) UNIQUE AFTER password,
  ADD COLUMN IF NOT EXISTS authMethod ENUM('email', 'wallet', 'both') NOT NULL DEFAULT 'email' AFTER walletAddress,
  MODIFY COLUMN role ENUM('client', 'manager', 'admin') NOT NULL DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS managerId INT AFTER role;

-- 2. Criar tabela manager_assignments
CREATE TABLE IF NOT EXISTS manager_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  managerId INT NOT NULL,
  clientId INT NOT NULL,
  assignedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assignedBy INT,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX managerId_idx (managerId),
  INDEX clientId_idx (clientId),
  INDEX isActive_idx (isActive)
);

-- 3. Criar tabela subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  slug VARCHAR(128) NOT NULL UNIQUE,
  description TEXT,
  priceMonthly INT NOT NULL,
  priceQuarterly INT,
  priceSemestral INT,
  priceYearly INT,
  priceLifetime INT,
  features TEXT,
  maxAccounts INT DEFAULT 1,
  copyTradingEnabled BOOLEAN DEFAULT FALSE,
  advancedAnalyticsEnabled BOOLEAN DEFAULT FALSE,
  freeVpsEnabled BOOLEAN DEFAULT FALSE,
  prioritySupport BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Criar tabela user_subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  planId INT NOT NULL,
  status ENUM('active', 'cancelled', 'expired', 'pending') NOT NULL DEFAULT 'pending',
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NOT NULL,
  autoRenew BOOLEAN DEFAULT TRUE,
  cancelledAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX userId_idx (userId),
  INDEX status_idx (status),
  INDEX endDate_idx (endDate)
);

-- 5. Criar tabela vps_products
CREATE TABLE IF NOT EXISTS vps_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  slug VARCHAR(256) NOT NULL UNIQUE,
  description TEXT,
  specifications TEXT,
  price INT NOT NULL,
  billingCycle ENUM('monthly', 'quarterly', 'yearly') NOT NULL DEFAULT 'monthly',
  location VARCHAR(128),
  provider VARCHAR(128),
  maxMt4Instances INT DEFAULT 1,
  maxMt5Instances INT DEFAULT 1,
  setupFee INT DEFAULT 0,
  isAvailable BOOLEAN NOT NULL DEFAULT TRUE,
  stockQuantity INT DEFAULT 0,
  imageUrl VARCHAR(512),
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX slug_idx (slug),
  INDEX isAvailable_idx (isAvailable)
);

-- 6. Criar tabela ea_products
CREATE TABLE IF NOT EXISTS ea_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  slug VARCHAR(256) NOT NULL UNIQUE,
  description TEXT,
  longDescription TEXT,
  platform ENUM('MT4', 'MT5', 'BOTH') NOT NULL,
  price INT NOT NULL,
  licenseType ENUM('single', 'unlimited', 'rental') NOT NULL DEFAULT 'single',
  rentalPeriod INT DEFAULT 0,
  features TEXT,
  strategy TEXT,
  backtestResults TEXT,
  fileUrl VARCHAR(512),
  version VARCHAR(32),
  imageUrl VARCHAR(512),
  demoUrl VARCHAR(512),
  videoUrl VARCHAR(512),
  isAvailable BOOLEAN NOT NULL DEFAULT TRUE,
  isExclusive BOOLEAN DEFAULT FALSE,
  downloads INT DEFAULT 0,
  rating INT DEFAULT 0,
  reviewCount INT DEFAULT 0,
  sortOrder INT DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX slug_idx (slug),
  INDEX platform_idx (platform),
  INDEX isAvailable_idx (isAvailable),
  INDEX isExclusive_idx (isExclusive)
);

-- 7. Criar tabela user_purchases
CREATE TABLE IF NOT EXISTS user_purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  productType ENUM('vps', 'ea', 'subscription') NOT NULL,
  productId INT NOT NULL,
  productName VARCHAR(256) NOT NULL,
  amount INT NOT NULL,
  status ENUM('pending', 'completed', 'cancelled', 'refunded', 'confirming') NOT NULL DEFAULT 'pending',
  paymentMethod ENUM('crypto_btc', 'crypto_usdt', 'crypto_matic', 'crypto_eth', 'pix', 'card'),
  cryptoAddress VARCHAR(256),
  cryptoTxHash VARCHAR(256),
  cryptoAmount VARCHAR(64),
  cryptoNetwork VARCHAR(64),
  transactionId VARCHAR(256),
  licenseKey VARCHAR(256),
  expiresAt TIMESTAMP NULL,
  downloadUrl VARCHAR(512),
  downloadCount INT DEFAULT 0,
  maxDownloads INT DEFAULT 3,
  notes TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX userId_idx (userId),
  INDEX productType_idx (productType),
  INDEX status_idx (status),
  INDEX licenseKey_idx (licenseKey)
);

-- 8. Criar tabela product_reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  productType ENUM('vps', 'ea') NOT NULL,
  productId INT NOT NULL,
  rating INT NOT NULL,
  title VARCHAR(256),
  comment TEXT,
  isVerifiedPurchase BOOLEAN DEFAULT FALSE,
  isApproved BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX userId_idx (userId),
  INDEX productType_idx (productType),
  INDEX productId_idx (productId),
  INDEX isApproved_idx (isApproved)
);

-- 9. Criar tabela crypto_payment_addresses
CREATE TABLE IF NOT EXISTS crypto_payment_addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  currency ENUM('BTC', 'USDT', 'MATIC', 'ETH') NOT NULL,
  network VARCHAR(64) NOT NULL,
  address VARCHAR(256) NOT NULL UNIQUE,
  label VARCHAR(256),
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX currency_idx (currency),
  INDEX isActive_idx (isActive)
);

-- 10. Criar tabela crypto_exchange_rates
CREATE TABLE IF NOT EXISTS crypto_exchange_rates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  currency VARCHAR(16) NOT NULL,
  rateUsd VARCHAR(32) NOT NULL,
  rateBrl VARCHAR(32) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX currency_idx (currency),
  INDEX timestamp_idx (timestamp)
);

-- 11. Criar tabela payment_transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  purchaseId INT,
  type ENUM('purchase', 'subscription', 'deposit') NOT NULL,
  amount INT NOT NULL,
  currency VARCHAR(16) NOT NULL,
  cryptoAmount VARCHAR(64),
  cryptoNetwork VARCHAR(64),
  cryptoAddress VARCHAR(256),
  cryptoTxHash VARCHAR(256),
  status ENUM('pending', 'confirming', 'completed', 'failed', 'expired') NOT NULL DEFAULT 'pending',
  confirmations INT DEFAULT 0,
  requiredConfirmations INT DEFAULT 3,
  expiresAt TIMESTAMP NULL,
  completedAt TIMESTAMP NULL,
  metadata TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX userId_idx (userId),
  INDEX status_idx (status),
  INDEX cryptoTxHash_idx (cryptoTxHash)
);

-- 12. Criar tabela wallet_sessions
CREATE TABLE IF NOT EXISTS wallet_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  walletAddress VARCHAR(128) NOT NULL,
  nonce VARCHAR(256) NOT NULL,
  signature VARCHAR(512),
  isVerified BOOLEAN NOT NULL DEFAULT FALSE,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX walletAddress_idx (walletAddress),
  INDEX expiresAt_idx (expiresAt)
);

-- 13. Renomear tabela accounts para trading_accounts (se necessário)
-- RENAME TABLE accounts TO trading_accounts;

-- 14. Atualizar tabela trading_accounts (ou accounts)
ALTER TABLE accounts 
  MODIFY COLUMN platform ENUM('MT4', 'MT5', 'cTrader', 'DXTrade', 'TradeLocker', 'MatchTrade', 'Tradovate') NOT NULL,
  ADD COLUMN IF NOT EXISTS classification VARCHAR(128) AFTER lastHeartbeat,
  ADD COLUMN IF NOT EXISTS isCentAccount BOOLEAN NOT NULL DEFAULT FALSE AFTER classification;

-- 15. Atualizar tabela trades
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS origin ENUM('robot', 'manual', 'unknown') NOT NULL DEFAULT 'unknown' AFTER comment;

-- Inserir planos de assinatura padrão
INSERT IGNORE INTO subscription_plans (name, slug, description, priceMonthly, priceQuarterly, priceYearly, features, maxAccounts, copyTradingEnabled, advancedAnalyticsEnabled, freeVpsEnabled, prioritySupport, isActive, sortOrder) VALUES
('Free', 'free', 'Plano gratuito com funcionalidades básicas', 0, 0, 0, '["1 conta de trading", "Analytics básico", "Suporte por email"]', 1, FALSE, FALSE, FALSE, FALSE, TRUE, 1),
('Pro', 'pro', 'Plano profissional com analytics avançado', 4900, 13900, 49900, '["5 contas de trading", "Analytics avançado", "Copy trading", "Suporte prioritário"]', 5, TRUE, TRUE, FALSE, TRUE, TRUE, 2),
('Premium', 'premium', 'Plano premium com VPS gratuito', 9900, 28900, 99900, '["Contas ilimitadas", "Analytics avançado", "Copy trading", "VPS gratuito", "Suporte 24/7"]', 999, TRUE, TRUE, TRUE, TRUE, TRUE, 3);

-- Inserir endereços de pagamento crypto padrão
INSERT IGNORE INTO crypto_payment_addresses (currency, network, address, label, isActive) VALUES
('BTC', 'Bitcoin', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'BTC Main Wallet', TRUE),
('USDT', 'Polygon', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'USDT Polygon Wallet', TRUE),
('MATIC', 'Polygon', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'MATIC Polygon Wallet', TRUE),
('ETH', 'Ethereum', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'ETH Main Wallet', TRUE);

SELECT 'Script executado com sucesso! Todas as tabelas foram criadas/atualizadas.' AS status;
