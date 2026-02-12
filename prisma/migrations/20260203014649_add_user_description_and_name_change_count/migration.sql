/*
  Warnings:

  - You are about to drop the `achievements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `direct_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `friendships` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_achievements` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `direct_messages` DROP FOREIGN KEY `direct_messages_receiver_id_fkey`;

-- DropForeignKey
ALTER TABLE `direct_messages` DROP FOREIGN KEY `direct_messages_sender_id_fkey`;

-- DropForeignKey
ALTER TABLE `friendships` DROP FOREIGN KEY `friendships_receiver_id_fkey`;

-- DropForeignKey
ALTER TABLE `friendships` DROP FOREIGN KEY `friendships_sender_id_fkey`;

-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_achievements` DROP FOREIGN KEY `user_achievements_achievement_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_achievements` DROP FOREIGN KEY `user_achievements_user_id_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `description` VARCHAR(500) NULL,
    ADD COLUMN `name_change_count` INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE `achievements`;

-- DropTable
DROP TABLE `direct_messages`;

-- DropTable
DROP TABLE `friendships`;

-- DropTable
DROP TABLE `notifications`;

-- DropTable
DROP TABLE `user_achievements`;
