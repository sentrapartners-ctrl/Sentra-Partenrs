-- Tabela para histórico de transferências de clientes entre gerentes

CREATE TABLE IF NOT EXISTS client_transfer_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  fromManagerId INT,
  toManagerId INT NOT NULL,
  transferredBy INT NOT NULL,
  reason TEXT,
  notes TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX clientId_idx (clientId),
  INDEX fromManagerId_idx (fromManagerId),
  INDEX toManagerId_idx (toManagerId),
  INDEX transferredBy_idx (transferredBy),
  INDEX createdAt_idx (createdAt)
);

SELECT 'Tabela de histórico de transferências criada com sucesso!' AS status;

