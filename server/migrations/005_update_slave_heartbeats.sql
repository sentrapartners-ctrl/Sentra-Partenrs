-- Migration: Update slave_heartbeats to use master_account_id
-- Altera coluna master_email para master_account_id

-- 1. Verificar se tabela existe
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

-- 2. Se tabela já existe com master_email, alterar para master_account_id
-- (Esta query vai falhar se a coluna não existir, mas não há problema)
ALTER TABLE slave_heartbeats 
CHANGE COLUMN master_email master_account_id VARCHAR(50) NOT NULL COMMENT 'Account number da conta Master';
