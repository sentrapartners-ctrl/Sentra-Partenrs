INSERT INTO balance_history (accountId, userId, balance, equity, timestamp)
SELECT 
  t.accountId,
  t.userId,
  (
    SELECT COALESCE(SUM(t2.profit), 0)
    FROM trades t2
    WHERE t2.accountId = t.accountId 
      AND t2.status = 'closed'
      AND t2.closeTime <= t.closeTime
  ) as balance,
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

SELECT 
  accountId,
  COUNT(*) as records,
  MIN(timestamp) as first_record,
  MAX(timestamp) as last_record,
  MIN(balance) as min_balance,
  MAX(balance) as max_balance
FROM balance_history
GROUP BY accountId;

