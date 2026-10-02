CREATE TABLE `deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer,
	`order_id` integer,
	`title` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`dedicated_to` text,
	`place_name` text,
	`lat` real,
	`lng` real,
	`photo_url` text,
	`amount` real,
	`delivered_at` integer DEFAULT (unixepoch()) NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `deliveries_product_idx` ON `deliveries` (`product_id`);--> statement-breakpoint
ALTER TABLE `order_items` ADD `is_bonus` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `is_gift` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `gift_recipient` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `gift_message` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `gift_token` text;