-- Adicionar colunas para sistema de tentativas falhadas de heartbeat
-- Sistema: manter online permanentemente, só desconectar após 10 falhas em 30 minutos

-- Tabela copy_signals (contas Master)
ALTER TABLE copy_signals
  ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0 COMMENT 'Número de tentativas falhadas de heartbeat',
  ADD COLUMN IF NOT EXISTS last_attempt TIMESTAMP NULL COMMENT 'Data/hora da última tentativa de heartbeat',
  ADD COLUMN IF NOT EXISTS is_connected BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status de conexão (true=online, false=offline)';

-- Tabela slave_heartbeats (contas Slave)
ALTER TABLE slave_heartbeats
  ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0 COMMENT 'Número de tentativas falhadas de heartbeat',
  ADD COLUMN IF NOT EXISTS last_attempt TIMESTAMP NULL COMMENT 'Data/hora da última tentativa de heartbeat',
  ADD COLUMN IF NOT EXISTS is_connected BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status de conexão (true=online, false=offline)';

-- Tabela trading_accounts (contas regulares)
ALTER TABLE trading_accounts
  ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0 COMMENT 'Número de tentativas falhadas de heartbeat',
  ADD COLUMN IF NOT EXISTS last_attempt TIMESTAMP NULL COMMENT 'Data/hora da última tentativa de heartbeat',
  ADD COLUMN IF NOT EXISTS is_connected BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status de conexão (true=online, false=offline)';

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_copy_signals_is_connected ON copy_signals(is_connected);
CREATE INDEX IF NOT EXISTS idx_slave_heartbeats_is_connected ON slave_heartbeats(is_connected);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_is_connected ON trading_accounts(is_connected);
