// =====================================================
// User Wallet / Monedero Virtual Page
// =====================================================

import API from '../api.js';
import { getStoredUser, isAuthenticated } from '../auth.js';
import { showLoading, formatCurrency } from '../ui-helpers.js';

export async function renderWallet(container) {
    if (!isAuthenticated()) {
        window.location.hash = '#/login';
        return;
    }

    showLoading(container);

    try {
        const user = getStoredUser();

        // Fetch wallet data in parallel
        const [balanceRes, historyRes] = await Promise.all([
            API.payments.getBalance().catch(() => ({ success: false })),
            API.payments.getHistory().catch(() => ({ success: false }))
        ]);

        const balance = balanceRes.data?.balance ?? balanceRes.data ?? user?.balance ?? 0;
        const transactions = historyRes.data || [];

        container.innerHTML = `
        <div class="wallet-page">
            <div class="container">
                <div class="page-header">
                    <h1 class="page-title">
                        <i class="fas fa-wallet"></i>
                        Mi Monedero
                    </h1>
                    <p class="page-subtitle">Administra tu saldo, recargas y transacciones</p>
                </div>

                <!-- Balance Card -->
                <div class="wallet-balance-card">
                    <div class="balance-bg-effect"></div>
                    <div class="balance-content">
                        <div class="balance-label">
                            <i class="fas fa-coins"></i> Saldo Disponible
                        </div>
                        <div class="balance-amount">${formatCurrency(balance)}</div>
                        <div class="balance-currency">MXN</div>
                    </div>
                    <div class="balance-actions">
                        <button class="wallet-btn primary" id="btnTopUp">
                            <i class="fas fa-plus-circle"></i>
                            Recargar Saldo
                        </button>
                        <button class="wallet-btn outline" id="btnWithdraw" ${Number(balance) <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-down"></i>
                            Retirar
                        </button>
                    </div>
                </div>

                <!-- Quick Top-Up Options -->
                <div class="topup-section">
                    <h2 class="section-title">
                        <i class="fas fa-bolt" style="color: #ffb800;"></i>
                        Recarga Rápida
                    </h2>
                    <div class="topup-grid">
                        ${[50, 100, 200, 500, 1000].map(amount => `
                            <button class="topup-option" data-amount="${amount}">
                                <span class="topup-amount">${formatCurrency(amount)}</span>
                                <span class="topup-label">MXN</span>
                            </button>
                        `).join('')}
                        <button class="topup-option custom" id="btnCustomAmount">
                            <span class="topup-amount"><i class="fas fa-edit"></i></span>
                            <span class="topup-label">Otro monto</span>
                        </button>
                    </div>
                </div>

                <!-- Transaction History -->
                <div class="wallet-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <i class="fas fa-history" style="color: var(--primary);"></i>
                            Historial de Transacciones
                        </h2>
                        <select class="wallet-filter" id="txFilter">
                            <option value="all">Todas</option>
                            <option value="topup">Recargas</option>
                            <option value="purchase">Compras</option>
                            <option value="prize">Premios</option>
                            <option value="refund">Reembolsos</option>
                        </select>
                    </div>

                    <div class="transactions-list" id="transactionsList">
                        ${transactions.length > 0 ? renderTransactions(transactions) : `
                            <div class="empty-transactions">
                                <i class="fas fa-receipt"></i>
                                <p>No hay transacciones aún</p>
                                <span>Realiza tu primera recarga para empezar</span>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Withdrawal Section -->
                <div class="wallet-section" id="withdrawSection" style="display:none;">
                    <h2 class="section-title">
                        <i class="fas fa-university" style="color: #00ff88;"></i>
                        Retirar Fondos
                    </h2>
                    <div class="withdraw-card">
                        <form id="withdrawForm">
                            <div class="withdraw-form-row">
                                <div class="form-group">
                                    <label>Monto a retirar (MXN)</label>
                                    <input type="number" id="withdrawAmount" min="50" step="10" placeholder="Mín. $50" required class="withdraw-input">
                                    <span class="form-hint">Mínimo: $50 MXN</span>
                                </div>
                                <div class="form-group">
                                    <label>Método de retiro</label>
                                    <select id="withdrawMethod" required class="withdraw-input">
                                        <option value="bank_transfer">🏦 Transferencia Bancaria</option>
                                        <option value="paypal">💳 PayPal</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Datos de cuenta</label>
                                <textarea id="withdrawAccount" rows="3" required class="withdraw-input" placeholder="CLABE interbancaria, número de cuenta PayPal, etc."></textarea>
                            </div>
                            <div class="withdraw-summary">
                                <div class="withdraw-summary-row">
                                    <span>Monto solicitado</span>
                                    <span id="withdrawDisplay">$0.00</span>
                                </div>
                                <div class="withdraw-summary-row">
                                    <span>Tiempo estimado</span>
                                    <span>1-3 días hábiles</span>
                                </div>
                            </div>
                            <div style="display:flex; gap:12px;">
                                <button type="submit" class="wallet-btn primary" style="flex:1;justify-content:center;">
                                    <i class="fas fa-paper-plane"></i> Solicitar Retiro
                                </button>
                                <button type="button" class="wallet-btn outline" id="btnCancelWithdraw">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Withdrawal History -->
                <div class="wallet-section" id="withdrawalsHistory"></div>

                <!-- Info Cards -->
                <div class="wallet-info-grid">
                    <div class="wallet-info-card">
                        <i class="fas fa-shield-alt" style="color: #00ff88;"></i>
                        <h4>Pagos Seguros</h4>
                        <p>Todas las transacciones están protegidas con cifrado SSL y procesadas por Stripe</p>
                    </div>
                    <div class="wallet-info-card">
                        <i class="fas fa-trophy" style="color: #ffd700;"></i>
                        <h4>Gana Premios</h4>
                        <p>Los premios de torneos se depositan a tu monedero automáticamente al ganar</p>
                    </div>
                    <div class="wallet-info-card">
                        <i class="fas fa-clock" style="color: var(--primary);"></i>
                        <h4>Retiros Rápidos</h4>
                        <p>Retira a tu cuenta bancaria o PayPal en 1-3 días hábiles</p>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .wallet-page { padding: 30px 0 60px; }

            /* Balance Card */
            .wallet-balance-card {
                position: relative;
                background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(0, 255, 136, 0.1));
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 20px;
                padding: 40px;
                margin-bottom: 32px;
                overflow: hidden;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 24px;
            }
            .balance-bg-effect {
                position: absolute;
                top: -50%;
                right: -20%;
                width: 300px;
                height: 300px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
                pointer-events: none;
            }
            .balance-content { position: relative; z-index: 1; }
            .balance-label {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: var(--text-secondary);
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 600;
            }
            .balance-amount {
                font-family: 'Orbitron', sans-serif;
                font-size: 48px;
                font-weight: 900;
                background: linear-gradient(90deg, #00d4ff, #00ff88, #00d4ff);
                background-size: 200% auto;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: balanceShine 4s linear infinite;
                line-height: 1.1;
            }
            @keyframes balanceShine { to { background-position: 200% center; } }
            .balance-currency {
                font-size: 14px;
                color: var(--text-muted);
                margin-top: 4px;
                letter-spacing: 2px;
            }
            .balance-actions {
                display: flex;
                gap: 12px;
                position: relative;
                z-index: 1;
                flex-wrap: wrap;
            }
            .wallet-btn {
                padding: 14px 28px;
                border-radius: 12px;
                font-weight: 700;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                transition: all 0.3s;
                border: none;
            }
            .wallet-btn.primary {
                background: linear-gradient(135deg, #00d4ff, #00ff88);
                color: #000;
            }
            .wallet-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4); }
            .wallet-btn.outline {
                background: transparent;
                border: 2px solid var(--border-color);
                color: var(--text-primary);
            }
            .wallet-btn.outline:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
            .wallet-btn:disabled { opacity: 0.4; cursor: not-allowed; }

            /* Top-Up Grid */
            .topup-section { margin-bottom: 32px; }
            .topup-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 12px;
                margin-top: 16px;
            }
            .topup-option {
                background: var(--bg-card);
                border: 2px solid var(--border-color);
                border-radius: 14px;
                padding: 20px 12px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
            }
            .topup-option:hover {
                border-color: var(--primary);
                background: rgba(0, 212, 255, 0.05);
                transform: translateY(-3px);
                box-shadow: 0 6px 20px rgba(0, 212, 255, 0.2);
            }
            .topup-option.custom { border-style: dashed; }
            .topup-amount {
                display: block;
                font-family: 'Orbitron', sans-serif;
                font-weight: 700;
                font-size: 18px;
                margin-bottom: 4px;
            }
            .topup-label { font-size: 12px; color: var(--text-muted); }

            /* Transactions */
            .wallet-section { margin-bottom: 32px; }
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                flex-wrap: wrap;
                gap: 12px;
            }
            .wallet-filter {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                padding: 8px 16px;
                color: var(--text-primary);
                font-size: 13px;
            }
            .transactions-list {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 14px;
                overflow: hidden;
            }
            .tx-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid var(--border-color);
                transition: background 0.2s;
            }
            .tx-item:last-child { border-bottom: none; }
            .tx-item:hover { background: rgba(0, 212, 255, 0.03); }
            .tx-left { display: flex; align-items: center; gap: 14px; }
            .tx-icon {
                width: 42px;
                height: 42px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }
            .tx-icon.topup { background: rgba(0, 255, 136, 0.15); color: #00ff88; }
            .tx-icon.purchase { background: rgba(255, 107, 53, 0.15); color: #ff6b35; }
            .tx-icon.prize { background: rgba(255, 215, 0, 0.15); color: #ffd700; }
            .tx-icon.refund { background: rgba(138, 43, 226, 0.15); color: #8a2be2; }
            .tx-icon.subscription { background: rgba(0, 212, 255, 0.15); color: #00d4ff; }
            .tx-icon.fee { background: rgba(108, 117, 125, 0.15); color: #8b95a5; }
            .tx-info h4 { font-size: 14px; margin-bottom: 2px; }
            .tx-info span { font-size: 12px; color: var(--text-muted); }
            .tx-right { text-align: right; }
            .tx-amount-user {
                font-weight: 700;
                font-family: 'Orbitron', monospace;
                font-size: 15px;
            }
            .tx-amount-user.positive { color: #00ff88; }
            .tx-amount-user.negative { color: #ff3366; }
            .tx-date { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

            .empty-transactions {
                text-align: center;
                padding: 50px 20px;
                color: var(--text-muted);
            }
            .empty-transactions i { font-size: 40px; opacity: 0.3; margin-bottom: 12px; }
            .empty-transactions p { font-weight: 600; margin-bottom: 4px; color: var(--text-secondary); }
            .empty-transactions span { font-size: 13px; }

            /* Info Cards */
            .wallet-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 16px;
            }
            .wallet-info-card {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: 14px;
                padding: 24px;
                text-align: center;
            }
            .wallet-info-card i { font-size: 28px; margin-bottom: 12px; }
            .wallet-info-card h4 { font-size: 15px; margin-bottom: 8px; }
            .wallet-info-card p { font-size: 13px; color: var(--text-muted); line-height: 1.5; }

            /* Withdrawal */
            .withdraw-card {
                background: var(--bg-card);
                border: 1px solid rgba(0,255,136,0.2);
                border-radius: 14px;
                padding: 24px;
            }
            .withdraw-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
            .withdraw-input {
                width: 100%;
                padding: 10px 14px;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-color);
                border-radius: 10px;
                color: var(--text-primary);
                font-size: 14px;
                resize: vertical;
            }
            .withdraw-input:focus { border-color: #00ff88; outline: none; }
            .form-group { margin-bottom: 14px; }
            .form-group label { display: block; font-weight: 600; font-size: 13px; margin-bottom: 6px; }
            .form-hint { font-size: 11px; color: var(--text-muted); margin-top: 4px; display: block; }
            .withdraw-summary {
                background: rgba(0,255,136,0.05);
                border: 1px solid rgba(0,255,136,0.15);
                border-radius: 10px;
                padding: 12px 16px;
                margin-bottom: 16px;
            }
            .withdraw-summary-row {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                font-size: 13px;
            }
            .withdraw-summary-row span:last-child { font-weight: 700; }
            .tx-icon.withdrawal { background: rgba(0,255,136,0.15); color: #00ff88; }

            .wd-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 16px;
                border-bottom: 1px solid var(--border-color);
            }
            .wd-item:last-child { border-bottom: none; }
            .wd-status {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 3px 10px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 700;
            }
            .wd-status.pending { background: rgba(255,184,0,0.15); color: #ffb800; }
            .wd-status.completed { background: rgba(0,255,136,0.15); color: #00ff88; }
            .wd-status.failed { background: rgba(255,51,102,0.15); color: #ff3366; }

            @media (max-width: 768px) {
                .balance-amount { font-size: 32px; }
                .wallet-balance-card { padding: 24px; flex-direction: column; text-align: center; }
                .balance-actions { justify-content: center; }
                .withdraw-form-row { grid-template-columns: 1fr; }
            }
        </style>
        `;

        initWalletEvents();

    } catch (error) {
        console.error('Wallet error:', error);
        container.innerHTML = `
        <div class="container">
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error al cargar el monedero</h3>
                <p>${error.message}</p>
                <a href="#/" class="btn btn-primary">Volver al inicio</a>
            </div>
        </div>
        `;
    }
}

function renderTransactions(transactions) {
    return transactions.map(tx => {
        const info = getTxInfo(tx);
        const date = tx.created_at
            ? new Date(tx.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
            : '';

        return `
            <div class="tx-item" data-type="${info.type}">
                <div class="tx-left">
                    <div class="tx-icon ${info.type}">
                        <i class="${info.icon}"></i>
                    </div>
                    <div class="tx-info">
                        <h4>${info.title}</h4>
                        <span>${tx.metadata?.description || tx.description || info.subtitle}</span>
                    </div>
                </div>
                <div class="tx-right">
                    <div class="tx-amount-user ${info.isPositive ? 'positive' : 'negative'}">
                        ${info.isPositive ? '+' : '-'}${formatCurrency(Math.abs(Number(tx.amount) || 0))}
                    </div>
                    <div class="tx-date">${date}</div>
                </div>
            </div>
        `;
    }).join('');
}

function getTxInfo(tx) {
    const status = tx.status || '';
    const type = tx.metadata?.type || tx.type || '';

    if (type.includes('topup') || type.includes('BALANCE_TOPUP') || status === 'succeeded') {
        return { type: 'topup', icon: 'fas fa-plus-circle', title: 'Recarga de saldo', subtitle: 'Depósito a monedero', isPositive: true };
    }
    if (type.includes('subscription') || type.includes('SUBSCRIPTION')) {
        return { type: 'subscription', icon: 'fas fa-credit-card', title: 'Suscripción', subtitle: 'Pago de plan', isPositive: false };
    }
    if (type.includes('name') || type.includes('NAME_CHANGE')) {
        return { type: 'purchase', icon: 'fas fa-pen', title: 'Cambio de nombre', subtitle: 'Servicio premium', isPositive: false };
    }
    if (type.includes('PRIZE_CREDIT') || type.includes('prize_credit')) {
        return { type: 'prize', icon: 'fas fa-trophy', title: '🏆 Premio de torneo', subtitle: 'Depositado en tu wallet', isPositive: true };
    }
    if (type.includes('prize') || type.includes('PRIZE')) {
        return { type: 'prize', icon: 'fas fa-trophy', title: 'Premio de torneo', subtitle: 'Ganancia por competición', isPositive: true };
    }
    if (type.includes('WITHDRAWAL') || type.includes('withdrawal')) {
        return { type: 'withdrawal', icon: 'fas fa-university', title: 'Retiro', subtitle: 'Retiro a cuenta bancaria', isPositive: false };
    }
    if (type.includes('refund') || type.includes('REFUND')) {
        return { type: 'refund', icon: 'fas fa-undo', title: 'Reembolso', subtitle: 'Devolución', isPositive: true };
    }
    if (type.includes('entry') || type.includes('TOURNAMENT_ENTRY')) {
        return { type: 'purchase', icon: 'fas fa-trophy', title: 'Entrada a torneo', subtitle: 'Inscripción', isPositive: false };
    }

    // Default based on amount
    const amount = Number(tx.amount) || 0;
    return {
        type: amount >= 0 ? 'topup' : 'purchase',
        icon: amount >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down',
        title: amount >= 0 ? 'Ingreso' : 'Cargo',
        subtitle: tx.description || 'Transacción',
        isPositive: amount >= 0
    };
}

function initWalletEvents() {
    // Top-up buttons
    document.querySelectorAll('.topup-option[data-amount]').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseInt(btn.dataset.amount);
            handleTopUp(amount);
        });
    });

    // Custom amount
    document.getElementById('btnCustomAmount')?.addEventListener('click', () => {
        const amount = prompt('Ingresa el monto a recargar (MXN):');
        if (amount && !isNaN(amount) && Number(amount) >= 10) {
            handleTopUp(Number(amount));
        } else if (amount) {
            window.showToast('error', 'Monto inválido', 'El monto mínimo es $10 MXN');
        }
    });

    // Top-up button
    document.getElementById('btnTopUp')?.addEventListener('click', () => {
        const amount = prompt('Ingresa el monto a recargar (MXN):');
        if (amount && !isNaN(amount) && Number(amount) >= 10) {
            handleTopUp(Number(amount));
        } else if (amount) {
            window.showToast('error', 'Monto inválido', 'El monto mínimo es $10 MXN');
        }
    });

    // Withdraw button — toggle withdraw form
    document.getElementById('btnWithdraw')?.addEventListener('click', () => {
        const section = document.getElementById('withdrawSection');
        if (section) {
            section.style.display = section.style.display === 'none' ? '' : 'none';
            if (section.style.display !== 'none') {
                section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    // Cancel withdraw
    document.getElementById('btnCancelWithdraw')?.addEventListener('click', () => {
        document.getElementById('withdrawSection').style.display = 'none';
    });

    // Live update withdraw amount display
    document.getElementById('withdrawAmount')?.addEventListener('input', (e) => {
        const val = Number(e.target.value) || 0;
        document.getElementById('withdrawDisplay').textContent = formatCurrency(val);
    });

    // Withdraw form submit
    document.getElementById('withdrawForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = Number(document.getElementById('withdrawAmount').value);
        const method = document.getElementById('withdrawMethod').value;
        const account = document.getElementById('withdrawAccount').value;

        if (amount < 50) {
            window.showToast('error', 'Monto inválido', 'El monto mínimo de retiro es $50 MXN');
            return;
        }
        if (!account.trim()) {
            window.showToast('error', 'Datos requeridos', 'Ingresa los datos de tu cuenta');
            return;
        }

        try {
            const result = await API.payments.withdraw(amount, method, account);
            window.showToast('success', '¡Solicitud creada!', result.message || `Retiro de $${amount} MXN en proceso`);
            document.getElementById('withdrawSection').style.display = 'none';
            // Refresh wallet
            renderWallet(document.getElementById('app'));
        } catch (error) {
            window.showToast('error', 'Error', error.message || 'No se pudo procesar el retiro');
        }
    });

    // Load withdrawal history
    loadWithdrawalHistory();

    // Transaction filter
    document.getElementById('txFilter')?.addEventListener('change', (e) => {
        const filter = e.target.value;
        document.querySelectorAll('.tx-item').forEach(item => {
            if (filter === 'all' || item.dataset.type === filter) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

async function handleTopUp(amount) {
    try {
        window.showToast('info', 'Redirigiendo...', 'Te llevaremos a la pasarela de pago');
        const result = await API.payments.createCheckout(amount, 'mxn', `Recarga de saldo: $${amount} MXN`);
        if (result.url) {
            window.location.href = result.url;
        } else if (result.data?.url) {
            window.location.href = result.data.url;
        } else {
            window.showToast('error', 'Error', 'No se pudo crear la sesión de pago');
        }
    } catch (error) {
        window.showToast('error', 'Error', error.message || 'No se pudo procesar la recarga');
    }
}

async function loadWithdrawalHistory() {
    const container = document.getElementById('withdrawalsHistory');
    if (!container) return;

    try {
        const res = await API.payments.getWithdrawals().catch(() => ({ data: [] }));
        const withdrawals = res.data || [];
        if (withdrawals.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <h2 class="section-title">
                <i class="fas fa-university" style="color: #00ff88;"></i>
                Historial de Retiros
            </h2>
            <div class="transactions-list">
                ${withdrawals.map(w => {
                    const status = (w.status || 'PENDING').toUpperCase();
                    const statusClass = status === 'COMPLETED' ? 'completed' : status === 'FAILED' ? 'failed' : 'pending';
                    const statusLabel = status === 'COMPLETED' ? '✅ Completado' : status === 'FAILED' ? '❌ Rechazado' : '⏳ Pendiente';
                    const date = w.created_at ? new Date(w.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                    return `
                        <div class="wd-item">
                            <div style="display:flex;align-items:center;gap:12px;">
                                <div class="tx-icon withdrawal"><i class="fas fa-university"></i></div>
                                <div>
                                    <div style="font-weight:600;font-size:14px;">Retiro</div>
                                    <div style="font-size:12px;color:var(--text-muted);">${date} · ${w.description || ''}</div>
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-weight:700;font-family:'Orbitron',mono;color:#ff3366;">-${formatCurrency(Number(w.amount) || 0)}</div>
                                <span class="wd-status ${statusClass}">${statusLabel}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Error loading withdrawals:', err);
    }
}

