ALTER TABLE `users` MODIFY COLUMN `role` enum('user','manager','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `managerId` int;--> statement-breakpoint
CREATE INDEX `managerId_idx` ON `users` (`managerId`);