// =====================================================
// BRACKETS PAGE - Enhanced Tournament Brackets
// Features: SVG connections, LIVE, predictions, stats
// =====================================================

import API from '../api.js';
import { showLoading, showToast, formatDate } from '../ui.js';
import { getBracketsStyles } from '../bracket-styles.js';
import {
  formatCountdown, getTeamInitials, validateScore,
  getWinStreak, isCloseMatch, exportBracketAsImage,
  toggleFullscreen, triggerConfetti
} from '../bracket-utils.js';

let allTournaments = [];
let allTeams = [];
let allMatches = [];
let selectedTournament = null;
let currentFilter = 'all';

// =====================================================
// MAIN RENDER FUNCTION
// =====================================================

export async function renderBrackets(container) {
  showLoading(container);

  try {
    const [tournamentsRes, teamsRes, matchesRes] = await Promise.all([
      API.tournaments.getAll(),
      API.teams.getAll(),
      API.matches.getAll()
    ]);

    allTournaments = tournamentsRes.data || [];
    allTeams = teamsRes.data || [];
    allMatches = matchesRes.data || [];

    const tournamentsWithTeams = allTournaments.filter(t =>
      allTeams.some(team => team.tournament_id === t.id)
    );

    container.innerHTML = `
      <div class="brackets-page" id="bracketsPage">
        <div class="brackets-header">
          <div class="brackets-title-section">
            <h1 class="brackets-main-title">
              <i class="fas fa-sitemap" style="color: var(--primary);"></i>
              Brackets de Torneos
            </h1>
            <p class="brackets-subtitle">Visualiza los enfrentamientos y resultados</p>
          </div>
          <div class="brackets-filters">
            <select class="form-control" id="selectTournament" style="width: 280px;">
              <option value="">Seleccionar torneo...</option>
              ${tournamentsWithTeams.map(t => `
                <option value="${t.id}">${t.name} (${t.format})</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="bracket-toolbar" id="bracketToolbar" style="display: none;">
          <div class="bracket-filter-tabs">
            <button class="active" data-filter="all">Todos</button>
            <button data-filter="live">🔴 En Vivo</button>
            <button data-filter="upcoming">Próximos</button>
            <button data-filter="completed">Completados</button>
          </div>
          <button class="btn-icon-tool" id="btnFullscreen" title="Pantalla completa">
            <i class="fas fa-expand"></i>
          </button>
          <button class="btn-icon-tool" id="btnExport" title="Exportar imagen">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn-icon-tool" id="btnShare" title="Compartir">
            <i class="fas fa-share-alt"></i>
          </button>
        </div>

        <div class="bracket-view-container" id="bracketViewContainer">
          ${tournamentsWithTeams.length === 0 ? `
            <div class="empty-state">
              <i class="fas fa-trophy"></i>
              <h3>No hay torneos con equipos</h3>
              <p>Crea un torneo y registra equipos para ver los brackets</p>
              <a href="#/tournaments" class="btn btn-primary">
                <i class="fas fa-plus"></i> Ir a Torneos
              </a>
            </div>
          ` : `
            <div class="empty-state">
              <i class="fas fa-hand-pointer"></i>
              <h3>Selecciona un torneo</h3>
              <p>Elige un torneo del menú superior para ver su bracket</p>
            </div>
          `}
        </div>
      </div>

      <style>${getBracketsStyles()}</style>
    `;

    // Event listeners
    document.getElementById('selectTournament').addEventListener('change', (e) => {
      if (e.target.value) {
        loadTournamentBracket(e.target.value);
      }
    });

    // Toolbar events
    document.getElementById('btnFullscreen')?.addEventListener('click', () => {
      toggleFullscreen('bracketsPage');
    });

    document.getElementById('btnExport')?.addEventListener('click', () => {
      exportBracketAsImage('bracketViewContainer');
    });

    document.getElementById('btnShare')?.addEventListener('click', () => {
      shareCurrentBracket();
    });

    // Filter tabs
    document.querySelectorAll('.bracket-filter-tabs button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.bracket-filter-tabs button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        if (selectedTournament) {
          loadTournamentBracket(selectedTournament.id);
        }
      });
    });

  } catch (error) {
    console.error('Error loading brackets:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar los brackets</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// =====================================================
// LOAD TOURNAMENT BRACKET
// =====================================================

async function loadTournamentBracket(tournamentId) {
  const container = document.getElementById('bracketViewContainer');
  const toolbar = document.getElementById('bracketToolbar');
  showLoading(container);
  toolbar.style.display = 'flex';

  try {
    selectedTournament = allTournaments.find(t => t.id === tournamentId);
    const tournamentTeams = allTeams.filter(t => t.tournament_id === tournamentId);
    let tournamentMatches = allMatches.filter(m => m.tournament_id === tournamentId);

    // Apply filter
    tournamentMatches = filterMatches(tournamentMatches, currentFilter);

    if (allMatches.filter(m => m.tournament_id === tournamentId).length === 0) {
      container.innerHTML = renderEmptyBracketState(tournamentTeams);
      document.getElementById('btnGenerateBracket')?.addEventListener('click', () => {
        generateBracketForTournament(tournamentId, tournamentTeams);
      });
      return;
    }

    // Render stats panel + bracket
    const statsHtml = renderTournamentStats(allMatches.filter(m => m.tournament_id === tournamentId), tournamentTeams);
    let bracketHtml = '';

    if (selectedTournament.format === 'DOUBLE_ELIMINATION') {
      bracketHtml = renderDoubleEliminationBracket(tournamentTeams, tournamentMatches);
    } else {
      bracketHtml = renderSingleEliminationBracket(tournamentTeams, tournamentMatches);
    }

    container.innerHTML = `
      ${statsHtml}
      <div class="bracket-wrapper" id="bracketWrapper">
        ${bracketHtml}
      </div>
    `;

    // Match click events
    container.querySelectorAll('.match-box').forEach(box => {
      box.addEventListener('click', () => {
        const matchId = box.dataset.matchId;
        if (matchId) {
          showMatchDetails(matchId, tournamentTeams, allMatches.filter(m => m.tournament_id === tournamentId));
        }
      });
    });

    // Draw SVG connections
    setTimeout(() => drawBracketConnections(), 100);

  } catch (error) {
    console.error('Error loading bracket:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar el bracket</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// =====================================================
// TOURNAMENT STATS PANEL
// =====================================================

function renderTournamentStats(matches, teams) {
  const completed = matches.filter(m => m.status === 'COMPLETED').length;
  const live = matches.filter(m => m.status === 'LIVE').length;
  const upcoming = matches.filter(m => m.status === 'SCHEDULED').length;

  // Find team with most wins
  const winCounts = {};
  matches.filter(m => m.winner_id).forEach(m => {
    winCounts[m.winner_id] = (winCounts[m.winner_id] || 0) + 1;
  });

  let topTeamId = null;
  let topWins = 0;
  for (const [teamId, wins] of Object.entries(winCounts)) {
    if (wins > topWins) {
      topWins = wins;
      topTeamId = teamId;
    }
  }

  const topTeam = teams.find(t => t.id === topTeamId);

  return `
    <div class="tournament-stats-panel">
      <div class="stat-mini-card">
        <div class="stat-value">${completed}/${matches.length}</div>
        <div class="stat-label">Partidas Jugadas</div>
      </div>
      <div class="stat-mini-card">
        <div class="stat-value" style="color: #ff3366;">${live}</div>
        <div class="stat-label">🔴 En Vivo</div>
      </div>
      <div class="stat-mini-card">
        <div class="stat-value" style="color: var(--warning);">${upcoming}</div>
        <div class="stat-label">Próximas</div>
      </div>
      <div class="stat-mini-card">
        <div class="stat-value">${topTeam?.tag || '-'}</div>
        <div class="stat-label">Líder (${topWins}W)</div>
      </div>
    </div>
  `;
}

// =====================================================
// FILTER MATCHES
// =====================================================

function filterMatches(matches, filter) {
  switch (filter) {
    case 'live': return matches.filter(m => m.status === 'LIVE');
    case 'upcoming': return matches.filter(m => m.status === 'SCHEDULED');
    case 'completed': return matches.filter(m => m.status === 'COMPLETED');
    default: return matches;
  }
}

// =====================================================
// SINGLE ELIMINATION BRACKET
// =====================================================

function renderSingleEliminationBracket(teams, matches) {
  const rounds = {};
  matches.forEach(match => {
    const round = match.round || 1;
    if (!rounds[round]) rounds[round] = [];
    rounds[round].push(match);
  });

  const roundNumbers = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));
  const totalRounds = roundNumbers.length;

  return `
    <div class="bracket-tournament-header">
      <h2><i class="fas fa-trophy"></i> ${selectedTournament.name}</h2>
      <div class="bracket-meta">
        <span><i class="fas fa-sitemap"></i> Eliminación Simple</span>
        <span><i class="fas fa-users"></i> ${teams.length} Equipos</span>
      </div>
    </div>
    
    <div class="bracket-title-banner">
      <h1>BRACKET</h1>
    </div>
    
    <div class="bracket-grid single-elimination" id="bracketGrid">
      ${roundNumbers.map((roundNum, idx) => `
        <div class="bracket-column" data-round="${roundNum}">
          <div class="round-title">${getRoundName(idx, totalRounds)}</div>
          <div class="round-matches">
            ${rounds[roundNum].map(match => renderMatchBox(match, teams, idx === totalRounds - 1)).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// =====================================================
// DOUBLE ELIMINATION BRACKET
// =====================================================

function renderDoubleEliminationBracket(teams, matches) {
  const allTournamentMatches = allMatches.filter(m => m.tournament_id === selectedTournament.id);

  const grandFinal = allTournamentMatches.find(m => m.is_grand_final);
  const bracketReset = allTournamentMatches.find(m => m.is_bracket_reset);

  const upperBracket = matches.filter(m => !m.is_lower_bracket && !m.is_grand_final && !m.is_bracket_reset);
  const lowerBracket = matches.filter(m => m.is_lower_bracket);

  const upperRounds = organizeByRound(upperBracket);
  const lowerRounds = organizeByRound(lowerBracket);

  const upperRoundNums = Object.keys(upperRounds).sort((a, b) => parseInt(a) - parseInt(b));
  const lowerRoundNums = Object.keys(lowerRounds).sort((a, b) => parseInt(a) - parseInt(b));

  return `
    <div class="bracket-tournament-header">
      <h2><i class="fas fa-trophy"></i> ${selectedTournament.name}</h2>
      <div class="bracket-meta">
        <span><i class="fas fa-sitemap"></i> Doble Eliminación</span>
        <span><i class="fas fa-users"></i> ${teams.length} Equipos</span>
        <span><i class="fas fa-gamepad"></i> ${allTournamentMatches.length} Partidas</span>
      </div>
    </div>
    
    <div class="bracket-title-banner"><h1>BRACKET</h1></div>

    <div class="bracket-section upper-bracket">
      <div class="bracket-section-header">
        <h3><i class="fas fa-chevron-up"></i> UPPER BRACKET</h3>
      </div>
      <div class="bracket-grid" id="upperBracketGrid">
        ${upperRoundNums.map((roundNum, idx) => `
          <div class="bracket-column" data-round="${roundNum}">
            <div class="round-title">${getUpperRoundNameDE(parseInt(roundNum), upperRoundNums.length)}</div>
            <div class="round-matches">
              ${upperRounds[roundNum].map(match => renderMatchBox(match, teams)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="bracket-section lower-bracket">
      <div class="bracket-section-header">
        <h3><i class="fas fa-chevron-down"></i> LOWER BRACKET</h3>
      </div>
      <div class="bracket-grid" id="lowerBracketGrid">
        ${lowerRoundNums.map((roundNum, idx) => `
          <div class="bracket-column" data-round="${roundNum}">
            <div class="round-title">${getLowerRoundNameDE(parseInt(roundNum), lowerRoundNums.length)}</div>
            <div class="round-matches">
              ${lowerRounds[roundNum].map(match => renderMatchBox(match, teams)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="bracket-section grand-final">
      <div class="bracket-section-header">
        <h3><i class="fas fa-crown"></i> GRAND FINAL</h3>
      </div>
      <div class="grand-final-container">
        ${grandFinal ? renderMatchBox(grandFinal, teams, true) : renderTBDMatch('GRAND FINAL')}
        ${bracketReset ? `
          <div class="bracket-reset-section">
            <div class="bracket-reset-label">BRACKET RESET (If Necessary)</div>
            ${renderMatchBox(bracketReset, teams, true)}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// =====================================================
// MATCH BOX RENDER
// =====================================================

function renderMatchBox(match, teams, isFinal = false) {
  const team1 = teams.find(t => t.id === match.home_team_id);
  const team2 = teams.find(t => t.id === match.away_team_id);
  const isCompleted = match.status === 'COMPLETED';
  const isLive = match.status === 'LIVE';
  const winner = match.winner_id;

  const streak1 = team1 ? getWinStreak(team1.id, allMatches) : 0;
  const streak2 = team2 ? getWinStreak(team2.id, allMatches) : 0;
  const isHeat = isCloseMatch(match);

  const matchLabel = match.is_grand_final ? 'GRAND FINAL' :
    match.is_bracket_reset ? 'BRACKET RESET' :
      `MATCH ${match.match_number}`;

  return `
    <div class="match-box ${isCompleted ? 'completed' : ''} ${isLive ? 'live' : ''} ${isFinal ? 'grand-final-box' : ''} ${isHeat ? 'heat-match' : ''}" 
         data-match-id="${match.id}">
      <div class="match-label">
        <span>${matchLabel}</span>
        ${isLive ? '<span class="live-badge">LIVE</span>' : ''}
        ${match.stream_url ? '<button class="stream-btn" onclick="event.stopPropagation()"><i class="fab fa-twitch"></i></button>' : ''}
      </div>
      <div class="match-teams-container">
        <div class="match-team ${winner === match.home_team_id ? 'winner' : ''} ${!team1 ? 'tbd' : ''}">
          <div class="match-team-info">
            ${team1?.logo_url ? `<img src="${team1.logo_url}" class="team-logo-small" alt="">` :
      `<div class="team-initials">${getTeamInitials(team1?.name)}</div>`}
            <span class="team-name">${team1?.name || 'TBD'}</span>
            ${streak1 >= 3 ? `<span class="streak-badge">🔥${streak1}W</span>` : ''}
          </div>
          <span class="team-score">${isCompleted || isLive ? (match.home_score ?? 0) : '-'}</span>
        </div>
        <div class="match-team ${winner === match.away_team_id ? 'winner' : ''} ${!team2 ? 'tbd' : ''}">
          <div class="match-team-info">
            ${team2?.logo_url ? `<img src="${team2.logo_url}" class="team-logo-small" alt="">` :
      `<div class="team-initials">${getTeamInitials(team2?.name)}</div>`}
            <span class="team-name">${team2?.name || 'TBD'}</span>
            ${streak2 >= 3 ? `<span class="streak-badge">🔥${streak2}W</span>` : ''}
          </div>
          <span class="team-score">${isCompleted || isLive ? (match.away_score ?? 0) : '-'}</span>
        </div>
      </div>
      ${!isCompleted && match.scheduled_datetime ? `
        <div class="match-countdown">
          <i class="fas fa-clock"></i> ${formatCountdown(match.scheduled_datetime)}
        </div>
      ` : ''}
    </div>
  `;
}

function renderTBDMatch(label) {
  return `
    <div class="match-box tbd">
      <div class="match-label">${label}</div>
      <div class="match-teams-container">
        <div class="match-team tbd"><span class="team-name">TBD</span><span class="team-score">-</span></div>
        <div class="match-team tbd"><span class="team-name">TBD</span><span class="team-score">-</span></div>
      </div>
    </div>
  `;
}

// =====================================================
// SVG BRACKET CONNECTIONS
// =====================================================

function drawBracketConnections() {
  const grids = document.querySelectorAll('.bracket-grid');
  grids.forEach(grid => {
    const columns = grid.querySelectorAll('.bracket-column');
    if (columns.length < 2) return;

    // Remove existing SVG
    grid.querySelectorAll('.bracket-connections').forEach(el => el.remove());

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('bracket-connections');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';

    const gridRect = grid.getBoundingClientRect();

    for (let i = 0; i < columns.length - 1; i++) {
      const currentMatches = columns[i].querySelectorAll('.match-box');
      const nextMatches = columns[i + 1].querySelectorAll('.match-box');

      currentMatches.forEach((match, idx) => {
        const nextMatchIdx = Math.floor(idx / 2);
        const nextMatch = nextMatches[nextMatchIdx];

        if (!nextMatch) return;

        const matchRect = match.getBoundingClientRect();
        const nextRect = nextMatch.getBoundingClientRect();

        const x1 = matchRect.right - gridRect.left;
        const y1 = matchRect.top + matchRect.height / 2 - gridRect.top;
        const x2 = nextRect.left - gridRect.left;
        const y2 = nextRect.top + nextRect.height / 2 - gridRect.top;

        const midX = (x1 + x2) / 2;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'var(--border-color)');
        path.setAttribute('stroke-width', '2');

        // Highlight winner path
        if (match.classList.contains('completed')) {
          path.setAttribute('stroke', 'var(--success)');
          path.setAttribute('stroke-width', '3');
        }

        svg.appendChild(path);
      });
    }

    grid.style.position = 'relative';
    grid.appendChild(svg);
  });
}

// =====================================================
// MATCH DETAILS MODAL
// =====================================================

function showMatchDetails(matchId, teams, matches) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const team1 = teams.find(t => t.id === match.home_team_id);
  const team2 = teams.find(t => t.id === match.away_team_id);
  const isCompleted = match.status === 'COMPLETED';

  const overlay = document.createElement('div');
  overlay.className = 'match-details-overlay';
  overlay.innerHTML = `
    <div class="match-details-modal">
      <div class="match-details-header">
        <h3>Match #${match.match_number || '?'}</h3>
        <button class="close-btn" onclick="this.closest('.match-details-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="match-details-body">
        <div class="match-versus">
          <div class="versus-team ${match.winner_id === match.home_team_id ? 'winner' : ''}">
            ${team1?.logo_url ? `<img src="${team1.logo_url}" class="team-avatar-large">` :
      `<div class="team-initials" style="width:80px;height:80px;font-size:24px;margin:0 auto 10px;">${getTeamInitials(team1?.name)}</div>`}
            <h4>${team1?.name || 'TBD'}</h4>
            ${team1?.tag ? `<span class="team-tag">${team1.tag}</span>` : ''}
          </div>
          <div class="versus-scores">
            <span class="score">${isCompleted ? (match.home_score ?? 0) : '-'}</span>
            <span class="vs-text">VS</span>
            <span class="score">${isCompleted ? (match.away_score ?? 0) : '-'}</span>
          </div>
          <div class="versus-team ${match.winner_id === match.away_team_id ? 'winner' : ''}">
            ${team2?.logo_url ? `<img src="${team2.logo_url}" class="team-avatar-large">` :
      `<div class="team-initials" style="width:80px;height:80px;font-size:24px;margin:0 auto 10px;">${getTeamInitials(team2?.name)}</div>`}
            <h4>${team2?.name || 'TBD'}</h4>
            ${team2?.tag ? `<span class="team-tag">${team2.tag}</span>` : ''}
          </div>
        </div>

        <div class="match-status-info">
          <span class="status-badge ${match.status?.toLowerCase()}">${getStatusLabel(match.status)}</span>
        </div>

        ${match.stream_url ? `
          <div class="stream-embed">
            <iframe src="${match.stream_url}" width="100%" height="300" allowfullscreen></iframe>
          </div>
        ` : ''}

        ${!isCompleted && team1 && team2 ? renderScoreForm(match, team1, team2) : ''}

        ${isCompleted ? `
          <div class="prediction-section">
            <h4>🗳️ Votar MVP</h4>
            <div class="prediction-buttons">
              <button class="prediction-btn" data-player="${team1?.captain_id}">
                ${team1?.name} - Jugador MVP
              </button>
              <button class="prediction-btn" data-player="${team2?.captain_id}">
                ${team2?.name} - Jugador MVP
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // Score form handler
  const form = overlay.querySelector('#updateScoreForm');
  if (form) {
    form.addEventListener('submit', (e) => handleScoreSubmit(e, match, matches));
  }
}

function renderScoreForm(match, team1, team2) {
  return `
    <form id="updateScoreForm" class="update-score-form">
      <h4>Registrar Resultado</h4>
      <div class="score-inputs">
        <div class="score-input-group">
          <label>${team1.name}</label>
          <input type="number" name="score1" min="0" value="0" class="form-control">
        </div>
        <span class="score-separator">-</span>
        <div class="score-input-group">
          <label>${team2.name}</label>
          <input type="number" name="score2" min="0" value="0" class="form-control">
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">
        <i class="fas fa-save"></i> Guardar Resultado
      </button>
    </form>
  `;
}

async function handleScoreSubmit(e, match, matches) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const score1 = parseInt(formData.get('score1'));
  const score2 = parseInt(formData.get('score2'));

  const validation = validateScore(score1, score2, match.best_of || 3);
  if (!validation.valid) {
    showToast('error', 'Error', validation.error);
    return;
  }

  const winnerId = score1 > score2 ? match.home_team_id : match.away_team_id;

  try {
    await API.matches.update(match.id, {
      home_score: score1,
      away_score: score2,
      winner_id: winnerId,
      status: 'COMPLETED'
    });

    // Auto-advance winner if next_match exists
    if (match.next_match_id && match.next_match_slot) {
      const updateData = {};
      if (match.next_match_slot === 'HOME') {
        updateData.home_team_id = winnerId;
      } else {
        updateData.away_team_id = winnerId;
      }
      await API.matches.update(match.next_match_id, updateData);
    }

    showToast('success', '🎉 Éxito', 'Resultado guardado');

    // Celebration for finals
    if (match.is_grand_final) {
      triggerConfetti();
    }

    document.querySelector('.match-details-overlay')?.remove();

    // Reload
    const matchesRes = await API.matches.getAll();
    allMatches = matchesRes.data || [];
    loadTournamentBracket(selectedTournament.id);

  } catch (error) {
    showToast('error', 'Error', error.message);
  }
}

// =====================================================
// BRACKET GENERATION
// =====================================================

async function generateBracketForTournament(tournamentId, teams) {
  if (teams.length < 2) {
    showToast('error', 'Error', 'Se necesitan al menos 2 equipos');
    return;
  }

  try {
    showToast('info', 'Generando...', 'Creando bracket del torneo');

    // Sort by seed if available
    const sortedTeams = [...teams].sort((a, b) => (a.seed || 999) - (b.seed || 999));

    const numRounds = Math.ceil(Math.log2(sortedTeams.length));
    const bracketSize = Math.pow(2, numRounds);

    const matches = [];
    let matchNumber = 1;
    let bracketPosition = 1;

    // First round
    const firstRoundMatches = bracketSize / 2;
    for (let i = 0; i < firstRoundMatches; i++) {
      const team1 = sortedTeams[i] || null;
      const team2 = sortedTeams[bracketSize - 1 - i] || null; // Seeding: 1v8, 2v7, etc.

      if (!team1 && !team2) continue;

      const matchData = {
        tournament_id: tournamentId,
        round: 1,
        match_number: matchNumber++,
        bracket_position: bracketPosition++,
        best_of: 3,
        scheduled_datetime: new Date().toISOString(),
        status: team1 && team2 ? 'SCHEDULED' : 'COMPLETED'
      };

      if (team1) matchData.home_team_id = team1.id;
      if (team2) matchData.away_team_id = team2.id;
      if (!team1 && team2) matchData.winner_id = team2.id;
      if (!team2 && team1) matchData.winner_id = team1.id;

      matches.push(matchData);
    }

    // Create matches
    for (const match of matches) {
      await API.matches.create(match);
    }

    showToast('success', '🎉 Éxito', 'Bracket generado correctamente');

    const matchesRes = await API.matches.getAll();
    allMatches = matchesRes.data || [];
    loadTournamentBracket(tournamentId);

  } catch (error) {
    console.error('Error generating bracket:', error);
    showToast('error', 'Error', error.message);
  }
}

// =====================================================
// SHARE FUNCTIONALITY
// =====================================================

function shareCurrentBracket() {
  const url = window.location.href;
  const text = `🏆 Mira el bracket de ${selectedTournament?.name || 'este torneo'}!`;

  if (navigator.share) {
    navigator.share({ title: selectedTournament?.name, text, url });
  } else {
    navigator.clipboard.writeText(url).then(() => {
      showToast('success', 'Link copiado', 'Comparte el bracket con otros');
    });
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function organizeByRound(matches) {
  const rounds = {};
  matches.forEach(match => {
    const round = match.round || 1;
    if (!rounds[round]) rounds[round] = [];
    rounds[round].push(match);
  });
  Object.keys(rounds).forEach(r => {
    rounds[r].sort((a, b) => a.match_number - b.match_number);
  });
  return rounds;
}

function getRoundName(roundIndex, totalRounds) {
  if (roundIndex === totalRounds - 1) return '🏆 FINAL';
  if (roundIndex === totalRounds - 2) return 'SEMI-FINALS';
  if (roundIndex === totalRounds - 3) return 'QUARTER-FINALS';
  return `ROUND ${roundIndex + 1}`;
}

function getUpperRoundNameDE(round, totalRounds) {
  if (round === totalRounds) return 'UPPER FINAL';
  if (round === totalRounds - 1) return 'UPPER SEMI-FINALS';
  return `UPPER ROUND ${round}`;
}

function getLowerRoundNameDE(round, totalRounds) {
  if (round === totalRounds) return 'LOWER FINAL';
  if (round === totalRounds - 1) return 'LOWER SEMI-FINALS';
  return `LOWER ROUND ${round}`;
}

function getStatusLabel(status) {
  const labels = {
    'SCHEDULED': 'Programado',
    'CHECK_IN': 'Check-in',
    'LIVE': '🔴 En Vivo',
    'COMPLETED': 'Finalizado',
    'DISPUTED': 'Disputado',
    'CANCELLED': 'Cancelado'
  };
  return labels[status] || status;
}

function renderEmptyBracketState(tournamentTeams) {
  return `
    <div class="bracket-empty-state">
      <div class="tournament-info-card">
        <h2><i class="fas fa-trophy"></i> ${selectedTournament.name}</h2>
        <div class="tournament-meta">
          <span><i class="fas fa-gamepad"></i> ${selectedTournament.format}</span>
          <span><i class="fas fa-users"></i> ${tournamentTeams.length} Equipos</span>
        </div>
      </div>
      <div class="generate-bracket-section">
        <i class="fas fa-sitemap"></i>
        <h3>Bracket no generado</h3>
        <p>Este torneo tiene ${tournamentTeams.length} equipos registrados</p>
        <button class="btn btn-primary btn-lg" id="btnGenerateBracket">
          <i class="fas fa-magic"></i> Generar Bracket Automáticamente
        </button>
      </div>
    </div>
  `;
}
