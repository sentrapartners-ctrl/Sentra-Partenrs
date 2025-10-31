-- Migration 008: Criar tabelas de produtos do admin
-- Criado em: 2025-10-31

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
