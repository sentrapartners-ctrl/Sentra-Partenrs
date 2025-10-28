import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

async function createSupportTables() {
  const dbUrl = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL not found');
  }
  
  const db = drizzle(dbUrl);
  
  console.log('🔧 Criando tabelas de suporte...');
  
  try {
    // Support Tickets
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        subject VARCHAR(256),
        status ENUM('open', 'in_progress', 'waiting_user', 'waiting_support', 'resolved', 'closed') NOT NULL DEFAULT 'open',
        priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
        assignedTo INT,
        category VARCHAR(128),
        lastMessageAt TIMESTAMP,
        resolvedAt TIMESTAMP,
        closedAt TIMESTAMP,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX userId_idx (userId),
        INDEX status_idx (status),
        INDEX assignedTo_idx (assignedTo),
        INDEX createdAt_idx (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela support_tickets criada!');
    
    // Support Messages
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS support_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticketId INT NOT NULL,
        senderId INT NOT NULL,
        senderType ENUM('user', 'support', 'system') NOT NULL DEFAULT 'user',
        message TEXT NOT NULL,
        attachments TEXT,
        isRead BOOLEAN NOT NULL DEFAULT FALSE,
        readAt TIMESTAMP,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        INDEX ticketId_idx (ticketId),
        INDEX senderId_idx (senderId),
        INDEX createdAt_idx (createdAt),
        INDEX isRead_idx (isRead)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela support_messages criada!');
    
    // Support Notifications
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS support_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        ticketId INT NOT NULL,
        type ENUM('new_message', 'ticket_assigned', 'ticket_resolved', 'ticket_closed') NOT NULL,
        message TEXT,
        isRead BOOLEAN NOT NULL DEFAULT FALSE,
        readAt TIMESTAMP,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        INDEX userId_idx (userId),
        INDEX ticketId_idx (ticketId),
        INDEX isRead_idx (isRead),
        INDEX createdAt_idx (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela support_notifications criada!');
    
    console.log('🎉 Todas as tabelas de suporte foram criadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    process.exit(1);
  }
}

createSupportTables();

