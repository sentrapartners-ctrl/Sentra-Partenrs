-- Create Support Tables
-- Sistema de chat de suporte entre leads, clientes e admin

-- Support Tickets
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `subject` VARCHAR(256),
  `status` ENUM('open', 'in_progress', 'waiting_user', 'waiting_support', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  `assignedTo` INT,
  `category` VARCHAR(128),
  `lastMessageAt` TIMESTAMP,
  `resolvedAt` TIMESTAMP,
  `closedAt` TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `userId_idx` (`userId`),
  INDEX `status_idx` (`status`),
  INDEX `assignedTo_idx` (`assignedTo`),
  INDEX `createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support Messages
CREATE TABLE IF NOT EXISTS `support_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticketId` INT NOT NULL,
  `senderId` INT NOT NULL,
  `senderType` ENUM('user', 'support', 'system') NOT NULL DEFAULT 'user',
  `message` TEXT NOT NULL,
  `attachments` TEXT,
  `isRead` BOOLEAN NOT NULL DEFAULT FALSE,
  `readAt` TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `ticketId_idx` (`ticketId`),
  INDEX `senderId_idx` (`senderId`),
  INDEX `createdAt_idx` (`createdAt`),
  INDEX `isRead_idx` (`isRead`),
  
  FOREIGN KEY (`ticketId`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support Notifications
CREATE TABLE IF NOT EXISTS `support_notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `ticketId` INT NOT NULL,
  `type` ENUM('new_message', 'ticket_assigned', 'ticket_resolved', 'ticket_closed') NOT NULL,
  `message` TEXT,
  `isRead` BOOLEAN NOT NULL DEFAULT FALSE,
  `readAt` TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `userId_idx` (`userId`),
  INDEX `ticketId_idx` (`ticketId`),
  INDEX `isRead_idx` (`isRead`),
  INDEX `createdAt_idx` (`createdAt`),
  
  FOREIGN KEY (`ticketId`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

