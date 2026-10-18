CREATE TABLE `calendar_connections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`account_email` text DEFAULT '' NOT NULL,
	`refresh_token` text NOT NULL,
	`access_token` text,
	`access_token_expires_at` integer,
	`calendar_id` text DEFAULT 'primary' NOT NULL,
	`last_error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_connections_provider_unique` ON `calendar_connections` (`provider`);--> statement-breakpoint
CREATE TABLE `event_signups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`order_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`seats` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'afventer' NOT NULL,
	`calendar_synced_at` integer,
	`sync_error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `event_signups_event_idx` ON `event_signups` (`event_id`);--> statement-breakpoint
CREATE INDEX `event_signups_order_idx` ON `event_signups` (`order_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`emoji` text DEFAULT '🎉' NOT NULL,
	`color` text DEFAULT '#ffd23f' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`capacity` integer,
	`product_id` integer,
	`route_geojson` text,
	`published` integer DEFAULT true NOT NULL,
	`external_ids` text DEFAULT '{}' NOT NULL,
	`sync_error` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE INDEX `events_starts_idx` ON `events` (`starts_at`);--> statement-breakpoint
ALTER TABLE `order_items` ADD `event_id` integer REFERENCES events(id);