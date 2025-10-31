-- Criar tabela client_vms para gerenciar VMs dos clientes
CREATE TABLE IF NOT EXISTS client_vms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  productName VARCHAR(255) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  ipAddress VARCHAR(45) NOT NULL,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('active', 'suspended', 'terminated') DEFAULT 'active' NOT NULL,
  cpu VARCHAR(100),
  ram VARCHAR(100),
  storage VARCHAR(100),
  os VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  INDEX userId_idx (userId),
  INDEX status_idx (status),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
