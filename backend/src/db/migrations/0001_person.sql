CREATE TABLE `person` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_person_updated` ON `person` (`updated_at`);--> statement-breakpoint
ALTER TABLE `roster` ADD `person_id` text REFERENCES `person`(`id`);--> statement-breakpoint
CREATE INDEX `idx_roster_person` ON `roster` (`person_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_roster_team_person` ON `roster` (`team_id`,`person_id`);
