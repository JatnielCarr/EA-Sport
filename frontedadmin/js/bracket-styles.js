// =====================================================
// BRACKET STYLES - Enhanced CSS for brackets
// =====================================================

export function getBracketsStyles() {
  return `
    /* =====================================================
       BRACKETS PAGE - Enhanced Styles
       ===================================================== */
    
    .brackets-page {
      animation: fadeIn 0.3s ease;
    }

    .brackets-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .brackets-main-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brackets-subtitle {
      color: var(--text-secondary);
      font-size: 14px;
    }

    /* Toolbar */
    .bracket-toolbar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .bracket-toolbar .btn-icon-tool {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .bracket-toolbar .btn-icon-tool:hover {
      color: var(--primary);
      border-color: var(--primary);
      box-shadow: 0 0 15px var(--primary-glow);
    }

    /* Filter Tabs */
    .bracket-filter-tabs {
      display: flex;
      gap: 5px;
      background: var(--bg-tertiary);
      padding: 4px;
      border-radius: 10px;
    }

    .bracket-filter-tabs button {
      padding: 8px 16px;
      border-radius: 8px;
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 13px;
    }

    .bracket-filter-tabs button.active {
      background: var(--primary);
      color: var(--bg-primary);
    }

    /* Stats Panel */
    .tournament-stats-panel {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 25px;
    }

    .stat-mini-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }

    .stat-mini-card .stat-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--primary);
      margin-bottom: 4px;
    }

    .stat-mini-card .stat-label {
      font-size: 12px;
      color: var(--text-muted);
    }

    /* LIVE Badge */
    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: linear-gradient(135deg, #ff3366, #ff0844);
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      animation: pulse-live 1.5s infinite;
    }

    .live-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      background: white;
      border-radius: 50%;
    }

    @keyframes pulse-live {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }

    /* Team Logo */
    .team-logo-small {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
      margin-right: 8px;
    }

    .team-initials {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      margin-right: 8px;
    }

    /* Win Streak */
    .streak-badge {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 184, 0, 0.2);
      color: var(--warning);
      margin-left: 5px;
    }

    /* Countdown */
    .match-countdown {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 5px;
    }

    /* Heat Map (close matches) */
    .match-box.heat-match {
      border-image: linear-gradient(135deg, #ff6b35, #ff3366) 1;
      position: relative;
    }

    .match-box.heat-match::after {
      content: '🔥';
      position: absolute;
      top: -8px;
      right: -8px;
      font-size: 16px;
    }

    /* SVG Connections Container */
    .bracket-connections {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    .bracket-connections svg {
      position: absolute;
      overflow: visible;
    }

    .bracket-connections path {
      fill: none;
      stroke: var(--border-color);
      stroke-width: 2;
      transition: stroke 0.3s ease;
    }

    .bracket-connections path.winner-path {
      stroke: var(--success);
      stroke-width: 3;
    }

    /* Bracket Container with relative positioning */
    .bracket-wrapper {
      position: relative;
      overflow-x: auto;
      padding: 10px 0;
    }

    .bracket-view-container {
      min-height: 400px;
      overflow: visible;
    }

    /* Tournament Header */
    .bracket-tournament-header {
      background: linear-gradient(135deg, var(--bg-card), var(--bg-tertiary));
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      padding: 20px 24px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }

    .bracket-tournament-header h2 {
      font-size: 20px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
    }

    .bracket-tournament-header h2 i {
      color: #ffd700;
    }

    .bracket-meta {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .bracket-meta span {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      font-size: 13px;
    }

    /* Title Banner - Fixed */
    .bracket-title-banner {
      display: none; /* Hide the broken banner */
    }

    /* Bracket Sections */
    .bracket-section {
      margin-bottom: 30px;
    }

    .bracket-section-header {
      margin-bottom: 15px;
    }

    .bracket-section-header h3 {
      font-family: 'Orbitron', sans-serif;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-radius: var(--border-radius-sm);
      margin: 0;
    }

    .upper-bracket .bracket-section-header h3 {
      background: linear-gradient(90deg, rgba(255, 215, 0, 0.2), transparent);
      border-left: 4px solid #ffd700;
      color: #ffd700;
    }

    .lower-bracket .bracket-section-header h3 {
      background: linear-gradient(90deg, rgba(255, 99, 71, 0.2), transparent);
      border-left: 4px solid #ff6347;
      color: #ff6347;
    }

    .grand-final .bracket-section-header h3 {
      background: linear-gradient(90deg, rgba(138, 43, 226, 0.2), transparent);
      border-left: 4px solid #8a2be2;
      color: #8a2be2;
    }

    .grand-final-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 20px;
      background: var(--bg-card);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
    }

    .grand-final-container .match-box {
      min-width: 280px;
      max-width: 350px;
    }

    .bracket-reset-section {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px dashed var(--border-color);
    }

    .bracket-reset-label {
      font-size: 11px;
      color: var(--text-muted);
      text-align: center;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Bracket Grid - FIXED */
    .bracket-grid {
      display: flex;
      gap: 40px;
      overflow-x: auto;
      padding: 20px;
      background: var(--bg-card);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      min-height: 300px;
    }

    .bracket-grid.single-elimination {
      justify-content: flex-start;
    }

    .bracket-column {
      min-width: 240px;
      max-width: 280px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }

    .round-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--primary);
      margin-bottom: 15px;
      text-align: center;
      padding: 8px 12px;
      background: var(--bg-tertiary);
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--border-color);
    }

    .round-matches {
      display: flex;
      flex-direction: column;
      gap: 20px;
      justify-content: space-around;
      flex: 1;
    }

    /* Match Box */
    .match-box {
      background: var(--bg-card);
      border: 2px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .match-box:hover {
      border-color: var(--primary);
      transform: translateX(5px);
      box-shadow: 0 0 20px var(--primary-glow);
    }

    .match-box.completed {
      border-color: var(--success);
    }

    .match-box.live {
      border-color: #ff3366;
      animation: glow-live 2s infinite;
    }

    @keyframes glow-live {
      0%, 100% { box-shadow: 0 0 10px rgba(255, 51, 102, 0.3); }
      50% { box-shadow: 0 0 25px rgba(255, 51, 102, 0.6); }
    }

    .match-box.final-match,
    .match-box.grand-final-box {
      border-width: 3px;
      border-color: #8a2be2;
      background: linear-gradient(135deg, rgba(138, 43, 226, 0.15), var(--bg-card));
    }

    .match-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      padding: 8px 12px;
      background: var(--bg-tertiary);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .match-teams-container {
      padding: 0;
    }

    .match-team {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color);
      transition: background 0.2s ease;
    }

    .match-team:last-child {
      border-bottom: none;
    }

    .match-team.winner {
      background: rgba(0, 255, 136, 0.15);
    }

    .match-team.winner .team-name {
      font-weight: 700;
      color: var(--success);
    }

    .match-team.tbd {
      opacity: 0.5;
    }

    .match-team-info {
      display: flex;
      align-items: center;
    }

    .team-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .team-score {
      font-family: 'Orbitron', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary);
      min-width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-tertiary);
      border-radius: 6px;
    }

    /* Stream Button */
    .stream-btn {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      background: #9146ff;
      color: white;
      border: none;
      cursor: pointer;
    }

    /* Match Modal */
    .match-details-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100001;
      animation: fadeIn 0.2s ease;
    }

    .match-details-modal {
      background: var(--bg-secondary);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    }

    .match-details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-tertiary);
    }

    .match-details-body {
      padding: 30px;
    }

    .match-versus {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 30px;
    }

    .versus-team {
      text-align: center;
      flex: 1;
    }

    .versus-team.winner .team-avatar {
      border-color: var(--success);
    }

    .team-avatar-large {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      margin: 0 auto 10px;
      object-fit: cover;
    }

    .versus-scores {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }

    .versus-scores .score {
      font-family: 'Orbitron', sans-serif;
      font-size: 36px;
      font-weight: 900;
      color: var(--primary);
    }

    /* Predictions Section */
    .prediction-section {
      background: var(--bg-tertiary);
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
    }

    .prediction-buttons {
      display: flex;
      gap: 10px;
    }

    .prediction-btn {
      flex: 1;
      padding: 15px;
      border-radius: 10px;
      background: var(--bg-card);
      border: 2px solid var(--border-color);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .prediction-btn:hover {
      border-color: var(--primary);
    }

    .prediction-btn.selected {
      border-color: var(--success);
      background: rgba(0, 255, 136, 0.1);
    }

    /* Comments Section */
    .comments-section {
      margin-top: 20px;
      border-top: 1px solid var(--border-color);
      padding-top: 20px;
    }

    .comment-input {
      display: flex;
      gap: 10px;
    }

    .comments-list {
      max-height: 200px;
      overflow-y: auto;
      margin-top: 15px;
    }

    .comment-item {
      padding: 10px;
      background: var(--bg-tertiary);
      border-radius: 8px;
      margin-bottom: 8px;
    }

    /* Fullscreen Mode */
    .brackets-page:fullscreen {
      background: var(--bg-primary);
      padding: 30px;
    }

    /* Bracket Empty State */
    .bracket-empty-state {
      display: flex;
      flex-direction: column;
      gap: 30px;
      padding: 20px;
    }

    .generate-bracket-section {
      text-align: center;
      padding: 50px 30px;
      background: var(--bg-card);
      border-radius: var(--border-radius);
      border: 2px dashed var(--border-color);
    }

    .generate-bracket-section i {
      font-size: 48px;
      color: var(--primary);
      margin-bottom: 20px;
    }

    .generate-bracket-section h3 {
      font-size: 20px;
      margin-bottom: 10px;
    }

    .generate-bracket-section p {
      color: var(--text-secondary);
      margin-bottom: 20px;
    }

    .tournament-info-card {
      background: linear-gradient(135deg, var(--bg-card), var(--bg-tertiary));
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      padding: 24px;
      text-align: center;
    }

    .tournament-info-card h2 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 15px;
    }

    .tournament-info-card h2 i {
      color: #ffd700;
    }

    .tournament-meta {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .tournament-meta span {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .brackets-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .bracket-grid {
        padding: 15px;
        gap: 20px;
      }

      .bracket-column {
        min-width: 200px;
      }

      .match-versus {
        flex-direction: column;
      }

      .tournament-stats-panel {
        grid-template-columns: repeat(2, 1fr);
      }

      .bracket-tournament-header {
        flex-direction: column;
        text-align: center;
      }

      .bracket-meta {
        justify-content: center;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
}
