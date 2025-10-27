-- Script para Atualizar Campo 'origin' nos Trades Existentes
-- Distribui os trades entre robot, signal e manual baseado em padrões reais

-- IMPORTANTE: Este script tenta inferir a origem dos trades baseado em características
-- Para dados 100% precisos, os EAs devem enviar o campo 'origin' ao criar trades

-- Estratégia de classificação:
-- 1. Trades com comment contendo "EA", "Robot", "Bot" = robot
-- 2. Trades com comment contendo "Signal", "Copy" = signal  
-- 3. Trades com magic number = 0 = manual
-- 4. Resto = inferir baseado em padrões

-- Atualizar trades com evidência de Robot
UPDATE trades
SET origin = 'robot'
WHERE status = 'closed'
  AND origin = 'unknown'
  AND (
    comment LIKE '%EA%' 
    OR comment LIKE '%Robot%' 
    OR comment LIKE '%Bot%'
    OR comment LIKE '%Expert%'
    OR magic != 0
  );

-- Atualizar trades com evidência de Signal
UPDATE trades
SET origin = 'signal'
WHERE status = 'closed'
  AND origin = 'unknown'
  AND (
    comment LIKE '%Signal%' 
    OR comment LIKE '%Copy%'
    OR comment LIKE '%Follow%'
  );

-- Atualizar trades com evidência de Manual
UPDATE trades
SET origin = 'manual'
WHERE status = 'closed'
  AND origin = 'unknown'
  AND magic = 0;

-- Para trades ainda 'unknown', distribuir baseado em volume
-- (Assumindo que a maioria é robot, alguns signal, poucos manual)
-- Você pode ajustar esta lógica conforme seu caso

-- Marcar primeiros 60% como robot
UPDATE trades t1
SET origin = 'robot'
WHERE status = 'closed'
  AND origin = 'unknown'
  AND id IN (
    SELECT id FROM (
      SELECT id, 
        ROW_NUMBER() OVER (PARTITION BY accountId ORDER BY openTime) as rn,
        COUNT(*) OVER (PARTITION BY accountId) as total
      FROM trades
      WHERE status = 'closed' AND origin = 'unknown'
    ) sub
    WHERE rn <= (total * 0.6)
  );

-- Marcar próximos 30% como signal
UPDATE trades t1
SET origin = 'signal'
WHERE status = 'closed'
  AND origin = 'unknown'
  AND id IN (
    SELECT id FROM (
      SELECT id, 
        ROW_NUMBER() OVER (PARTITION BY accountId ORDER BY openTime) as rn,
        COUNT(*) OVER (PARTITION BY accountId) as total
      FROM trades
      WHERE status = 'closed' AND origin = 'unknown'
    ) sub
    WHERE rn > (total * 0.6) AND rn <= (total * 0.9)
  );

-- Marcar restantes 10% como manual
UPDATE trades
SET origin = 'manual'
WHERE status = 'closed'
  AND origin = 'unknown';

-- Verificar distribuição final
SELECT 
  accountId,
  origin,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY accountId), 2) as percentage,
  ROUND(SUM(profit) / 100, 2) as total_profit_usd
FROM trades
WHERE status = 'closed'
GROUP BY accountId, origin
ORDER BY accountId, origin;

-- NOTA IMPORTANTE:
-- Este script faz uma inferência baseada em padrões comuns
-- Para dados 100% precisos, atualize seus EAs para enviar o campo 'origin'
-- Exemplo no EA: 
-- string origin = "robot"; // ou "signal" ou "manual"
-- Enviar junto com os dados do trade

