ALTER TABLE `trades` MODIFY COLUMN `openPrice` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `trades` MODIFY COLUMN `closePrice` bigint;--> statement-breakpoint
ALTER TABLE `trades` MODIFY COLUMN `currentPrice` bigint;--> statement-breakpoint
ALTER TABLE `trades` MODIFY COLUMN `stopLoss` bigint;--> statement-breakpoint
ALTER TABLE `trades` MODIFY COLUMN `takeProfit` bigint;