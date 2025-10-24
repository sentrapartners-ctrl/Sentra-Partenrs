CREATE TABLE `account_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`mt5Login` varchar(128),
	`mt5Password` text,
	`mt5Server` varchar(256),
	`mt5InvestorPassword` text,
	`vpsProvider` varchar(128),
	`vpsIp` varchar(64),
	`vpsUsername` varchar(128),
	`vpsPassword` text,
	`vpsPort` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `account_notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_notes_accountId_unique` UNIQUE(`accountId`)
);
--> statement-breakpoint
CREATE INDEX `accountId_idx` ON `account_notes` (`accountId`);