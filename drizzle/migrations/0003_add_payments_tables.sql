-- Create products table
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` ENUM('ea', 'copy_trading', 'connector', 'vps', 'subscription', 'strategy') NOT NULL,
  `price_usd` DECIMAL(10, 2) NOT NULL,
  `billing_period` ENUM('one_time', 'monthly', 'quarterly', 'yearly') NOT NULL DEFAULT 'monthly',
  `metadata` TEXT,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `product_id` INT,
  `order_id` VARCHAR(255) NOT NULL UNIQUE,
  `payment_id` VARCHAR(255),
  `invoice_id` VARCHAR(255),
  `price_amount` DECIMAL(10, 2) NOT NULL,
  `price_currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `pay_amount` DECIMAL(20, 8),
  `pay_currency` VARCHAR(10),
  `status` ENUM('pending', 'waiting', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired') NOT NULL DEFAULT 'pending',
  `customer_email` VARCHAR(255),
  `customer_data` TEXT,
  `invoice_url` VARCHAR(500),
  `success_url` VARCHAR(500),
  `cancel_url` VARCHAR(500),
  `delivered` BOOLEAN NOT NULL DEFAULT FALSE,
  `delivered_at` TIMESTAMP NULL,
  `delivery_data` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `paid_at` TIMESTAMP NULL,
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_user_id` (`user_id`)
);

-- Create ea_orders table
CREATE TABLE IF NOT EXISTS `ea_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_id` INT NOT NULL,
  `order_id` VARCHAR(255) NOT NULL,
  `ea_type` ENUM('copy_master', 'copy_slave', 'connector') NOT NULL,
  `platform` ENUM('MT4', 'MT5') NOT NULL,
  `account_number` VARCHAR(50) NOT NULL,
  `expiry_date` TIMESTAMP NOT NULL,
  `source_code` TEXT,
  `compiled_file` VARCHAR(500),
  `download_url` VARCHAR(500),
  `generated` BOOLEAN NOT NULL DEFAULT FALSE,
  `generated_at` TIMESTAMP NULL,
  `compiled` BOOLEAN NOT NULL DEFAULT FALSE,
  `compiled_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_payment_id` (`payment_id`),
  INDEX `idx_order_id` (`order_id`)
);

-- Insert seed products
INSERT INTO `products` (`name`, `description`, `category`, `price_usd`, `billing_period`, `is_active`) VALUES
('Scalper Pro EA', 'Expert Advisor de scalping para operações rápidas', 'ea', 24.99, 'monthly', TRUE),
('Trend Master EA', 'Robô seguidor de tendências de longo prazo', 'ea', 32.99, 'monthly', TRUE),
('Grid Trading EA', 'Sistema de grade para mercados laterais', 'ea', 19.99, 'monthly', TRUE),
('Copy Trading Master MT4', 'EA Master para enviar sinais de copy trading (MT4)', 'copy_trading', 29.99, 'monthly', TRUE),
('Copy Trading Master MT5', 'EA Master para enviar sinais de copy trading (MT5)', 'copy_trading', 29.99, 'monthly', TRUE),
('Copy Trading Slave MT4', 'EA Slave para copiar sinais de trading (MT4)', 'copy_trading', 29.99, 'monthly', TRUE),
('Copy Trading Slave MT5', 'EA Slave para copiar sinais de trading (MT5)', 'copy_trading', 29.99, 'monthly', TRUE),
('Connector MT4', 'Conector para enviar dados da conta para o servidor (MT4)', 'connector', 19.99, 'monthly', TRUE),
('Connector MT5', 'Conector para enviar dados da conta para o servidor (MT5)', 'connector', 19.99, 'monthly', TRUE);

