// =====================================================
// PREDICTIONS MODULE - Bracket Predictions System
// =====================================================

import API from './api.js';
import { showToast } from './ui.js';

let userPredictions = [];

// Get user's predictions for a tournament
export async function getUserPredictions(tournamentId) {
    try {
        // This would need a backend endpoint
        // For now, using localStorage as fallback
        const stored = localStorage.getItem(`predictions_${tournamentId}`);
        userPredictions = stored ? JSON.parse(stored) : [];
        return userPredictions;
    } catch (error) {
        console.error('Error loading predictions:', error);
        return [];
    }
}

// Save a prediction
export async function savePrediction(matchId, predictedWinnerId, homeScore, awayScore) {
    try {
        const prediction = {
            id: `pred_${Date.now()}`,
            match_id: matchId,
            predicted_winner_id: predictedWinnerId,
            predicted_home_score: homeScore,
            predicted_away_score: awayScore,
            created_at: new Date().toISOString()
        };

        // Save to localStorage (would be API in production)
        const tournamentId = getCurrentTournamentId();
        const stored = localStorage.getItem(`predictions_${tournamentId}`);
        const predictions = stored ? JSON.parse(stored) : [];

        // Remove existing prediction for this match
        const filtered = predictions.filter(p => p.match_id !== matchId);
        filtered.push(prediction);

        localStorage.setItem(`predictions_${tournamentId}`, JSON.stringify(filtered));
        userPredictions = filtered;

        showToast('success', '🎯 Predicción guardada', 'Buena suerte!');
        return prediction;
    } catch (error) {
        showToast('error', 'Error', error.message);
        throw error;
    }
}

// Calculate prediction points
export function calculatePredictionPoints(predictions, matches) {
    let totalPoints = 0;

    predictions.forEach(pred => {
        const match = matches.find(m => m.id === pred.match_id);
        if (!match || match.status !== 'COMPLETED') return;

        // Correct winner: +10 points
        if (match.winner_id === pred.predicted_winner_id) {
            totalPoints += 10;

            // Exact score bonus: +5 points
            if (match.home_score === pred.predicted_home_score &&
                match.away_score === pred.predicted_away_score) {
                totalPoints += 5;
            }
        }
    });

    return totalPoints;
}

// Get predictions leaderboard
export function getLeaderboard(allPredictions, matches) {
    const userScores = {};

    allPredictions.forEach(pred => {
        if (!userScores[pred.user_id]) {
            userScores[pred.user_id] = { points: 0, correct: 0, total: 0 };
        }
        userScores[pred.user_id].total++;

        const match = matches.find(m => m.id === pred.match_id);
        if (match?.status === 'COMPLETED' && match.winner_id === pred.predicted_winner_id) {
            userScores[pred.user_id].correct++;
            userScores[pred.user_id].points += 10;

            if (match.home_score === pred.predicted_home_score &&
                match.away_score === pred.predicted_away_score) {
                userScores[pred.user_id].points += 5;
            }
        }
    });

    return Object.entries(userScores)
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.points - a.points);
}

// Render predictions UI for a match
export function renderPredictionUI(match, teams, existingPrediction) {
    const team1 = teams.find(t => t.id === match.home_team_id);
    const team2 = teams.find(t => t.id === match.away_team_id);

    if (!team1 || !team2 || match.status === 'COMPLETED') {
        return '';
    }

    return `
    <div class="prediction-section">
      <h4>🎯 Haz tu predicción</h4>
      <div class="prediction-buttons">
        <button class="prediction-btn ${existingPrediction?.predicted_winner_id === team1.id ? 'selected' : ''}" 
                data-team-id="${team1.id}" data-match-id="${match.id}">
          <div class="prediction-team-name">${team1.name}</div>
          <div class="prediction-team-tag">${team1.tag}</div>
        </button>
        <button class="prediction-btn ${existingPrediction?.predicted_winner_id === team2.id ? 'selected' : ''}" 
                data-team-id="${team2.id}" data-match-id="${match.id}">
          <div class="prediction-team-name">${team2.name}</div>
          <div class="prediction-team-tag">${team2.tag}</div>
        </button>
      </div>
      ${existingPrediction ? `
        <p class="prediction-status">
          <i class="fas fa-check-circle"></i> Ya has predicho: <strong>${existingPrediction.predicted_winner_id === team1.id ? team1.name : team2.name
            }</strong>
        </p>
      ` : ''}
    </div>
  `;
}

// Render predictions leaderboard
export function renderLeaderboard(leaderboard, users) {
    return `
    <div class="predictions-leaderboard">
      <h3><i class="fas fa-trophy"></i> Leaderboard de Predicciones</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Usuario</th>
            <th>Puntos</th>
            <th>Aciertos</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          ${leaderboard.slice(0, 10).map((entry, idx) => {
        const user = users.find(u => u.id === entry.userId);
        const accuracy = entry.total > 0 ? ((entry.correct / entry.total) * 100).toFixed(0) : 0;
        return `
              <tr>
                <td>${idx + 1}</td>
                <td>${user?.username || 'Usuario'}</td>
                <td><strong>${entry.points}</strong></td>
                <td>${entry.correct}/${entry.total}</td>
                <td>${accuracy}%</td>
              </tr>
            `;
    }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getCurrentTournamentId() {
    // Get from URL or global state
    const select = document.getElementById('selectTournament');
    return select?.value || null;
}
