CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('balance','drawdown','trade','connection','economic') NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text,
	`severity` enum('info','warning','error') NOT NULL DEFAULT 'info',
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `balance_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`userId` int NOT NULL,
	`balance` int NOT NULL,
	`equity` int NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `balance_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `copy_trading_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`sourceAccountId` int NOT NULL,
	`targetAccountId` int NOT NULL,
	`copyRatio` int DEFAULT 100,
	`maxLotSize` int DEFAULT 0,
	`minLotSize` int DEFAULT 0,
	`stopOnDrawdown` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `copy_trading_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `economic_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventTime` timestamp NOT NULL,
	`currency` varchar(10) NOT NULL,
	`eventName` varchar(256) NOT NULL,
	`impact` enum('low','medium','high') NOT NULL,
	`previousValue` varchar(64),
	`forecastValue` varchar(64),
	`actualValue` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `economic_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`rules` text,
	`entryConditions` text,
	`exitConditions` text,
	`riskManagement` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`userId` int NOT NULL,
	`note` text,
	`tags` text,
	`screenshot` varchar(512),
	`emotion` enum('confident','nervous','greedy','fearful','neutral'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trade_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`userId` int NOT NULL,
	`ticket` varchar(64) NOT NULL,
	`symbol` varchar(32) NOT NULL,
	`type` enum('BUY','SELL','PENDING','OTHER') NOT NULL,
	`volume` int NOT NULL,
	`openPrice` int NOT NULL,
	`closePrice` int DEFAULT 0,
	`currentPrice` int DEFAULT 0,
	`profit` int DEFAULT 0,
	`commission` int DEFAULT 0,
	`swap` int DEFAULT 0,
	`openTime` timestamp NOT NULL,
	`closeTime` timestamp,
	`comment` text,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`terminalId` varchar(128) NOT NULL,
	`accountNumber` varchar(64) NOT NULL,
	`broker` varchar(256),
	`platform` enum('MT4','MT5','cTrader','DXTrade','TradeLocker','MatchTrade','Tradovate') NOT NULL,
	`accountType` enum('CENT','STANDARD','DEMO','LIVE') NOT NULL DEFAULT 'STANDARD',
	`server` varchar(256),
	`currency` varchar(10) DEFAULT 'USD',
	`leverage` int DEFAULT 100,
	`balance` int DEFAULT 0,
	`equity` int DEFAULT 0,
	`marginFree` int DEFAULT 0,
	`marginUsed` int DEFAULT 0,
	`marginLevel` int DEFAULT 0,
	`openPositions` int DEFAULT 0,
	`status` enum('connected','disconnected','error') NOT NULL DEFAULT 'disconnected',
	`lastHeartbeat` timestamp,
	`classification` varchar(128),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trading_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `trading_accounts_terminalId_unique` UNIQUE(`terminalId`)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`theme` enum('light','dark') NOT NULL DEFAULT 'light',
	`displayCurrency` varchar(10) DEFAULT 'USD',
	`dateFormat` varchar(32) DEFAULT 'YYYY-MM-DD',
	`timezone` varchar(64) DEFAULT 'UTC',
	`decimalPrecision` int DEFAULT 2,
	`heartbeatInterval` int DEFAULT 60,
	`alertsEnabled` boolean DEFAULT true,
	`alertBalance` boolean DEFAULT true,
	`alertDrawdown` boolean DEFAULT true,
	`alertTrades` boolean DEFAULT true,
	`alertConnection` boolean DEFAULT true,
	`drawdownThreshold` int DEFAULT 1000,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `alerts` (`userId`);--> statement-breakpoint
CREATE INDEX `isRead_idx` ON `alerts` (`isRead`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `alerts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `accountId_idx` ON `balance_history` (`accountId`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `balance_history` (`timestamp`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `copy_trading_configs` (`userId`);--> statement-breakpoint
CREATE INDEX `sourceAccountId_idx` ON `copy_trading_configs` (`sourceAccountId`);--> statement-breakpoint
CREATE INDEX `targetAccountId_idx` ON `copy_trading_configs` (`targetAccountId`);--> statement-breakpoint
CREATE INDEX `eventTime_idx` ON `economic_events` (`eventTime`);--> statement-breakpoint
CREATE INDEX `currency_idx` ON `economic_events` (`currency`);--> statement-breakpoint
CREATE INDEX `impact_idx` ON `economic_events` (`impact`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `strategies` (`userId`);--> statement-breakpoint
CREATE INDEX `tradeId_idx` ON `trade_notes` (`tradeId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `trade_notes` (`userId`);--> statement-breakpoint
CREATE INDEX `accountId_idx` ON `trades` (`accountId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `trades` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `trades` (`status`);--> statement-breakpoint
CREATE INDEX `symbol_idx` ON `trades` (`symbol`);--> statement-breakpoint
CREATE INDEX `openTime_idx` ON `trades` (`openTime`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `trading_accounts` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `trading_accounts` (`status`);