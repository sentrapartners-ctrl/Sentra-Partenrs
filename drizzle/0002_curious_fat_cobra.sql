ALTER TABLE `user_settings` ADD `telegramChatId` varchar(64);--> statement-breakpoint
ALTER TABLE `user_settings` ADD `telegramEnabled` boolean DEFAULT false;