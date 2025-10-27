-- Script para Popular balance_history com Dados Reais
-- Baseado nos trades fechados existentes
-- Execute este script no banco de dados de produção

-- Limpar dados antigos (opcional, comente se quiser manter)
-- DELETE FROM balance_history;

-- Popular balance_history com base nos trades fechados
-- Cria um registro de balance para cada trade fechado
INSERT INTO balance_history (accountId, userId, balance, equity, timestamp)
SELECT 
  t.accountId,
  t.userId,
  -- Balance acumulado até este trade (em centavos)
  (
    SELECT COALESCE(SUM(t2.profit), 0)
    FROM trades t2
    WHERE t2.accountId = t.accountId 
      AND t2.status = 'closed'
      AND t2.closeTime <= t.closeTime
  ) as balance,
  -- Equity = balance (simplificado, já que não temos trades abertos no histórico)
  (
    SELECT COALESCE(SUM(t2.profit), 0)
    FROM trades t2
    WHERE t2.accountId = t.accountId 
      AND t2.status = 'closed'
      AND t2.closeTime <= t.closeTime
  ) as equity,
  t.closeTime as timestamp
FROM trades t
WHERE t.status = 'closed'
ORDER BY t.accountId, t.closeTime;

-- Verificar quantos registros foram inseridos
SELECT 
  accountId,
  COUNT(*) as records,
  MIN(timestamp) as first_record,
  MAX(timestamp) as last_record,
  MIN(balance) as min_balance,
  MAX(balance) as max_balance
FROM balance_history
GROUP BY accountId;

-- Nota: Este script cria um registro de balance para cada trade fechado
-- Para produção, é recomendado que os EAs enviem balance periodicamente (ex: a cada hora)

