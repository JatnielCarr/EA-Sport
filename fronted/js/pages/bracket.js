// =====================================================
// BRACKET PAGE - Tournament Bracket Visualization
// =====================================================

import API from '../api.js';
import { showLoading, showToast, formatDate } from '../ui.js';

let currentTournament = null;
let tournamentMatches = [];
let tournamentTeams = [];

export async function renderBracket(container, tournamentId) {
  showLoading(container);

  try {
    // Load tournament data, matches and teams
    const [tournamentRes, matchesRes, teamsRes] = await Promise.all([
      API.tournaments.getById(tournamentId),
      API.matches.getAll({ tournament_id: tournamentId }),
      API.teams.getAll(tournamentId)
    ]);

    currentTournament = tournamentRes.data;
    tournamentMatches = matchesRes.data || [];
    tournamentTeams = teamsRes.data || [];

    // Show sidebar and header
    document.querySelector('.sidebar')?.classList.remove('hidden');
    document.querySelector('.header')?.classList.remove('hidden');
    document.querySelector('.main-content')?.classList.remove('login-page');

    container.innerHTML = `
      <div class="bracket-page">
        <div class="bracket-header">
          <div class="bracket-info">
            <a href="#/tournaments" class="btn btn-secondary btn-sm">
              <i class="fas fa-arrow-left"></i> Volver
            </a>
            <div class="tournament-title">
              <h1><i class="fas fa-trophy"></i> ${currentTournament.name}</h1>
              <p class="text-muted">${getFormatName(currentTournament.format)} • ${tournamentTeams.length} equipos</p>
            </div>
          </div>
          <div class="bracket-actions">
            <button class="btn btn-primary" id="btnGenerateBracket">
              <i class="fas fa-random"></i> Generar Bracket
            </button>
          </div>
        </div>

        <div class="bracket-container" id="bracketContainer">
          ${renderBracketView()}
        </div>
      </div>
    `;

    // Add bracket styles
    addBracketStyles();

    // Event listeners
    document.getElementById('btnGenerateBracket')?.addEventListener('click', generateBracket);
    document.getElementById('bracketContainer')?.addEventListener('click', handleBracketActions);

  } catch (error) {
    console.error('Error loading bracket:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar el bracket</h3>
        <p>${error.message}</p>
        <a href="#/tournaments" class="btn btn-primary">
          <i class="fas fa-arrow-left"></i> Volver a Torneos
        </a>
      </div>
    `;
  }
}

function getFormatName(format) {
  const formats = {
    'SINGLE_ELIMINATION': 'Eliminación Simple',
    'DOUBLE_ELIMINATION': 'Doble Eliminación',
    'ROUND_ROBIN': 'Round Robin',
    'SWISS': 'Sistema Suizo'
  };
  return formats[format] || format;
}

function renderBracketView() {
  if (tournamentTeams.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <h3>No hay equipos registrados</h3>
        <p>Añade equipos al torneo para generar el bracket</p>
        <a href="#/teams" class="btn btn-primary">
          <i class="fas fa-plus"></i> Gestionar Equipos
        </a>
      </div>
    `;
  }

  if (tournamentMatches.length === 0) {
    return `
      <div class="empty-state">
        <i class="fas fa-sitemap"></i>
        <h3>Bracket no generado</h3>
        <p>Haz clic en "Generar Bracket" para crear los enfrentamientos</p>
      </div>
    `;
  }

  // Organize matches by rounds
  const rounds = organizeMatchesByRound(tournamentMatches);
  
  return `
    <div class="bracket-wrapper">
      ${rounds.map((round, index) => `
        <div class="bracket-round" data-round="${index + 1}">
          <div class="round-header">
            <h3>${getRoundName(index, rounds.length)}</h3>
          </div>
          <div class="round-matches">
            ${round.map(match => renderMatchCard(match)).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function organizeMatchesByRound(matches) {
  // Group matches by round number
  const roundsMap = {};
  
  matches.forEach(match => {
    const round = match.round || 1;
    if (!roundsMap[round]) {
      roundsMap[round] = [];
    }
    roundsMap[round].push(match);
  });

  // Convert to array and sort by round
  const rounds = Object.keys(roundsMap)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(round => roundsMap[round]);

  return rounds;
}

function getRoundName(roundIndex, totalRounds) {
  if (roundIndex === totalRounds - 1) return '🏆 Final';
  if (roundIndex === totalRounds - 2) return 'Semifinales';
  if (roundIndex === totalRounds - 3) return 'Cuartos de Final';
  return `Ronda ${roundIndex + 1}`;
}

function renderMatchCard(match) {
  const team1 = tournamentTeams.find(t => t.id === match.team1_id);
  const team2 = tournamentTeams.find(t => t.id === match.team2_id);
  
  const isCompleted = match.status === 'COMPLETED';
  const winner = match.winner_id;
  
  return `
    <div class="match-card ${isCompleted ? 'completed' : ''}" data-match-id="${match.id}">
      <div class="match-number">Match #${match.match_number || match.id.substring(0, 4)}</div>
      
      <div class="match-teams">
        <div class="team-slot ${winner === match.team1_id ? 'winner' : ''} ${!team1 ? 'tbd' : ''}">
          <div class="team-info">
            <span class="team-logo">
              ${team1 ? `<i class="fas fa-shield-alt"></i>` : `<i class="fas fa-question"></i>`}
            </span>
            <span class="team-name">${team1?.name || 'Por definir'}</span>
          </div>
          <span class="team-score">${isCompleted && match.score_team1 !== null ? match.score_team1 : '-'}</span>
        </div>
        
        <div class="vs-divider">
          <span>VS</span>
        </div>
        
        <div class="team-slot ${winner === match.team2_id ? 'winner' : ''} ${!team2 ? 'tbd' : ''}">
          <div class="team-info">
            <span class="team-logo">
              ${team2 ? `<i class="fas fa-shield-alt"></i>` : `<i class="fas fa-question"></i>`}
            </span>
            <span class="team-name">${team2?.name || 'Por definir'}</span>
          </div>
          <span class="team-score">${isCompleted && match.score_team2 !== null ? match.score_team2 : '-'}</span>
        </div>
      </div>
      
      <div class="match-footer">
        <span class="match-status ${match.status?.toLowerCase()}">${getStatusLabel(match.status)}</span>
        ${match.scheduled_time ? `<span class="match-time"><i class="fas fa-clock"></i> ${formatMatchDate(match.scheduled_time)}</span>` : ''}
      </div>
      
      ${!isCompleted ? `
        <button class="btn btn-sm btn-primary match-result-btn" data-action="result" data-match-id="${match.id}">
          <i class="fas fa-edit"></i> Registrar Resultado
        </button>
      ` : ''}
    </div>
  `;
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

function formatMatchDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function generateBracket() {
  if (tournamentTeams.length < 2) {
    showToast('error', 'Error', 'Se necesitan al menos 2 equipos para generar el bracket');
    return;
  }

  try {
    // Shuffle teams randomly
    const shuffledTeams = [...tournamentTeams].sort(() => Math.random() - 0.5);
    
    // Calculate number of rounds needed
    const numTeams = shuffledTeams.length;
    const numRounds = Math.ceil(Math.log2(numTeams));
    const bracketSize = Math.pow(2, numRounds);
    
    // Create matches for the bracket
    const matches = [];
    let matchNumber = 1;
    
    // First round - pair teams
    const firstRoundMatches = bracketSize / 2;
    for (let i = 0; i < firstRoundMatches; i++) {
      const team1 = shuffledTeams[i * 2] || null;
      const team2 = shuffledTeams[i * 2 + 1] || null;
      
      // Skip if both teams are null (bye)
      if (!team1 && !team2) continue;
      
      const matchData = {
        tournament_id: currentTournament.id,
        round: 1,
        match_number: matchNumber++,
        team1_id: team1?.id || null,
        team2_id: team2?.id || null,
        status: team1 && team2 ? 'PENDING' : 'COMPLETED',
        // If one team has a bye, they automatically win
        winner_id: (!team1 && team2) ? team2.id : ((!team2 && team1) ? team1.id : null)
      };
      
      matches.push(matchData);
    }
    
    // Create placeholder matches for subsequent rounds
    let prevRoundMatches = firstRoundMatches;
    for (let round = 2; round <= numRounds; round++) {
      const roundMatches = prevRoundMatches / 2;
      for (let i = 0; i < roundMatches; i++) {
        matches.push({
          tournament_id: currentTournament.id,
          round: round,
          match_number: matchNumber++,
          team1_id: null,
          team2_id: null,
          status: 'PENDING'
        });
      }
      prevRoundMatches = roundMatches;
    }
    
    // Create matches in the backend
    for (const match of matches) {
      await API.matches.create(match);
    }
    
    showToast('success', 'Éxito', 'Bracket generado correctamente');
    
    // Reload matches
    const matchesRes = await API.matches.getAll({ tournament_id: currentTournament.id });
    tournamentMatches = matchesRes.data || [];
    
    document.getElementById('bracketContainer').innerHTML = renderBracketView();
    
  } catch (error) {
    console.error('Error generating bracket:', error);
    showToast('error', 'Error', error.message);
  }
}

function handleBracketActions(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const matchId = btn.dataset.matchId;

  if (action === 'result') {
    showResultModal(matchId);
  }
}

function showResultModal(matchId) {
  const match = tournamentMatches.find(m => m.id === matchId);
  if (!match) return;

  const team1 = tournamentTeams.find(t => t.id === match.team1_id);
  const team2 = tournamentTeams.find(t => t.id === match.team2_id);

  const modal = document.createElement('div');
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal active">
      <div class="modal-header">
        <h3>Registrar Resultado</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="resultForm">
          <div class="result-teams">
            <div class="result-team">
              <label>${team1?.name || 'Equipo 1'}</label>
              <input type="number" name="score1" class="form-control" min="0" value="0" required>
            </div>
            <div class="result-vs">VS</div>
            <div class="result-team">
              <label>${team2?.name || 'Equipo 2'}</label>
              <input type="number" name="score2" class="form-control" min="0" value="0" required>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> Guardar Resultado
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#resultForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const score1 = parseInt(formData.get('score1'));
    const score2 = parseInt(formData.get('score2'));

    if (score1 === score2) {
      showToast('error', 'Error', 'No puede haber empate en eliminación directa');
      return;
    }

    try {
      const winnerId = score1 > score2 ? match.team1_id : match.team2_id;
      
      await API.matches.update(matchId, {
        score_team1: score1,
        score_team2: score2,
        winner_id: winnerId,
        status: 'COMPLETED'
      });

      // Update next round match with the winner
      await updateNextRoundMatch(match, winnerId);

      showToast('success', 'Éxito', 'Resultado registrado');
      modal.remove();

      // Reload matches
      const matchesRes = await API.matches.getAll({ tournament_id: currentTournament.id });
      tournamentMatches = matchesRes.data || [];
      document.getElementById('bracketContainer').innerHTML = renderBracketView();

    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  });
}

async function updateNextRoundMatch(currentMatch, winnerId) {
  // Find the next round match
  const nextRound = currentMatch.round + 1;
  const nextRoundMatches = tournamentMatches.filter(m => m.round === nextRound);
  
  if (nextRoundMatches.length === 0) return; // This was the final
  
  // Determine which match in the next round this winner goes to
  const currentRoundMatches = tournamentMatches
    .filter(m => m.round === currentMatch.round)
    .sort((a, b) => a.match_number - b.match_number);
  
  const matchIndex = currentRoundMatches.findIndex(m => m.id === currentMatch.id);
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const isFirstTeam = matchIndex % 2 === 0;
  
  const nextMatch = nextRoundMatches[nextMatchIndex];
  if (!nextMatch) return;
  
  // Update the next match with the winner
  const updateData = isFirstTeam 
    ? { team1_id: winnerId }
    : { team2_id: winnerId };
  
  await API.matches.update(nextMatch.id, updateData);
}

function addBracketStyles() {
  if (document.getElementById('bracket-styles')) return;

  const styles = document.createElement('style');
  styles.id = 'bracket-styles';
  styles.textContent = `
    .bracket-page {
      padding: 20px;
    }

    .bracket-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: var(--bg-card);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
    }

    .bracket-info {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .tournament-title h1 {
      font-size: 1.8rem;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .tournament-title h1 i {
      color: var(--primary);
    }

    .bracket-container {
      overflow-x: auto;
      padding: 20px;
    }

    .bracket-wrapper {
      display: flex;
      gap: 40px;
      min-width: fit-content;
      padding: 20px;
    }

    .bracket-round {
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-width: 280px;
    }

    .round-header {
      text-align: center;
      padding: 10px 20px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: var(--border-radius-sm);
      margin-bottom: 10px;
    }

    .round-header h3 {
      margin: 0;
      font-size: 1rem;
      color: var(--bg-primary);
    }

    .round-matches {
      display: flex;
      flex-direction: column;
      gap: 20px;
      justify-content: space-around;
      flex: 1;
    }

    .match-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 15px;
      position: relative;
      transition: var(--transition);
    }

    .match-card:hover {
      border-color: var(--primary);
      box-shadow: 0 0 20px var(--primary-glow);
    }

    .match-card.completed {
      border-color: var(--success);
    }

    .match-number {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .match-teams {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .team-slot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
      background: var(--bg-tertiary);
      border-radius: var(--border-radius-sm);
      border: 2px solid transparent;
      transition: var(--transition);
    }

    .team-slot.winner {
      border-color: var(--success);
      background: rgba(0, 255, 136, 0.1);
    }

    .team-slot.tbd {
      opacity: 0.5;
      font-style: italic;
    }

    .team-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .team-logo {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      border-radius: 50%;
      color: var(--primary);
    }

    .team-name {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .team-score {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--primary);
      min-width: 30px;
      text-align: center;
    }

    .vs-divider {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.8rem;
      padding: 5px 0;
    }

    .match-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--border-color);
    }

    .match-status {
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .match-status.pending {
      background: rgba(255, 184, 0, 0.2);
      color: var(--warning);
    }

    .match-status.in_progress {
      background: rgba(0, 212, 255, 0.2);
      color: var(--info);
    }

    .match-status.completed {
      background: rgba(0, 255, 136, 0.2);
      color: var(--success);
    }

    .match-time {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .match-result-btn {
      width: 100%;
      margin-top: 10px;
    }

    /* Result Modal */
    .result-teams {
      display: flex;
      align-items: center;
      gap: 20px;
      margin: 20px 0;
    }

    .result-team {
      flex: 1;
      text-align: center;
    }

    .result-team label {
      display: block;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .result-team input {
      text-align: center;
      font-size: 2rem;
      font-weight: 700;
      padding: 15px;
    }

    .result-vs {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    /* Bracket Lines (connectors) */
    .bracket-round:not(:last-child) .match-card::after {
      content: '';
      position: absolute;
      right: -20px;
      top: 50%;
      width: 20px;
      height: 2px;
      background: var(--border-color);
    }

    /* Empty State */
    .bracket-container .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .bracket-container .empty-state i {
      font-size: 4rem;
      color: var(--text-muted);
      margin-bottom: 20px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .bracket-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      .bracket-info {
        flex-direction: column;
      }

      .tournament-title h1 {
        font-size: 1.4rem;
      }
    }
  `;

  document.head.appendChild(styles);
}

export default { renderBracket };
