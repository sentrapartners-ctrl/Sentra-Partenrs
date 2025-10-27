CREATE TABLE `crypto_exchange_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`currency` varchar(16) NOT NULL,
	`usdRate` decimal(20,8) NOT NULL,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crypto_exchange_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crypto_payment_addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`currency` enum('BTC','USDT','MATIC','ETH') NOT NULL,
	`network` varchar(64) NOT NULL,
	`address` varchar(256) NOT NULL,
	`label` varchar(128),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crypto_payment_addresses_id` PRIMARY KEY(`id`),
	CONSTRAINT `crypto_payment_addresses_address_unique` UNIQUE(`address`)
);
--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`purchaseId` int,
	`amount` int NOT NULL,
	`paymentMethod` enum('crypto_btc','crypto_usdt','crypto_matic','crypto_eth','pix','card') NOT NULL,
	`status` enum('pending','confirming','completed','failed','expired') NOT NULL DEFAULT 'pending',
	`cryptoCurrency` varchar(16),
	`cryptoAmount` varchar(64),
	`cryptoAddress` varchar(256),
	`cryptoTxHash` varchar(256),
	`cryptoNetwork` varchar(64),
	`confirmations` int DEFAULT 0,
	`requiredConfirmations` int DEFAULT 3,
	`expiresAt` timestamp,
	`completedAt` timestamp,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallet_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletAddress` varchar(128) NOT NULL,
	`nonce` varchar(256) NOT NULL,
	`signature` varchar(512),
	`isVerified` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP INDEX `isPremiumOnly_idx` ON `ea_products`;--> statement-breakpoint
ALTER TABLE `user_purchases` MODIFY COLUMN `status` enum('pending','completed','cancelled','refunded','confirming') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `user_purchases` MODIFY COLUMN `paymentMethod` enum('crypto_btc','crypto_usdt','crypto_matic','crypto_eth','pix','card');--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `password` varchar(255);--> statement-breakpoint
ALTER TABLE `ea_products` ADD `isExclusive` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_purchases` ADD `cryptoAddress` varchar(256);--> statement-breakpoint
ALTER TABLE `user_purchases` ADD `cryptoTxHash` varchar(256);--> statement-breakpoint
ALTER TABLE `user_purchases` ADD `cryptoAmount` varchar(64);--> statement-breakpoint
ALTER TABLE `user_purchases` ADD `cryptoNetwork` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `walletAddress` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `authMethod` enum('email','wallet','both') DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_walletAddress_unique` UNIQUE(`walletAddress`);--> statement-breakpoint
CREATE INDEX `currency_idx` ON `crypto_exchange_rates` (`currency`);--> statement-breakpoint
CREATE INDEX `lastUpdated_idx` ON `crypto_exchange_rates` (`lastUpdated`);--> statement-breakpoint
CREATE INDEX `currency_idx` ON `crypto_payment_addresses` (`currency`);--> statement-breakpoint
CREATE INDEX `isActive_idx` ON `crypto_payment_addresses` (`isActive`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `payment_transactions` (`userId`);--> statement-breakpoint
CREATE INDEX `purchaseId_idx` ON `payment_transactions` (`purchaseId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `payment_transactions` (`status`);--> statement-breakpoint
CREATE INDEX `cryptoTxHash_idx` ON `payment_transactions` (`cryptoTxHash`);--> statement-breakpoint
CREATE INDEX `walletAddress_idx` ON `wallet_sessions` (`walletAddress`);--> statement-breakpoint
CREATE INDEX `expiresAt_idx` ON `wallet_sessions` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `isExclusive_idx` ON `ea_products` (`isExclusive`);--> statement-breakpoint
ALTER TABLE `ea_products` DROP COLUMN `isPremiumOnly`;--> statement-breakpoint
ALTER TABLE `subscription_plans` DROP COLUMN `exclusiveEasEnabled`;