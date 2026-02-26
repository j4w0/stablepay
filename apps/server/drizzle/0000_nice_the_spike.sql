CREATE TABLE `merchants` (
	`merchant_id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`address` text NOT NULL,
	`supported_network_ids` text NOT NULL,
	`metadata` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`payment_ref` text PRIMARY KEY NOT NULL,
	`merchant_id` text NOT NULL,
	`amount` text NOT NULL,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`tx_hash` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`merchant_id`) ON UPDATE no action ON DELETE no action
);
