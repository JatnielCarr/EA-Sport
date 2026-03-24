// =====================================================
// PAGES - Panel de Monetización / Revenue Dashboard
// =====================================================

import { API } from '../api.js';
import { showLoading, showToast, formatCurrency, openModal, closeModal } from '../ui.js';
import Auth from '../auth.js';

let dashboardData = null;
let transactionsData = [];
let currentPeriod = 'month';

export async function renderMonetization(container) {
  showLoading(container);

  try {
    const token = Auth.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch monetization data in parallel
    const [dashboardRes, transactionsRes, mrrRes] = await Promise.all([
      fetch(`${API_BASE()}/monetization/dashboard`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`${API_BASE()}/monetization/transactions?limit=50`, { headers }).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`${API_BASE()}/monetization/mrr`, { headers }).then(r => r.json()).catch(() => ({ success: false }))
    ]);

    dashboardData = dashboardRes.data || {};
    transactionsData = transactionsRes.data?.transactions || transactionsRes.data || [];
    const mrrData = mrrRes.data || {};

    const totalRevenue = dashboardData.totalRevenue || 0;
    const subscriptionRevenue = dashboardData.subscriptionRevenue || mrrData.mrr || 0;
    const tournamentRevenue = dashboardData.tournamentRevenue || 0;
    const commissionRevenue = dashboardData.commissionRevenue || 0;
    const totalTransactions = dashboardData.totalTransactions || transactionsData.length || 0;
    const activeSubscribers = mrrData.activeSubscribers || dashboardData.activeSubscribers || 0;
    const mrr = mrrData.mrr || 0;
    const arr = mrrData.arr || mrr * 12;

    container.innerHTML = `
      <div class="monetization-page">
        <!-- Header -->
        <div class="welcome-banner">
          <div class="welcome-content">
            <h1 class="welcome-title">
              <i class="fas fa-chart-line"></i>
              Panel de Monetización
            </h1>
            <p class="welcome-subtitle">Control de ingresos, suscripciones y transacciones de la plataforma</p>
          </div>
          <div class="welcome-stats">
            <div class="period-selector">
              <button class="period-btn ${currentPeriod === 'today' ? 'active' : ''}" data-period="today">Hoy</button>
              <button class="period-btn ${currentPeriod === 'week' ? 'active' : ''}" data-period="week">Semana</button>
              <button class="period-btn ${currentPeriod === 'month' ? 'active' : ''}" data-period="month">Mes</button>
              <button class="period-btn ${currentPeriod === 'year' ? 'active' : ''}" data-period="year">Año</button>
            </div>
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="stats-grid monetization-stats">
          <div class="stat-card primary gradient-border-card">
            <div class="stat-header">
              <div class="stat-icon pulse-glow-pro"><i class="fas fa-dollar-sign"></i></div>
              <span class="stat-trend up"><i class="fas fa-arrow-up"></i> Revenue</span>
            </div>
            <div class="stat-value money-glow">${formatCurrency(totalRevenue)}</div>
            <p class="stat-label">Ingresos Totales</p>
          </div>

          <div class="stat-card warning gradient-border-card">
            <div class="stat-header">
              <div class="stat-icon"><i class="fas fa-sync-alt"></i></div>
              <span class="stat-trend"><i class="fas fa-chart-line"></i> MRR</span>
            </div>
            <div class="stat-value money-glow">${formatCurrency(mrr)}</div>
            <p class="stat-label">Monthly Recurring Revenue</p>
          </div>

          <div class="stat-card accent gradient-border-card">
            <div class="stat-header">
              <div class="stat-icon"><i class="fas fa-calendar-alt"></i></div>
              <span class="stat-trend"><i class="fas fa-coins"></i> ARR</span>
            </div>
            <div class="stat-value money-glow">${formatCurrency(arr)}</div>
            <p class="stat-label">Annual Recurring Revenue</p>
          </div>

          <div class="stat-card success gradient-border-card">
            <div class="stat-header">
              <div class="stat-icon"><i class="fas fa-users"></i></div>
              <span class="stat-trend up"><i class="fas fa-crown"></i> Premium</span>
            </div>
            <div class="stat-value">${activeSubscribers}</div>
            <p class="stat-label">Suscriptores Activos</p>
          </div>
        </div>

        <!-- Revenue Breakdown -->
        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
          <div class="stat-card gradient-border-card" style="border-left: 3px solid var(--primary);">
            <div class="stat-header">
              <div class="stat-icon"><i class="fas fa-credit-card"></i></div>
            </div>
            <div class="stat-value" style="font-size: 1.4rem;">${formatCurrency(subscriptionRevenue)}</div>
            <p class="stat-label">Suscripciones</p>
            <div class="stat-progress">
              <div class="stat-progress-bar" style="width: ${totalRevenue > 0 ? (subscriptionRevenue / totalRevenue * 100) : 0}%"></div>
            </div>
          </div>

          <div class="stat-card gradient-border-card" style="border-left: 3px solid var(--warning);">
            <div class="stat-header">
              <div class="stat-icon"><i class="fas fa-trophy"></i></div>
            </div>
            <div class="stat-value" style="font-size: 1.4rem;">${formatCurrency(tournamentRevenue)}</div>
            <p class="stat-label">Entradas a Torneos</p>
            <div class="stat-progress">
              <div class="stat-progress-bar warning" style="width: ${totalRevenue > 0 ? (tournamentRevenue / totalRevenue * 100) : 0}%"></div>
            </div>
          </div>

          <div class="stat-card gradient-border-card" style="border-left: 3px solid var(--accent);">
            <div class="stat-header">
              <div class="stat-icon"><i class="fas fa-percentage"></i></div>
            </div>
            <div class="stat-value" style="font-size: 1.4rem;">${formatCurrency(commissionRevenue)}</div>
            <p class="stat-label">Comisiones</p>
            <div class="stat-progress">
              <div class="stat-progress-bar accent" style="width: ${totalRevenue > 0 ? (commissionRevenue / totalRevenue * 100) : 0}%"></div>
            </div>
          </div>
        </div>

        <!-- Transactions Table -->
        <div class="data-card gradient-border-card">
          <div class="card-header">
            <h2 class="card-title">
              <i class="fas fa-list-ul" style="color: var(--primary);"></i>
              Historial de Transacciones
            </h2>
            <div class="card-actions" style="display:flex; gap:8px; align-items:center;">
              <select class="form-control" id="txTypeFilter" style="width:160px; font-size:0.85rem; padding:6px 10px;">
                <option value="all">Todos los tipos</option>
                <option value="SUBSCRIPTION">Suscripciones</option>
                <option value="TOURNAMENT_ENTRY">Entradas Torneo</option>
                <option value="PRIZE_COMMISSION">Comisiones</option>
                <option value="NAME_CHANGE">Cambio Nombre</option>
                <option value="BALANCE_TOPUP">Recargas</option>
                <option value="WITHDRAWAL">Retiros</option>
                <option value="REFUND">Reembolsos</option>
              </select>
              <button class="btn btn-primary btn-sm" id="btnExportCSV">
                <i class="fas fa-download"></i> Exportar
              </button>
            </div>
          </div>
          <div class="table-container" style="overflow-x:auto;">
            <table class="data-table" style="width:100%; font-size:0.85rem;">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Usuario</th>
                  <th style="text-align:right;">Monto</th>
                  <th style="text-align:center;">Estado</th>
                </tr>
              </thead>
              <tbody id="transactionsBody">
                ${renderTransactionRows(Array.isArray(transactionsData) ? transactionsData : [])}
              </tbody>
            </table>
          </div>
          ${(!Array.isArray(transactionsData) || transactionsData.length === 0) ? `
          <div style="text-align:center; padding:40px; color:var(--text-muted);">
            <i class="fas fa-receipt" style="font-size:32px; opacity:0.5; margin-bottom:10px;"></i>
            <p>No hay transacciones registradas aún</p>
          </div>
          ` : ''}
        </div>
      </div>

      <style>
        .monetization-page { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .monetization-stats { margin-bottom: 24px; }

        .money-glow {
          background: linear-gradient(90deg, #00ff88, #00d4ff, #00ff88);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: moneyShine 3s linear infinite;
        }
        @keyframes moneyShine { to { background-position: 200% center; } }

        .period-selector {
          display: flex;
          gap: 4px;
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
          padding: 4px;
          border: 1px solid var(--border-color);
        }
        .period-btn {
          padding: 6px 14px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .period-btn.active, .period-btn:hover {
          background: var(--primary);
          color: white;
        }

        .tx-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .tx-type-badge.subscription { background: rgba(0,212,255,0.15); color: #00d4ff; }
        .tx-type-badge.tournament { background: rgba(255,184,0,0.15); color: #ffb800; }
        .tx-type-badge.commission { background: rgba(255,107,53,0.15); color: #ff6b35; }
        .tx-type-badge.name-change { background: rgba(138,43,226,0.15); color: #8a2be2; }
        .tx-type-badge.topup { background: rgba(0,255,136,0.15); color: #00ff88; }
        .tx-type-badge.withdrawal { background: rgba(255,51,102,0.15); color: #ff3366; }
        .tx-type-badge.refund { background: rgba(255,193,7,0.15); color: #ffc107; }
        .tx-type-badge.fee { background: rgba(108,117,125,0.15); color: #8b95a5; }

        .tx-amount { font-weight: 700; font-family: 'Orbitron', monospace; }
        .tx-amount.positive { color: #00ff88; }
        .tx-amount.negative { color: #ff3366; }

        .stat-progress { margin-top: 12px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
        .stat-progress-bar { height: 100%; background: linear-gradient(90deg, var(--primary), var(--primary-light)); border-radius: 2px; transition: width 1s ease; }
        .stat-progress-bar.warning { background: linear-gradient(90deg, #ffb800, #ffd700); }
        .stat-progress-bar.accent { background: linear-gradient(90deg, #ff6b35, #ff8f6b); }
      </style>
    `;

    // Event listeners
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        currentPeriod = e.target.dataset.period;
        renderMonetization(container);
      });
    });

    document.getElementById('txTypeFilter')?.addEventListener('change', (e) => {
      const type = e.target.value;
      const filtered = type === 'all'
        ? transactionsData
        : transactionsData.filter(t => t.transaction_type === type);
      document.getElementById('transactionsBody').innerHTML = renderTransactionRows(filtered);
    });

    document.getElementById('btnExportCSV')?.addEventListener('click', () => exportCSV(transactionsData));

  } catch (error) {
    console.error('Error loading monetization:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error al cargar monetización</h3>
        <p>${error.message}</p>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:8px;">Los datos de monetización estarán disponibles cuando haya transacciones registradas.</p>
      </div>
    `;
  }
}

function API_BASE() {
  return window.__API_BASE || 'http://localhost:3100';
}

function renderTransactionRows(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) return '';

  return transactions.map(tx => {
    const typeInfo = getTransactionTypeInfo(tx.transaction_type);
    const isPositive = !['WITHDRAWAL', 'REFUND'].includes(tx.transaction_type);
    const statusBadge = getStatusBadge(tx.status);
    const date = tx.created_at ? new Date(tx.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

    return `
      <tr>
        <td style="white-space:nowrap; font-size:0.8rem; color:var(--text-secondary);">${date}</td>
        <td><span class="tx-type-badge ${typeInfo.class}"><i class="${typeInfo.icon}"></i> ${typeInfo.label}</span></td>
        <td style="font-size:0.83rem;">${tx.description || '-'}</td>
        <td style="font-size:0.8rem; color:var(--text-secondary);">${tx.user_id ? tx.user_id.substring(0, 8) + '...' : 'Sistema'}</td>
        <td style="text-align:right;"><span class="tx-amount ${isPositive ? 'positive' : 'negative'}">${isPositive ? '+' : '-'}${formatCurrency(Math.abs(Number(tx.amount) || 0))}</span></td>
        <td style="text-align:center;">${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

function getTransactionTypeInfo(type) {
  const types = {
    SUBSCRIPTION: { label: 'Suscripción', icon: 'fas fa-credit-card', class: 'subscription' },
    TOURNAMENT_ENTRY: { label: 'Entrada Torneo', icon: 'fas fa-trophy', class: 'tournament' },
    PRIZE_COMMISSION: { label: 'Comisión', icon: 'fas fa-percentage', class: 'commission' },
    NAME_CHANGE: { label: 'Cambio Nombre', icon: 'fas fa-pen', class: 'name-change' },
    BALANCE_TOPUP: { label: 'Recarga', icon: 'fas fa-plus-circle', class: 'topup' },
    WITHDRAWAL: { label: 'Retiro', icon: 'fas fa-arrow-down', class: 'withdrawal' },
    REFUND: { label: 'Reembolso', icon: 'fas fa-undo', class: 'refund' },
    PLATFORM_FEE: { label: 'Comisión Plataf.', icon: 'fas fa-building', class: 'fee' }
  };
  return types[type] || { label: type || 'Otro', icon: 'fas fa-circle', class: 'fee' };
}

function getStatusBadge(status) {
  const styles = {
    COMPLETED: { bg: 'rgba(0,255,136,0.15)', color: '#00ff88', icon: 'fas fa-check-circle', label: 'Completado' },
    PENDING: { bg: 'rgba(255,184,0,0.15)', color: '#ffb800', icon: 'fas fa-clock', label: 'Pendiente' },
    FAILED: { bg: 'rgba(255,51,102,0.15)', color: '#ff3366', icon: 'fas fa-times-circle', label: 'Fallido' },
    REFUNDED: { bg: 'rgba(138,43,226,0.15)', color: '#8a2be2', icon: 'fas fa-undo', label: 'Reembolsado' }
  };
  const s = styles[status] || styles.PENDING;
  return `<span style="display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:6px; font-size:0.72rem; font-weight:600; background:${s.bg}; color:${s.color};"><i class="${s.icon}"></i> ${s.label}</span>`;
}

function exportCSV(transactions) {
  if (!transactions || transactions.length === 0) {
    showToast('warning', 'Sin datos', 'No hay transacciones para exportar');
    return;
  }

  const headers = ['Fecha', 'Tipo', 'Descripción', 'Monto', 'Moneda', 'Estado'];
  const rows = transactions.map(tx => [
    tx.created_at ? new Date(tx.created_at).toISOString() : '',
    tx.transaction_type || '',
    (tx.description || '').replace(/,/g, ';'),
    tx.amount || 0,
    tx.currency || 'mxn',
    tx.status || ''
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `revenue_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('success', 'Exportado', 'Archivo CSV descargado');
}
