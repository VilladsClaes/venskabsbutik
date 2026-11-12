ALTER TABLE `events` ADD `invite_sequence` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `invite_state` text;