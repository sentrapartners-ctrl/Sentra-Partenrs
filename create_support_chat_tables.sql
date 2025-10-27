-- Tabelas para sistema de chat de suporte

-- 1. Tabela de conversas/tickets de suporte
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  subject VARCHAR(256),
  status ENUM('open', 'in_progress', 'waiting_user', 'waiting_support', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  assignedTo INT,
  category VARCHAR(128),
  lastMessageAt TIMESTAMP NULL,
  resolvedAt TIMESTAMP NULL,
  closedAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX userId_idx (userId),
  INDEX status_idx (status),
  INDEX assignedTo_idx (assignedTo),
  INDEX createdAt_idx (createdAt)
);

-- 2. Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS support_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticketId INT NOT NULL,
  senderId INT NOT NULL,
  senderType ENUM('user', 'support', 'system') NOT NULL DEFAULT 'user',
  message TEXT NOT NULL,
  attachments TEXT,
  isRead BOOLEAN NOT NULL DEFAULT FALSE,
  readAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ticketId_idx (ticketId),
  INDEX senderId_idx (senderId),
  INDEX createdAt_idx (createdAt),
  INDEX isRead_idx (isRead),
  FOREIGN KEY (ticketId) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- 3. Tabela de anexos do chat
CREATE TABLE IF NOT EXISTS support_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  messageId INT NOT NULL,
  fileName VARCHAR(256) NOT NULL,
  fileUrl VARCHAR(512) NOT NULL,
  fileSize INT,
  fileType VARCHAR(64),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX messageId_idx (messageId),
  FOREIGN KEY (messageId) REFERENCES support_messages(id) ON DELETE CASCADE
);

-- 4. Tabela de notificações de chat
CREATE TABLE IF NOT EXISTS support_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  ticketId INT NOT NULL,
  type ENUM('new_message', 'ticket_assigned', 'ticket_resolved', 'ticket_closed') NOT NULL,
  message TEXT,
  isRead BOOLEAN NOT NULL DEFAULT FALSE,
  readAt TIMESTAMP NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX userId_idx (userId),
  INDEX ticketId_idx (ticketId),
  INDEX isRead_idx (isRead),
  INDEX createdAt_idx (createdAt)
);

-- 5. Tabela de avaliações do suporte
CREATE TABLE IF NOT EXISTS support_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticketId INT NOT NULL UNIQUE,
  userId INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ticketId_idx (ticketId),
  INDEX userId_idx (userId),
  INDEX rating_idx (rating),
  FOREIGN KEY (ticketId) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- 6. Tabela de respostas rápidas (templates)
CREATE TABLE IF NOT EXISTS support_quick_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(256) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(128),
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  usageCount INT DEFAULT 0,
  createdBy INT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX category_idx (category),
  INDEX isActive_idx (isActive)
);

SELECT 'Tabelas de suporte criadas com sucesso!' AS status;

