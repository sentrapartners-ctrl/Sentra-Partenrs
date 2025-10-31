-- Tabela de drawdown por conta individual
CREATE TABLE IF NOT EXISTS account_drawdown (
  id INT AUTO_INCREMENT PRIMARY KEY,
  accountId INT NOT NULL,
  userId INT NOT NULL,
  date DATE NOT NULL,
  peakBalance INT NOT NULL COMMENT 'Maior balance do período (em cents)',
  currentBalance INT NOT NULL COMMENT 'Balance atual (em cents)',
  drawdownAmount INT NOT NULL COMMENT 'Valor do drawdown (em cents)',
  drawdownPercent INT NOT NULL COMMENT 'Percentual * 100 (ex: 540 = 5.40%)',
  isCentAccount BOOLEAN NOT NULL DEFAULT FALSE,
  period ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'daily',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX accountId_idx (accountId),
  INDEX userId_idx (userId),
  INDEX date_idx (date),
  INDEX period_idx (period),
  UNIQUE INDEX unique_account_date_period (accountId, date, period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de drawdown consolidado (total)
CREATE TABLE IF NOT EXISTS consolidated_drawdown (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  date DATE NOT NULL,
  totalPeakBalance INT NOT NULL COMMENT 'Soma dos peaks (em cents normalizados)',
  totalCurrentBalance INT NOT NULL COMMENT 'Soma dos balances atuais (em cents normalizados)',
  totalDrawdownAmount INT NOT NULL COMMENT 'Valor total do drawdown (em cents)',
  totalDrawdownPercent INT NOT NULL COMMENT 'Percentual * 100 (ex: 540 = 5.40%)',
  accountCount INT DEFAULT 0 COMMENT 'Número de contas consideradas',
  period ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'daily',
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX userId_idx (userId),
  INDEX date_idx (date),
  INDEX period_idx (period),
  UNIQUE INDEX unique_user_date_period (userId, date, period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
