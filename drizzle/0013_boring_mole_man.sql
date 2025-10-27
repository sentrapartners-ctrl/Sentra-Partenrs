CREATE TABLE `ea_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`slug` varchar(256) NOT NULL,
	`description` text,
	`longDescription` text,
	`platform` enum('MT4','MT5','BOTH') NOT NULL,
	`price` int NOT NULL,
	`licenseType` enum('single','unlimited','rental') NOT NULL DEFAULT 'single',
	`rentalPeriod` int DEFAULT 0,
	`features` text,
	`strategy` text,
	`backtestResults` text,
	`fileUrl` varchar(512),
	`version` varchar(32),
	`imageUrl` varchar(512),
	`demoUrl` varchar(512),
	`videoUrl` varchar(512),
	`isAvailable` boolean NOT NULL DEFAULT true,
	`isPremiumOnly` boolean DEFAULT false,
	`downloads` int DEFAULT 0,
	`rating` int DEFAULT 0,
	`reviewCount` int DEFAULT 0,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ea_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `ea_products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `product_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productType` enum('vps','ea') NOT NULL,
	`productId` int NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(256),
	`comment` text,
	`isVerifiedPurchase` boolean DEFAULT false,
	`isApproved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`billingCycle` enum('monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
	`features` text,
	`maxAccounts` int DEFAULT 1,
	`copyTradingEnabled` boolean DEFAULT false,
	`advancedAnalyticsEnabled` boolean DEFAULT false,
	`freeVpsEnabled` boolean DEFAULT false,
	`exclusiveEasEnabled` boolean DEFAULT false,
	`prioritySupport` boolean DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productType` enum('vps','ea','subscription') NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(256) NOT NULL,
	`amount` int NOT NULL,
	`status` enum('pending','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(64),
	`transactionId` varchar(256),
	`licenseKey` varchar(256),
	`expiresAt` timestamp,
	`downloadUrl` varchar(512),
	`downloadCount` int DEFAULT 0,
	`maxDownloads` int DEFAULT 3,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('active','cancelled','expired','pending') NOT NULL DEFAULT 'pending',
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`autoRenew` boolean DEFAULT true,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vps_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`slug` varchar(256) NOT NULL,
	`description` text,
	`specifications` text,
	`price` int NOT NULL,
	`billingCycle` enum('monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
	`location` varchar(128),
	`provider` varchar(128),
	`maxMt4Instances` int DEFAULT 1,
	`maxMt5Instances` int DEFAULT 1,
	`setupFee` int DEFAULT 0,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`stockQuantity` int DEFAULT 0,
	`imageUrl` varchar(512),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vps_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `vps_products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `trades` ADD `origin` enum('robot','signal','manual','unknown') DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
CREATE INDEX `slug_idx` ON `ea_products` (`slug`);--> statement-breakpoint
CREATE INDEX `platform_idx` ON `ea_products` (`platform`);--> statement-breakpoint
CREATE INDEX `isAvailable_idx` ON `ea_products` (`isAvailable`);--> statement-breakpoint
CREATE INDEX `isPremiumOnly_idx` ON `ea_products` (`isPremiumOnly`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `product_reviews` (`userId`);--> statement-breakpoint
CREATE INDEX `productType_idx` ON `product_reviews` (`productType`);--> statement-breakpoint
CREATE INDEX `productId_idx` ON `product_reviews` (`productId`);--> statement-breakpoint
CREATE INDEX `isApproved_idx` ON `product_reviews` (`isApproved`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `user_purchases` (`userId`);--> statement-breakpoint
CREATE INDEX `productType_idx` ON `user_purchases` (`productType`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `user_purchases` (`status`);--> statement-breakpoint
CREATE INDEX `licenseKey_idx` ON `user_purchases` (`licenseKey`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `user_subscriptions` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `user_subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `endDate_idx` ON `user_subscriptions` (`endDate`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `vps_products` (`slug`);--> statement-breakpoint
CREATE INDEX `isAvailable_idx` ON `vps_products` (`isAvailable`);