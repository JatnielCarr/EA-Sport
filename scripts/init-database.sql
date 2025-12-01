-- =====================================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- EA Sports Tournament API
-- =====================================================

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS esports_tournament_db;
USE esports_tournament_db;

-- =====================================================
-- TABLAS
-- =====================================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(191) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ORGANIZER', 'ADMIN') DEFAULT 'USER',
    verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Tabla de juegos
CREATE TABLE IF NOT EXISTS games (
    id VARCHAR(191) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    developer VARCHAR(255) NOT NULL,
    icon_url VARCHAR(500),
    team_size_default INT DEFAULT 5,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_slug (slug)
);

-- Tabla de cuentas de juego
CREATE TABLE IF NOT EXISTS game_accounts (
    id VARCHAR(191) PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    game_id VARCHAR(191) NOT NULL,
    game_username VARCHAR(255) NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    `rank` VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    verified_at DATETIME(3),
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_game_account (user_id, game_id, account_id),
    INDEX idx_user_id (user_id),
    INDEX idx_game_id (game_id)
);

-- Tabla de torneos
CREATE TABLE IF NOT EXISTS tournaments (
    id VARCHAR(191) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    game_id VARCHAR(191) NOT NULL,
    organizer_id VARCHAR(191) NOT NULL,
    format ENUM('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS') NOT NULL,
    team_size INT NOT NULL,
    max_participants INT NOT NULL,
    region VARCHAR(50) NOT NULL,
    entry_fee DECIMAL(10, 2) DEFAULT 0,
    prize_pool DECIMAL(10, 2) DEFAULT 0,
    start_date DATETIME(3) NOT NULL,
    end_date DATETIME(3),
    registration_deadline DATETIME(3) NOT NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
    rules_json JSON,
    bracket_generated BOOLEAN DEFAULT FALSE,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_slug (slug),
    INDEX idx_game_id (game_id),
    INDEX idx_organizer_id (organizer_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date)
);

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(191) PRIMARY KEY,
    tournament_id VARCHAR(191) NOT NULL,
    name VARCHAR(255) NOT NULL,
    tag VARCHAR(10) NOT NULL,
    logo_url VARCHAR(500),
    captain_id VARCHAR(191) NOT NULL,
    seed INT,
    registration_date DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    payment_status ENUM('PENDING', 'PAID', 'REFUNDED') DEFAULT 'PENDING',
    approved BOOLEAN DEFAULT FALSE,
    disqualified BOOLEAN DEFAULT FALSE,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tournament_name (tournament_id, name),
    UNIQUE KEY unique_tournament_tag (tournament_id, tag),
    INDEX idx_tournament_id (tournament_id),
    INDEX idx_captain_id (captain_id)
);

-- Tabla de jugadores de equipo
CREATE TABLE IF NOT EXISTS team_players (
    id VARCHAR(191) PRIMARY KEY,
    team_id VARCHAR(191) NOT NULL,
    user_id VARCHAR(191) NOT NULL,
    role VARCHAR(50),
    is_captain BOOLEAN DEFAULT FALSE,
    is_substitute BOOLEAN DEFAULT FALSE,
    status ENUM('ACTIVE', 'INACTIVE', 'REMOVED') DEFAULT 'ACTIVE',
    joined_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_user (team_id, user_id),
    INDEX idx_team_id (team_id),
    INDEX idx_user_id (user_id)
);

-- Tabla de partidas
CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(191) PRIMARY KEY,
    tournament_id VARCHAR(191) NOT NULL,
    round INT NOT NULL,
    match_number INT NOT NULL,
    bracket_position INT NOT NULL,
    home_team_id VARCHAR(191),
    away_team_id VARCHAR(191),
    scheduled_datetime DATETIME(3),
    best_of INT DEFAULT 1,
    status ENUM('SCHEDULED', 'CHECK_IN', 'LIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED') DEFAULT 'SCHEDULED',
    winner_id VARCHAR(191),
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (winner_id) REFERENCES teams(id) ON DELETE SET NULL,
    INDEX idx_tournament_id (tournament_id),
    INDEX idx_tournament_round (tournament_id, round),
    INDEX idx_status (status)
);

-- Tabla de resultados de partidas
CREATE TABLE IF NOT EXISTS match_results (
    id VARCHAR(191) PRIMARY KEY,
    match_id VARCHAR(191) NOT NULL,
    reported_by_user_id VARCHAR(191) NOT NULL,
    reported_by_team_id VARCHAR(191) NOT NULL,
    winning_team_id VARCHAR(191) NOT NULL,
    home_score INT NOT NULL,
    away_score INT NOT NULL,
    screenshot_url VARCHAR(500),
    replay_file_url VARCHAR(500),
    submitted_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    validated BOOLEAN DEFAULT FALSE,
    validated_by_user_id VARCHAR(191),
    validated_at DATETIME(3),
    disputed BOOLEAN DEFAULT FALSE,
    dispute_reason TEXT,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (winning_team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (validated_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_match_id (match_id),
    INDEX idx_reported_by_team_id (reported_by_team_id)
);

-- Tabla de clasificaciones
CREATE TABLE IF NOT EXISTS standings (
    id VARCHAR(191) PRIMARY KEY,
    tournament_id VARCHAR(191) NOT NULL,
    team_id VARCHAR(191) NOT NULL,
    played INT DEFAULT 0,
    won INT DEFAULT 0,
    lost INT DEFAULT 0,
    drawn INT DEFAULT 0,
    rounds_for INT DEFAULT 0,
    rounds_against INT DEFAULT 0,
    points INT DEFAULT 0,
    position INT NOT NULL,
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tournament_team (tournament_id, team_id),
    INDEX idx_tournament_id (tournament_id),
    INDEX idx_tournament_position (tournament_id, position)
);

-- Tabla de estadísticas de jugadores
CREATE TABLE IF NOT EXISTS player_stats (
    id VARCHAR(191) PRIMARY KEY,
    user_id VARCHAR(191) NOT NULL,
    game_id VARCHAR(191) NOT NULL,
    total_matches INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    draws INT DEFAULT 0,
    win_rate FLOAT DEFAULT 0,
    total_score INT DEFAULT 0,
    average_score FLOAT DEFAULT 0,
    `rank` VARCHAR(100),
    rating INT DEFAULT 1000,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_game (user_id, game_id),
    INDEX idx_user_id (user_id),
    INDEX idx_game_id (game_id),
    INDEX idx_rating (rating)
);

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

-- Insertar juegos
INSERT INTO games (id, name, slug, developer, icon_url, team_size_default) VALUES
('game_lol', 'League of Legends', 'lol', 'Riot Games', 'https://example.com/lol-icon.png', 5),
('game_valorant', 'Valorant', 'valorant', 'Riot Games', 'https://example.com/valorant-icon.png', 5),
('game_cs2', 'Counter-Strike 2', 'cs2', 'Valve', 'https://example.com/cs2-icon.png', 5),
('game_dota2', 'Dota 2', 'dota2', 'Valve', 'https://example.com/dota2-icon.png', 5),
('game_fortnite', 'Fortnite', 'fortnite', 'Epic Games', 'https://example.com/fortnite-icon.png', 4),
('game_apex', 'Apex Legends', 'apex', 'Respawn Entertainment', 'https://example.com/apex-icon.png', 3),
('game_fifa', 'EA Sports FC 25', 'fc25', 'EA Sports', 'https://example.com/fc25-icon.png', 1),
('game_rocket', 'Rocket League', 'rocket-league', 'Psyonix', 'https://example.com/rocket-icon.png', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insertar usuarios de ejemplo
INSERT INTO users (id, email, username, password_hash, role, verified) VALUES
('user_admin', 'admin@esports.com', 'admin', '$2b$10$placeholder_hash', 'ADMIN', TRUE),
('user_org1', 'organizer1@esports.com', 'organizer1', '$2b$10$placeholder_hash', 'ORGANIZER', TRUE),
('user_player1', 'player1@esports.com', 'ProGamer123', '$2b$10$placeholder_hash', 'USER', TRUE),
('user_player2', 'player2@esports.com', 'NightOwl', '$2b$10$placeholder_hash', 'USER', TRUE),
('user_player3', 'player3@esports.com', 'StormRider', '$2b$10$placeholder_hash', 'USER', TRUE),
('user_player4', 'player4@esports.com', 'ShadowBlade', '$2b$10$placeholder_hash', 'USER', TRUE),
('user_player5', 'player5@esports.com', 'PhoenixRising', '$2b$10$placeholder_hash', 'USER', TRUE),
('user_player6', 'player6@esports.com', 'DragonSlayer', '$2b$10$placeholder_hash', 'USER', TRUE),
('user_player7', 'player7@esports.com', 'IceQueen', '$2b$10$placeholder_hash', 'USER', TRUE),
('user_player8', 'player8@esports.com', 'FireStarter', '$2b$10$placeholder_hash', 'USER', TRUE)
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Insertar torneos de ejemplo
INSERT INTO tournaments (id, name, slug, description, game_id, organizer_id, format, team_size, max_participants, region, entry_fee, prize_pool, start_date, registration_deadline, status) VALUES
('tournament_lol_winter', 'League of Legends Winter Championship 2025', 'lol-winter-2025', 'Campeonato de invierno de League of Legends con los mejores equipos de la región.', 'game_lol', 'user_org1', 'SINGLE_ELIMINATION', 5, 16, 'EU', 50.00, 10000.00, '2025-12-15 18:00:00', '2025-12-10 23:59:59', 'REGISTRATION_OPEN'),
('tournament_valorant_pro', 'Valorant Pro Series', 'valorant-pro-series', 'Serie profesional de Valorant con formato suizo.', 'game_valorant', 'user_org1', 'SWISS', 5, 8, 'NA', 25.00, 5000.00, '2025-12-20 20:00:00', '2025-12-18 23:59:59', 'PUBLISHED'),
('tournament_cs2_masters', 'CS2 Masters Tournament', 'cs2-masters', 'Torneo maestro de Counter-Strike 2 con doble eliminación.', 'game_cs2', 'user_admin', 'DOUBLE_ELIMINATION', 5, 32, 'GLOBAL', 100.00, 25000.00, '2026-01-10 16:00:00', '2026-01-05 23:59:59', 'DRAFT'),
('tournament_fc25_cup', 'EA Sports FC 25 Cup', 'fc25-cup', 'Copa de EA Sports FC 25 individual.', 'game_fifa', 'user_org1', 'SINGLE_ELIMINATION', 1, 64, 'LATAM', 10.00, 1000.00, '2025-12-05 15:00:00', '2025-12-01 23:59:59', 'IN_PROGRESS')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insertar equipos de ejemplo
INSERT INTO teams (id, tournament_id, name, tag, captain_id, seed, payment_status, approved) VALUES
('team_dragons', 'tournament_lol_winter', 'Dragon Esports', 'DRG', 'user_player1', 1, 'PAID', TRUE),
('team_wolves', 'tournament_lol_winter', 'Night Wolves', 'NW', 'user_player3', 2, 'PAID', TRUE),
('team_phoenix', 'tournament_lol_winter', 'Phoenix Rising', 'PHX', 'user_player5', 3, 'PAID', TRUE),
('team_storm', 'tournament_lol_winter', 'Storm Riders', 'STR', 'user_player7', 4, 'PAID', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insertar jugadores de equipo
INSERT INTO team_players (id, team_id, user_id, role, is_captain, is_substitute) VALUES
('tp_1', 'team_dragons', 'user_player1', 'Top', TRUE, FALSE),
('tp_2', 'team_dragons', 'user_player2', 'Jungle', FALSE, FALSE),
('tp_3', 'team_wolves', 'user_player3', 'Mid', TRUE, FALSE),
('tp_4', 'team_wolves', 'user_player4', 'ADC', FALSE, FALSE),
('tp_5', 'team_phoenix', 'user_player5', 'Support', TRUE, FALSE),
('tp_6', 'team_phoenix', 'user_player6', 'Top', FALSE, FALSE),
('tp_7', 'team_storm', 'user_player7', 'Jungle', TRUE, FALSE),
('tp_8', 'team_storm', 'user_player8', 'Mid', FALSE, FALSE)
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- Insertar partidas de ejemplo
INSERT INTO matches (id, tournament_id, round, match_number, bracket_position, home_team_id, away_team_id, scheduled_datetime, best_of, status) VALUES
('match_sf1', 'tournament_lol_winter', 1, 1, 1, 'team_dragons', 'team_storm', '2025-12-15 18:00:00', 3, 'SCHEDULED'),
('match_sf2', 'tournament_lol_winter', 1, 2, 2, 'team_wolves', 'team_phoenix', '2025-12-15 20:00:00', 3, 'SCHEDULED'),
('match_final', 'tournament_lol_winter', 2, 1, 1, NULL, NULL, '2025-12-16 18:00:00', 5, 'SCHEDULED')
ON DUPLICATE KEY UPDATE round = VALUES(round);

-- Insertar clasificaciones iniciales
INSERT INTO standings (id, tournament_id, team_id, played, won, lost, drawn, points, position) VALUES
('standing_1', 'tournament_lol_winter', 'team_dragons', 0, 0, 0, 0, 0, 1),
('standing_2', 'tournament_lol_winter', 'team_wolves', 0, 0, 0, 0, 0, 2),
('standing_3', 'tournament_lol_winter', 'team_phoenix', 0, 0, 0, 0, 0, 3),
('standing_4', 'tournament_lol_winter', 'team_storm', 0, 0, 0, 0, 0, 4)
ON DUPLICATE KEY UPDATE position = VALUES(position);

-- Insertar estadísticas de jugadores
INSERT INTO player_stats (id, user_id, game_id, total_matches, wins, losses, win_rate, rating) VALUES
('stats_1', 'user_player1', 'game_lol', 150, 95, 55, 63.33, 1850),
('stats_2', 'user_player2', 'game_lol', 120, 70, 50, 58.33, 1720),
('stats_3', 'user_player3', 'game_lol', 200, 130, 70, 65.00, 1920),
('stats_4', 'user_player4', 'game_lol', 180, 100, 80, 55.56, 1650),
('stats_5', 'user_player5', 'game_valorant', 100, 60, 40, 60.00, 1780),
('stats_6', 'user_player6', 'game_cs2', 250, 150, 100, 60.00, 1800)
ON DUPLICATE KEY UPDATE total_matches = VALUES(total_matches);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 'Database initialized successfully!' AS status;
SELECT CONCAT('Users: ', COUNT(*)) AS count FROM users;
SELECT CONCAT('Games: ', COUNT(*)) AS count FROM games;
SELECT CONCAT('Tournaments: ', COUNT(*)) AS count FROM tournaments;
SELECT CONCAT('Teams: ', COUNT(*)) AS count FROM teams;
SELECT CONCAT('Matches: ', COUNT(*)) AS count FROM matches;
