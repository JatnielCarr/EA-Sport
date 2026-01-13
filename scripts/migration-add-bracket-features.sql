-- =====================================================
-- MIGRATION: Add Bracket System Features
-- EA Sports Tournament API
-- =====================================================

USE esports_tournament_db;

-- =====================================================
-- MATCHES TABLE UPDATES
-- =====================================================

-- Add next match tracking for winner advancement
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS next_match_id VARCHAR(191),
ADD COLUMN IF NOT EXISTS next_match_slot ENUM('HOME', 'AWAY'),
ADD COLUMN IF NOT EXISTS stream_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_lower_bracket BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_grand_final BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_bracket_reset BOOLEAN DEFAULT FALSE;

-- Add foreign key for next_match_id (ignore if exists)
-- Note: Run this separately if the above succeeds
-- ALTER TABLE matches ADD FOREIGN KEY (next_match_id) REFERENCES matches(id) ON DELETE SET NULL;

-- =====================================================
-- PREDICTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(191) PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    match_id VARCHAR(191) NOT NULL,
    predicted_winner_id VARCHAR(191) NOT NULL,
    predicted_home_score INT,
    predicted_away_score INT,
    points_earned INT DEFAULT 0,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (predicted_winner_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_match_prediction (user_id, match_id),
    INDEX idx_match_id (match_id),
    INDEX idx_user_id (user_id)
);

-- =====================================================
-- MATCH COMMENTS TABLE (Live Chat)
-- =====================================================

CREATE TABLE IF NOT EXISTS match_comments (
    id VARCHAR(191) PRIMARY KEY,
    match_id VARCHAR(191) NOT NULL,
    user_id VARCHAR(191) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_match_id (match_id),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- MVP VOTES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS mvp_votes (
    id VARCHAR(191) PRIMARY KEY,
    match_id VARCHAR(191) NOT NULL,
    user_id VARCHAR(191) NOT NULL,
    player_id VARCHAR(191) NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_match_vote (user_id, match_id),
    INDEX idx_match_id (match_id)
);

-- =====================================================
-- NOTIFICATION PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_prefs (
    id VARCHAR(191) PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL UNIQUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT FALSE,
    discord_webhook VARCHAR(500),
    discord_enabled BOOLEAN DEFAULT FALSE,
    notify_match_start BOOLEAN DEFAULT TRUE,
    notify_match_end BOOLEAN DEFAULT TRUE,
    notify_predictions BOOLEAN DEFAULT TRUE,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- TOURNAMENT ARCHIVE TABLE (Historical)
-- =====================================================

CREATE TABLE IF NOT EXISTS tournament_archives (
    id VARCHAR(191) PRIMARY KEY,
    tournament_id VARCHAR(191) NOT NULL,
    bracket_snapshot JSON NOT NULL,
    final_standings JSON,
    champion_team_id VARCHAR(191),
    archived_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (champion_team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Migration completed successfully!' AS status;
SHOW TABLES;
