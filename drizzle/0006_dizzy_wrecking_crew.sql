CREATE TABLE `journal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` date NOT NULL,
	`content` text,
	`emotion` enum('confident','nervous','greedy','fearful','neutral','disciplined'),
	`marketCondition` enum('trending','ranging','volatile','quiet'),
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `journal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `journal_entries` (`userId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `journal_entries` (`date`);--> statement-breakpoint
CREATE INDEX `user_date_idx` ON `journal_entries` (`userId`,`date`);