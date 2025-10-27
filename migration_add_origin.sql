-- Migração: Adicionar campo 'origin' na tabela trades
-- Data: 2025-10-27
-- Descrição: Adiciona campo para identificar origem da operação (robot/signal/manual)

-- Adicionar coluna origin
ALTER TABLE trades
ADD COLUMN origin ENUM('robot', 'signal', 'manual', 'unknown') 
NOT NULL DEFAULT 'unknown'
AFTER status;

-- Criar índice para melhorar performance de queries por origem
CREATE INDEX idx_trades_origin ON trades(origin);

-- Criar índice composto para queries comuns
CREATE INDEX idx_trades_account_origin ON trades(accountId, origin, status);

-- Verificar alteração
DESCRIBE trades;
