// =====================================================
// Admin: Withdrawal Management Panel
// =====================================================

const API_BASE = () => window.__API_BASE || 'http://localhost:3100';

export async function renderWithdrawals(container) {
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando retiros...</div>';

    try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE()}/admin/withdrawals`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const withdrawals = data.data || [];
        const stats = data.stats || {};

        container.innerHTML = `
        <div class="page-content">
            <div class="content-header">
                <h1><i class="fas fa-money-check-alt"></i> Gestión de Retiros</h1>
                <p>Aprobar o rechazar solicitudes de retiro de usuarios</p>
            </div>

            <!-- Stats Bar -->
            <div class="stats-bar">
                <div class="stat-item pending">
                    <i class="fas fa-clock"></i>
                    <div>
                        <span class="stat-value">${stats.pending || 0}</span>
                        <span class="stat-label">Pendientes</span>
                    </div>
                </div>
                <div class="stat-item success">
                    <i class="fas fa-check-circle"></i>
                    <div>
                        <span class="stat-value">${stats.completed || 0}</span>
                        <span class="stat-label">Aprobados</span>
                    </div>
                </div>
                <div class="stat-item danger">
                    <i class="fas fa-times-circle"></i>
                    <div>
                        <span class="stat-value">${stats.failed || 0}</span>
                        <span class="stat-label">Rechazados</span>
                    </div>
                </div>
                <div class="stat-item info">
                    <i class="fas fa-dollar-sign"></i>
                    <div>
                        <span class="stat-value">$${(stats.totalPending || 0).toFixed(2)}</span>
                        <span class="stat-label">Monto Pendiente</span>
                    </div>
                </div>
            </div>

            <!-- Filter -->
            <div class="filter-bar">
                <select id="wdStatusFilter" class="filter-select">
                    <option value="">Todos</option>
                    <option value="PENDING" selected>Pendientes</option>
                    <option value="COMPLETED">Aprobados</option>
                    <option value="FAILED">Rechazados</option>
                </select>
            </div>

            <!-- Table -->
            <div class="data-table-container">
                <table class="data-table" id="withdrawalsTable">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Monto</th>
                            <th>Método</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${withdrawals.map(w => renderWithdrawalRow(w)).join('')}
                    </tbody>
                </table>
                ${withdrawals.length === 0 ? '<div class="empty-state"><i class="fas fa-check-double"></i><p>No hay retiros pendientes</p></div>' : ''}
            </div>
        </div>

        <style>
            .stats-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
            .stat-item { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px; display: flex; align-items: center; gap: 14px; }
            .stat-item i { font-size: 24px; }
            .stat-item.pending i { color: #ffb800; }
            .stat-item.success i { color: #00ff88; }
            .stat-item.danger i { color: #ff3366; }
            .stat-item.info i { color: #00d4ff; }
            .stat-value { display: block; font-size: 22px; font-weight: 900; font-family: 'Orbitron', mono; }
            .stat-label { font-size: 12px; color: var(--text-muted); }
            .filter-bar { margin-bottom: 16px; }
            .filter-select { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 16px; color: var(--text-primary); }
            .data-table-container { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; }
            .data-table { width: 100%; border-collapse: collapse; }
            .data-table th { background: var(--bg-tertiary); padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: var(--text-muted); }
            .data-table td { padding: 14px 16px; border-top: 1px solid var(--border-color); font-size: 13px; }
            .data-table tr:hover td { background: rgba(0,212,255,0.03); }
            .wd-user { display: flex; align-items: center; gap: 10px; }
            .wd-avatar { width: 32px; height: 32px; border-radius: 8px; background: var(--bg-tertiary); }
            .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
            .badge.pending { background: rgba(255,184,0,0.15); color: #ffb800; }
            .badge.completed { background: rgba(0,255,136,0.15); color: #00ff88; }
            .badge.failed { background: rgba(255,51,102,0.15); color: #ff3366; }
            .action-btn { padding: 6px 14px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 12px; margin-right: 6px; }
            .action-btn.approve { background: rgba(0,255,136,0.15); color: #00ff88; }
            .action-btn.approve:hover { background: rgba(0,255,136,0.3); }
            .action-btn.reject { background: rgba(255,51,102,0.15); color: #ff3366; }
            .action-btn.reject:hover { background: rgba(255,51,102,0.3); }
            .empty-state { text-align: center; padding: 40px; color: var(--text-muted); }
            .empty-state i { font-size: 40px; opacity: 0.3; display: block; margin-bottom: 12px; }
        </style>
        `;

        initWithdrawalEvents();
    } catch (err) {
        container.innerHTML = `<div class="error-state"><p>Error: ${err.message}</p></div>`;
    }
}

function renderWithdrawalRow(w) {
    const status = (w.status || 'PENDING').toUpperCase();
    const statusLabel = status === 'COMPLETED' ? 'Aprobado' : status === 'FAILED' ? 'Rechazado' : 'Pendiente';
    const date = w.created_at ? new Date(w.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const desc = w.description || '';
    const method = desc.includes('bank') ? '🏦 Banco' : desc.includes('paypal') ? '💳 PayPal' : '💰 Otro';

    return `
        <tr data-id="${w.id}" data-status="${status}">
            <td>
                <div class="wd-user">
                    <img class="wd-avatar" src="${w.user?.avatar_url || 'https://via.placeholder.com/32'}" onerror="this.src='https://via.placeholder.com/32'" />
                    <div>
                        <strong>${w.user?.username || 'N/A'}</strong>
                        <div style="font-size:11px;color:var(--text-muted);">${w.user?.email || ''}</div>
                    </div>
                </div>
            </td>
            <td><strong style="color:#ff3366;">-$${Number(w.amount).toFixed(2)}</strong></td>
            <td>${method}</td>
            <td>${date}</td>
            <td><span class="badge ${status.toLowerCase()}">${statusLabel}</span></td>
            <td>
                ${status === 'PENDING' ? `
                    <button class="action-btn approve" data-action="approve" data-id="${w.id}">✅ Aprobar</button>
                    <button class="action-btn reject" data-action="reject" data-id="${w.id}">❌ Rechazar</button>
                ` : '—'}
            </td>
        </tr>
    `;
}

function initWithdrawalEvents() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

    // Action buttons
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const action = btn.dataset.action;

            if (action === 'approve') {
                if (!confirm('¿Aprobar este retiro?')) return;
                const res = await fetch(`${API_BASE()}/admin/withdrawals/${id}/approve`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                alert(data.message || 'Aprobado');
            } else {
                const reason = prompt('Razón del rechazo:');
                if (!reason) return;
                const res = await fetch(`${API_BASE()}/admin/withdrawals/${id}/reject`, {
                    method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason })
                });
                const data = await res.json();
                alert(data.message || 'Rechazado');
            }
            location.reload();
        });
    });

    // Filter
    document.getElementById('wdStatusFilter')?.addEventListener('change', (e) => {
        const filter = e.target.value;
        document.querySelectorAll('#withdrawalsTable tbody tr').forEach(row => {
            row.style.display = !filter || row.dataset.status === filter ? '' : 'none';
        });
    });
}
