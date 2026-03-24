// =====================================================
// Modal de Suscripción - UI de Pago Premium
// =====================================================

import API from '../api.js';
import { showToast } from '../ui-helpers.js';
import { isAuthenticated } from '../auth.js';

let isYearlyBilling = false;
let currentPlan = 'STANDARD'; // Default plan

// Planes de suscripción
const PLANS = {
    DEMO: {
        id: 'DEMO',
        name: 'Demo',
        description: 'Plan de prueba para verificar pagos',
        icon: 'fa-flask',
        monthlyPrice: 0.10,
        yearlyPrice: 0.10,
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981, #059669)',
        maxUsers: null,
        features: [
            'Solo para demostración',
            'Cobra $0.10 MXN real',
            'Verifica flujo de Stripe',
            'Cancélalo después de probar'
        ]
    },
    STANDARD: {
        id: 'STANDARD',
        name: 'Standard',
        description: 'Para jugadores serios que quieren más',
        icon: 'fa-rocket',
        monthlyPrice: 499,
        yearlyPrice: 4990,
        color: '#667eea',
        gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
        maxUsers: null,
        features: [
            'Todo lo de Gratis',
            'Torneos premium',
            'Estadísticas avanzadas',
            'Badge STANDARD exclusivo',
            'Sin anuncios'
        ]
    },
    PREMIUM: {
        id: 'PREMIUM',
        name: 'Premium',
        description: 'La experiencia definitiva para campeones',
        icon: 'fa-gem',
        monthlyPrice: 999,
        yearlyPrice: 9990,
        color: '#f093fb',
        gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
        maxUsers: null,
        features: [
            'Todo lo de Standard',
            'Torneos exclusivos',
            'Badge LEGEND legendario',
            'Soporte prioritario',
            'Acceso anticipado'
        ]
    }
};

/**
 * Abre el modal de suscripción para un plan específico
 * @param {string} planId - 'STANDARD' o 'PREMIUM'
 */
export function openSubscriptionModal(planId = 'STANDARD') {
    if (!isAuthenticated()) {
        showToast('warning', 'Inicia sesión', 'Debes iniciar sesión para suscribirte');
        window.location.hash = '#/login';
        return;
    }

    currentPlan = planId;
    createModal();
}

/**
 * Cierra el modal de suscripción
 */
export function closeSubscriptionModal() {
    const modal = document.getElementById('subscription-modal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

/**
 * Crea y muestra el modal
 */
function createModal() {
    // Remover modal existente si lo hay
    const existing = document.getElementById('subscription-modal');
    if (existing) existing.remove();

    const plan = PLANS[currentPlan];
    const price = isYearlyBilling ? plan.yearlyPrice : plan.monthlyPrice;
    const interval = isYearlyBilling ? 'año' : 'mes';
    const savings = isYearlyBilling ? Math.round((1 - (plan.yearlyPrice / (plan.monthlyPrice * 12))) * 100) : 0;

    const modal = document.createElement('div');
    modal.id = 'subscription-modal';
    modal.className = 'subscription-modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-container">
            <div class="modal-content">
                <button class="modal-close" id="closeModal">
                    <i class="fas fa-times"></i>
                </button>
                
                <!-- Header con gradiente -->
                <div class="modal-header" style="--plan-gradient: ${plan.gradient}">
                    <div class="plan-icon-large">
                        <i class="fas ${plan.icon}"></i>
                    </div>
                    <h2>Suscripción <span>${plan.name}</span></h2>
                    <p>${plan.description}</p>
                </div>
                
                <!-- Selector de Plan -->
                <div class="plan-selector">
                    <button class="plan-tab ${currentPlan === 'DEMO' ? 'active' : ''}" data-plan="DEMO">
                        <i class="fas fa-flask"></i>
                        Demo
                    </button>
                    <button class="plan-tab ${currentPlan === 'STANDARD' ? 'active' : ''}" data-plan="STANDARD">
                        <i class="fas fa-rocket"></i>
                        Standard
                    </button>
                    <button class="plan-tab ${currentPlan === 'PREMIUM' ? 'active' : ''}" data-plan="PREMIUM">
                        <i class="fas fa-gem"></i>
                        Premium
                    </button>
                </div>

                <!-- Toggle de Facturación -->
                <div class="billing-toggle-container">
                    <span class="${!isYearlyBilling ? 'active' : ''}">Mensual</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="billingToggle" ${isYearlyBilling ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <span class="${isYearlyBilling ? 'active' : ''}">
                        Anual
                        ${isYearlyBilling ? `<span class="save-badge">-${savings}%</span>` : ''}
                    </span>
                </div>

                <!-- Precio -->
                <div class="price-display" style="--plan-color: ${plan.color}">
                    <div class="price-main">
                        <span class="currency">$</span>
                        <span class="amount">${price.toLocaleString()}</span>
                        <span class="interval">/${interval}</span>
                    </div>
                    ${isYearlyBilling ? `
                        <div class="price-equivalent">
                            Equivalente a $${Math.round(plan.yearlyPrice / 12)}/mes
                        </div>
                    ` : ''}
                </div>

                <!-- Features -->
                <div class="features-list">
                    <h4>Incluye:</h4>
                    <ul>
                        ${plan.features.map(feature => `
                            <li>
                                <i class="fas fa-check"></i>
                                <span>${feature}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Botón de Pago -->
                <button class="btn-subscribe" id="subscribeBtn" style="--plan-gradient: ${plan.gradient}">
                    <i class="fas fa-credit-card"></i>
                    <span>Suscribirme a ${plan.name}</span>
                    <div class="btn-shine"></div>
                </button>

                <!-- Métodos de pago -->
                <div class="payment-methods">
                    <span>Pago seguro con</span>
                    <div class="payment-icons">
                        <i class="fab fa-cc-visa"></i>
                        <i class="fab fa-cc-mastercard"></i>
                        <i class="fab fa-cc-amex"></i>
                        <i class="fab fa-stripe"></i>
                    </div>
                </div>

                <!-- Garantía -->
                <div class="guarantee">
                    <i class="fas fa-shield-alt"></i>
                    <span>Cancela cuando quieras. Sin compromisos.</span>
                </div>
            </div>
        </div>
    `;

    // Agregar estilos
    if (!document.getElementById('subscription-modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'subscription-modal-styles';
        styles.textContent = getModalStyles();
        document.head.appendChild(styles);
    }

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Forzar reflow para animación
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });

    // Event listeners
    attachEventListeners();
}

/**
 * Adjunta los event listeners al modal
 */
function attachEventListeners() {
    // Cerrar modal
    document.getElementById('closeModal')?.addEventListener('click', closeSubscriptionModal);
    document.querySelector('.modal-backdrop')?.addEventListener('click', closeSubscriptionModal);

    // Cambiar plan
    document.querySelectorAll('.plan-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentPlan = tab.dataset.plan;
            createModal(); // Recrear modal con nuevo plan
        });
    });

    // Toggle facturación
    document.getElementById('billingToggle')?.addEventListener('change', (e) => {
        isYearlyBilling = e.target.checked;
        createModal(); // Recrear con nueva facturación
    });

    // Botón de suscripción
    document.getElementById('subscribeBtn')?.addEventListener('click', handleSubscribe);

    // Cerrar con ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeSubscriptionModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

/**
 * Maneja la suscripción
 */
async function handleSubscribe() {
    const btn = document.getElementById('subscribeBtn');
    if (!btn) return;

    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Procesando...</span>';

    try {
        const interval = isYearlyBilling ? 'yearly' : 'monthly';
        const response = await API.subscriptions.checkout(currentPlan, interval);

        if (response.success && response.url) {
            showToast('success', '¡Redirigiendo!', 'Te llevaremos a la página de pago...');

            // Pequeño delay para que el usuario vea el toast
            setTimeout(() => {
                window.location.href = response.url;
            }, 500);
        } else {
            showToast('error', 'Error', response.error || 'No se pudo iniciar el pago');
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    } catch (error) {
        console.error('Subscription error:', error);
        showToast('error', 'Error', 'Ocurrió un error al procesar la solicitud');
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}

/**
 * Retorna los estilos CSS del modal
 */
function getModalStyles() {
    return `
        .subscription-modal {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .subscription-modal.active {
            opacity: 1;
            visibility: visible;
        }

        .subscription-modal.closing {
            opacity: 0;
        }

        .modal-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
        }

        .modal-container {
            position: relative;
            max-width: 480px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            transform: scale(0.9) translateY(20px);
            transition: transform 0.3s ease;
        }

        .subscription-modal.active .modal-container {
            transform: scale(1) translateY(0);
        }

        .subscription-modal.closing .modal-container {
            transform: scale(0.9) translateY(20px);
        }

        .modal-content {
            background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            overflow: hidden;
            position: relative;
        }

        .modal-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            z-index: 10;
        }

        .modal-close:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: rotate(90deg);
        }

        .modal-header {
            padding: 3rem 2rem 2rem;
            text-align: center;
            background: var(--plan-gradient);
            position: relative;
            overflow: hidden;
        }

        .modal-header::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%);
        }

        .modal-header::after {
            content: '';
            position: absolute;
            bottom: -50%;
            left: -10%;
            right: -10%;
            height: 100%;
            background: linear-gradient(180deg, transparent 0%, #1a1a2e 80%);
        }

        .plan-icon-large {
            position: relative;
            z-index: 1;
            width: 80px;
            height: 80px;
            margin: 0 auto 1rem;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            color: white;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }

        .modal-header h2 {
            position: relative;
            z-index: 1;
            font-size: 1.8rem;
            font-weight: 800;
            color: white;
            margin-bottom: 0.5rem;
        }

        .modal-header h2 span {
            display: block;
        }

        .modal-header p {
            position: relative;
            z-index: 1;
            font-size: 0.95rem;
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
        }

        .plan-selector {
            display: flex;
            gap: 8px;
            padding: 1rem 1.5rem 0;
        }

        .plan-tab {
            flex: 1;
            padding: 0.75rem 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .plan-tab:hover {
            border-color: rgba(255, 255, 255, 0.2);
            color: white;
        }

        .plan-tab.active {
            background: rgba(255, 255, 255, 0.1);
            border-color: var(--accent, #00d4ff);
            color: white;
        }

        .billing-toggle-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 1.5rem;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.6);
        }

        .billing-toggle-container span.active {
            color: white;
            font-weight: 600;
        }

        .toggle-switch {
            position: relative;
            width: 50px;
            height: 26px;
            display: inline-block;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            inset: 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 26px;
            transition: 0.3s;
        }

        .slider::before {
            content: '';
            position: absolute;
            height: 20px;
            width: 20px;
            left: 3px;
            bottom: 3px;
            background: var(--accent, #00d4ff);
            border-radius: 50%;
            transition: 0.3s;
        }

        .toggle-switch input:checked + .slider::before {
            transform: translateX(24px);
        }

        .save-badge {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 700;
            margin-left: 4px;
        }

        .price-display {
            text-align: center;
            padding: 0 2rem 1.5rem;
        }

        .price-main {
            display: flex;
            align-items: baseline;
            justify-content: center;
            gap: 4px;
        }

        .price-main .currency {
            font-size: 1.8rem;
            font-weight: 600;
            color: var(--plan-color);
        }

        .price-main .amount {
            font-size: 4rem;
            font-weight: 900;
            background: linear-gradient(180deg, #fff 0%, #ccc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1;
        }

        .price-main .interval {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.6);
            margin-left: 4px;
        }

        .price-equivalent {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 0.5rem;
        }

        .features-list {
            padding: 0 2rem;
        }

        .features-list h4 {
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: rgba(255, 255, 255, 0.5);
            margin-bottom: 0.75rem;
        }

        .features-list ul {
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .features-list li {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0.6rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.85);
            font-size: 0.95rem;
        }

        .features-list li:last-child {
            border-bottom: none;
        }

        .features-list li i {
            color: #10b981;
            font-size: 0.9rem;
        }

        .btn-subscribe {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: calc(100% - 4rem);
            margin: 1.5rem 2rem;
            padding: 1.2rem 2rem;
            background: var(--plan-gradient);
            border: none;
            border-radius: 16px;
            color: white;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .btn-subscribe:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
        }

        .btn-subscribe:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }

        .btn-shine {
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shine 3s infinite;
        }

        @keyframes shine {
            0%, 100% { left: -100%; }
            50% { left: 100%; }
        }

        .payment-methods {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 0 2rem;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.4);
        }

        .payment-icons {
            display: flex;
            gap: 8px;
            font-size: 1.5rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .guarantee {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 1.5rem 2rem;
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .guarantee i {
            color: #10b981;
        }

        /* Responsive */
        @media (max-width: 480px) {
            .modal-content {
                border-radius: 20px 20px 0 0;
            }

            .modal-container {
                max-height: none;
                height: auto;
                position: absolute;
                bottom: 0;
                border-radius: 20px 20px 0 0;
            }

            .modal-header {
                padding: 2.5rem 1.5rem 1.5rem;
            }

            .modal-header h2 {
                font-size: 1.5rem;
            }

            .plan-selector,
            .features-list,
            .btn-subscribe,
            .payment-methods,
            .guarantee {
                padding-left: 1.5rem;
                padding-right: 1.5rem;
            }

            .btn-subscribe {
                width: calc(100% - 3rem);
                margin-left: 1.5rem;
                margin-right: 1.5rem;
            }

            .price-main .amount {
                font-size: 3rem;
            }
        }
    `;
}

// Inicializar listeners globales para botones de suscripción
export function initSubscriptionButtons() {
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-subscribe-plan]');
        if (target) {
            e.preventDefault();
            const plan = target.dataset.subscribePlan;
            openSubscriptionModal(plan);
        }
    });
}
