-- Script para criar tabela ea_licenses
-- Execute este SQL no banco de dados do Render

CREATE TABLE IF NOT EXISTS `ea_licenses` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `license_key` varchar(255) NOT NULL UNIQUE,
  `ea_name` varchar(100) NOT NULL,
  `license_type` enum('trial', 'monthly', 'yearly', 'lifetime') DEFAULT 'trial',
  `status` enum('active', 'inactive', 'expired') DEFAULT 'active',
  `allowed_accounts` text,
  `expires_at` datetime,
  `last_used_at` datetime,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_license_key` ON `ea_licenses`(`license_key`);
CREATE INDEX `idx_user_id` ON `ea_licenses`(`user_id`);
CREATE INDEX `idx_status` ON `ea_licenses`(`status`);
