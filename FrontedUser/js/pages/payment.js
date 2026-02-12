import API from '../api.js';
import { showLoading, showToast } from '../ui-helpers.js';
import { isAuthenticated } from '../auth.js';

export async function renderPayment(container) {
    showLoading(container);

    let balance = 0;

    // Fetch current balance if authenticated
    if (isAuthenticated()) {
        try {
            const response = await API.payment.getBalance();
            if (response.success) {
                balance = parseFloat(response.balance) || 0;
            }
        } catch (e) {
            console.log('Could not fetch balance');
        }
    }

    // Check for canceled payment
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const canceled = urlParams.get('canceled');

    container.innerHTML = `
    <div class="payment-page fade-in">
        <!-- Animated Background -->
        <div class="page-background">
            <div class="gradient-orb orb-1"></div>
            <div class="gradient-orb orb-2"></div>
            <div class="gradient-orb orb-3"></div>
        </div>

        <div class="container">
            ${canceled ? `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-circle"></i>
                El pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.
            </div>
            ` : ''}

            <!-- Hero Section -->
            <header class="payment-hero">
                <div class="hero-badge">
                    <i class="fas fa-wallet"></i> CENTRO DE PAGOS
                </div>
                <h1>Recarga tu <span class="gradient-text-animated">cuenta</span></h1>
                <p>Añade fondos para participar en torneos premium y exclusivos</p>
            </header>

            <!-- Main Grid -->
            <div class="payment-main-grid">
                <!-- Balance Card with Animated Gradient -->
                <div class="balance-card-wrapper">
                    <div class="balance-card">
                        <div class="balance-glow"></div>
                        <div class="balance-content">
                            <div class="balance-header">
                                <i class="fas fa-coins"></i>
                                <span>Tu Saldo Actual</span>
                            </div>
                            <div class="balance-amount">
                                <span class="currency">$</span>
                                <span class="value">${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                <span class="code">MXN</span>
                            </div>
                            <p class="balance-tip">
                                <i class="fas fa-info-circle"></i>
                                Disponible para inscripciones a torneos
                            </p>
                        </div>
                        <div class="balance-decoration">
                            <i class="fas fa-gem"></i>
                        </div>
                    </div>
                </div>

                <!-- Payment Options -->
                <div class="payment-options-card">
                    <h2><i class="fas fa-bolt"></i> Selecciona un monto</h2>
                    
                    <div class="amount-grid">
                        <button class="amount-card" data-amount="100">
                            <div class="amount-value">$100</div>
                            <div class="amount-label">MXN</div>
                            <div class="amount-hover-effect"></div>
                        </button>
                        <button class="amount-card" data-amount="250">
                            <div class="amount-value">$250</div>
                            <div class="amount-label">MXN</div>
                            <div class="amount-hover-effect"></div>
                        </button>
                        <button class="amount-card popular" data-amount="500">
                            <div class="popular-badge">⚡ Popular</div>
                            <div class="amount-value">$500</div>
                            <div class="amount-label">MXN</div>
                            <div class="amount-hover-effect"></div>
                        </button>
                        <button class="amount-card" data-amount="1000">
                            <div class="amount-value">$1,000</div>
                            <div class="amount-label">MXN</div>
                            <div class="bonus-badge">+5% Bonus</div>
                            <div class="amount-hover-effect"></div>
                        </button>
                    </div>

                    <!-- Custom Amount -->
                    <div class="custom-amount-section">
                        <div class="custom-amount-label">
                            <i class="fas fa-edit"></i> O ingresa tu propio monto
                        </div>
                        <div class="custom-amount-input">
                            <span class="prefix">$</span>
                            <input type="number" id="customAmount" placeholder="500" min="50" step="50">
                            <span class="suffix">MXN</span>
                            <button id="payCustomBtn" class="btn-pay" disabled>
                                <i class="fas fa-credit-card"></i>
                                <span>Pagar</span>
                            </button>
                        </div>
                        <small class="min-note">Mínimo: $50 MXN</small>
                    </div>
                </div>
            </div>

            <!-- Features Section -->
            <div class="features-section">
                <div class="feature-card">
                    <div class="feature-icon" style="--gradient: linear-gradient(135deg, #667eea, #764ba2);">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h4>100% Seguro</h4>
                    <p>Encriptación SSL y protección de datos</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon" style="--gradient: linear-gradient(135deg, #00d4ff, #00b4d8);">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <h4>Instantáneo</h4>
                    <p>Tu saldo se actualiza al momento</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon" style="--gradient: linear-gradient(135deg, #f093fb, #f5576c);">
                        <i class="fab fa-stripe"></i>
                    </div>
                    <h4>Powered by Stripe</h4>
                    <p>La plataforma de pagos más segura</p>
                </div>
            </div>

            <!-- Payment History -->
            <div class="history-section">
                <div class="history-header">
                    <h3><i class="fas fa-history"></i> Historial de Transacciones</h3>
                </div>
                <div id="paymentHistoryList" class="history-list">
                    <div class="loading-state">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Cargando historial...</span>
                    </div>
                </div>
            </div>

            <!-- Payment Methods -->
            <div class="payment-methods">
                <span>Métodos aceptados:</span>
                <div class="method-icons">
                    <i class="fab fa-cc-visa"></i>
                    <i class="fab fa-cc-mastercard"></i>
                    <i class="fab fa-cc-amex"></i>
                    <i class="fab fa-cc-discover"></i>
                </div>
            </div>
        </div>
    </div>

    <style>
        .payment-page {
            position: relative;
            min-height: 100vh;
            overflow: hidden;
        }

        /* Animated Background */
        .page-background {
            position: fixed;
            inset: 0;
            z-index: -1;
            overflow: hidden;
        }

        .gradient-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.5;
            animation: float 20s ease-in-out infinite;
        }

        .orb-1 {
            width: 600px;
            height: 600px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            top: -200px;
            left: -100px;
            animation-delay: 0s;
        }

        .orb-2 {
            width: 400px;
            height: 400px;
            background: linear-gradient(135deg, #00d4ff, #00b4d8);
            bottom: -100px;
            right: -100px;
            animation-delay: -5s;
        }

        .orb-3 {
            width: 300px;
            height: 300px;
            background: linear-gradient(135deg, #f093fb, #f5576c);
            top: 50%;
            left: 60%;
            animation-delay: -10s;
        }

        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(30px, -30px) rotate(5deg); }
            50% { transform: translate(-20px, 20px) rotate(-5deg); }
            75% { transform: translate(10px, -10px) rotate(3deg); }
        }

        /* Hero Section */
        .payment-hero {
            text-align: center;
            padding: 3rem 0 2rem;
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1.5rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 50px;
            font-size: 0.85rem;
            font-weight: 600;
            letter-spacing: 1px;
            margin-bottom: 1.5rem;
            color: var(--accent);
        }

        .payment-hero h1 {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
        }

        .gradient-text-animated {
            background: linear-gradient(90deg, #00d4ff, #667eea, #f093fb, #f5576c, #00d4ff);
            background-size: 300% 100%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: gradient-shift 6s ease-in-out infinite;
        }

        @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        .payment-hero p {
            font-size: 1.2rem;
            opacity: 0.8;
        }

        /* Alert */
        .alert {
            padding: 1rem 1.5rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            backdrop-filter: blur(10px);
        }

        .alert-warning {
            background: rgba(255, 193, 7, 0.15);
            border: 1px solid rgba(255, 193, 7, 0.3);
            color: #ffc107;
        }

        /* Main Grid */
        .payment-main-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 2rem;
            margin-bottom: 3rem;
        }

        @media (max-width: 1024px) {
            .payment-main-grid {
                grid-template-columns: 1fr;
            }
        }

        /* Balance Card */
        .balance-card-wrapper {
            position: relative;
        }

        .balance-card {
            position: relative;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(240, 147, 251, 0.2));
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 24px;
            padding: 2rem;
            backdrop-filter: blur(20px);
            overflow: hidden;
            height: 100%;
        }

        .balance-glow {
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: conic-gradient(from 0deg, #667eea, #764ba2, #f093fb, #f5576c, #00d4ff, #667eea);
            animation: spin-glow 10s linear infinite;
            opacity: 0.1;
        }

        @keyframes spin-glow {
            100% { transform: rotate(360deg); }
        }

        .balance-content {
            position: relative;
            z-index: 1;
        }

        .balance-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.9rem;
            opacity: 0.9;
            margin-bottom: 1.5rem;
        }

        .balance-header i {
            font-size: 1.2rem;
            color: #ffd700;
        }

        .balance-amount {
            display: flex;
            align-items: baseline;
            gap: 0.25rem;
            margin-bottom: 1rem;
        }

        .balance-amount .currency {
            font-size: 2rem;
            font-weight: 600;
            opacity: 0.8;
        }

        .balance-amount .value {
            font-size: 3.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #fff, #e0e0e0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .balance-amount .code {
            font-size: 1rem;
            opacity: 0.6;
            margin-left: 0.5rem;
        }

        .balance-tip {
            font-size: 0.85rem;
            opacity: 0.7;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .balance-decoration {
            position: absolute;
            bottom: -20px;
            right: -20px;
            font-size: 8rem;
            opacity: 0.1;
            color: #fff;
        }

        /* Payment Options Card */
        .payment-options-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 2rem;
        }

        .payment-options-card h2 {
            font-size: 1.3rem;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .payment-options-card h2 i {
            color: var(--accent);
        }

        /* Amount Grid */
        .amount-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
            .amount-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        .amount-card {
            position: relative;
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 1.5rem 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            overflow: hidden;
            text-align: center;
        }

        .amount-card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
            opacity: 0;
            transition: opacity 0.3s;
        }

        .amount-card:hover::before {
            opacity: 0.2;
        }

        .amount-card:hover {
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-4px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }

        .amount-card.popular {
            border-color: var(--accent);
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(102, 126, 234, 0.1));
        }

        .popular-badge {
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(90deg, #00d4ff, #667eea);
            color: #000;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 700;
            white-space: nowrap;
        }

        .bonus-badge {
            position: absolute;
            bottom: 8px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(90deg, #10b981, #059669);
            color: #fff;
            padding: 0.2rem 0.6rem;
            border-radius: 20px;
            font-size: 0.65rem;
            font-weight: 700;
        }

        .amount-value {
            position: relative;
            font-size: 1.8rem;
            font-weight: 800;
            color: #fff;
            z-index: 1;
        }

        .amount-label {
            position: relative;
            font-size: 0.8rem;
            opacity: 0.7;
            z-index: 1;
            color: #fff;
        }

        /* Custom Amount */
        .custom-amount-section {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 1.5rem;
        }

        .custom-amount-label {
            font-size: 0.9rem;
            margin-bottom: 1rem;
            opacity: 0.9;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .custom-amount-input {
            display: flex;
            align-items: center;
            gap: 0;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 0.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .custom-amount-input .prefix,
        .custom-amount-input .suffix {
            padding: 0.75rem 1rem;
            color: rgba(255, 255, 255, 0.5);
            font-weight: 600;
        }

        .custom-amount-input input {
            flex: 1;
            background: transparent;
            border: none;
            color: #fff;
            font-size: 1.2rem;
            font-weight: 600;
            padding: 0.75rem;
            min-width: 100px;
        }

        .custom-amount-input input::placeholder {
            color: rgba(255, 255, 255, 0.3);
        }

        .custom-amount-input input:focus {
            outline: none;
        }

        .btn-pay {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            border-radius: 10px;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            white-space: nowrap;
        }

        .btn-pay:hover:not(:disabled) {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        .btn-pay:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .min-note {
            display: block;
            margin-top: 0.75rem;
            opacity: 0.5;
            font-size: 0.8rem;
        }

        /* Features Section */
        .features-section {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
            margin-bottom: 3rem;
        }

        @media (max-width: 768px) {
            .features-section {
                grid-template-columns: 1fr;
            }
        }

        .feature-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
            transition: all 0.3s;
        }

        .feature-card:hover {
            transform: translateY(-5px);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .feature-icon {
            width: 60px;
            height: 60px;
            margin: 0 auto 1rem;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: #fff;
            background: var(--gradient);
        }

        .feature-card h4 {
            margin-bottom: 0.5rem;
        }

        .feature-card p {
            font-size: 0.9rem;
            opacity: 0.7;
            margin: 0;
        }

        /* History Section */
        .history-section {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 2rem;
            margin-bottom: 2rem;
        }

        .history-header {
            margin-bottom: 1.5rem;
        }

        .history-header h3 {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.2rem;
        }

        .history-header i {
            color: var(--accent);
        }

        .history-list {
            max-height: 300px;
            overflow-y: auto;
        }

        .loading-state {
            text-align: center;
            padding: 2rem;
            opacity: 0.7;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
        }

        .history-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            margin-bottom: 0.75rem;
            transition: all 0.3s;
        }

        .history-item:hover {
            background: rgba(0, 0, 0, 0.3);
        }

        .history-item .amount {
            font-weight: 700;
            font-size: 1.1rem;
        }

        .history-item .date {
            font-size: 0.85rem;
            opacity: 0.7;
        }

        .history-item .status {
            padding: 0.35rem 0.85rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .status.succeeded {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }

        .status.pending {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
        }

        .status.failed {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }

        .empty-state {
            text-align: center;
            padding: 2rem;
            opacity: 0.6;
        }

        .empty-state i {
            font-size: 2rem;
            margin-bottom: 1rem;
            opacity: 0.5;
        }

        /* Payment Methods */
        .payment-methods {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 1.5rem;
            opacity: 0.7;
        }

        .method-icons {
            display: flex;
            gap: 0.75rem;
            font-size: 1.8rem;
        }

        @media (max-width: 768px) {
            .payment-hero h1 {
                font-size: 2rem;
            }

            .balance-amount .value {
                font-size: 2.5rem;
            }
        }
    </style>
    `;

    // Attach Event Listeners
    container.querySelectorAll('.amount-card').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!isAuthenticated()) {
                showToast('warning', 'Inicia sesión', 'Debes iniciar sesión para recargar');
                window.location.hash = '#/login';
                return;
            }
            const amount = parseInt(btn.dataset.amount);
            initiatePayment(amount);
        });
    });

    const customInput = container.querySelector('#customAmount');
    const customBtn = container.querySelector('#payCustomBtn');

    customInput.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (value >= 50) {
            customBtn.removeAttribute('disabled');
        } else {
            customBtn.setAttribute('disabled', 'true');
        }
    });

    customBtn.addEventListener('click', () => {
        if (!isAuthenticated()) {
            showToast('warning', 'Inicia sesión', 'Debes iniciar sesión para recargar');
            window.location.hash = '#/login';
            return;
        }
        const amount = parseFloat(customInput.value);
        if (amount >= 50) {
            initiatePayment(amount);
        }
    });

    // Load payment history
    if (isAuthenticated()) {
        loadPaymentHistory(container);
    } else {
        container.querySelector('#paymentHistoryList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lock"></i>
                <p>Inicia sesión para ver tu historial</p>
            </div>
        `;
    }
}

async function loadPaymentHistory(container) {
    const historyList = container.querySelector('#paymentHistoryList');

    try {
        const response = await API.payment.getHistory();
        if (response.success && response.data.length > 0) {
            historyList.innerHTML = response.data.map(payment => `
                <div class="history-item">
                    <div>
                        <div class="amount">$${parseFloat(payment.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${payment.currency.toUpperCase()}</div>
                        <div class="date">${new Date(payment.created_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</div>
                    </div>
                    <span class="status ${payment.status}">${payment.status === 'succeeded' ? '✓ Completado' :
                    payment.status === 'pending' ? '⏳ Pendiente' : '✗ Fallido'
                }</span>
                </div>
            `).join('');
        } else {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No tienes transacciones aún</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading payment history:', error);
        historyList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar historial</p>
            </div>
        `;
    }
}

async function initiatePayment(amount) {
    const buttons = document.querySelectorAll('.amount-card, #payCustomBtn');
    buttons.forEach(btn => btn.disabled = true);

    try {
        const response = await API.payment.createCheckout(
            amount,
            'mxn',
            `Recarga de saldo: $${amount} MXN`
        );

        if (response.success && response.url) {
            window.location.href = response.url;
        } else {
            showToast('error', 'Error', response.error || 'No se pudo iniciar el pago.');
            buttons.forEach(btn => btn.disabled = false);
        }
    } catch (error) {
        console.error(error);
        showToast('error', 'Error', 'Ocurrió un error al procesar la solicitud.');
        buttons.forEach(btn => btn.disabled = false);
    }
}
