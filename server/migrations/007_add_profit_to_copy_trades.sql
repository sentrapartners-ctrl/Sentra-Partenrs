-- ============================================
-- MIGRATION 007: Add profit field to copy_trades
-- ============================================

-- Adicionar campo profit para armazenar lucro/prejuízo do trade
ALTER TABLE copy_trades 
ADD COLUMN profit DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Lucro/Prejuízo do trade em USD';

-- Adicionar campo close_price para calcular profit
ALTER TABLE copy_trades 
ADD COLUMN close_price DECIMAL(20,5) DEFAULT 0 COMMENT 'Preço de fechamento do trade';

-- Criar índice para consultas de profit
CREATE INDEX idx_profit ON copy_trades(profit);

-- Criar índice composto para análise de performance
CREATE INDEX idx_status_profit ON copy_trades(status, profit);
