CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `type` ENUM('trade', 'account', 'alert', 'system', 'support') NOT NULL,
  `title` VARCHAR(256) NOT NULL,
  `message` TEXT NOT NULL,
  `read` BOOLEAN DEFAULT FALSE NOT NULL,
  `readAt` TIMESTAMP NULL,
  `metadata` TEXT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `userId_idx` (`userId`),
  INDEX `read_idx` (`read`),
  INDEX `createdAt_idx` (`createdAt`),
  INDEX `type_idx` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir algumas notificações de teste
INSERT INTO `notifications` (`userId`, `type`, `title`, `message`, `read`, `createdAt`) VALUES
(1, 'trade', 'Novo Trade Aberto', 'Trade USDJPY foi aberto com sucesso', FALSE, NOW()),
(1, 'account', 'Conta Sincronizada', 'Sua conta MT4 foi sincronizada com sucesso', FALSE, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(1, 'alert', 'Alerta de Drawdown', 'Sua conta atingiu 10% de drawdown', TRUE, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(1, 'system', 'Atualização do Sistema', 'Nova versão da plataforma disponível', FALSE, DATE_SUB(NOW(), INTERVAL 3 HOUR));
