CREATE TABLE `daily_journal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` date NOT NULL,
	`notes` text,
	`mood` enum('excellent','good','neutral','bad','terrible'),
	`marketConditions` text,
	`lessonsLearned` text,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_journal_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `daily_journal` (`userId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `daily_journal` (`date`);--> statement-breakpoint
CREATE INDEX `user_date_idx` ON `daily_journal` (`userId`,`date`);