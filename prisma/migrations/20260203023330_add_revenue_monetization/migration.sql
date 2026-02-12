-- CreateTable
CREATE TABLE `platform_revenue` (
    `id` VARCHAR(191) NOT NULL,
    `transaction_type` ENUM('SUBSCRIPTION', 'TOURNAMENT_ENTRY', 'PRIZE_COMMISSION', 'NAME_CHANGE', 'BALANCE_TOPUP', 'WITHDRAWAL', 'REFUND', 'PLATFORM_FEE') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'mxn',
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `description` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NULL,
    `tournament_id` VARCHAR(191) NULL,
    `stripe_payment_id` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `platform_revenue_transaction_type_idx`(`transaction_type`),
    INDEX `platform_revenue_created_at_idx`(`created_at`),
    INDEX `platform_revenue_user_id_idx`(`user_id`),
    INDEX `platform_revenue_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tournament_entries` (
    `id` VARCHAR(191) NOT NULL,
    `tournament_id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `entry_fee` DECIMAL(10, 2) NOT NULL,
    `platform_fee` DECIMAL(10, 2) NOT NULL,
    `net_amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `stripe_payment_id` VARCHAR(191) NULL,
    `paid_at` DATETIME(3) NULL,
    `refunded_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tournament_entries_tournament_id_idx`(`tournament_id`),
    INDEX `tournament_entries_user_id_idx`(`user_id`),
    INDEX `tournament_entries_status_idx`(`status`),
    UNIQUE INDEX `tournament_entries_tournament_id_team_id_key`(`tournament_id`, `team_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prize_distributions` (
    `id` VARCHAR(191) NOT NULL,
    `tournament_id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL,
    `gross_amount` DECIMAL(10, 2) NOT NULL,
    `platform_fee` DECIMAL(10, 2) NOT NULL,
    `net_amount` DECIMAL(10, 2) NOT NULL,
    `distributed` BOOLEAN NOT NULL DEFAULT false,
    `distributed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `prize_distributions_tournament_id_idx`(`tournament_id`),
    INDEX `prize_distributions_distributed_idx`(`distributed`),
    UNIQUE INDEX `prize_distributions_tournament_id_team_id_key`(`tournament_id`, `team_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revenue_metrics` (
    `id` VARCHAR(191) NOT NULL,
    `period_type` VARCHAR(191) NOT NULL,
    `period_start` DATETIME(3) NOT NULL,
    `period_end` DATETIME(3) NOT NULL,
    `total_revenue` DECIMAL(12, 2) NOT NULL,
    `subscription_revenue` DECIMAL(12, 2) NOT NULL,
    `tournament_revenue` DECIMAL(12, 2) NOT NULL,
    `commission_revenue` DECIMAL(12, 2) NOT NULL,
    `other_revenue` DECIMAL(12, 2) NOT NULL,
    `total_transactions` INTEGER NOT NULL,
    `new_subscribers` INTEGER NOT NULL,
    `churned_subscribers` INTEGER NOT NULL,
    `mrr` DECIMAL(12, 2) NOT NULL,
    `arr` DECIMAL(12, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `revenue_metrics_period_type_idx`(`period_type`),
    INDEX `revenue_metrics_period_start_idx`(`period_start`),
    UNIQUE INDEX `revenue_metrics_period_type_period_start_key`(`period_type`, `period_start`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
