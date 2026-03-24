// =====================================================
// Match Result Reporting Page  
// =====================================================

import API from '../api.js';
import { getStoredUser, isAuthenticated } from '../auth.js';
import { showLoading, formatDate } from '../ui-helpers.js';

export async function renderMatchReport(container, matchId) {
    if (!isAuthenticated()) {
        window.location.hash = '#/login';
        return;
    }

    showLoading(container);

    try {
        const user = getStoredUser();

        // Fetch match details
        const matchRes = await API.get(`/matches/${matchId}`);
        const match = matchRes.data;

        if (!match) {
            container.innerHTML = `
                <div class="container">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>Partida no encontrada</h3>
                        <a href="#/" class="btn btn-primary">Volver al inicio</a>
                    </div>
                </div>
            `;
            return;
        }

        const homeTeam = match.home_team || {};
        const awayTeam = match.away_team || {};
        const tournament = match.tournament || {};
        const results = match.results || [];

        // Check if user is captain of either team
        const isHomeCaptain = homeTeam.captain?.id === user.id;
        const isAwayCaptain = awayTeam.captain?.id === user.id;
        const isCaptain = isHomeCaptain || isAwayCaptain;
        const myTeamId = isHomeCaptain ? homeTeam.id : isAwayCaptain ? awayTeam.id : null;

        // Check if user's team already reported
        const myReport = results.find(r => r.reported_by_team?.id === myTeamId);
        const opponentReport = results.find(r => r.reported_by_team?.id !== myTeamId);
        const isDisputed = match.status === 'DISPUTED';
        const isCompleted = match.status === 'COMPLETED';

        container.innerHTML = `
        <div class="match-report-page">
            <div class="container">
                <!-- Back Button -->
                <a href="#/dashboard" class="back-link">
                    <i class="fas fa-arrow-left"></i> Volver al Dashboard
                </a>

                <!-- Match Header -->
                <div class="mr-header">
                    <div class="mr-tournament">
                        <i class="fas fa-trophy"></i> ${tournament.name || 'Torneo'}
                    </div>
                    <div class="mr-round">Ronda ${match.round || '?'} · Partido ${match.match_number || '?'}</div>
                    <div class="mr-status ${match.status?.toLowerCase()}">${getStatusLabel(match.status)}</div>
                </div>

                <!-- Matchup Display -->
                <div class="mr-matchup">
                    <div class="mr-team ${isHomeCaptain ? 'my-team' : ''}">
                        <div class="mr-team-logo">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="mr-team-name">${homeTeam.name || 'TBD'}</div>
                        <div class="mr-team-tag">[${homeTeam.tag || '???'}]</div>
                        ${isHomeCaptain ? '<span class="my-team-badge">Tu equipo</span>' : ''}
                    </div>

                    <div class="mr-score-display">
                        <span class="mr-score">${match.home_score || 0}</span>
                        <span class="mr-vs">VS</span>
                        <span class="mr-score">${match.away_score || 0}</span>
                    </div>

                    <div class="mr-team ${isAwayCaptain ? 'my-team' : ''}">
                        <div class="mr-team-logo">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="mr-team-name">${awayTeam.name || 'TBD'}</div>
                        <div class="mr-team-tag">[${awayTeam.tag || '???'}]</div>
                        ${isAwayCaptain ? '<span class="my-team-badge">Tu equipo</span>' : ''}
                    </div>
                </div>

                <!-- Check-in Section -->
                ${['SCHEDULED', 'CHECK_IN'].includes(match.status) && isCaptain ? `
                <div class="mr-section">
                    <div class="mr-reported-notice" style="background: rgba(0,212,255,0.08); border-color: rgba(0,212,255,0.2);">
                        <i class="fas fa-clipboard-check" style="color: #00d4ff;"></i>
                        <div style="flex:1;">
                            <strong style="color: #00d4ff;">Fase de Check-in abierta</strong>
                            <p>Confirma que tu equipo está listo para jugar.</p>
                        </div>
                        <button class="btn btn-primary" id="btnCheckIn">
                            <i class="fas fa-check"></i> Hacer Check-in
                        </button>
                    </div>
                </div>
                ` : ''}

                <!-- Existing Reports -->
                ${results.length > 0 ? `
                <div class="mr-section">
                    <h3 class="mr-section-title">
                        <i class="fas fa-clipboard-list"></i> Reportes Enviados
                    </h3>
                    <div class="mr-reports-grid">
                        ${results.map(r => `
                            <div class="mr-report-card ${r.disputed ? 'disputed' : r.validated ? 'validated' : ''}">
                                <div class="mr-report-header">
                                    <span class="mr-report-team">${r.reported_by_team?.tag ? `[${r.reported_by_team.tag}]` : ''} ${r.reported_by_team?.name || 'Equipo'}</span>
                                    <span class="mr-report-user"><i class="fas fa-user"></i> ${r.reported_by_user?.username || 'Jugador'}</span>
                                </div>
                                <div class="mr-report-score">${r.home_score} - ${r.away_score}</div>
                                <div class="mr-report-winner">
                                    <i class="fas fa-crown" style="color:#ffd700;"></i> 
                                    Ganador: ${r.winning_team?.name || r.winning_team?.tag || 'N/A'}
                                </div>
                                ${r.screenshot_url ? `
                                    <a href="${r.screenshot_url}" target="_blank" class="mr-screenshot-link">
                                        <i class="fas fa-image"></i> Ver captura
                                    </a>
                                ` : ''}
                                ${r.dispute_reason ? `
                                    <div class="mr-dispute-reason">
                                        <i class="fas fa-exclamation-triangle"></i> ${r.dispute_reason}
                                    </div>
                                ` : ''}
                                <div class="mr-report-status">
                                    ${r.disputed ? '<span class="status-disputed"><i class="fas fa-exclamation-circle"></i> Disputado</span>' :
                                      r.validated ? '<span class="status-validated"><i class="fas fa-check-circle"></i> Validado</span>' :
                                      '<span class="status-pending"><i class="fas fa-clock"></i> Pendiente</span>'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Report Form (only for captains who haven't reported yet) -->
                ${isCaptain && !myReport && !isCompleted ? `
                <div class="mr-section">
                    <h3 class="mr-section-title">
                        <i class="fas fa-pen-square"></i> Reportar Resultado
                    </h3>
                    <form id="reportResultForm" class="mr-form">
                        <div class="mr-form-matchup">
                            <div class="mr-form-team">
                                <label>${homeTeam.name || 'Local'}</label>
                                <input type="number" id="homeScore" min="0" value="0" required class="mr-score-input">
                            </div>
                            <div class="mr-form-vs">-</div>
                            <div class="mr-form-team">
                                <label>${awayTeam.name || 'Visitante'}</label>
                                <input type="number" id="awayScore" min="0" value="0" required class="mr-score-input">
                            </div>
                        </div>

                        <div class="mr-form-group">
                            <label class="mr-form-label">
                                <i class="fas fa-crown" style="color:#ffd700;"></i> Equipo Ganador
                            </label>
                            <select id="winnerId" required class="mr-select">
                                <option value="">Seleccionar ganador...</option>
                                ${homeTeam.id ? `<option value="${homeTeam.id}">${homeTeam.name || 'Local'}</option>` : ''}
                                ${awayTeam.id ? `<option value="${awayTeam.id}">${awayTeam.name || 'Visitante'}</option>` : ''}
                            </select>
                        </div>

                        <div class="mr-form-group">
                            <label class="mr-form-label">
                                <i class="fas fa-camera" style="color:var(--primary);"></i> Captura de pantalla (URL)
                            </label>
                            <input type="url" id="screenshotUrl" placeholder="https://imgur.com/..." class="mr-input">
                            <span class="mr-hint">Sube tu screenshot a imgur o similar y pega la URL</span>
                        </div>

                        <button type="submit" class="btn btn-primary mr-submit-btn" id="submitResultBtn">
                            <i class="fas fa-paper-plane"></i> Enviar Resultado
                        </button>

                        <div class="mr-form-note">
                            <i class="fas fa-info-circle"></i>
                            El capitán del equipo rival también debe reportar. Si los resultados coinciden, se validan automáticamente. 
                            Si no coinciden, se abrirá una disputa.
                        </div>
                    </form>
                </div>
                ` : myReport ? `
                <div class="mr-section">
                    <div class="mr-reported-notice">
                        <i class="fas fa-check-circle"></i>
                        <div>
                            <strong>Ya reportaste el resultado</strong>
                            <p>Score: ${myReport.home_score} - ${myReport.away_score} · Ganador: ${myReport.winning_team?.name || 'N/A'}</p>
                            ${!opponentReport ? '<p style="color:var(--text-muted);">Esperando el reporte del equipo rival...</p>' : ''}
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Dispute Button -->
                ${isCaptain && !isDisputed && !isCompleted && match.status !== 'CANCELLED' ? `
                <div class="mr-section">
                    <button class="mr-dispute-btn" id="btnOpenDispute">
                        <i class="fas fa-exclamation-triangle"></i>
                        Abrir Disputa
                    </button>
                </div>
                ` : ''}

                ${isDisputed ? `
                <div class="mr-section">
                    <div class="mr-disputed-notice">
                        <i class="fas fa-gavel"></i>
                        <div>
                            <strong>Partida en disputa</strong>
                            <p>Un administrador revisará las evidencias y tomará una decisión.</p>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>

        <style>
            .match-report-page { padding: 30px 0 60px; }
            .back-link {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                color: var(--text-secondary);
                font-size: 14px;
                margin-bottom: 20px;
                text-decoration: none;
                transition: color 0.2s;
            }
            .back-link:hover { color: var(--primary); }

            /* Header */
            .mr-header {
                text-align: center;
                margin-bottom: 24px;
            }
            .mr-tournament {
                font-size: 14px;
                color: var(--primary);
                font-weight: 600;
                margin-bottom: 4px;
            }
            .mr-round { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
            .mr-status {
                display: inline-block;
                padding: 4px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .mr-status.scheduled { background: rgba(108,117,125,0.15); color: #8b95a5; }
            .mr-status.live { background: rgba(255,51,102,0.15); color: #ff3366; animation: pulse-live 2s infinite; }
            .mr-status.completed { background: rgba(0,255,136,0.15); color: #00ff88; }
            .mr-status.disputed { background: rgba(255,107,53,0.15); color: #ff6b35; }
            .mr-status.cancelled { background: rgba(108,117,125,0.15); color: #8b95a5; }
            @keyframes pulse-live { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }

            /* Matchup */
            .mr-matchup {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 24px;
                padding: 30px;
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 16px;
                margin-bottom: 24px;
            }
            .mr-team { text-align: center; flex: 1; max-width: 200px; position: relative; }
            .mr-team.my-team { }
            .mr-team-logo {
                width: 60px;
                height: 60px;
                border-radius: 16px;
                background: linear-gradient(135deg, var(--primary), var(--accent));
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                margin: 0 auto 10px;
            }
            .my-team .mr-team-logo { box-shadow: 0 0 20px rgba(0, 212, 255, 0.4); }
            .mr-team-name { font-weight: 700; font-size: 15px; margin-bottom: 2px; }
            .mr-team-tag { font-size: 12px; color: var(--text-secondary); }
            .my-team-badge {
                display: inline-block;
                margin-top: 6px;
                padding: 2px 10px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 700;
                background: rgba(0, 212, 255, 0.15);
                color: var(--primary);
            }
            .mr-score-display { display: flex; align-items: center; gap: 12px; }
            .mr-score {
                font-family: 'Orbitron', sans-serif;
                font-size: 36px;
                font-weight: 900;
            }
            .mr-vs {
                font-family: 'Orbitron', sans-serif;
                font-size: 16px;
                color: var(--text-muted);
                font-weight: 700;
            }

            /* Sections */
            .mr-section { margin-bottom: 24px; }
            .mr-section-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 16px;
                margin-bottom: 16px;
            }
            .mr-section-title i { color: var(--primary); }

            /* Report Cards */
            .mr-reports-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
            .mr-report-card {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 14px;
                padding: 20px;
            }
            .mr-report-card.disputed { border-color: rgba(255,107,53,0.3); background: rgba(255,107,53,0.03); }
            .mr-report-card.validated { border-color: rgba(0,255,136,0.3); }
            .mr-report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px; }
            .mr-report-team { font-weight: 700; }
            .mr-report-user { color: var(--text-muted); }
            .mr-report-score {
                text-align: center;
                font-family: 'Orbitron', mono;
                font-weight: 900;
                font-size: 28px;
                margin-bottom: 8px;
                letter-spacing: 4px;
            }
            .mr-report-winner { text-align: center; font-size: 13px; margin-bottom: 12px; }
            .mr-screenshot-link {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                color: var(--primary);
                text-decoration: none;
                margin-bottom: 8px;
            }
            .mr-dispute-reason {
                padding: 8px 12px;
                background: rgba(255,107,53,0.1);
                border-radius: 8px;
                font-size: 12px;
                color: #ff6b35;
                margin-bottom: 8px;
            }
            .mr-report-status { text-align: center; font-size: 12px; font-weight: 600; }
            .status-disputed { color: #ff6b35; }
            .status-validated { color: #00ff88; }
            .status-pending { color: #ffb800; }

            /* Report Form */
            .mr-form {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 14px;
                padding: 24px;
            }
            .mr-form-matchup {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                margin-bottom: 20px;
            }
            .mr-form-team { text-align: center; }
            .mr-form-team label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
            .mr-score-input {
                width: 80px;
                height: 60px;
                text-align: center;
                font-family: 'Orbitron', sans-serif;
                font-size: 28px;
                font-weight: 900;
                background: var(--bg-tertiary);
                border: 2px solid var(--border-color);
                border-radius: 12px;
                color: var(--text-primary);
                transition: border-color 0.2s;
            }
            .mr-score-input:focus { border-color: var(--primary); outline: none; }
            .mr-form-vs { font-size: 24px; font-weight: 900; color: var(--text-muted); }
            .mr-form-group { margin-bottom: 16px; }
            .mr-form-label { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 13px; margin-bottom: 8px; }
            .mr-select, .mr-input {
                width: 100%;
                padding: 10px 14px;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-color);
                border-radius: 10px;
                color: var(--text-primary);
                font-size: 14px;
            }
            .mr-hint { font-size: 12px; color: var(--text-muted); margin-top: 4px; display: block; }
            .mr-submit-btn {
                width: 100%;
                padding: 14px;
                font-size: 15px;
                font-weight: 700;
                border-radius: 12px;
                margin-bottom: 12px;
            }
            .mr-form-note {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                padding: 12px;
                background: rgba(0,212,255,0.05);
                border-radius: 10px;
                font-size: 12px;
                color: var(--text-secondary);
                line-height: 1.5;
            }

            /* Notices */
            .mr-reported-notice, .mr-disputed-notice {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 20px;
                border-radius: 14px;
                font-size: 14px;
            }
            .mr-reported-notice {
                background: rgba(0,255,136,0.08);
                border: 1px solid rgba(0,255,136,0.2);
            }
            .mr-reported-notice > i { font-size: 28px; color: #00ff88; }
            .mr-reported-notice p { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
            .mr-disputed-notice {
                background: rgba(255,107,53,0.08);
                border: 1px solid rgba(255,107,53,0.2);
            }
            .mr-disputed-notice > i { font-size: 28px; color: #ff6b35; }
            .mr-disputed-notice p { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }

            .mr-dispute-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                width: 100%;
                padding: 12px;
                background: transparent;
                border: 2px solid rgba(255,107,53,0.3);
                border-radius: 12px;
                color: #ff6b35;
                font-weight: 700;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .mr-dispute-btn:hover {
                background: rgba(255,107,53,0.1);
                border-color: #ff6b35;
            }

            @media (max-width: 768px) {
                .mr-matchup { flex-direction: column; padding: 20px; }
                .mr-score { font-size: 28px; }
                .mr-form-matchup { flex-direction: column; }
                .mr-score-input { width: 100%; max-width: 200px; }
            }
        </style>
        `;

        // Event listeners
        document.getElementById('reportResultForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submitResultBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            try {
                const body = {
                    reported_by_team_id: myTeamId,
                    winning_team_id: document.getElementById('winnerId').value,
                    home_score: parseInt(document.getElementById('homeScore').value),
                    away_score: parseInt(document.getElementById('awayScore').value),
                    screenshot_url: document.getElementById('screenshotUrl')?.value || undefined
                };

                if (!body.winning_team_id) {
                    window.showToast('error', 'Error', 'Selecciona el equipo ganador');
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Resultado';
                    return;
                }

                const result = await API.post(`/matches/${matchId}/results`, body);

                if (result.disputed) {
                    window.showToast('warning', 'Disputa detectada', result.message || 'Los resultados no coinciden');
                } else {
                    window.showToast('success', '¡Resultado enviado!', result.message || 'Esperando confirmación del rival');
                }

                // Reload page
                renderMatchReport(container, matchId);
            } catch (error) {
                window.showToast('error', 'Error', error.message || 'No se pudo enviar el resultado');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Resultado';
            }
        });

        document.getElementById('btnOpenDispute')?.addEventListener('click', async () => {
            const reason = prompt('Describe la razón de la disputa (mínimo 10 caracteres):');
            if (!reason || reason.length < 10) {
                if (reason) window.showToast('error', 'Error', 'La razón debe tener al menos 10 caracteres');
                return;
            }

            try {
                await API.post(`/matches/${matchId}/dispute`, {
                    reason,
                    reported_by_team_id: myTeamId
                });
                window.showToast('warning', 'Disputa abierta', 'Un admin revisará el caso');
                renderMatchReport(container, matchId);
            } catch (error) {
                window.showToast('error', 'Error', error.message);
            }
        });

        document.getElementById('btnCheckIn')?.addEventListener('click', async () => {
            const btn = document.getElementById('btnCheckIn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

            try {
                const result = await API.post(`/matches/${matchId}/check-in`, {});
                window.showToast('success', '¡Check-in exitoso!', result.message || 'Tu equipo está listo');
                renderMatchReport(container, matchId);
            } catch (error) {
                window.showToast('error', 'Error de Check-in', error.message || 'No se pudo completar el check-in');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check"></i> Hacer Check-in';
            }
        });

    } catch (error) {
        console.error('Match report error:', error);
        container.innerHTML = `
        <div class="container">
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar la partida</h3>
                <p>${error.message}</p>
                <a href="#/dashboard" class="btn btn-primary">Volver al dashboard</a>
            </div>
        </div>
        `;
    }
}

function getStatusLabel(status) {
    const labels = {
        'SCHEDULED': 'Programada',
        'CHECK_IN': 'Check-in',
        'LIVE': 'En Vivo',
        'COMPLETED': 'Finalizada',
        'DISPUTED': 'En Disputa',
        'CANCELLED': 'Cancelada'
    };
    return labels[status] || status;
}
