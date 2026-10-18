CREATE TABLE `friend_periods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`from_age` real NOT NULL,
	`to_age` real,
	`intensity` integer DEFAULT 3 NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `friend_periods_customer_idx` ON `friend_periods` (`customer_id`);--> statement-breakpoint
CREATE TABLE `interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`date` text NOT NULL,
	`kind` text DEFAULT 'samtale' NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'hukommelse' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `interactions_customer_idx` ON `interactions` (`customer_id`,`date`);--> statement-breakpoint
ALTER TABLE `customers` ADD `origin` text DEFAULT 'butik' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `relation` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `birth_year` integer;--> statement-breakpoint
ALTER TABLE `customers` ADD `how_we_met` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `about_them` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `together` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `is_sample` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `customers_origin_idx` ON `customers` (`origin`);