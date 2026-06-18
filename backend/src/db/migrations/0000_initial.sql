CREATE TABLE `event` (
	`id` text PRIMARY KEY NOT NULL,
	`short_code` text NOT NULL,
	`name` text NOT NULL,
	`admin_token_hash` text NOT NULL,
	`admin_pin` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` integer NOT NULL,
	`finished_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_event_short_code` ON `event` (`short_code`);--> statement-breakpoint
CREATE TABLE `team` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`name` text NOT NULL,
	`color_hex` text DEFAULT '#22c55e' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_team_event` ON `team` (`event_id`);--> statement-breakpoint
CREATE TABLE `roster` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`name` text NOT NULL,
	`jersey_number` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_roster_team` ON `roster` (`team_id`);--> statement-breakpoint
CREATE TABLE `game` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`team_a_id` text NOT NULL,
	`team_b_id` text NOT NULL,
	`status` text DEFAULT 'READY' NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`planned_duration_ms` integer DEFAULT 1800000 NOT NULL,
	`paused_duration_ms` integer DEFAULT 0 NOT NULL,
	`pause_started_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_a_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_b_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_game_event` ON `game` (`event_id`);--> statement-breakpoint
CREATE TABLE `game_event` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`client_event_id` text NOT NULL,
	`type` text NOT NULL,
	`team_side` text,
	`scorer_roster_id` text,
	`assistant_roster_id` text,
	`undo_target_event_id` text,
	`client_ts` integer NOT NULL,
	`server_ts` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_game_event_game` ON `game_event` (`game_id`,`server_ts`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_game_event_idem` ON `game_event` (`game_id`,`client_event_id`);
