CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `name` varchar(256) NOT NULL,
  `key` varchar(64) NOT NULL UNIQUE,
  `isActive` boolean DEFAULT true NOT NULL,
  `lastUsedAt` timestamp,
  `createdAt` timestamp DEFAULT NOW() NOT NULL,
  `updatedAt` timestamp DEFAULT NOW() ON UPDATE NOW() NOT NULL,
  INDEX `userId_idx` (`userId`),
  INDEX `key_idx` (`key`),
  INDEX `isActive_idx` (`isActive`)
);
