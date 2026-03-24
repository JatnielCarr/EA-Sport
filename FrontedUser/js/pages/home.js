// =====================================================
// Home Page - Landing Page Atractiva
// =====================================================

import API from '../api.js';
import { showLoading } from '../ui-helpers.js';
import { isAuthenticated, getStoredUser } from '../auth.js';
import { openSubscriptionModal } from '../components/subscription-modal.js';

export async function renderHome(container) {
    console.log('🏠 renderHome: Iniciando render de la página de inicio');
    showLoading(container);

    let games = [];

    try {
        const gamesRes = await API.games.getAll();
        games = gamesRes.data || gamesRes || [];
        console.log('🎮 Juegos cargados:', games.length);
    } catch (error) {
        console.error('Could not load games in home.js:', error);
    }

    try {

    const user = isAuthenticated() ? getStoredUser() : null;
    console.log('👤 Usuario autenticado:', !!user);

    container.innerHTML = `
    <!-- Hero Section Principal -->
    <section class="hero-main">
        <div class="hero-particles"></div>
        <div class="hero-gradient-orbs">
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
            <div class="orb orb-3"></div>
        </div>
        <div class="container">
            <div class="hero-main-content">
                <div class="hero-badge-animated">
                    <span class="pulse-dot"></span>
                    <span>🎮 La mejor plataforma de esports</span>
                    <span class="badge-glow"></span>
                </div>
                
                <h1 class="hero-main-title">
                    <span class="title-line">Tu portal hacia</span>
                    <span class="title-gradient">la gloria competitiva</span>
                </h1>
                
                <p class="hero-main-subtitle">
                    Compite en torneos épicos, crea tu clan, escala en el ranking mundial 
                    y conviértete en una leyenda del gaming. <strong>Miles de posibilidades te esperan.</strong>
                </p>
                
                <div class="hero-main-actions">
                    ${user ? `
                        <a href="#/dashboard" class="btn btn-hero-primary">
                            <i class="fas fa-gamepad"></i>
                            Mi Dashboard
                            <span class="btn-shine"></span>
                        </a>
                        <a href="#/torneos" class="btn btn-hero-secondary">
                            <i class="fas fa-trophy"></i>
                            Explorar Torneos
                        </a>
                    ` : `
                        <a href="#/registro" class="btn btn-hero-primary">
                            <i class="fas fa-rocket"></i>
                            Comenzar Ahora
                            <span class="btn-shine"></span>
                        </a>
                        <a href="#/torneos" class="btn btn-hero-secondary">
                            <i class="fas fa-eye"></i>
                            Ver Torneos
                        </a>
                    `}
                </div>
                
                <div class="hero-trust-badges">
                    <div class="trust-badge">
                        <i class="fas fa-shield-alt"></i>
                        <span>100% Seguro</span>
                    </div>
                    <div class="trust-badge">
                        <i class="fas fa-bolt"></i>
                        <span>Tiempo Real</span>
                    </div>
                    <div class="trust-badge">
                        <i class="fas fa-globe"></i>
                        <span>Comunidad Global</span>
                    </div>
                </div>
            </div>
            
            <div class="hero-stats-floating">
                <div class="floating-stat" style="--delay: 0s">
                    <div class="stat-icon-wrapper">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number counter" data-target="500">500+</span>
                        <span class="stat-text">Torneos Activos</span>
                    </div>
                </div>
                <div class="floating-stat" style="--delay: 0.1s">
                    <div class="stat-icon-wrapper secondary">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number counter" data-target="10000">10K+</span>
                        <span class="stat-text">Jugadores</span>
                    </div>
                </div>
                <div class="floating-stat" style="--delay: 0.2s">
                    <div class="stat-icon-wrapper accent">
                        <i class="fas fa-gamepad"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number counter" data-target="${games.length}">${games.length || 5}+</span>
                        <span class="stat-text">Juegos</span>
                    </div>
                </div>
                <div class="floating-stat" style="--delay: 0.3s">
                    <div class="stat-icon-wrapper warning">
                        <i class="fas fa-coins"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">$50K+</span>
                        <span class="stat-text">En Premios</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="hero-scroll-indicator">
            <span>Descubre más</span>
            <i class="fas fa-chevron-down"></i>
        </div>
    </section>

    <!-- Sección de Características -->
    <section class="features-showcase">
        <div class="container">
            <div class="section-header-centered">
                <span class="section-badge">
                    <i class="fas fa-star"></i>
                    Características
                </span>
                <h2 class="section-title-large">
                    <span class="gradient-text">Miles de cosas</span> que puedes hacer
                </h2>
                <p class="section-description">
                    Desde competir en torneos hasta crear tu propio clan, ApexTournament te ofrece 
                    una experiencia gaming completa e inmersiva.
                </p>
            </div>
            
            <div class="features-grid">
                <div class="feature-card feature-highlight">
                    <div class="feature-icon-large">
                        <i class="fas fa-trophy"></i>
                        <div class="feature-icon-glow"></div>
                    </div>
                    <h3>Compite en Torneos</h3>
                    <p>Participa en torneos de tus juegos favoritos con premios reales y brackets en tiempo real.</p>
                    <a href="#/torneos" class="feature-link">
                        Explorar torneos <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h3>Crea tu Clan</h3>
                    <p>Forma tu equipo, recluta jugadores y domina la competición juntos.</p>
                    <a href="#/clanes" class="feature-link">
                        Ver clanes <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon secondary">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3>Escala el Ranking</h3>
                    <p>Compite para subir en el ranking global y demuestra tu habilidad.</p>
                    <a href="#/ranking" class="feature-link">
                        Ver ranking <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon accent">
                        <i class="fas fa-broadcast-tower"></i>
                    </div>
                    <h3>Partidas en Vivo</h3>
                    <p>Sigue las partidas en tiempo real con estadísticas actualizadas.</p>
                    <a href="#/live" class="feature-link">
                        Ver en vivo <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon warning">
                        <i class="fas fa-medal"></i>
                    </div>
                    <h3>Gana Logros</h3>
                    <p>Desbloquea insignias exclusivas completando desafíos y torneos.</p>
                    ${user ? `<a href="#/logros" class="feature-link">Mis logros <i class="fas fa-arrow-right"></i></a>` :
            `<a href="#/registro" class="feature-link">Registrarse <i class="fas fa-arrow-right"></i></a>`}
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon danger">
                        <i class="fas fa-history"></i>
                    </div>
                    <h3>Historial Completo</h3>
                    <p>Revisa tu historial de partidas, estadísticas y progreso.</p>
                    ${user ? `<a href="#/historial" class="feature-link">Mi historial <i class="fas fa-arrow-right"></i></a>` :
            `<a href="#/registro" class="feature-link">Registrarse <i class="fas fa-arrow-right"></i></a>`}
                </div>
            </div>
        </div>
    </section>

    <!-- Juegos Disponibles -->
    <section class="games-section">
        <div class="container">
            <div class="section-header-centered">
                <span class="section-badge secondary">
                    <i class="fas fa-gamepad"></i>
                    Juegos
                </span>
                <h2 class="section-title-large">
                    Juegos <span class="gradient-text">Disponibles</span>
                </h2>
                <p class="section-description">
                    Compite en los juegos más populares del momento. Nuevos títulos añadidos regularmente.
                </p>
            </div>
            
            <div class="games-showcase">
                ${games.length > 0 ? games.map((game, index) => `
                    <a href="#/torneos" class="game-showcase-card" style="--delay: ${index * 0.1}s" data-game-id="${game.id}">
                        <div class="game-card-banner">
                            ${game.image_url ?
                    `<img src="${game.image_url}" alt="${game.name}">` :
                    `<div class="game-placeholder"><i class="fas fa-gamepad"></i></div>`}
                            <div class="game-overlay"></div>
                        </div>
                        <div class="game-card-body">
                            <h3 class="game-name">${game.name}</h3>
                            <span class="game-genre">${game.genre || 'Competitivo'}</span>
                        </div>
                        <div class="game-card-footer">
                            <span class="game-stat"><i class="fas fa-trophy"></i> Torneos Activos</span>
                            <span class="game-action">Ver Torneos <i class="fas fa-arrow-right"></i></span>
                        </div>
                    </a>
                `).join('') : ''}
                
                <!-- Coming Soon Card -->
                <div class="game-showcase-card coming-soon" style="--delay: ${games.length * 0.1}s">
                    <div class="game-card-banner coming-soon-banner">
                        <div class="coming-soon-icon">
                            <i class="fas fa-plus"></i>
                        </div>
                    </div>
                    <div class="game-card-body">
                        <h3 class="game-name">Próximamente...</h3>
                        <span class="game-genre">Más juegos en camino</span>
                    </div>
                    <div class="game-card-footer">
                        <span class="game-stat"><i class="fas fa-clock"></i> En desarrollo</span>
                    </div>
                </div>
            </div>

            
            <div class="games-cta">
                <a href="#/torneos" class="btn btn-large btn-gradient">
                    <i class="fas fa-trophy"></i>
                    Ver Todos los Torneos
                    <span class="btn-shine"></span>
                </a>
            </div>
        </div>
    </section>

    <!-- Sección de Comunidad / Clanes -->
    <section class="community-section">
        <div class="container">
            <div class="community-grid">
                <div class="community-content">
                    <span class="section-badge accent">
                        <i class="fas fa-users"></i>
                        Comunidad
                    </span>
                    <h2 class="section-title-large">
                        Únete a una <span class="gradient-text">comunidad épica</span>
                    </h2>
                    <p class="community-description">
                        Forma parte de una comunidad de gamers apasionados. Crea o únete a un clan, 
                        participa en eventos exclusivos y haz amigos que comparten tu pasión.
                    </p>
                    <ul class="community-benefits">
                        <li><i class="fas fa-check-circle"></i> Crea tu propio clan con tag personalizado</li>
                        <li><i class="fas fa-check-circle"></i> Recluta jugadores y forma el equipo perfecto</li>
                        <li><i class="fas fa-check-circle"></i> Compite en torneos exclusivos para clanes</li>
                        <li><i class="fas fa-check-circle"></i> Chat y coordinación en tiempo real</li>
                    </ul>
                    <div class="community-actions">
                        <a href="#/clanes" class="btn btn-primary btn-large">
                            <i class="fas fa-shield-alt"></i>
                            Explorar Clanes
                        </a>
                        ${user ? `
                            <a href="#/crear-clan" class="btn btn-outline btn-large">
                                <i class="fas fa-plus"></i>
                                Crear Clan
                            </a>
                        ` : `
                            <a href="#/registro" class="btn btn-outline btn-large">
                                <i class="fas fa-user-plus"></i>
                                Registrarse
                            </a>
                        `}
                    </div>
                </div>
                <div class="community-visual">
                    <div class="clan-cards-stack">
                        <div class="clan-preview-card card-1">
                            <div class="clan-avatar"><i class="fas fa-dragon"></i></div>
                            <span class="clan-name">Dragon Warriors</span>
                            <span class="clan-members">24 miembros</span>
                        </div>
                        <div class="clan-preview-card card-2">
                            <div class="clan-avatar accent"><i class="fas fa-fire"></i></div>
                            <span class="clan-name">Phoenix Rising</span>
                            <span class="clan-members">18 miembros</span>
                        </div>
                        <div class="clan-preview-card card-3">
                            <div class="clan-avatar secondary"><i class="fas fa-bolt"></i></div>
                            <span class="clan-name">Thunder Squad</span>
                            <span class="clan-members">32 miembros</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Sección de Estadísticas Impactantes -->
    <section class="impact-stats-section">
        <div class="container">
            <div class="impact-grid">
                <div class="impact-stat">
                    <div class="impact-icon"><i class="fas fa-globe-americas"></i></div>
                    <div class="impact-number">25+</div>
                    <div class="impact-label">Países</div>
                </div>
                <div class="impact-stat">
                    <div class="impact-icon"><i class="fas fa-users"></i></div>
                    <div class="impact-number">10K+</div>
                    <div class="impact-label">Jugadores Activos</div>
                </div>
                <div class="impact-stat">
                    <div class="impact-icon"><i class="fas fa-trophy"></i></div>
                    <div class="impact-number">500+</div>
                    <div class="impact-label">Torneos Completados</div>
                </div>
                <div class="impact-stat">
                    <div class="impact-icon"><i class="fas fa-dollar-sign"></i></div>
                    <div class="impact-number">$50K+</div>
                    <div class="impact-label">En Premios</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Sección de Planes / Suscripciones -->
    <section id="pricing-section" class="pricing-preview-section">
        <div class="container">
            <div class="section-header-centered">
                <span class="section-badge warning">
                    <i class="fas fa-crown"></i>
                    Premium
                </span>
                <h2 class="section-title-large">
                    Elige tu 
                    <span style="
                        background: linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff, #ff0000);
                        background-size: 200% auto;
                        color: transparent;
                        -webkit-background-clip: text;
                        background-clip: text;
                        animation: neon-spin 3s linear infinite;
                        font-weight: 900;
                        text-shadow: 0 0 15px rgba(255,100,200,0.5);
                    ">plan perfecto</span>
                    <style>@keyframes neon-spin { to { background-position: 200% center; } }</style>
                </h2>
                <p class="section-description">
                    Desbloquea todo el poder de ApexTournament con nuestros planes premium.
                </p>
            </div>
            
            <div class="pricing-preview-grid" style="grid-template-columns: repeat(4, 1fr);">
                <!-- DEMO Plan -->
                <div class="pricing-preview-card demo-card" style="border-color: #10b981;">
                    <div class="featured-badge" style="background: linear-gradient(135deg, #10b981, #059669);">🧪 Test</div>
                    <div class="plan-icon" style="color: #10b981;"><i class="fas fa-flask"></i></div>
                    <h3>Demo</h3>
                    <div class="plan-price-preview">$0.10<span>/mes</span></div>
                    <p class="plan-save" style="color: #10b981;">Solo para probar el pago</p>
                    <ul>
                        <li><i class="fas fa-check"></i> Prueba de Stripe</li>
                        <li><i class="fas fa-check"></i> Cobra $0.10 MXN</li>
                        <li><i class="fas fa-check"></i> Flujo completo</li>
                        <li><i class="fas fa-check"></i> Cancélalo después</li>
                    </ul>
                    <button class="btn" id="homeSubscribeDemo" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; width: 100%;">Probar Demo</button>
                </div>

                <div class="pricing-preview-card">
                    <div class="plan-icon"><i class="fas fa-user"></i></div>
                    <h3>Gratis</h3>
                    <div class="plan-price-preview">$0<span>/siempre</span></div>
                    <ul>
                        <li><i class="fas fa-check"></i> Torneos gratuitos</li>
                        <li><i class="fas fa-check"></i> Perfil básico</li>

                        <li><i class="fas fa-check"></i> Ver partidas en vivo</li>
                    </ul>
                    <a href="#/registro" class="btn btn-outline">Comenzar Gratis</a>
                </div>
                
                <div class="pricing-preview-card featured">
                    <div class="featured-badge">⚡ Popular</div>
                    <div class="plan-icon pro"><i class="fas fa-rocket"></i></div>
                    <h3>Standard</h3>
                    <div class="plan-price-preview">$499<span>/mes</span></div>
                    <p class="plan-save">Ahorra 17% con plan anual</p>
                    <ul>
                        <li><i class="fas fa-check"></i> Todo lo de Gratis</li>
                        <li><i class="fas fa-check"></i> Torneos premium</li>
                        <li><i class="fas fa-check"></i> Estadísticas avanzadas</li>
                        <li><i class="fas fa-check"></i> Badge STANDARD exclusivo</li>
                        <li><i class="fas fa-check"></i> Sin anuncios</li>
                    </ul>
                    <button class="btn btn-pro-gradient" id="homeSubscribeStandard">Obtener Standard</button>
                </div>
                
                <div class="pricing-preview-card premium-card">
                    <div class="plan-icon premium"><i class="fas fa-gem"></i></div>
                    <h3>Premium</h3>
                    <div class="plan-price-preview">$999<span>/mes</span></div>
                    <p class="plan-save">Ahorra 17% con plan anual</p>
                    <ul>
                        <li><i class="fas fa-check"></i> Todo lo de Standard</li>
                        <li><i class="fas fa-check"></i> Torneos exclusivos</li>
                        <li><i class="fas fa-check"></i> Badge LEGEND</li>
                        <li><i class="fas fa-check"></i> Soporte prioritario</li>
                    </ul>
                    <button class="btn btn-premium-gradient" id="homeSubscribePremium">Obtener Premium</button>
                </div>
            </div>
            

        </div>
    </section>

    <!-- Call to Action Final -->
    <section class="final-cta-section">
        <div class="container">
            <div class="final-cta-content">
                <div class="cta-glow"></div>
                <h2 class="cta-title">
                    ¿Listo para <span class="gradient-text">dominar</span>?
                </h2>
                <p class="cta-subtitle">
                    Únete a miles de jugadores que ya están compitiendo y ganando. 
                    Tu camino hacia la gloria comienza aquí.
                </p>
                <div class="cta-actions">
                    ${user ? `
                        <a href="#/torneos" class="btn btn-cta-primary">
                            <i class="fas fa-trophy"></i>
                            Explorar Torneos
                            <span class="btn-shine"></span>
                        </a>
                    ` : `
                        <a href="#/registro" class="btn btn-cta-primary">
                            <i class="fas fa-rocket"></i>
                            Crear Cuenta Gratis
                            <span class="btn-shine"></span>
                        </a>
                        <a href="#/login" class="btn btn-cta-secondary">
                            Ya tengo cuenta
                        </a>
                    `}
                </div>
                <div class="cta-features">
                    <span><i class="fas fa-check"></i> Registro gratuito</span>
                    <span><i class="fas fa-check"></i> Sin compromisos</span>
                    <span><i class="fas fa-check"></i> Torneos diarios</span>
                </div>
            </div>
        </div>
    </section>
    `;

    // Scroll al inicio
    window.scrollTo(0, 0);

    // Event listeners para botones de suscripción
    const demoBtn = container.querySelector('#homeSubscribeDemo');
    const standardBtn = container.querySelector('#homeSubscribeStandard');
    const premiumBtn = container.querySelector('#homeSubscribePremium');

    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            openSubscriptionModal('DEMO');
        });
    }

    if (standardBtn) {
        standardBtn.addEventListener('click', () => {
            openSubscriptionModal('STANDARD');
        });
    }

    if (premiumBtn) {
        premiumBtn.addEventListener('click', () => {
            openSubscriptionModal('PREMIUM');
        });
    }
  } catch(e) { console.error('Error rendered home page: ', e); }
}
