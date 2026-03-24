// =====================================================
// PAGE - Live Bracket (Real-time tournament bracket via SSE)
// =====================================================

import API from '../api.js';
import { isAuthenticated, getStoredUser } from '../auth.js';

let eventSource = null;
let currentTournamentId = null;

function cleanupSSE() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
}

export async function renderLiveBracketPage(container, tournamentId) {
    cleanupSSE();
    currentTournamentId = tournamentId;

    container.innerHTML = `
    <div class="section">
        <div class="container">
            <div class="live-bracket-header">
                <a href="#/torneos" class="btn btn-ghost"><i class="fas fa-arrow-left"></i> Torneos</a>
                <div class="live-bracket-title-area">
                    <h1 class="gradient-text"><i class="fas fa-sitemap"></i> Bracket en Vivo</h1>
                    <div class="live-indicator" id="liveIndicator">
                        <span class="live-dot"></span>
                        <span>ACTUALIZACIÓN EN TIEMPO REAL</span>
                    </div>
                </div>
            </div>

            <div class="live-bracket-info" id="tournamentInfo">
                <div class="loading-skeleton"><div class="skeleton-line wide"></div></div>
            </div>

            <div class="bracket-controls">
                <button class="btn btn-sm btn-ghost" id="zoomOut" title="Alejar"><i class="fas fa-search-minus"></i></button>
                <button class="btn btn-sm btn-ghost" id="zoomReset" title="Resetear">100%</button>
                <button class="btn btn-sm btn-ghost" id="zoomIn" title="Acercar"><i class="fas fa-search-plus"></i></button>
                <button class="btn btn-sm btn-ghost" id="toggleFullscreen" title="Pantalla completa"><i class="fas fa-expand"></i></button>
            </div>

            <div class="bracket-viewport" id="bracketViewport">
                <div class="bracket-container" id="bracketContainer">
                    <div class="bracket-loading" id="bracketLoading">
                        <div class="spinner"></div>
                        <p>Conectando al bracket en vivo...</p>
                    </div>
                </div>
            </div>

            <div class="bracket-legend">
                <div class="legend-item"><span class="legend-dot live"></span> En Vivo</div>
                <div class="legend-item"><span class="legend-dot completed"></span> Finalizado</div>
                <div class="legend-item"><span class="legend-dot disputed"></span> Disputado</div>
                <div class="legend-item"><span class="legend-dot scheduled"></span> Programado</div>
            </div>
        </div>
    </div>`;

    // Fetch tournament info
    try {
        const res = await API.tournaments.getById(tournamentId);
        const tournament = res?.data || res;
        const infoEl = document.getElementById('tournamentInfo');
        if (infoEl && tournament) {
            infoEl.innerHTML = `
                <div class="bracket-tournament-card">
                    <h2>${tournament.name || 'Torneo'}</h2>
                    <div class="bracket-meta">
                        <span><i class="fas fa-gamepad"></i> ${tournament.game?.name || 'Juego'}</span>
                        <span><i class="fas fa-trophy"></i> ${tournament.format?.replace('_', ' ') || 'Eliminación'}</span>
                        <span><i class="fas fa-users"></i> ${tournament.teams?.length || 0} equipos</span>
                        <span class="status-badge status-${(tournament.status || '').toLowerCase()}">${getStatusLabel(tournament.status)}</span>
                    </div>
                    ${tournament.twitch_url ? `<a href="${tournament.twitch_url}" target="_blank" class="btn btn-sm btn-accent"><i class="fab fa-twitch"></i> Ver Stream</a>` : ''}
                    ${tournament.youtube_url ? `<a href="${tournament.youtube_url}" target="_blank" class="btn btn-sm btn-error"><i class="fab fa-youtube"></i> Ver Stream</a>` : ''}
                </div>`;
        }
    } catch (e) { console.warn('Failed to load tournament info:', e); }

    // Setup zoom controls
    setupZoomControls();

    // Connect to SSE
    connectSSE(tournamentId);
}

function connectSSE(tournamentId) {
    const API_URL = window.API_URL || localStorage.getItem('api_url') || 'http://localhost:3000';
    const url = `${API_URL}/tournaments/${tournamentId}/bracket/live`;

    const indicator = document.getElementById('liveIndicator');

    try {
        eventSource = new EventSource(url);

        eventSource.onopen = () => {
            if (indicator) {
                indicator.classList.add('connected');
                indicator.querySelector('span:last-child').textContent = 'CONECTADO — EN VIVO';
            }
        };

        eventSource.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'BRACKET_FULL' || payload.type === 'BRACKET_UPDATE') {
                    renderBracket(payload.data);
                }
            } catch (e) { console.warn('SSE parse error:', e); }
        };

        eventSource.onerror = () => {
            if (indicator) {
                indicator.classList.remove('connected');
                indicator.querySelector('span:last-child').textContent = 'RECONECTANDO...';
            }
            // Browser will auto-reconnect SSE
        };
    } catch (e) {
        // Fallback: polling
        console.warn('SSE not available, falling back to polling');
        startPolling(tournamentId);
    }
}

async function startPolling(tournamentId) {
    const fetchBracket = async () => {
        try {
            const res = await API.tournaments.getBracket(tournamentId);
            const matches = res?.data || res || [];
            renderBracket(matches);
        } catch (e) { console.warn('Polling error:', e); }
    };
    fetchBracket();
    setInterval(fetchBracket, 5000);
}

function renderBracket(matches) {
    const container = document.getElementById('bracketContainer');
    const loading = document.getElementById('bracketLoading');
    if (!container) return;
    if (loading) loading.style.display = 'none';

    if (!matches || matches.length === 0) {
        container.innerHTML = '<div class="bracket-empty"><i class="fas fa-sitemap"></i><p>El bracket aún no ha sido generado.</p></div>';
        return;
    }

    // Group matches by round
    const rounds = {};
    matches.forEach(m => {
        const round = m.round || 1;
        if (!rounds[round]) rounds[round] = [];
        rounds[round].push(m);
    });

    const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
    const totalRounds = roundNumbers.length;

    let html = '<div class="bracket-rounds">';

    roundNumbers.forEach((roundNum, idx) => {
        const roundMatches = rounds[roundNum];
        const roundLabel = getRoundLabel(roundNum, totalRounds);

        html += `<div class="bracket-round" data-round="${roundNum}">`;
        html += `<div class="round-header"><span class="round-label">${roundLabel}</span><span class="round-count">${roundMatches.length} partido${roundMatches.length > 1 ? 's' : ''}</span></div>`;
        html += '<div class="round-matches">';

        roundMatches.forEach((match) => {
            const statusClass = getMatchStatusClass(match.status);
            const isLive = match.status === 'LIVE';
            const isCompleted = match.status === 'COMPLETED';
            const isDisputed = match.status === 'DISPUTED';

            html += `<div class="bracket-match ${statusClass}" data-match-id="${match.id}">`;

            if (isLive) {
                html += '<div class="match-live-badge"><span class="live-pulse"></span> EN VIVO</div>';
            }
            if (isDisputed) {
                html += '<div class="match-disputed-badge"><i class="fas fa-exclamation-triangle"></i> DISPUTA</div>';
            }

            // Home team
            html += `<div class="bracket-team ${match.winner_id === match.home_team_id ? 'winner' : ''} ${match.winner_id && match.winner_id !== match.home_team_id ? 'loser' : ''}">`;
            html += `<div class="team-info"><span class="team-seed">${match.home_team?.tag || '—'}</span>`;
            html += `<span class="team-name">${match.home_team?.name || 'TBD'}</span></div>`;
            html += `<span class="team-score">${match.home_score || 0}</span>`;
            html += '</div>';

            // Away team
            html += `<div class="bracket-team ${match.winner_id === match.away_team_id ? 'winner' : ''} ${match.winner_id && match.winner_id !== match.away_team_id ? 'loser' : ''}">`;
            html += `<div class="team-info"><span class="team-seed">${match.away_team?.tag || '—'}</span>`;
            html += `<span class="team-name">${match.away_team?.name || 'TBD'}</span></div>`;
            html += `<span class="team-score">${match.away_score || 0}</span>`;
            html += '</div>';

            html += '</div>'; // bracket-match

            // Connector line (except last round)
            if (idx < totalRounds - 1) {
                html += '<div class="bracket-connector"></div>';
            }
        });

        html += '</div></div>'; // round-matches, bracket-round
    });

    html += '</div>'; // bracket-rounds

    container.innerHTML = html;

    // Animate new updates
    container.querySelectorAll('.bracket-match.live, .bracket-match.disputed').forEach(el => {
        el.classList.add('bracket-match-attention');
    });
}

function getRoundLabel(round, totalRounds) {
    const remaining = totalRounds - round + 1;
    if (remaining === 1) return '🏆 Final';
    if (remaining === 2) return 'Semifinal';
    if (remaining === 3) return 'Cuartos de Final';
    return `Ronda ${round}`;
}

function getMatchStatusClass(status) {
    switch (status) {
        case 'LIVE': return 'live';
        case 'COMPLETED': return 'completed';
        case 'DISPUTED': return 'disputed';
        case 'CANCELLED': return 'cancelled';
        default: return 'scheduled';
    }
}

function getStatusLabel(status) {
    const labels = {
        'DRAFT': 'Borrador', 'PUBLISHED': 'Publicado', 'REGISTRATION_OPEN': 'Registro Abierto',
        'REGISTRATION_CLOSED': 'Registro Cerrado', 'IN_PROGRESS': 'En Curso',
        'COMPLETED': 'Finalizado', 'CANCELLED': 'Cancelado'
    };
    return labels[status] || status;
}

function setupZoomControls() {
    let scale = 1;
    const viewport = document.getElementById('bracketViewport');
    const container = document.getElementById('bracketContainer');
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const zoomReset = document.getElementById('zoomReset');
    const fullscreen = document.getElementById('toggleFullscreen');

    function applyZoom() {
        if (container) container.style.transform = `scale(${scale})`;
        if (zoomReset) zoomReset.textContent = Math.round(scale * 100) + '%';
    }

    if (zoomIn) zoomIn.addEventListener('click', () => { scale = Math.min(scale + 0.1, 2); applyZoom(); });
    if (zoomOut) zoomOut.addEventListener('click', () => { scale = Math.max(scale - 0.1, 0.3); applyZoom(); });
    if (zoomReset) zoomReset.addEventListener('click', () => { scale = 1; applyZoom(); });

    if (fullscreen && viewport) {
        fullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                viewport.requestFullscreen?.();
            } else {
                document.exitFullscreen?.();
            }
        });
    }

    // Mouse wheel zoom
    if (viewport) {
        viewport.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                scale += e.deltaY > 0 ? -0.05 : 0.05;
                scale = Math.max(0.3, Math.min(2, scale));
                applyZoom();
            }
        }, { passive: false });
    }
}

export function cleanupLiveBracket() {
    cleanupSSE();
}

export default { renderLiveBracketPage, cleanupLiveBracket };
