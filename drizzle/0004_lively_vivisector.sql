CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','withdrawal') NOT NULL,
	`amount` int NOT NULL,
	`balanceBefore` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`comment` text,
	`timestamp` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `accountId_idx` ON `transactions` (`accountId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `transactions` (`userId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `transactions` (`type`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `transactions` (`timestamp`);