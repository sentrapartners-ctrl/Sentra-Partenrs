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

UPDATE trades
SET origin = 'signal'
WHERE status = 'closed'
  AND origin = 'unknown'
  AND (
    comment LIKE '%Signal%' 
    OR comment LIKE '%Copy%'
    OR comment LIKE '%Follow%'
  );

UPDATE trades
SET origin = 'manual'
WHERE status = 'closed'
  AND origin = 'unknown'
  AND magic = 0;

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

