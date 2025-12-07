// =====================================================
// BRACKETS PAGE - Tournament Brackets List & View
// =====================================================

import API from '../api.js';
import { showLoading, showToast, formatDate } from '../ui.js';

let allTournaments = [];
let allTeams = [];
let allMatches = [];
let selectedTournament = null;

export async function renderBrackets(container) {
    showLoading(container);

    try {
        // Fetch all tournaments
        const [tournamentsRes, teamsRes, matchesRes] = await Promise.all([
            API.tournaments.getAll(),
            API.teams.getAll(),
            API.matches.getAll()
        ]);

        allTournaments = tournamentsRes.data || [];
        allTeams = teamsRes.data || [];
        allMatches = matchesRes.data || [];

        // Get tournaments that have teams registered
        const tournamentsWithTeams = allTournaments.filter(t =>
            allTeams.some(team => team.tournament_id === t.id)
        );

        container.innerHTML = `
      <div class="brackets-page">
        <!-- Page Header -->
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

        <!-- Bracket View Container -->
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

      <style>
        ${getBracketsStyles()}
      </style>
    `;

        // Event listeners
        document.getElementById('selectTournament').addEventListener('change', (e) => {
            if (e.target.value) {
                loadTournamentBracket(e.target.value);
            }
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

async function loadTournamentBracket(tournamentId) {
    const container = document.getElementById('bracketViewContainer');
    showLoading(container);

    try {
        selectedTournament = allTournaments.find(t => t.id === tournamentId);
        const tournamentTeams = allTeams.filter(t => t.tournament_id === tournamentId);
        const tournamentMatches = allMatches.filter(m => m.tournament_id === tournamentId);

        if (tournamentMatches.length === 0) {
            container.innerHTML = `
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
            <p>Este torneo tiene ${tournamentTeams.length} equipos registrados pero aún no se ha generado el bracket</p>
            <button class="btn btn-primary btn-lg" id="btnGenerateBracket">
              <i class="fas fa-magic"></i> Generar Bracket Automáticamente
            </button>
          </div>
        </div>
      `;

            document.getElementById('btnGenerateBracket').addEventListener('click', () => {
                generateBracketForTournament(tournamentId, tournamentTeams);
            });
            return;
        }

        // Render the bracket based on format
        if (selectedTournament.format === 'DOUBLE_ELIMINATION') {
            container.innerHTML = renderDoubleEliminationBracket(tournamentTeams, tournamentMatches);
        } else {
            container.innerHTML = renderSingleEliminationBracket(tournamentTeams, tournamentMatches);
        }

        // Add event listeners for match actions
        container.querySelectorAll('.match-box').forEach(box => {
            box.addEventListener('click', (e) => {
                const matchId = box.dataset.matchId;
                if (matchId) {
                    showMatchDetails(matchId, tournamentTeams, tournamentMatches);
                }
            });
        });

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

function renderSingleEliminationBracket(teams, matches) {
    // Organize matches by round
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
        <span class="bracket-format"><i class="fas fa-sitemap"></i> Eliminación Simple</span>
        <span class="bracket-teams"><i class="fas fa-users"></i> ${teams.length} Equipos</span>
      </div>
    </div>
    
    <div class="bracket-title-banner">
      <h1>BRACKET</h1>
    </div>
    
    <div class="bracket-grid single-elimination">
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

function renderDoubleEliminationBracket(teams, matches) {
    // Separate matches by type
    const grandFinal = matches.find(m => m.is_grand_final);
    const bracketReset = matches.find(m => m.is_bracket_reset);

    // Upper bracket: not lower, not grand final, not bracket reset
    const upperBracket = matches.filter(m =>
        !m.is_lower_bracket && !m.is_grand_final && !m.is_bracket_reset
    );

    // Lower bracket
    const lowerBracket = matches.filter(m => m.is_lower_bracket);

    // Organize by rounds
    const upperRounds = {};
    const lowerRounds = {};

    upperBracket.forEach(match => {
        const round = match.round || 1;
        if (!upperRounds[round]) upperRounds[round] = [];
        upperRounds[round].push(match);
    });

    lowerBracket.forEach(match => {
        const round = match.round || 1;
        if (!lowerRounds[round]) lowerRounds[round] = [];
        lowerRounds[round].push(match);
    });

    // Sort matches within rounds by match_number
    Object.keys(upperRounds).forEach(r => {
        upperRounds[r].sort((a, b) => a.match_number - b.match_number);
    });
    Object.keys(lowerRounds).forEach(r => {
        lowerRounds[r].sort((a, b) => a.match_number - b.match_number);
    });

    const upperRoundNums = Object.keys(upperRounds).sort((a, b) => parseInt(a) - parseInt(b));
    const lowerRoundNums = Object.keys(lowerRounds).sort((a, b) => parseInt(a) - parseInt(b));

    return `
    <div class="bracket-tournament-header">
      <h2><i class="fas fa-trophy"></i> ${selectedTournament.name}</h2>
      <div class="bracket-meta">
        <span class="bracket-format"><i class="fas fa-sitemap"></i> Doble Eliminación</span>
        <span class="bracket-teams"><i class="fas fa-users"></i> ${teams.length} Equipos</span>
        <span class="bracket-matches"><i class="fas fa-gamepad"></i> ${matches.length} Partidas</span>
      </div>
    </div>
    
    <div class="bracket-title-banner">
      <h1>BRACKET</h1>
    </div>

    <!-- Upper Bracket -->
    <div class="bracket-section upper-bracket">
      <div class="bracket-section-header">
        <h3><i class="fas fa-chevron-up"></i> UPPER BRACKET</h3>
      </div>
      <div class="bracket-grid">
        ${upperRoundNums.map((roundNum, idx) => `
          <div class="bracket-column" data-round="${roundNum}">
            <div class="round-title">${getUpperRoundNameDE(parseInt(roundNum), upperRoundNums.length)}</div>
            <div class="round-matches">
              ${upperRounds[roundNum].map(match => renderMatchBoxDE(match, teams)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Lower Bracket -->
    <div class="bracket-section lower-bracket">
      <div class="bracket-section-header">
        <h3><i class="fas fa-chevron-down"></i> LOWER BRACKET</h3>
      </div>
      <div class="bracket-grid">
        ${lowerRoundNums.map((roundNum, idx) => `
          <div class="bracket-column" data-round="${roundNum}">
            <div class="round-title">${getLowerRoundNameDE(parseInt(roundNum), lowerRoundNums.length)}</div>
            <div class="round-matches">
              ${lowerRounds[roundNum].map(match => renderMatchBoxDE(match, teams)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Grand Final & Bracket Reset -->
    <div class="bracket-section grand-final">
      <div class="bracket-section-header">
        <h3><i class="fas fa-crown"></i> GRAND FINAL</h3>
      </div>
      <div class="grand-final-container">
        ${grandFinal ? renderMatchBoxDE(grandFinal, teams, true) : `
          <div class="match-box tbd">
            <div class="match-label">GRAND FINAL</div>
            <div class="match-teams-container">
              <div class="match-team tbd"><span class="team-name">Upper Winner</span><span class="team-score">-</span></div>
              <div class="match-team tbd"><span class="team-name">Lower Winner</span><span class="team-score">-</span></div>
            </div>
          </div>
        `}
        ${bracketReset ? `
          <div class="bracket-reset-section">
            <div class="bracket-reset-label">BRACKET RESET (If Necessary)</div>
            ${renderMatchBoxDE(bracketReset, teams, true)}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Helper functions for Double Elimination round names
function getUpperRoundNameDE(round, totalRounds) {
    if (round === 4) return 'UPPER FINAL';
    if (round === 3) return 'UPPER SEMI-FINALS';
    if (round === 2) return 'MATCH 5-6';
    return `MATCH ${round === 1 ? '1-4' : round}`;
}

function getLowerRoundNameDE(round, totalRounds) {
    if (round === 6) return 'LOWER FINAL';
    if (round === 5) return 'LOWER SEMI-FINALS';
    if (round === 4) return 'MATCH 14';
    if (round === 3) return 'MATCH 13';
    if (round === 2) return 'MATCH 11-12';
    return 'MATCH 9-10';
}

function renderMatchBoxDE(match, teams, isGrandFinal = false) {
    const team1 = teams.find(t => t.id === match.home_team_id);
    const team2 = teams.find(t => t.id === match.away_team_id);
    const isCompleted = match.status === 'COMPLETED';
    const winner = match.winner_id;

    const matchLabel = match.is_grand_final ? 'GRAND FINAL' :
        match.is_bracket_reset ? 'BRACKET RESET' :
            `MATCH ${match.match_number}`;

    return `
    <div class="match-box ${isCompleted ? 'completed' : ''} ${isGrandFinal ? 'grand-final-box' : ''}" 
         data-match-id="${match.id}">
      <div class="match-label">${matchLabel}</div>
      <div class="match-teams-container">
        <div class="match-team ${winner === match.home_team_id ? 'winner' : ''} ${!team1 ? 'tbd' : ''}">
          <span class="team-name">${team1?.name || team1?.tag || 'TBD'}</span>
          <span class="team-score">${isCompleted ? (match.home_score ?? 0) : '-'}</span>
        </div>
        <div class="match-team ${winner === match.away_team_id ? 'winner' : ''} ${!team2 ? 'tbd' : ''}">
          <span class="team-name">${team2?.name || team2?.tag || 'TBD'}</span>
          <span class="team-score">${isCompleted ? (match.away_score ?? 0) : '-'}</span>
        </div>
      </div>
    </div>
  `;
}

function renderMatchBox(match, teams, isFinal = false) {
    const team1 = teams.find(t => t.id === match.home_team_id);
    const team2 = teams.find(t => t.id === match.away_team_id);
    const isCompleted = match.status === 'COMPLETED';
    const winner = match.winner_id;

    return `
    <div class="match-box ${isCompleted ? 'completed' : ''} ${isFinal ? 'final-match' : ''}" 
         data-match-id="${match.id}">
      <div class="match-label">MATCH ${match.match_number || match.id.substring(0, 4).toUpperCase()}</div>
      <div class="match-teams-container">
        <div class="match-team ${winner === match.home_team_id ? 'winner' : ''} ${!team1 ? 'tbd' : ''}">
          <span class="team-name">${team1?.name || team1?.tag || 'Por definir'}</span>
          <span class="team-score">${isCompleted ? (match.home_score ?? 0) : '-'}</span>
        </div>
        <div class="match-team ${winner === match.away_team_id ? 'winner' : ''} ${!team2 ? 'tbd' : ''}">
          <span class="team-name">${team2?.name || team2?.tag || 'Por definir'}</span>
          <span class="team-score">${isCompleted ? (match.away_score ?? 0) : '-'}</span>
        </div>
      </div>
    </div>
  `;
}

function renderGrandFinalBox(matches, teams) {
    // Find grand final matches
    const grandFinal = matches.find(m => m.is_grand_final);
    const bracketReset = matches.find(m => m.is_bracket_reset);

    if (!grandFinal) {
        return `
      <div class="match-box grand-final-box tbd">
        <div class="match-label">GRAND FINAL</div>
        <div class="match-teams-container">
          <div class="match-team tbd">
            <span class="team-name">UPPER WINNER</span>
            <span class="team-score">-</span>
          </div>
          <div class="match-team tbd">
            <span class="team-name">LOWER WINNER</span>
            <span class="team-score">-</span>
          </div>
        </div>
      </div>
    `;
    }

    const team1 = teams.find(t => t.id === grandFinal.home_team_id);
    const team2 = teams.find(t => t.id === grandFinal.away_team_id);

    return `
    <div class="match-box grand-final-box ${grandFinal.status === 'COMPLETED' ? 'completed' : ''}" 
         data-match-id="${grandFinal.id}">
      <div class="match-label">GRAND FINAL</div>
      <div class="match-teams-container">
        <div class="match-team ${grandFinal.winner_id === grandFinal.home_team_id ? 'winner' : ''}">
          <span class="team-name">${team1?.name || 'TBD'}</span>
          <span class="team-score">${grandFinal.status === 'COMPLETED' ? (grandFinal.home_score ?? 0) : '-'}</span>
        </div>
        <div class="match-team ${grandFinal.winner_id === grandFinal.away_team_id ? 'winner' : ''}">
          <span class="team-name">${team2?.name || 'TBD'}</span>
          <span class="team-score">${grandFinal.status === 'COMPLETED' ? (grandFinal.away_score ?? 0) : '-'}</span>
        </div>
      </div>
    </div>
    ${bracketReset ? `
      <div class="bracket-reset-info">
        <span>(If Necessary)</span>
      </div>
    ` : ''}
  `;
}

function getRoundName(roundIndex, totalRounds) {
    if (roundIndex === totalRounds - 1) return '🏆 FINAL';
    if (roundIndex === totalRounds - 2) return 'SEMI-FINALS';
    if (roundIndex === totalRounds - 3) return 'QUARTER-FINALS';
    return `ROUND ${roundIndex + 1}`;
}

function getUpperRoundName(roundIndex, totalRounds) {
    if (roundIndex === totalRounds - 1) return 'UPPER FINAL';
    if (roundIndex === totalRounds - 2) return 'UPPER SEMI-FINALS';
    return `MATCH ${roundIndex + 1}`;
}

function getLowerRoundName(roundIndex, totalRounds) {
    if (roundIndex === totalRounds - 1) return 'LOWER FINAL';
    if (roundIndex === totalRounds - 2) return 'LOWER SEMI-FINALS';
    return `MATCH ${roundIndex + 1}`;
}

async function generateBracketForTournament(tournamentId, teams) {
    if (teams.length < 2) {
        showToast('error', 'Error', 'Se necesitan al menos 2 equipos');
        return;
    }

    try {
        showToast('info', 'Generando...', 'Creando bracket del torneo');

        // Shuffle teams
        const shuffled = [...teams].sort(() => Math.random() - 0.5);

        // Calculate rounds
        const numRounds = Math.ceil(Math.log2(shuffled.length));
        const bracketSize = Math.pow(2, numRounds);

        const matches = [];
        let matchNumber = 1;
        let bracketPosition = 1;

        // First round
        const firstRoundMatches = bracketSize / 2;
        for (let i = 0; i < firstRoundMatches; i++) {
            const team1 = shuffled[i * 2] || null;
            const team2 = shuffled[i * 2 + 1] || null;

            if (!team1 && !team2) continue;

            // Build match object without null values
            const matchData = {
                tournament_id: tournamentId,
                round: 1,
                match_number: matchNumber++,
                bracket_position: bracketPosition++,
                best_of: 3,
                scheduled_datetime: new Date().toISOString(),
                status: team1 && team2 ? 'SCHEDULED' : 'COMPLETED'
            };

            // Only add team IDs if they exist
            if (team1) matchData.home_team_id = team1.id;
            if (team2) matchData.away_team_id = team2.id;

            // Handle bye (one team advances automatically)
            if (!team1 && team2) matchData.winner_id = team2.id;
            if (!team2 && team1) matchData.winner_id = team1.id;

            matches.push(matchData);
        }

        // Subsequent rounds (placeholder matches - teams TBD)
        let prevRoundMatches = firstRoundMatches;
        for (let round = 2; round <= numRounds; round++) {
            const roundMatches = prevRoundMatches / 2;
            for (let i = 0; i < roundMatches; i++) {
                // For subsequent rounds, don't include team IDs (they're determined by winners)
                matches.push({
                    tournament_id: tournamentId,
                    round: round,
                    match_number: matchNumber++,
                    bracket_position: bracketPosition++,
                    best_of: round === numRounds ? 5 : 3, // Final is best of 5
                    scheduled_datetime: new Date().toISOString(),
                    status: 'SCHEDULED'
                });
            }
            prevRoundMatches = roundMatches;
        }

        // Create matches
        for (const match of matches) {
            await API.matches.create(match);
        }

        showToast('success', 'Éxito', 'Bracket generado correctamente');

        // Reload
        const matchesRes = await API.matches.getAll();
        allMatches = matchesRes.data || [];
        loadTournamentBracket(tournamentId);

    } catch (error) {
        console.error('Error generating bracket:', error);
        showToast('error', 'Error', error.message);
    }
}

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
        <h3>Match #${match.match_number || match.id.substring(0, 4)}</h3>
        <button class="close-btn" onclick="this.closest('.match-details-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="match-details-body">
        <div class="match-versus">
          <div class="versus-team ${match.winner_id === match.home_team_id ? 'winner' : ''}">
            <div class="team-avatar"><i class="fas fa-shield-alt"></i></div>
            <h4>${team1?.name || 'Por definir'}</h4>
            ${team1?.tag ? `<span class="team-tag">${team1.tag}</span>` : ''}
          </div>
          <div class="versus-scores">
            <span class="score">${isCompleted ? (match.home_score ?? 0) : '-'}</span>
            <span class="vs-text">VS</span>
            <span class="score">${isCompleted ? (match.away_score ?? 0) : '-'}</span>
          </div>
          <div class="versus-team ${match.winner_id === match.away_team_id ? 'winner' : ''}">
            <div class="team-avatar"><i class="fas fa-shield-alt"></i></div>
            <h4>${team2?.name || 'Por definir'}</h4>
            ${team2?.tag ? `<span class="team-tag">${team2.tag}</span>` : ''}
          </div>
        </div>
        <div class="match-status-info">
          <span class="status-badge ${match.status?.toLowerCase()}">${getStatusLabel(match.status)}</span>
        </div>
        ${!isCompleted && team1 && team2 ? `
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
        ` : ''}
      </div>
    </div>
  `;

    document.body.appendChild(overlay);

    // Handle score form
    const form = overlay.querySelector('#updateScoreForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const score1 = parseInt(formData.get('score1'));
            const score2 = parseInt(formData.get('score2'));

            if (score1 === score2) {
                showToast('error', 'Error', 'No puede haber empate');
                return;
            }

            try {
                await API.matches.update(matchId, {
                    home_score: score1,
                    away_score: score2,
                    winner_id: score1 > score2 ? match.home_team_id : match.away_team_id,
                    status: 'COMPLETED'
                });

                showToast('success', 'Éxito', 'Resultado guardado');
                overlay.remove();

                // Reload
                const matchesRes = await API.matches.getAll();
                allMatches = matchesRes.data || [];
                loadTournamentBracket(selectedTournament.id);

            } catch (error) {
                showToast('error', 'Error', error.message);
            }
        });
    }

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

function getStatusLabel(status) {
    const labels = {
        'PENDING': 'Pendiente',
        'SCHEDULED': 'Programado',
        'IN_PROGRESS': 'En Curso',
        'COMPLETED': 'Finalizado',
        'CANCELLED': 'Cancelado'
    };
    return labels[status] || status;
}

function getBracketsStyles() {
    return `
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

    .bracket-view-container {
      min-height: 500px;
    }

    /* Tournament Header */
    .bracket-tournament-header {
      background: var(--bg-card);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      padding: 24px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bracket-tournament-header h2 {
      font-size: 22px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .bracket-tournament-header h2 i {
      color: #ffd700;
    }

    .bracket-meta {
      display: flex;
      gap: 20px;
    }

    .bracket-meta span {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-secondary);
      font-size: 14px;
    }

    /* Title Banner */
    .bracket-title-banner {
      background: linear-gradient(135deg, #1a365d, #2a4a7f);
      padding: 20px 40px;
      border-radius: var(--border-radius);
      margin-bottom: 30px;
      text-align: right;
      position: relative;
      overflow: hidden;
    }

    .bracket-title-banner::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        135deg,
        transparent,
        transparent 20px,
        rgba(255,255,255,0.03) 20px,
        rgba(255,255,255,0.03) 40px
      );
    }

    .bracket-title-banner h1 {
      font-family: 'Orbitron', sans-serif;
      font-size: 48px;
      font-weight: 900;
      color: white;
      text-shadow: 0 4px 20px rgba(0,0,0,0.5);
      margin: 0;
      letter-spacing: 8px;
    }

    /* Bracket Sections */
    .bracket-section {
      margin-bottom: 40px;
    }

    .bracket-section-header {
      margin-bottom: 20px;
    }

    .bracket-section-header h3 {
      font-family: 'Orbitron', sans-serif;
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      border-radius: var(--border-radius-sm);
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
    }

    .grand-final-container .match-box {
      min-width: 280px;
    }

    .bracket-reset-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      opacity: 0.7;
    }

    .bracket-reset-label {
      font-family: 'Orbitron', sans-serif;
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .grand-final-box {
      border-width: 3px !important;
      border-color: #8a2be2 !important;
      background: linear-gradient(135deg, rgba(138, 43, 226, 0.15), var(--bg-card)) !important;
    }

    /* Bracket Grid */
    .bracket-grid {
      display: flex;
      gap: 20px;
      overflow-x: auto;
      padding: 20px 0;
    }

    .bracket-column {
      min-width: 200px;
      display: flex;
      flex-direction: column;
    }

    .round-title {
      font-family: 'Orbitron', sans-serif;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-secondary);
      margin-bottom: 15px;
      text-align: center;
    }

    .round-matches {
      display: flex;
      flex-direction: column;
      gap: 15px;
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
    }

    .match-box:hover {
      border-color: var(--primary);
      transform: translateX(5px);
      box-shadow: 0 0 20px var(--primary-glow);
    }

    .match-box.completed {
      border-color: var(--success);
    }

    .match-box.final-match {
      border-width: 3px;
      border-color: #ffd700;
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), var(--bg-card));
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

    .match-team.tbd .team-name {
      font-style: italic;
    }

    .team-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      max-width: 140px;
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

    /* Grand Final */
    .grand-final-matches {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .grand-final-box {
      min-width: 280px;
      border-width: 3px;
      border-color: #8a2be2;
      background: linear-gradient(135deg, rgba(138, 43, 226, 0.1), var(--bg-card));
    }

    .bracket-reset-info {
      font-size: 12px;
      color: var(--text-muted);
      font-style: italic;
    }

    /* Empty States */
    .bracket-empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .tournament-info-card {
      background: var(--bg-card);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      padding: 30px;
      margin-bottom: 40px;
      display: inline-block;
    }

    .tournament-info-card h2 {
      font-size: 24px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .tournament-info-card h2 i {
      color: #ffd700;
    }

    .tournament-meta {
      display: flex;
      gap: 20px;
      justify-content: center;
    }

    .tournament-meta span {
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .generate-bracket-section {
      padding: 40px;
    }

    .generate-bracket-section i {
      font-size: 64px;
      color: var(--text-muted);
      margin-bottom: 20px;
    }

    .generate-bracket-section h3 {
      font-size: 20px;
      margin-bottom: 10px;
    }

    .generate-bracket-section p {
      color: var(--text-secondary);
      margin-bottom: 30px;
    }

    /* Match Details Modal */
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
      max-width: 500px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.2s ease;
    }

    .match-details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-tertiary);
    }

    .match-details-header h3 {
      font-family: 'Orbitron', sans-serif;
      font-size: 18px;
      margin: 0;
    }

    .match-details-header .close-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 20px;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .match-details-header .close-btn:hover {
      color: var(--danger);
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
      color: var(--success);
    }

    .team-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      border: 3px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: var(--primary);
      margin: 0 auto 10px;
    }

    .versus-team h4 {
      font-size: 16px;
      margin-bottom: 5px;
    }

    .team-tag {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .versus-scores {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
    }

    .versus-scores .score {
      font-family: 'Orbitron', sans-serif;
      font-size: 32px;
      font-weight: 900;
      color: var(--primary);
    }

    .versus-scores .vs-text {
      font-size: 14px;
      color: var(--text-muted);
    }

    .match-status-info {
      text-align: center;
      margin-bottom: 30px;
    }

    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.pending {
      background: rgba(255, 184, 0, 0.2);
      color: var(--warning);
    }

    .status-badge.completed {
      background: rgba(0, 255, 136, 0.2);
      color: var(--success);
    }

    .status-badge.in_progress {
      background: rgba(0, 212, 255, 0.2);
      color: var(--info);
    }

    /* Score Form */
    .update-score-form {
      border-top: 1px solid var(--border-color);
      padding-top: 20px;
    }

    .update-score-form h4 {
      font-size: 14px;
      margin-bottom: 15px;
      text-align: center;
    }

    .score-inputs {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }

    .score-input-group {
      flex: 1;
      text-align: center;
    }

    .score-input-group label {
      display: block;
      font-size: 13px;
      margin-bottom: 8px;
      color: var(--text-secondary);
    }

    .score-input-group input {
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      padding: 15px;
    }

    .score-separator {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .btn-block {
      width: 100%;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .brackets-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .bracket-title-banner h1 {
        font-size: 32px;
        letter-spacing: 4px;
      }

      .match-versus {
        flex-direction: column;
      }
    }
  `;
}
