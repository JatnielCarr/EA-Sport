/*
  Warnings:

  - You are about to drop the column `payment_status` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the `payouts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscription_plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wallets` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `payouts` DROP FOREIGN KEY `payouts_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `subscriptions` DROP FOREIGN KEY `subscriptions_plan_id_fkey`;

-- DropForeignKey
ALTER TABLE `subscriptions` DROP FOREIGN KEY `subscriptions_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_wallet_id_fkey`;

-- DropForeignKey
ALTER TABLE `wallets` DROP FOREIGN KEY `wallets_user_id_fkey`;

-- AlterTable
ALTER TABLE `teams` DROP COLUMN `payment_status`;

-- DropTable
DROP TABLE `payouts`;

-- DropTable
DROP TABLE `subscription_plans`;

-- DropTable
DROP TABLE `subscriptions`;

-- DropTable
DROP TABLE `transactions`;

-- DropTable
DROP TABLE `wallets`;

-- CreateTable
CREATE TABLE `clans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tag` VARCHAR(191) NOT NULL,
    `banner_url` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `location` VARCHAR(191) NULL,
    `access_type` ENUM('OPEN', 'INVITE_ONLY', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `requirements` TEXT NULL,
    `max_members` INTEGER NOT NULL DEFAULT 50,
    `leader_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clans_name_key`(`name`),
    UNIQUE INDEX `clans_tag_key`(`tag`),
    INDEX `clans_name_idx`(`name`),
    INDEX `clans_leader_id_idx`(`leader_id`),
    INDEX `clans_access_type_idx`(`access_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clan_members` (
    `id` VARCHAR(191) NOT NULL,
    `clan_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` ENUM('LEADER', 'OFFICER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `clan_members_clan_id_idx`(`clan_id`),
    INDEX `clan_members_user_id_idx`(`user_id`),
    UNIQUE INDEX `clan_members_clan_id_user_id_key`(`clan_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clan_requests` (
    `id` VARCHAR(191) NOT NULL,
    `clan_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `clan_requests_clan_id_idx`(`clan_id`),
    INDEX `clan_requests_user_id_idx`(`user_id`),
    INDEX `clan_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clan_messages` (
    `id` VARCHAR(191) NOT NULL,
    `clan_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `is_announcement` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `clan_messages_clan_id_idx`(`clan_id`),
    INDEX `clan_messages_clan_id_created_at_idx`(`clan_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `clans` ADD CONSTRAINT `clans_leader_id_fkey` FOREIGN KEY (`leader_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clan_members` ADD CONSTRAINT `clan_members_clan_id_fkey` FOREIGN KEY (`clan_id`) REFERENCES `clans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clan_members` ADD CONSTRAINT `clan_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clan_requests` ADD CONSTRAINT `clan_requests_clan_id_fkey` FOREIGN KEY (`clan_id`) REFERENCES `clans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clan_requests` ADD CONSTRAINT `clan_requests_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clan_messages` ADD CONSTRAINT `clan_messages_clan_id_fkey` FOREIGN KEY (`clan_id`) REFERENCES `clans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clan_messages` ADD CONSTRAINT `clan_messages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
