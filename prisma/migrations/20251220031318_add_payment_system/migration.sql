-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ORGANIZER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_username_key`(`username`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_username_idx`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `games` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `developer` VARCHAR(191) NOT NULL,
    `icon_url` VARCHAR(191) NULL,
    `team_size_default` INTEGER NOT NULL DEFAULT 5,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `games_slug_key`(`slug`),
    INDEX `games_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `game_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `game_id` VARCHAR(191) NOT NULL,
    `game_username` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `rank` VARCHAR(191) NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `verified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `game_accounts_user_id_idx`(`user_id`),
    INDEX `game_accounts_game_id_idx`(`game_id`),
    UNIQUE INDEX `game_accounts_user_id_game_id_account_id_key`(`user_id`, `game_id`, `account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tournaments` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `game_id` VARCHAR(191) NOT NULL,
    `organizer_id` VARCHAR(191) NOT NULL,
    `format` ENUM('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS') NOT NULL,
    `team_size` INTEGER NOT NULL,
    `max_participants` INTEGER NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `entry_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `prize_pool` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NULL,
    `registration_deadline` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `rules_json` JSON NULL,
    `bracket_generated` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tournaments_slug_key`(`slug`),
    INDEX `tournaments_slug_idx`(`slug`),
    INDEX `tournaments_game_id_idx`(`game_id`),
    INDEX `tournaments_organizer_id_idx`(`organizer_id`),
    INDEX `tournaments_status_idx`(`status`),
    INDEX `tournaments_start_date_idx`(`start_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teams` (
    `id` VARCHAR(191) NOT NULL,
    `tournament_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tag` VARCHAR(191) NOT NULL,
    `logo_url` VARCHAR(191) NULL,
    `captain_id` VARCHAR(191) NOT NULL,
    `seed` INTEGER NULL,
    `registration_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `payment_status` ENUM('PENDING', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `disqualified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `teams_tournament_id_idx`(`tournament_id`),
    INDEX `teams_captain_id_idx`(`captain_id`),
    UNIQUE INDEX `teams_tournament_id_name_key`(`tournament_id`, `name`),
    UNIQUE INDEX `teams_tournament_id_tag_key`(`tournament_id`, `tag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `team_players` (
    `id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NULL,
    `is_captain` BOOLEAN NOT NULL DEFAULT false,
    `is_substitute` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ACTIVE', 'INACTIVE', 'REMOVED') NOT NULL DEFAULT 'ACTIVE',
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `team_players_team_id_idx`(`team_id`),
    INDEX `team_players_user_id_idx`(`user_id`),
    UNIQUE INDEX `team_players_team_id_user_id_key`(`team_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matches` (
    `id` VARCHAR(191) NOT NULL,
    `tournament_id` VARCHAR(191) NOT NULL,
    `round` INTEGER NOT NULL,
    `match_number` INTEGER NOT NULL,
    `bracket_position` INTEGER NOT NULL,
    `home_team_id` VARCHAR(191) NULL,
    `away_team_id` VARCHAR(191) NULL,
    `scheduled_datetime` DATETIME(3) NULL,
    `best_of` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('SCHEDULED', 'CHECK_IN', 'LIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `winner_id` VARCHAR(191) NULL,
    `home_score` INTEGER NOT NULL DEFAULT 0,
    `away_score` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `matches_tournament_id_idx`(`tournament_id`),
    INDEX `matches_tournament_id_round_idx`(`tournament_id`, `round`),
    INDEX `matches_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_results` (
    `id` VARCHAR(191) NOT NULL,
    `match_id` VARCHAR(191) NOT NULL,
    `reported_by_user_id` VARCHAR(191) NOT NULL,
    `reported_by_team_id` VARCHAR(191) NOT NULL,
    `winning_team_id` VARCHAR(191) NOT NULL,
    `home_score` INTEGER NOT NULL,
    `away_score` INTEGER NOT NULL,
    `screenshot_url` VARCHAR(191) NULL,
    `replay_file_url` VARCHAR(191) NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validated` BOOLEAN NOT NULL DEFAULT false,
    `validated_by_user_id` VARCHAR(191) NULL,
    `validated_at` DATETIME(3) NULL,
    `disputed` BOOLEAN NOT NULL DEFAULT false,
    `dispute_reason` TEXT NULL,

    INDEX `match_results_match_id_idx`(`match_id`),
    INDEX `match_results_reported_by_team_id_idx`(`reported_by_team_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `standings` (
    `id` VARCHAR(191) NOT NULL,
    `tournament_id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `played` INTEGER NOT NULL DEFAULT 0,
    `won` INTEGER NOT NULL DEFAULT 0,
    `lost` INTEGER NOT NULL DEFAULT 0,
    `drawn` INTEGER NOT NULL DEFAULT 0,
    `rounds_for` INTEGER NOT NULL DEFAULT 0,
    `rounds_against` INTEGER NOT NULL DEFAULT 0,
    `points` INTEGER NOT NULL DEFAULT 0,
    `position` INTEGER NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `standings_tournament_id_idx`(`tournament_id`),
    INDEX `standings_tournament_id_position_idx`(`tournament_id`, `position`),
    UNIQUE INDEX `standings_tournament_id_team_id_key`(`tournament_id`, `team_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `player_stats` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `game_id` VARCHAR(191) NOT NULL,
    `total_matches` INTEGER NOT NULL DEFAULT 0,
    `wins` INTEGER NOT NULL DEFAULT 0,
    `losses` INTEGER NOT NULL DEFAULT 0,
    `draws` INTEGER NOT NULL DEFAULT 0,
    `win_rate` DOUBLE NOT NULL DEFAULT 0,
    `total_score` INTEGER NOT NULL DEFAULT 0,
    `average_score` DOUBLE NOT NULL DEFAULT 0,
    `rank` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL DEFAULT 1000,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `player_stats_user_id_idx`(`user_id`),
    INDEX `player_stats_game_id_idx`(`game_id`),
    INDEX `player_stats_rating_idx`(`rating`),
    UNIQUE INDEX `player_stats_user_id_game_id_key`(`user_id`, `game_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallets` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `pending_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `stripe_customer_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wallets_user_id_key`(`user_id`),
    UNIQUE INDEX `wallets_stripe_customer_id_key`(`stripe_customer_id`),
    INDEX `wallets_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `wallet_id` VARCHAR(191) NOT NULL,
    `type` ENUM('DEPOSIT', 'WITHDRAWAL', 'ENTRY_FEE', 'PRIZE', 'SUBSCRIPTION', 'REFUND', 'TRANSFER') NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `amount` DECIMAL(10, 2) NOT NULL,
    `fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `net_amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `description` VARCHAR(191) NULL,
    `reference_id` VARCHAR(191) NULL,
    `reference_type` VARCHAR(191) NULL,
    `stripe_payment_id` VARCHAR(191) NULL,
    `stripe_transfer_id` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `transactions_wallet_id_idx`(`wallet_id`),
    INDEX `transactions_type_idx`(`type`),
    INDEX `transactions_status_idx`(`status`),
    INDEX `transactions_reference_id_idx`(`reference_id`),
    INDEX `transactions_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_plans` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tier` ENUM('BASIC', 'PRO', 'ELITE') NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `interval` VARCHAR(191) NOT NULL DEFAULT 'month',
    `stripe_price_id` VARCHAR(191) NULL,
    `features` JSON NOT NULL,
    `max_tournaments` INTEGER NOT NULL DEFAULT 1,
    `max_team_size` INTEGER NOT NULL DEFAULT 5,
    `priority_matchmaking` BOOLEAN NOT NULL DEFAULT false,
    `advanced_stats` BOOLEAN NOT NULL DEFAULT false,
    `custom_branding` BOOLEAN NOT NULL DEFAULT false,
    `coaching_access` BOOLEAN NOT NULL DEFAULT false,
    `fee_discount` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscription_plans_tier_key`(`tier`),
    UNIQUE INDEX `subscription_plans_stripe_price_id_key`(`stripe_price_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE', 'TRIALING') NOT NULL DEFAULT 'ACTIVE',
    `stripe_subscription_id` VARCHAR(191) NULL,
    `current_period_start` DATETIME(3) NOT NULL,
    `current_period_end` DATETIME(3) NOT NULL,
    `cancel_at_period_end` BOOLEAN NOT NULL DEFAULT false,
    `cancelled_at` DATETIME(3) NULL,
    `trial_end` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subscriptions_stripe_subscription_id_key`(`stripe_subscription_id`),
    INDEX `subscriptions_user_id_idx`(`user_id`),
    INDEX `subscriptions_plan_id_idx`(`plan_id`),
    INDEX `subscriptions_status_idx`(`status`),
    INDEX `subscriptions_current_period_end_idx`(`current_period_end`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payouts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `tournament_id` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `net_amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `placement` INTEGER NULL,
    `stripe_payout_id` VARCHAR(191) NULL,
    `stripe_transfer_id` VARCHAR(191) NULL,
    `payout_method` VARCHAR(191) NULL,
    `processed_at` DATETIME(3) NULL,
    `failure_reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payouts_user_id_idx`(`user_id`),
    INDEX `payouts_tournament_id_idx`(`tournament_id`),
    INDEX `payouts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `game_accounts` ADD CONSTRAINT `game_accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `game_accounts` ADD CONSTRAINT `game_accounts_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tournaments` ADD CONSTRAINT `tournaments_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tournaments` ADD CONSTRAINT `tournaments_organizer_id_fkey` FOREIGN KEY (`organizer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_tournament_id_fkey` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_captain_id_fkey` FOREIGN KEY (`captain_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_players` ADD CONSTRAINT `team_players_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_players` ADD CONSTRAINT `team_players_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_tournament_id_fkey` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_home_team_id_fkey` FOREIGN KEY (`home_team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_away_team_id_fkey` FOREIGN KEY (`away_team_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_winner_id_fkey` FOREIGN KEY (`winner_id`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_results` ADD CONSTRAINT `match_results_match_id_fkey` FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_results` ADD CONSTRAINT `match_results_reported_by_user_id_fkey` FOREIGN KEY (`reported_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_results` ADD CONSTRAINT `match_results_reported_by_team_id_fkey` FOREIGN KEY (`reported_by_team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_results` ADD CONSTRAINT `match_results_winning_team_id_fkey` FOREIGN KEY (`winning_team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_results` ADD CONSTRAINT `match_results_validated_by_user_id_fkey` FOREIGN KEY (`validated_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `standings` ADD CONSTRAINT `standings_tournament_id_fkey` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `standings` ADD CONSTRAINT `standings_team_id_fkey` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_stats` ADD CONSTRAINT `player_stats_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `player_stats` ADD CONSTRAINT `player_stats_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_wallet_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
