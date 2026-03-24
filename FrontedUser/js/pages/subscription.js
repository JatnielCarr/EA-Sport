import API from '../api.js';
import { showLoading, showToast } from '../ui-helpers.js';
import { isAuthenticated } from '../auth.js';

// Track billing preference
let isYearlyBilling = false;

export async function renderSubscription(container) {
    showLoading(container);

    let plans = [];
    let currentSubscription = null;

    try {
        const plansResponse = await API.subscriptions.getPlans();
        plans = plansResponse.data || [];

        if (isAuthenticated()) {
            try {
                const subResponse = await API.subscriptions.getMySubscription();
                currentSubscription = subResponse.data;
            } catch (e) {
                console.log('No subscription found');
            }
        }
    } catch (error) {
        console.error('Error loading plans:', error);
    }

    container.innerHTML = `
    <div class="subscription-page fade-in">
        <!-- Hero Section -->
        <section class="pricing-hero">
            <div class="hero-glow"></div>
            <div class="container">
                <div class="hero-badge">
                    <i class="fas fa-crown"></i> ADMINISTRADOR DE TORNEOS
                </div>
                <h1>Crea y administra <span class="gradient-text">tus propios torneos</span></h1>
                <p class="hero-subtitle">Suscríbete para crear torneos, invitar jugadores por URL y cobrar cuota de inscripción</p>
                
                <!-- Billing Toggle -->
                <div class="billing-toggle">
                    <span class="toggle-option ${!isYearlyBilling ? 'active' : ''}" data-billing="monthly">Mensual</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="billingToggle" ${isYearlyBilling ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-option ${isYearlyBilling ? 'active' : ''}" data-billing="yearly">
                        Anual
                        <span class="save-tag">Ahorra 17%</span>
                    </span>
                </div>
            </div>
        </section>

        <!-- Current Plan Banner (if subscribed) -->
        ${currentSubscription && currentSubscription.plan !== 'FREE' ? `
        <section class="current-plan-section">
            <div class="container">
                <div class="current-plan-card ${currentSubscription.plan.toLowerCase()}">
                    <div class="plan-info">
                        <span class="plan-badge">${currentSubscription.plan}</span>
                        <span class="plan-status">Plan Activo</span>
                    </div>
                    ${currentSubscription.current_period_end ? `
                    <div class="plan-period">
                        <i class="fas fa-calendar-alt"></i>
                        Válido hasta: <strong>${new Date(currentSubscription.current_period_end).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </div>
                    ` : ''}
                    ${currentSubscription.cancel_at_period_end ? `
                    <div class="cancel-notice">
                        <i class="fas fa-info-circle"></i>
                        Tu suscripción se cancelará al final del período
                    </div>
                    ` : ''}
                </div>
            </div>
        </section>
        ` : ''}

        <!-- Pricing Cards -->
        <section class="pricing-section">
            <div class="container">
                <div class="pricing-grid">
                    ${renderPlanCard(getDefaultDemoPlan(), currentSubscription, isYearlyBilling)}
                    ${renderPlanCard(plans.find(p => p.id === 'FREE') || getDefaultFreePlan(), currentSubscription, isYearlyBilling)}
                    ${renderPlanCard(plans.find(p => p.id === 'STANDARD') || getDefaultStandardPlan(), currentSubscription, isYearlyBilling)}
                    ${renderPlanCard(plans.find(p => p.id === 'PREMIUM') || getDefaultPremiumPlan(), currentSubscription, isYearlyBilling, true)}
                </div>
            </div>
        </section>

        <!-- Features Comparison -->
        <section class="comparison-section">
            <div class="container">
                <h2 class="section-title">
                    <i class="fas fa-table"></i>
                    Comparación de Planes
                </h2>
                
                <div class="comparison-table-wrapper">
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>Característica</th>
                                <th><i class="fas fa-user"></i> Gratis</th>
                                <th><i class="fas fa-shield-alt"></i> Standard</th>
                                <th class="highlight"><i class="fas fa-gem"></i> Premium</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><i class="fas fa-trophy"></i> Unirse a torneos por invitación</td>
                                <td><i class="fas fa-check text-success"></i></td>
                                <td><i class="fas fa-check text-success"></i></td>
                                <td class="highlight"><i class="fas fa-check text-success"></i></td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-plus-circle"></i> Crear torneos</td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td><i class="fas fa-check text-success"></i></td>
                                <td class="highlight"><i class="fas fa-check text-success"></i></td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-users"></i> Máx. jugadores por torneo</td>
                                <td><span class="text-muted">-</span></td>
                                <td><strong>Hasta 16</strong></td>
                                <td class="highlight"><strong>Hasta 64</strong></td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-list"></i> Torneos activos simultáneos</td>
                                <td><span class="text-muted">-</span></td>
                                <td><strong>Hasta 3</strong></td>
                                <td class="highlight"><strong>Hasta 10</strong></td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-link"></i> URL de invitación</td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td class="highlight"><i class="fas fa-check text-success"></i></td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-money-bill"></i> Cobrar cuota de inscripción</td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td class="highlight"><i class="fas fa-check text-success"></i></td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-chart-line"></i> Estadísticas Avanzadas</td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td class="highlight"><i class="fas fa-check text-success"></i></td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-ban"></i> Sin Anuncios</td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td class="highlight"><i class="fas fa-check text-success"></i></td>
                            </tr>
                            <tr>
                                <td><i class="fas fa-headset"></i> Soporte Prioritario</td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td class="highlight"><i class="fas fa-check text-success"></i></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- Testimonials -->
        <section class="testimonials-section">
            <div class="container">
                <h2 class="section-title">
                    <i class="fas fa-quote-left"></i>
                    Lo que dicen nuestros jugadores
                </h2>
                
                <div class="testimonials-grid">
                    <div class="testimonial-card featured">
                        <div class="testimonial-avatar premium">
                            <i class="fas fa-user-astronaut"></i>
                        </div>
                        <p class="testimonial-text">"Crear mi propio torneo y compartir el link de invitación fue super fácil. Mis amigos se registraron en minutos y la plataforma maneja todo."</p>
                        <div class="testimonial-author">
                            <strong>ObsidianKing</strong>
                            <span class="badge-premium">ADMIN</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- FAQ Section -->
        <section class="faq-section">
            <div class="container">
                <h2 class="section-title">
                    <i class="fas fa-question-circle"></i>
                    Preguntas Frecuentes
                </h2>
                
                <div class="faq-grid">
                    <div class="faq-item">
                        <div class="faq-question">
                            <i class="fas fa-credit-card"></i>
                            ¿Qué métodos de pago aceptan?
                        </div>
                        <p class="faq-answer">Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express) a través de Stripe, la plataforma de pagos más segura del mundo.</p>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <i class="fas fa-undo"></i>
                            ¿Puedo cancelar en cualquier momento?
                        </div>
                        <p class="faq-answer">Sí, puedes cancelar tu suscripción cuando quieras desde tu perfil. Mantendrás el acceso a los beneficios hasta el final de tu período de facturación actual.</p>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <i class="fas fa-sync"></i>
                            ¿Puedo cambiar de plan?
                        </div>
                        <p class="faq-answer">¡Claro! Puedes actualizar o bajar de plan en cualquier momento. Si actualizas, solo pagas la diferencia prorrateada. Si bajas, el cambio se aplica al siguiente período.</p>
                    </div>
                    
                    <div class="faq-item">
                        <div class="faq-question">
                            <i class="fas fa-shield-alt"></i>
                            ¿Mis pagos son seguros?
                        </div>
                        <p class="faq-answer">Absolutamente. Utilizamos Stripe para procesar todos los pagos, lo que garantiza encriptación de nivel bancario y cumplimiento con PCI DSS.</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section">
            <div class="container">
                <div class="cta-card">
                    <div class="cta-content">
                        <h2>¿Listo para dominar?</h2>
                        <p>Únete a miles de gamers que ya están disfrutando de los beneficios premium</p>
                    </div>
                    <a href="#pricing-section" class="btn btn-accent btn-lg">
                        <i class="fas fa-rocket"></i> Comenzar Ahora
                    </a>
                </div>
            </div>
        </section>
    </div>

    <style>
        .subscription-page {
            overflow-x: hidden;
        }

        /* Hero Section */
        .pricing-hero {
            position: relative;
            padding: 4rem 0 3rem;
            text-align: center;
            overflow: hidden;
        }

        .hero-glow {
            position: absolute;
            top: -50%;
            left: 50%;
            transform: translateX(-50%);
            width: 800px;
            height: 800px;
            background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
            pointer-events: none;
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1.5rem;
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(138, 43, 226, 0.2));
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 50px;
            font-size: 0.85rem;
            font-weight: 600;
            letter-spacing: 1px;
            margin-bottom: 1.5rem;
            color: var(--accent);
        }

        .pricing-hero h1 {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
            line-height: 1.2;
        }

        .gradient-text {
            background: linear-gradient(135deg, var(--accent), #667eea, #f093fb);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .hero-subtitle {
            font-size: 1.2rem;
            opacity: 0.8;
            max-width: 600px;
            margin: 0 auto 2rem;
        }

        /* Billing Toggle */
        .billing-toggle {
            display: inline-flex;
            align-items: center;
            gap: 1rem;
            padding: 0.5rem;
            background: var(--glass-bg);
            border-radius: 50px;
            border: 1px solid var(--glass-border);
        }

        .toggle-option {
            padding: 0.5rem 1rem;
            font-weight: 500;
            opacity: 0.6;
            transition: all 0.3s;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .toggle-option.active {
            opacity: 1;
            font-weight: 600;
        }

        .save-tag {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 0.2rem 0.6rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 700;
        }

        .toggle-switch {
            position: relative;
            width: 50px;
            height: 26px;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .toggle-slider {
            position: absolute;
            cursor: pointer;
            inset: 0;
            background: var(--bg-secondary);
            border-radius: 26px;
            transition: 0.3s;
        }

        .toggle-slider::before {
            content: '';
            position: absolute;
            height: 20px;
            width: 20px;
            left: 3px;
            bottom: 3px;
            background: var(--accent);
            border-radius: 50%;
            transition: 0.3s;
        }

        .toggle-switch input:checked + .toggle-slider::before {
            transform: translateX(24px);
        }

        /* Current Plan Section */
        .current-plan-section {
            padding: 1rem 0;
        }

        .current-plan-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
            padding: 1.5rem 2rem;
            border-radius: var(--radius-lg);
            background: var(--glass-bg);
            border: 2px solid;
        }

        .current-plan-card.premium {
            border-color: #f093fb;
            background: linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(245, 87, 108, 0.1));
        }

        .plan-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .plan-badge {
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-weight: 700;
            font-size: 0.9rem;
        }

        .current-plan-card.premium .plan-badge {
            background: linear-gradient(135deg, #f093fb, #f5576c);
            color: white;
        }

        .plan-period {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            opacity: 0.9;
        }

        .cancel-notice {
            color: #ffc107;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        /* Pricing Cards */
        .pricing-section {
            padding: 2rem 0 4rem;
        }

        .pricing-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            align-items: stretch;
        }

        @media (max-width: 1024px) {
            .pricing-grid {
                grid-template-columns: 1fr;
                max-width: 450px;
                margin: 0 auto;
            }
        }

        .pricing-card {
            position: relative;
            background: var(--glass-bg);
            border: 2px solid var(--glass-border);
            border-radius: 24px;
            padding: 2.5rem 2rem;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
        }

        .pricing-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        }

        .pricing-card.popular {
            border-color: var(--accent);
            transform: scale(1.05);
            z-index: 2;
        }

        .pricing-card.popular:hover {
            transform: scale(1.05) translateY(-8px);
        }

        .pricing-card.current {
            border-color: #10b981;
        }

        .popular-tag {
            position: absolute;
            top: -14px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, var(--accent), #667eea);
            color: var(--bg-primary);
            padding: 0.5rem 1.5rem;
            border-radius: 50px;
            font-size: 0.8rem;
            font-weight: 700;
            white-space: nowrap;
        }

        .current-tag {
            position: absolute;
            top: -14px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 0.5rem 1.5rem;
            border-radius: 50px;
            font-size: 0.8rem;
            font-weight: 700;
        }

        .plan-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .plan-icon.free { color: #64748b; }
        .plan-icon.premium { color: #f093fb; }

        .plan-name {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .plan-description {
            font-size: 0.95rem;
            opacity: 0.7;
            margin-bottom: 1.5rem;
        }

        .plan-price {
            margin-bottom: 2rem;
        }

        .price-row {
            display: flex;
            align-items: baseline;
            gap: 0.25rem;
        }

        .currency {
            font-size: 1.5rem;
            font-weight: 600;
        }

        .amount {
            font-size: 3.5rem;
            font-weight: 800;
            line-height: 1;
        }

        .interval {
            font-size: 1rem;
            opacity: 0.7;
        }

        .monthly-equivalent {
            font-size: 0.9rem;
            opacity: 0.6;
            margin-top: 0.5rem;
        }

        .plan-features {
            list-style: none;
            padding: 0;
            margin: 0 0 2rem;
            flex-grow: 1;
        }

        .plan-features li {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.6rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .plan-features li:last-child {
            border-bottom: none;
        }

        .plan-features .icon {
            width: 20px;
            text-align: center;
        }

        .plan-features .icon.check { color: #10b981; }
        .plan-features .icon.x { color: #64748b; }

        .plan-action {
            margin-top: auto;
        }

        .plan-action .btn {
            width: 100%;
            padding: 1rem;
            font-size: 1rem;
            font-weight: 600;
            border-radius: 12px;
        }

        .btn-pro {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
        }

        .btn-pro:hover {
            transform: scale(1.02);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        .btn-premium {
            background: linear-gradient(135deg, #f093fb, #f5576c);
            color: white;
            border: none;
        }

        .btn-premium:hover {
            transform: scale(1.02);
            box-shadow: 0 10px 30px rgba(240, 147, 251, 0.4);
        }

        .btn-demo {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
        }

        .btn-demo:hover {
            transform: scale(1.02);
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
        }

        .plan-icon.demo { color: #10b981; }

        /* Section Titles */
        .section-title {
            text-align: center;
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 3rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
        }

        .section-title i {
            color: var(--accent);
        }

        /* Comparison Table */
        .comparison-section {
            padding: 4rem 0;
            background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.2), transparent);
        }

        .comparison-table-wrapper {
            overflow-x: auto;
            border-radius: var(--radius-lg);
            border: 1px solid var(--glass-border);
        }

        .comparison-table {
            width: 100%;
            border-collapse: collapse;
            background: var(--glass-bg);
        }

        .comparison-table th,
        .comparison-table td {
            padding: 1rem 1.5rem;
            text-align: center;
            border-bottom: 1px solid var(--glass-border);
        }

        .comparison-table th:first-child,
        .comparison-table td:first-child {
            text-align: left;
        }

        .comparison-table thead th {
            background: var(--bg-secondary);
            font-weight: 600;
            font-size: 1rem;
        }

        .comparison-table .highlight {
            background: rgba(102, 126, 234, 0.1);
        }

        .comparison-table thead .highlight {
            background: rgba(102, 126, 234, 0.2);
        }

        .comparison-table td i {
            font-size: 1.1rem;
        }

        .text-success { color: #10b981; }
        .text-muted { color: #64748b; }

        .badge-pro, .badge-premium {
            padding: 0.25rem 0.75rem;
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: 700;
        }

        .badge-pro {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }

        .badge-premium {
            background: linear-gradient(135deg, #f093fb, #f5576c);
            color: white;
        }

        /* Testimonials */
        .testimonials-section {
            padding: 4rem 0;
        }

        .testimonials-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
        }

        @media (max-width: 1024px) {
            .testimonials-grid {
                grid-template-columns: 1fr;
            }
        }

        .testimonial-card {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            transition: all 0.3s;
        }

        .testimonial-card:hover {
            transform: translateY(-5px);
        }

        .testimonial-card.featured {
            border-color: #f093fb;
            background: linear-gradient(135deg, rgba(240, 147, 251, 0.05), rgba(245, 87, 108, 0.05));
        }

        .testimonial-avatar {
            width: 60px;
            height: 60px;
            background: var(--bg-secondary);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin: 0 auto 1rem;
            color: #667eea;
        }

        .testimonial-avatar.premium {
            background: linear-gradient(135deg, #f093fb, #f5576c);
            color: white;
        }

        .testimonial-text {
            font-style: italic;
            opacity: 0.9;
            margin-bottom: 1rem;
            line-height: 1.6;
        }

        .testimonial-author {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
        }

        /* FAQ */
        .faq-section {
            padding: 4rem 0;
            background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.2), transparent);
        }

        .faq-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
            max-width: 900px;
            margin: 0 auto;
        }

        @media (max-width: 768px) {
            .faq-grid {
                grid-template-columns: 1fr;
            }
        }

        .faq-item {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-lg);
            padding: 1.5rem;
        }

        .faq-question {
            font-weight: 600;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .faq-question i {
            color: var(--accent);
        }

        .faq-answer {
            opacity: 0.8;
            font-size: 0.95rem;
            line-height: 1.6;
            margin: 0;
        }

        /* CTA Section */
        .cta-section {
            padding: 4rem 0;
        }

        .cta-card {
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(138, 43, 226, 0.1));
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 24px;
            padding: 3rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 2rem;
        }

        .cta-content h2 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .cta-content p {
            opacity: 0.8;
            margin: 0;
        }

        .btn-accent {
            background: linear-gradient(135deg, var(--accent), #667eea);
            color: var(--bg-primary);
            border: none;
        }

        .btn-lg {
            padding: 1rem 2rem;
            font-size: 1.1rem;
        }

        @media (max-width: 768px) {
            .pricing-hero h1 {
                font-size: 2rem;
            }

            .pricing-card.popular {
                transform: none;
            }

            .cta-card {
                flex-direction: column;
                text-align: center;
            }
        }
    </style>
    `;

    // Attach Event Listeners
    const toggle = container.querySelector('#billingToggle');
    if (toggle) {
        toggle.addEventListener('change', (e) => {
            isYearlyBilling = e.target.checked;
            renderSubscription(container);
        });
    }

    // Toggle options click
    container.querySelectorAll('.toggle-option').forEach(opt => {
        opt.addEventListener('click', () => {
            isYearlyBilling = opt.dataset.billing === 'yearly';
            renderSubscription(container);
        });
    });

    // Subscribe buttons
    container.querySelectorAll('.subscribe-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!isAuthenticated()) {
                showToast('warning', 'Inicia sesión', 'Debes iniciar sesión para suscribirte');
                window.location.hash = '#/login';
                return;
            }

            const plan = btn.dataset.plan;
            const interval = isYearlyBilling ? 'yearly' : 'monthly';

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

            try {
                const response = await API.subscriptions.checkout(plan, interval);

                if (response.success && response.url) {
                    window.location.href = response.url;
                } else {
                    showToast('error', 'Error', response.error || 'No se pudo iniciar el pago');
                    btn.disabled = false;
                    btn.innerHTML = 'Suscribirse';
                }
            } catch (error) {
                console.error(error);
                showToast('error', 'Error', 'Error al procesar la solicitud');
                btn.disabled = false;
                btn.innerHTML = 'Suscribirse';
            }
        });
    });

    // Cancel button
    const cancelBtn = container.querySelector('#cancelSubscription');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
            if (!confirm('¿Estás seguro de que deseas cancelar tu suscripción? Mantendrás el acceso hasta el fin del período.')) return;

            cancelBtn.disabled = true;
            cancelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelando...';

            try {
                const response = await API.subscriptions.cancel();
                if (response.success) {
                    showToast('success', 'Suscripción cancelada', 'Mantendrás el acceso hasta el fin del período');
                    renderSubscription(container);
                } else {
                    showToast('error', 'Error', response.error);
                    cancelBtn.disabled = false;
                    cancelBtn.innerHTML = 'Cancelar Suscripción';
                }
            } catch (error) {
                showToast('error', 'Error', 'No se pudo cancelar la suscripción');
                cancelBtn.disabled = false;
                cancelBtn.innerHTML = 'Cancelar Suscripción';
            }
        });
    }
}

function getDefaultDemoPlan() {
    return {
        id: 'DEMO',
        name: '🧪 Demo',
        description: 'Solo $0.10 MXN para probar el flujo de pago',
        monthlyPrice: 0.10,
        yearlyPrice: 0.10,
        features: [
            { text: 'Solo para demostración', included: true },
            { text: 'Cobra $0.10 MXN reales', included: true },
            { text: 'Verifica flujo de Stripe', included: true },
            { text: 'Cancélalo después de probar', included: true }
        ]
    };
}

function getDefaultFreePlan() {
    return {
        id: 'FREE',
        name: 'Gratis',
        description: 'Perfecto para empezar tu aventura gaming',
        features: [
            { text: 'Torneos gratuitos', included: true },
            { text: 'Ver partidas en vivo', included: true },
            { text: 'Perfil básico', included: true },
            { text: 'Torneos premium', included: false },
            { text: 'Estadísticas avanzadas', included: false },
            { text: 'Badge exclusivo', included: false }
        ]
    };
}

function getDefaultStandardPlan() {
    return {
        id: 'STANDARD',
        name: 'Standard',
        description: 'Crea y administra tus propios torneos',
        monthlyPrice: 499,
        yearlyPrice: 4990,
        features: [
            { text: 'Crear torneos', included: true },
            { text: 'Hasta 16 jugadores por torneo', included: true },
            { text: 'Hasta 3 torneos activos', included: true },
            { text: 'URL de invitación', included: true },
            { text: 'Cobrar cuota de inscripción', included: true },
            { text: 'Estadísticas avanzadas', included: true },
            { text: 'Sin anuncios', included: true }
        ]
    };
}

function getDefaultPremiumPlan() {
    return {
        id: 'PREMIUM',
        name: 'Premium',
        description: 'La experiencia definitiva para campeones',
        monthlyPrice: 999,
        yearlyPrice: 9990,
        features: [
            { text: 'Todo lo de Pro', included: true },
            { text: 'Torneos exclusivos', included: true },
            { text: 'Badge LEGEND legendario', included: true },
            { text: 'Soporte prioritario', included: true },
            { text: 'Acceso anticipado', included: true }
        ]
    };
}

function renderPlanCard(plan, currentSubscription, isYearly, isPopular = false) {
    const isCurrentPlan = currentSubscription?.plan === plan.id;
    const price = plan.id === 'FREE' ? 0 : (isYearly ? plan.yearlyPrice : plan.monthlyPrice);
    const interval = plan.id === 'FREE' ? '' : (isYearly ? '/año' : '/mes');

    const iconClass = plan.id === 'FREE' ? 'fa-user' : plan.id === 'DEMO' ? 'fa-flask' : 'fa-gem';
    const btnClass = plan.id === 'PREMIUM' ? 'btn-premium' : plan.id === 'DEMO' ? 'btn-demo' : 'btn-outline';

    // Get features array
    let features = plan.features;
    if (Array.isArray(features) && typeof features[0] === 'string') {
        features = features.map(f => ({ text: f, included: true }));
    }

    return `
    <div class="pricing-card ${isPopular ? 'popular' : ''} ${isCurrentPlan ? 'current' : ''}">
        ${isPopular && !isCurrentPlan ? '<div class="popular-tag"><i class="fas fa-fire"></i> Más Popular</div>' : ''}
        ${isCurrentPlan ? '<div class="current-tag"><i class="fas fa-check"></i> Tu Plan</div>' : ''}
        
        <div class="plan-icon ${plan.id.toLowerCase()}">
            <i class="fas ${iconClass}"></i>
        </div>
        
        <h3 class="plan-name">${plan.name}</h3>
        <p class="plan-description">${plan.description || ''}</p>
        
        <div class="plan-price">
            <div class="price-row">
                <span class="currency">$</span>
                <span class="amount">${price.toLocaleString()}</span>
                <span class="interval">${interval}</span>
            </div>
            ${isYearly && plan.monthlyPrice ? `
            <div class="monthly-equivalent">Equivalente a $${Math.round(plan.yearlyPrice / 12)}/mes</div>
            ` : ''}
        </div>
        
        <ul class="plan-features">
            ${features.map(f => `
                <li>
                    <span class="icon ${f.included ? 'check' : 'x'}">
                        <i class="fas ${f.included ? 'fa-check' : 'fa-times'}"></i>
                    </span>
                    <span>${f.text}</span>
                </li>
            `).join('')}
        </ul>
        
        <div class="plan-action">
            ${plan.id === 'FREE' ? `
                <button class="btn btn-outline" disabled>Plan Gratuito</button>
            ` : isCurrentPlan ? `
                <button class="btn btn-outline" id="cancelSubscription">
                    <i class="fas fa-times"></i> Cancelar Suscripción
                </button>
            ` : `
                <button class="btn ${btnClass} subscribe-btn" data-plan="${plan.id}">
                    ${currentSubscription?.plan === 'FREE' || !currentSubscription ? `<i class="fas fa-bolt"></i> Suscribirse` : `<i class="fas fa-arrow-up"></i> Cambiar Plan`}
                </button>
            `}
        </div>
    </div>
    `;
}
