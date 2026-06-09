ALTER TABLE `moderation_sessions` ADD `isListening` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `moderation_sessions` ADD `lastCommentFetchTime` timestamp;--> statement-breakpoint
ALTER TABLE `moderation_sessions` ADD `totalCommentsReceived` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `moderation_sessions` ADD `totalResponsesSent` int DEFAULT 0 NOT NULL;