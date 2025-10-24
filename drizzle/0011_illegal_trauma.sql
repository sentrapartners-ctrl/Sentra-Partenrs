DROP TABLE `account_notes`;--> statement-breakpoint
DROP TABLE `journal_entries`;--> statement-breakpoint
DROP INDEX `managerId_idx` ON `users`;--> statement-breakpoint
ALTER TABLE `trades` MODIFY COLUMN `openPrice` int NOT NULL;--> statement-breakpoint
ALTER TABLE `trades` MODIFY COLUMN `closePrice` int;--> statement-breakpoint
ALTER TABLE `trades` MODIFY COLUMN `currentPrice` int;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `trades` DROP COLUMN `stopLoss`;--> statement-breakpoint
ALTER TABLE `trades` DROP COLUMN `takeProfit`;--> statement-breakpoint
ALTER TABLE `trades` DROP COLUMN `magicNumber`;--> statement-breakpoint
ALTER TABLE `trades` DROP COLUMN `duration`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `managerId`;