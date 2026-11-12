CREATE TABLE `activity_interests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_interests_product_email` ON `activity_interests` (`product_id`,`email`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_event_signups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`order_id` integer,
	`group_token` text NOT NULL,
	`is_booker` integer DEFAULT true NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`note` text DEFAULT '' NOT NULL,
	`hide_name` integer DEFAULT false NOT NULL,
	`seats` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'tilmeldt' NOT NULL,
	`payment_reminded_at` integer,
	`calendar_synced_at` integer,
	`sync_error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_event_signups`("id", "event_id", "order_id", "group_token", "is_booker", "name", "email", "seats", "status", "calendar_synced_at", "sync_error", "created_at", "updated_at") SELECT "id", "event_id", "order_id", 'legacy-' || "id", 1, "name", "email", "seats", CASE "status" WHEN 'afventer' THEN 'bekraeftet' ELSE "status" END, "calendar_synced_at", "sync_error", "created_at", "updated_at" FROM `event_signups`;--> statement-breakpoint
DROP TABLE `event_signups`;--> statement-breakpoint
ALTER TABLE `__new_event_signups` RENAME TO `event_signups`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `event_signups_event_idx` ON `event_signups` (`event_id`);--> statement-breakpoint
CREATE INDEX `event_signups_order_idx` ON `event_signups` (`order_id`);--> statement-breakpoint
CREATE INDEX `event_signups_group_idx` ON `event_signups` (`group_token`);--> statement-breakpoint
ALTER TABLE `events` ADD `min_participants` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `signup_deadline` integer;--> statement-breakpoint
ALTER TABLE `events` ADD `practical_info` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `status` text DEFAULT 'samler' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `confirmed_at` integer;--> statement-breakpoint
ALTER TABLE `events` ADD `cancelled_at` integer;--> statement-breakpoint
ALTER TABLE `events` ADD `cancel_reason` text;--> statement-breakpoint
ALTER TABLE `products` ADD `is_activity` integer DEFAULT false NOT NULL;--> statement-breakpoint
-- Events fra før tilmeldingsflowet kørte "betal først" – de er allerede gennemført
UPDATE `events` SET `status` = 'gennemfoeres', `confirmed_at` = `created_at`;