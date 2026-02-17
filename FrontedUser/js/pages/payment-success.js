import API from '../api.js';
import { showToast } from '../ui-helpers.js';

export async function renderPaymentSuccess(container) {
    // Get session_id from URL if available
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const sessionId = urlParams.get('session_id');

    container.innerHTML = `
    <div class="container fade-in">
        <div class="success-container">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h1>¡Pago Exitoso!</h1>
            <p class="success-message">Tu pago ha sido procesado correctamente.</p>
            <p class="success-detail">El saldo ha sido añadido a tu cuenta.</p>
            
            <div class="balance-display" id="balanceDisplay">
                <span class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando saldo...</span>
            </div>
            
            <div class="success-actions">
                <a href="#/torneos" class="btn btn-primary">
                    <i class="fas fa-trophy"></i> Ver Torneos
                </a>
                <a href="#/perfil" class="btn btn-outline">
                    <i class="fas fa-user"></i> Mi Perfil
                </a>
            </div>
        </div>
    </div>

    <style>
        .success-container {
            max-width: 500px;
            margin: 4rem auto;
            text-align: center;
            padding: 3rem;
            background: var(--glass-bg);
            border-radius: var(--radius-lg);
            border: 1px solid var(--glass-border);
        }
        
        .success-icon {
            font-size: 5rem;
            color: var(--success);
            margin-bottom: 1.5rem;
            animation: successPulse 0.6s ease-out;
        }
        
        @keyframes successPulse {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
        }
        
        .success-container h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, var(--success), var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .success-message {
            font-size: 1.1rem;
            opacity: 0.9;
            margin-bottom: 0.5rem;
        }
        
        .success-detail {
            opacity: 0.7;
            margin-bottom: 2rem;
        }
        
        .balance-display {
            background: linear-gradient(135deg, var(--accent), var(--accent-dark));
            padding: 1.5rem 2rem;
            border-radius: var(--radius-md);
            margin-bottom: 2rem;
            color: var(--bg-primary);
        }
        
        .balance-display .label {
            font-size: 0.9rem;
            opacity: 0.8;
            margin-bottom: 0.5rem;
        }
        
        .balance-display .amount {
            font-size: 2.5rem;
            font-weight: 700;
        }
        
        .success-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .success-actions .btn {
            min-width: 150px;
        }
    </style>
    `;

    // Verify payment session with Stripe and then fetch balance
    try {
        const balanceDisplay = container.querySelector('#balanceDisplay');

        // Step 1: Verify the payment session if we have a session_id
        if (sessionId) {
            try {
                balanceDisplay.innerHTML = `
                    <span class="loading"><i class="fas fa-spinner fa-spin"></i> Verificando pago...</span>
                `;
                const verifyResponse = await API.payment.verifySession(sessionId);
                if (verifyResponse.success) {
                    console.log('✅ Payment verified:', verifyResponse);
                } else {
                    console.warn('Payment verification returned:', verifyResponse);
                }
            } catch (verifyError) {
                console.warn('Could not verify session (might already be verified):', verifyError.message);
            }
        }

        // Step 2: Fetch updated balance
        const response = await API.payment.getBalance();
        if (response.success) {
            balanceDisplay.innerHTML = `
                <div class="label">Tu saldo actual</div>
                <div class="amount">$${parseFloat(response.balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</div>
            `;
        }
    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}
