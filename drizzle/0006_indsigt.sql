ALTER TABLE `customers` ADD `insight_token` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `insight_created_at` integer;--> statement-breakpoint
ALTER TABLE `customers` ADD `insight_viewed_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `customers_insight_token_idx` ON `customers` (`insight_token`);