// =====================================================
// Ranking Page
// =====================================================

import API from '../api.js';
import { showLoading } from '../app.js';

export async function renderRanking(container) {
    showLoading(container);

    try {
        const [teamsRes, tournamentsRes] = await Promise.all([
            API.teams.getAll(),
            API.tournaments.getAll()
        ]);

        const teams = teamsRes.data || [];
        const tournaments = tournamentsRes.data || [];

        // Create fake ranking data based on teams
        const rankings = teams.map((team, idx) => ({
            ...team,
            rank: idx + 1,
            wins: Math.floor(Math.random() * 20) + 5,
            losses: Math.floor(Math.random() * 10),
            points: Math.floor(Math.random() * 5000) + 1000,
            tournamentWins: Math.floor(Math.random() * 5)
        })).sort((a, b) => b.points - a.points);

        container.innerHTML = `
      <div class="container section">
        <div class="page-header">
          <h1 class="page-title">
            <i class="fas fa-medal"></i>
            Ranking Global
          </h1>
          <p class="page-subtitle">Los mejores equipos de la plataforma</p>
        </div>
        
        <!-- Top 3 Podium -->
        <div class="podium">
          ${rankings.length >= 3 ? `
            <div class="podium-item second">
              <div class="podium-rank">2</div>
              <div class="podium-avatar">
                <i class="fas fa-shield-halved"></i>
              </div>
              <h3 class="podium-name">${rankings[1]?.name || 'N/A'}</h3>
              <div class="podium-points">${rankings[1]?.points || 0} pts</div>
              <div class="podium-base"></div>
            </div>
            
            <div class="podium-item first">
              <div class="podium-crown"><i class="fas fa-crown"></i></div>
              <div class="podium-rank">1</div>
              <div class="podium-avatar">
                <i class="fas fa-shield-halved"></i>
              </div>
              <h3 class="podium-name">${rankings[0]?.name || 'N/A'}</h3>
              <div class="podium-points">${rankings[0]?.points || 0} pts</div>
              <div class="podium-base"></div>
            </div>
            
            <div class="podium-item third">
              <div class="podium-rank">3</div>
              <div class="podium-avatar">
                <i class="fas fa-shield-halved"></i>
              </div>
              <h3 class="podium-name">${rankings[2]?.name || 'N/A'}</h3>
              <div class="podium-points">${rankings[2]?.points || 0} pts</div>
              <div class="podium-base"></div>
            </div>
          ` : ''}
        </div>
        
        <!-- Rankings Table -->
        <div class="rankings-table-container">
          <table class="rankings-table">
            <thead>
              <tr>
                <th>Posición</th>
                <th>Equipo</th>
                <th>Victorias</th>
                <th>Derrotas</th>
                <th>Torneos Ganados</th>
                <th>Puntos</th>
              </tr>
            </thead>
            <tbody>
              ${rankings.map((team, idx) => `
                <tr class="${idx < 3 ? 'top-' + (idx + 1) : ''}">
                  <td class="rank-cell">
                    ${idx < 3 ? `<span class="rank-medal rank-${idx + 1}">${idx + 1}</span>` : `<span class="rank-number">${idx + 1}</span>`}
                  </td>
                  <td class="team-cell">
                    <div class="team-info">
                      <div class="team-avatar-small">
                        <i class="fas fa-shield-halved"></i>
                      </div>
                      <span>${team.name}</span>
                    </div>
                  </td>
                  <td class="wins-cell">${team.wins}</td>
                  <td class="losses-cell">${team.losses}</td>
                  <td class="trophies-cell">
                    <i class="fas fa-trophy"></i> ${team.tournamentWins}
                  </td>
                  <td class="points-cell">${team.points.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <style>
        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .page-title {
          font-family: var(--font-display);
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        
        .page-title i {
          color: var(--warning);
        }
        
        .page-subtitle {
          font-size: 16px;
          color: var(--text-secondary);
        }
        
        /* Podium */
        .podium {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 48px;
        }
        
        .podium-item {
          text-align: center;
          position: relative;
        }
        
        .podium-crown {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 24px;
          color: #ffd700;
          animation: float 2s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-5px); }
        }
        
        .podium-rank {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 18px;
          margin: 0 auto 12px;
        }
        
        .podium-item.first .podium-rank {
          background: linear-gradient(135deg, #ffd700, #ffb800);
          color: #000;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        }
        
        .podium-item.second .podium-rank {
          background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
          color: #000;
        }
        
        .podium-item.third .podium-rank {
          background: linear-gradient(135deg, #cd7f32, #b87333);
          color: #000;
        }
        
        .podium-avatar {
          width: 80px;
          height: 80px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          font-size: 32px;
          color: white;
        }
        
        .podium-item.first .podium-avatar {
          background: linear-gradient(135deg, #ffd700, #ff6b35);
          box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
        }
        
        .podium-item.second .podium-avatar {
          background: linear-gradient(135deg, #c0c0c0, #808080);
        }
        
        .podium-item.third .podium-avatar {
          background: linear-gradient(135deg, #cd7f32, #8b4513);
        }
        
        .podium-name {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .podium-points {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 16px;
        }
        
        .podium-base {
          width: 120px;
          border-radius: 8px 8px 0 0;
        }
        
        .podium-item.first .podium-base {
          height: 100px;
          background: linear-gradient(180deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.1));
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-bottom: none;
        }
        
        .podium-item.second .podium-base {
          height: 70px;
          background: linear-gradient(180deg, rgba(192, 192, 192, 0.3), rgba(192, 192, 192, 0.1));
          border: 1px solid rgba(192, 192, 192, 0.3);
          border-bottom: none;
        }
        
        .podium-item.third .podium-base {
          height: 50px;
          background: linear-gradient(180deg, rgba(205, 127, 50, 0.3), rgba(205, 127, 50, 0.1));
          border: 1px solid rgba(205, 127, 50, 0.3);
          border-bottom: none;
        }
        
        /* Rankings Table */
        .rankings-table-container {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          overflow: hidden;
        }
        
        .rankings-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .rankings-table th,
        .rankings-table td {
          padding: 16px 20px;
          text-align: left;
        }
        
        .rankings-table th {
          background: var(--bg-tertiary);
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
        }
        
        .rankings-table tr {
          border-bottom: 1px solid var(--border-color);
          transition: var(--transition);
        }
        
        .rankings-table tr:hover {
          background: var(--bg-tertiary);
        }
        
        .rankings-table tr:last-child {
          border-bottom: none;
        }
        
        .rankings-table tr.top-1 {
          background: rgba(255, 215, 0, 0.05);
        }
        
        .rankings-table tr.top-2 {
          background: rgba(192, 192, 192, 0.05);
        }
        
        .rankings-table tr.top-3 {
          background: rgba(205, 127, 50, 0.05);
        }
        
        .rank-cell {
          width: 80px;
        }
        
        .rank-medal {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 900;
        }
        
        .rank-medal.rank-1 {
          background: linear-gradient(135deg, #ffd700, #ffb800);
          color: #000;
        }
        
        .rank-medal.rank-2 {
          background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
          color: #000;
        }
        
        .rank-medal.rank-3 {
          background: linear-gradient(135deg, #cd7f32, #b87333);
          color: #000;
        }
        
        .rank-number {
          font-family: var(--font-display);
          font-weight: 600;
          color: var(--text-secondary);
        }
        
        .team-cell .team-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .team-avatar-small {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .wins-cell {
          color: var(--secondary);
          font-weight: 600;
        }
        
        .losses-cell {
          color: var(--danger);
          font-weight: 600;
        }
        
        .trophies-cell i {
          color: var(--warning);
          margin-right: 4px;
        }
        
        .points-cell {
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--primary);
        }
        
        @media (max-width: 768px) {
          .podium {
            flex-direction: column;
            align-items: center;
          }
          
          .podium-item.first {
            order: -1;
          }
          
          .podium-base {
            display: none;
          }
          
          .rankings-table th,
          .rankings-table td {
            padding: 12px;
            font-size: 13px;
          }
          
          .rankings-table th:nth-child(3),
          .rankings-table th:nth-child(4),
          .rankings-table td:nth-child(3),
          .rankings-table td:nth-child(4) {
            display: none;
          }
        }
      </style>
    `;

    } catch (error) {
        console.error('Error loading rankings:', error);
        container.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Error al cargar ranking</h3>
          <p>${error.message}</p>
        </div>
      </div>
    `;
    }
}
