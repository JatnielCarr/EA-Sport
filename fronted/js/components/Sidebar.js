import Auth from '../auth.js';

class Sidebar {
    constructor() {
        this.sidebarNav = null;
        this.userInfo = null;
    }

    init() {
        // Query DOM elements when init is called (after DOM is ready)
        this.sidebarNav = document.querySelector('.sidebar-nav ul');
        this.userInfo = document.querySelector('.user-info');
        
        console.log('🎮 Sidebar: Initializing...', { 
            sidebarNav: !!this.sidebarNav, 
            userInfo: !!this.userInfo,
            user: Auth.getUser()
        });
        
        if (!this.sidebarNav) {
            console.error('❌ Sidebar: .sidebar-nav ul not found');
            return;
        }
        
        this.renderMenu();
        this.renderUserInfo();
    }

    renderMenu() {
        const user = Auth.getUser();
        const isSuperAdmin = Auth.isSuperAdmin();

        console.log('🎮 Sidebar: Rendering menu', { user, isSuperAdmin });

        let menuItems = [];

        if (isSuperAdmin) {
            menuItems = [
                { href: '#/dashboard', icon: 'fas fa-chart-line', text: 'Dashboard', active: true },
                { href: '#/leaderboard', icon: 'fas fa-crown', text: 'Leaderboard', badge: 'NEW', badgeColor: '#ffd700' },
                { href: '#/users', icon: 'fas fa-users', text: 'Jugadores' },
                { href: '#/tournaments', icon: 'fas fa-trophy', text: 'Torneos', badge: 'LIVE', badgeClass: 'badge-live' },
                { href: '#/teams', icon: 'fas fa-shield-halved', text: 'Equipos' },
                { href: '#/matches', icon: 'fas fa-crosshairs', text: 'Partidas' },
                { href: '#/games', icon: 'fas fa-gamepad', text: 'Juegos' },
                { href: '#/brackets', icon: 'fas fa-sitemap', text: 'Brackets', color: 'var(--primary)' }
            ];
        } else if (user) {
            // Fallback menu for any logged-in user
            menuItems = [
                { href: '#/dashboard', icon: 'fas fa-chart-line', text: 'Dashboard', active: true },
                { href: '#/tournaments', icon: 'fas fa-trophy', text: 'Torneos' },
                { href: '#/teams', icon: 'fas fa-shield-halved', text: 'Equipos' },
                { href: '#/matches', icon: 'fas fa-crosshairs', text: 'Partidas' }
            ];
        }

        if (menuItems.length === 0) {
            console.warn('⚠️ Sidebar: No menu items to render (user not logged in?)');
            return;
        }

        this.sidebarNav.innerHTML = menuItems.map(item => `
            <li>
                <a href="${item.href}" class="nav-link ${item.active ? 'active' : ''} icon-bounce" data-page="${item.href.replace('#/', '')}">
                    <i class="${item.icon}" ${item.color ? `style="color: ${item.color};"` : ''}></i>
                    <span>${item.text}</span>
                    ${item.badge ? `<span class="${item.badgeClass || 'badge-new'}">${item.badge}</span>` : ''}
                </a>
            </li>
        `).join('');
    }

    renderUserInfo() {
        if (!this.userInfo) return;

        const user = Auth.getUser();
        if (!user) return;

        const roleName = Auth.isSuperAdmin() ? 'Super Admin' : 'Usuario';
        const roleIcon = Auth.isSuperAdmin() ? 'fas fa-crown' : 'fas fa-shield-alt';

        this.userInfo.innerHTML = `
            <div class="avatar pulse-glow-pro">
                <i class="${roleIcon}"></i>
            </div>
            <div class="user-details">
                <span class="user-name">${user.username}</span>
                <span class="user-role"><i class="fas fa-star" style="color: #ffd700; font-size: 10px;"></i> ${roleName}</span>
            </div>
            <button class="logout-btn" id="logoutBtn" title="Cerrar sesión">
                <i class="fas fa-power-off"></i>
            </button>
        `;

        // Re-attach logout listener since we replaced the HTML
        document.getElementById('logoutBtn')?.addEventListener('click', () => Auth.logout());
    }
}

export default new Sidebar();
