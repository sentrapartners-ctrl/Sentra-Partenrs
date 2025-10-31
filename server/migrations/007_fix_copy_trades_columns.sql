-- ============================================
-- MIGRATION 007: Fix copy_trades table - Add missing columns
-- Data: 2025-10-30
-- Descrição: Adicionar colunas profit e close_price que estavam faltando
-- ============================================

-- Adicionar coluna profit (lucro/prejuízo do trade)
ALTER TABLE copy_trades 
ADD COLUMN IF NOT EXISTS profit DECIMAL(15,2) DEFAULT 0 COMMENT 'Profit/Loss do trade' AFTER closed_at;

-- Adicionar coluna close_price (preço de fechamento)
ALTER TABLE copy_trades 
ADD COLUMN IF NOT EXISTS close_price DECIMAL(20,5) DEFAULT 0 COMMENT 'Preço de fechamento' AFTER profit;

-- Verificar estrutura final
SELECT 'copy_trades table structure updated successfully' AS status;
