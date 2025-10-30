-- Migration: Copy Trading v4.0
-- Adiciona suporte a eventos, heartbeat e sincronização

-- 1. Atualizar tabela copy_signals (adicionar last_heartbeat)
ALTER TABLE copy_signals 
ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP NULL DEFAULT NULL AFTER updated_at;

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
    master_email VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    broker VARCHAR(255) DEFAULT '',
    positions_count INT DEFAULT 0,
    balance DECIMAL(15,2) DEFAULT 0,
    equity DECIMAL(15,2) DEFAULT 0,
    last_heartbeat TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_slave (slave_email, account_number),
    INDEX idx_slave (slave_email),
    INDEX idx_master (master_email),
    INDEX idx_heartbeat (last_heartbeat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Criar índice adicional em copy_signals para performance
CREATE INDEX IF NOT EXISTS idx_heartbeat ON copy_signals(last_heartbeat);

