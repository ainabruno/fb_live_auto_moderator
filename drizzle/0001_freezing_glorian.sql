CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`facebookCommentId` varchar(255) NOT NULL,
	`userName` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`detectedLanguage` varchar(10) DEFAULT 'en',
	`classification` enum('question','gratitude','spam','off_topic') NOT NULL,
	`classificationConfidence` decimal(3,2),
	`priority` int NOT NULL DEFAULT 0,
	`isSpam` boolean NOT NULL DEFAULT false,
	`status` enum('pending','approved','rejected','sent') NOT NULL DEFAULT 'pending',
	`responseId` int,
	`facebookTimestamp` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`),
	CONSTRAINT `comments_facebookCommentId_unique` UNIQUE(`facebookCommentId`)
);
--> statement-breakpoint
CREATE TABLE `generated_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`sessionId` int NOT NULL,
	`responseText` text NOT NULL,
	`responseLanguage` varchar(10) NOT NULL,
	`isGroundedInContext` boolean NOT NULL DEFAULT true,
	`status` enum('pending','approved','rejected','sent','failed') NOT NULL DEFAULT 'pending',
	`sentToFacebook` boolean NOT NULL DEFAULT false,
	`facebookResponseId` varchar(255),
	`approvedBy` int,
	`approvedAt` timestamp,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generated_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderation_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`facebookPageId` varchar(255) NOT NULL,
	`facebookAccessToken` text NOT NULL,
	`liveVideoId` varchar(255),
	`liveContext` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moderation_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderation_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`autoApproveResponses` boolean NOT NULL DEFAULT false,
	`responseDelaySeconds` int NOT NULL DEFAULT 0,
	`maxRepliesPerMinute` int NOT NULL DEFAULT 10,
	`spamFilterEnabled` boolean NOT NULL DEFAULT true,
	`blockedKeywords` text,
	`enableMalagasy` boolean NOT NULL DEFAULT true,
	`enableFrench` boolean NOT NULL DEFAULT true,
	`enableEnglish` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moderation_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `moderation_settings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `response_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`commentId` int NOT NULL,
	`responseId` int NOT NULL,
	`originalMessage` text NOT NULL,
	`generatedResponse` text NOT NULL,
	`sentResponse` text,
	`status` enum('sent','rejected','failed') NOT NULL,
	`responseLanguage` varchar(10) NOT NULL,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `response_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `sessionId_idx` ON `comments` (`sessionId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `comments` (`status`);--> statement-breakpoint
CREATE INDEX `commentId_idx` ON `generated_responses` (`commentId`);--> statement-breakpoint
CREATE INDEX `sessionId_idx` ON `generated_responses` (`sessionId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `generated_responses` (`status`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `moderation_sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `moderation_settings` (`userId`);--> statement-breakpoint
CREATE INDEX `sessionId_idx` ON `response_history` (`sessionId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `response_history` (`status`);