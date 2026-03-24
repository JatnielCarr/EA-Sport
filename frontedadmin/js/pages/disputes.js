// =====================================================
// PAGES - Panel de Disputas (Disputes Management)
// =====================================================

import { API } from '../api.js';
import { showLoading, showToast, openModal, closeModal, confirmDialog, formatDate } from '../ui.js';
import Auth from '../auth.js';

let allDisputes = [];

export async function renderDisputes(container) {
  showLoading(container);

  try {
    const token = Auth.getToken();
    const response = await fetch(`${API_BASE()}/disputes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    allDisputes = result.data || [];

    container.innerHTML = `
      <div class="disputes-page">
        <div class="card">
          <div class="card-header" style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px;">
            <h2 class="card-title" style="margin:0; font-size:1.25rem; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-gavel" style="color:#ff3366;"></i>
              Panel de Disputas
              <span class="badge" style="background:linear-gradient(135deg,#ff3366,#ff6b35); color:#fff; font-size:0.75rem; margin-left:4px;">${allDisputes.length}</span>
            </h2>
            <div class="card-actions" style="display:flex; gap:8px; align-items:center;">
              <select class="form-control" id="disputeFilter" style="width:160px; font-size:0.85rem; padding:6px 10px;">
                <option value="all">Todas</option>
                <option value="pending">Pendientes</option>
                <option value="resolved">Resueltas</option>
              </select>
              <input type="text" class="form-control" placeholder="🔍 Buscar..." id="searchDisputes" style="width:200px; font-size:0.85rem; padding:6px 10px;">
            </div>
          </div>

          <div id="disputesList" class="disputes-list">
            ${allDisputes.length > 0 ? renderDisputeCards(allDisputes) : `
              <div class="empty-state" style="padding:60px 20px;">
                <i class="fas fa-peace" style="font-size:48px; opacity:0.3; margin-bottom:16px; display:block;"></i>
                <h3>No hay disputas activas</h3>
                <p style="color:var(--text-muted);">Todas las partidas se han resuelto sin conflictos 🎉</p>
              </div>
            `}
          </div>
        </div>
      </div>

      <style>
        .disputes-page { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .disputes-list { padding: 16px; display: flex; flex-direction: column; gap: 16px; }

        .dispute-card {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-left: 4px solid #ff3366;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        .dispute-card:hover { border-color: #ff3366; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(255,51,102,0.15); }
        .dispute-card.resolved { border-left-color: #00ff88; opacity: 0.7; }

        .dispute-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
        .dispute-title { font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .dispute-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 0.8rem; color: var(--text-secondary); }
        .dispute-meta span { display: flex; align-items: center; gap: 4px; }

        .dispute-matchup {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255,51,102,0.05);
          border-radius: 10px;
          margin-bottom: 16px;
        }
        .dispute-team {
          text-align: center;
          flex: 1;
        }
        .dispute-team-name { font-weight: 700; font-size: 0.95rem; }
        .dispute-team-tag { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }
        .dispute-vs {
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          color: #ff3366;
          font-size: 1.1rem;
        }

        .dispute-results {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        .result-report {
          padding: 12px;
          background: var(--bg-card);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }
        .result-report-header {
          display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
          font-size: 0.8rem; font-weight: 600;
        }
        .result-report-score { font-family: 'Orbitron', monospace; font-weight: 900; font-size: 1.3rem; text-align: center; letter-spacing: 2px; }
        .result-report-winner { font-size: 0.75rem; text-align: center; margin-top: 4px; color: #00ff88; }
        .result-report-reason { font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color); }

        .dispute-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }

        .badge-disputed {
          background: linear-gradient(135deg, #ff3366, #ff6b35);
          color: #fff;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          animation: pulse-badge 2s infinite;
        }
        @keyframes pulse-badge { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
      </style>
    `;

    // Events
    document.getElementById('disputeFilter')?.addEventListener('change', filterDisputes);
    document.getElementById('searchDisputes')?.addEventListener('input', filterDisputes);
    document.getElementById('disputesList')?.addEventListener('click', handleDisputeActions);

  } catch (error) {
    console.error('Error loading disputes:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar disputas</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function API_BASE() {
  return window.__API_BASE || 'http://localhost:3100';
}

function renderDisputeCards(disputes) {
  return disputes.map(dispute => {
    const homeTeam = dispute.home_team || {};
    const awayTeam = dispute.away_team || {};
    const tournament = dispute.tournament || {};
    const results = dispute.results || [];
    const isResolved = dispute.status !== 'DISPUTED';

    return `
      <div class="dispute-card ${isResolved ? 'resolved' : ''}" data-match-id="${dispute.id}">
        <div class="dispute-header">
          <div class="dispute-title">
            <span class="badge-disputed"><i class="fas fa-exclamation-triangle"></i> DISPUTA</span>
            ${tournament.name || 'Torneo'}
          </div>
          <div class="dispute-meta">
            <span><i class="fas fa-calendar"></i> ${dispute.updated_at ? formatDate(dispute.updated_at) : 'Reciente'}</span>
            <span><i class="fas fa-gamepad"></i> Ronda ${dispute.round || '?'}</span>
          </div>
        </div>

        <div class="dispute-matchup">
          <div class="dispute-team">
            <div class="dispute-team-name">${homeTeam.name || 'Equipo Local'}</div>
            <div class="dispute-team-tag">[${homeTeam.tag || '???'}]</div>
          </div>
          <div class="dispute-vs">VS</div>
          <div class="dispute-team">
            <div class="dispute-team-name">${awayTeam.name || 'Equipo Visitante'}</div>
            <div class="dispute-team-tag">[${awayTeam.tag || '???'}]</div>
          </div>
        </div>

        ${results.length > 0 ? `
        <div class="dispute-results">
          ${results.map((r, i) => `
            <div class="result-report">
              <div class="result-report-header">
                <span><i class="fas fa-user"></i> ${r.reported_by_user?.username || 'Jugador'}</span>
                <span style="color:var(--text-muted);">${r.reported_by_team?.name || 'Equipo'}</span>
              </div>
              <div class="result-report-score">${r.home_score} - ${r.away_score}</div>
              <div class="result-report-winner">
                <i class="fas fa-crown"></i> Ganador: ${r.winning_team?.name || r.winning_team?.tag || 'N/A'}
              </div>
              ${r.dispute_reason ? `<div class="result-report-reason"><i class="fas fa-comment"></i> ${r.dispute_reason}</div>` : ''}
              ${r.screenshot_url ? `<div style="margin-top:8px;"><a href="${r.screenshot_url}" target="_blank" class="btn btn-sm btn-secondary"><i class="fas fa-image"></i> Ver Screenshot</a></div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : '<p style="text-align:center; color:var(--text-muted); padding:12px;">Sin reportes de resultado enviados</p>'}

        ${!isResolved ? `
        <div class="dispute-actions">
          <button class="btn btn-sm" style="background:rgba(0,255,136,0.15); color:#00ff88; border:1px solid rgba(0,255,136,0.3);" data-action="resolve" data-match-id="${dispute.id}" data-home-id="${homeTeam.id}" data-away-id="${awayTeam.id}" data-home-name="${homeTeam.name}" data-away-name="${awayTeam.name}">
            <i class="fas fa-check-circle"></i> Resolver Disputa
          </button>
          <button class="btn btn-sm" style="background:rgba(255,51,102,0.15); color:#ff3366; border:1px solid rgba(255,51,102,0.3);" data-action="cancel" data-match-id="${dispute.id}">
            <i class="fas fa-times-circle"></i> Cancelar Partida
          </button>
        </div>
        ` : `
        <div style="text-align:center; padding:8px; background:rgba(0,255,136,0.1); border-radius:8px; color:#00ff88; font-size:0.85rem;">
          <i class="fas fa-check-circle"></i> Disputa resuelta
        </div>
        `}
      </div>
    `;
  }).join('');
}

function filterDisputes() {
  const filter = document.getElementById('disputeFilter')?.value || 'all';
  const search = (document.getElementById('searchDisputes')?.value || '').toLowerCase();

  const filtered = allDisputes.filter(d => {
    const matchesFilter = filter === 'all' ||
      (filter === 'pending' && d.status === 'DISPUTED') ||
      (filter === 'resolved' && d.status !== 'DISPUTED');

    const matchesSearch = !search ||
      d.home_team?.name?.toLowerCase().includes(search) ||
      d.away_team?.name?.toLowerCase().includes(search) ||
      d.tournament?.name?.toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });

  const container = document.getElementById('disputesList');
  if (container) {
    container.innerHTML = filtered.length > 0 ? renderDisputeCards(filtered) : `
      <div style="text-align:center; padding:40px; color:var(--text-muted);">
        <i class="fas fa-search" style="font-size:32px; opacity:0.3; margin-bottom:10px;"></i>
        <p>No se encontraron disputas</p>
      </div>
    `;
  }
}

async function handleDisputeActions(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const matchId = btn.dataset.matchId;

  if (action === 'resolve') {
    showResolveModal(matchId, btn.dataset);
  } else if (action === 'cancel') {
    if (await confirmDialog('¿Cancelar esta partida? La disputa se cerrará y ningún equipo avanzará.')) {
      try {
        const token = Auth.getToken();
        await fetch(`${API_BASE()}/matches/${matchId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ status: 'CANCELLED' })
        });
        showToast('success', 'Partida cancelada', 'La disputa ha sido cerrada');
        const container = document.getElementById('pageContent');
        renderDisputes(container);
      } catch (error) {
        showToast('error', 'Error', error.message);
      }
    }
  }
}

function showResolveModal(matchId, data) {
  const title = '⚖️ Resolver Disputa';
  const homeId = data.homeId;
  const awayId = data.awayId;
  const homeName = data.homeName;
  const awayName = data.awayName;

  const formHtml = `
    <form id="resolveDisputeForm" style="display:flex; flex-direction:column; gap:16px;">
      <div style="text-align:center; padding:16px; background:rgba(255,51,102,0.1); border-radius:10px; border:1px solid rgba(255,51,102,0.2);">
        <div style="font-family:'Orbitron',sans-serif; font-weight:900; font-size:1.1rem; margin-bottom:4px;">
          ${homeName || 'Local'} <span style="color:#ff3366;">VS</span> ${awayName || 'Visitante'}
        </div>
        <div style="font-size:0.8rem; color:var(--text-secondary);">Selecciona el resultado correcto</div>
      </div>

      <div class="form-group">
        <label class="form-label" style="font-weight:600;"><i class="fas fa-crown" style="color:#ffd700;"></i> Equipo Ganador *</label>
        <select class="form-control" name="winner_id" required style="padding:8px 12px;">
          <option value="">Seleccionar ganador...</option>
          ${homeId ? `<option value="${homeId}">${homeName || 'Equipo Local'}</option>` : ''}
          ${awayId ? `<option value="${awayId}">${awayName || 'Equipo Visitante'}</option>` : ''}
        </select>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group">
          <label class="form-label" style="font-weight:600;"><i class="fas fa-home"></i> Score Local *</label>
          <input type="number" class="form-control" name="home_score" min="0" required value="0" style="padding:8px 12px;">
        </div>
        <div class="form-group">
          <label class="form-label" style="font-weight:600;"><i class="fas fa-plane"></i> Score Visitante *</label>
          <input type="number" class="form-control" name="away_score" min="0" required value="0" style="padding:8px 12px;">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" style="font-weight:600;"><i class="fas fa-sticky-note"></i> Notas del Admin</label>
        <textarea class="form-control" name="admin_notes" rows="3" placeholder="Razón de la resolución..." style="padding:8px 12px; resize:vertical;"></textarea>
      </div>

      <div style="padding:10px; background:rgba(0,212,255,0.1); border-radius:6px; border:1px solid rgba(0,212,255,0.3); font-size:0.8rem; color:var(--primary);">
        <i class="fas fa-info-circle"></i> El resultado será validado y el equipo ganador avanzará automáticamente en el bracket.
      </div>

      <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:8px; padding-top:8px; border-top:1px solid var(--border-color);">
        <button type="button" class="btn btn-secondary" onclick="window.closeModal()" style="padding:8px 16px;">Cancelar</button>
        <button type="submit" class="btn" style="background:linear-gradient(135deg,#00ff88,#00d4ff); color:#000; border:none; padding:8px 20px; cursor:pointer; border-radius:6px; font-weight:700;">
          <i class="fas fa-gavel"></i> Resolver
        </button>
      </div>
    </form>
  `;

  openModal(title, formHtml);

  document.getElementById('resolveDisputeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = {
      winner_id: formData.get('winner_id'),
      home_score: parseInt(formData.get('home_score')),
      away_score: parseInt(formData.get('away_score')),
      admin_notes: formData.get('admin_notes')
    };

    if (!body.winner_id) {
      showToast('error', 'Error', 'Selecciona un equipo ganador');
      return;
    }

    try {
      const token = Auth.getToken();
      const res = await fetch(`${API_BASE()}/matches/${matchId}/resolve-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      const result = await res.json();

      if (result.success) {
        showToast('success', 'Disputa resuelta', result.message || 'El resultado ha sido validado');
        closeModal();
        const container = document.getElementById('pageContent');
        renderDisputes(container);
      } else {
        showToast('error', 'Error', result.error || 'No se pudo resolver la disputa');
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
  });
}
