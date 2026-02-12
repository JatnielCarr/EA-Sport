/**
 * Player Profile Modal
 * Handles fetching and displaying detailed user information
 */

// Create Modal HTML Structure
function createModalStructure() {
    if (document.getElementById('profileModalOverlay')) return;

    const modalHTML = `
    <div id="profileModalOverlay" class="profile-modal-overlay">
        <div class="profile-card">
            <div class="profile-header" id="profileBanner">
                <button class="close-btn" onclick="closeProfileModal()">×</button>
            </div>
            
            <div class="profile-body">
                <img src="" alt="Avatar" class="profile-avatar" id="profileAvatar">
                
                <h2 class="profile-username" id="profileUsername">
                    Loading... 
                    <i class="fas fa-check-circle verified-badge" id="profileVerified" style="display:none;"></i>
                </h2>
                
                <div class="profile-clan-tag" id="profileClanTag"></div>

                <div class="badges-row" id="profileBadges">
                    <!-- Badges injected via JS -->
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="stat-value" id="statRating">-</div>
                        <div class="stat-label">Rating (MR)</div>
                        <div class="rating-change" id="statRatingChange"></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-bolt"></i></div>
                        <div class="stat-value" id="statWinRate">-</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-gamepad"></i></div>
                        <div class="stat-value" id="statMatches">-</div>
                        <div class="stat-label">Partidas</div>
                    </div>
                </div>

                <div class="profile-footer">
                    <button class="social-btn telegram" id="btnTelegram" style="display:none;" title="Telegram Linked">
                        <i class="fab fa-telegram-plane"></i>
                    </button>
                    <!-- other social buttons if needed -->
                    
                    <button class="view-full-btn" onclick="alert('Funcionalidad completa pronto')">
                        Ver Perfil Completo
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Close on click outside
    document.getElementById('profileModalOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'profileModalOverlay') closeProfileModal();
    });
}

// Global function to close
window.closeProfileModal = function () {
    const overlay = document.getElementById('profileModalOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
}

/**
 * Show the profile modal for a specific user ID
 * @param {string} userId - The unique ID or username of the user
 */
export async function showPlayerProfile(userId) {
    createModalStructure();

    const overlay = document.getElementById('profileModalOverlay');
    overlay.style.display = 'flex';
    // Slight delay to allow display flex to apply before opacity transition
    setTimeout(() => overlay.classList.add('active'), 10);

    // Reset UI to loading state
    document.getElementById('profileUsername').innerHTML = 'Cargando...';
    document.getElementById('profileClanTag').textContent = '';
    document.getElementById('profileBadges').innerHTML = '';
    document.getElementById('profileAvatar').src = 'https://via.placeholder.com/80?text=?';
    document.getElementById('profileBanner').style.backgroundImage = 'none';

    try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}/profile`);
        const result = await response.json();

        if (result.success) {
            populateProfile(result.data);
        } else {
            console.error('Error fetching profile:', result.error);
            document.getElementById('profileUsername').textContent = 'Usuario no encontrado';
        }
    } catch (error) {
        console.error('Network error:', error);
        document.getElementById('profileUsername').textContent = 'Error de conexión';
    }
}

function populateProfile(data) {
    // 1. Identity
    const usernameEl = document.getElementById('profileUsername');
    usernameEl.innerHTML = `${data.username} <i class="fas fa-check-circle verified-badge" style="display:${data.verified ? 'inline-block' : 'none'};"></i>`;

    // Class for premium colors
    usernameEl.className = 'profile-username'; // reset
    if (data.subscription?.plan === 'PREMIUM') usernameEl.classList.add('premium');
    else if (data.subscription?.plan === 'STANDARD') usernameEl.classList.add('standard');

    // Images
    const avatar = document.getElementById('profileAvatar');
    avatar.src = data.avatar_url || `https://ui-avatars.com/api/?name=${data.username}&background=random`;

    if (data.banner_url) {
        document.getElementById('profileBanner').style.backgroundImage = `url('${data.banner_url}')`;
    } else {
        document.getElementById('profileBanner').style.backgroundImage = `linear-gradient(to right, #2b32b2, #1488cc)`;
    }

    // 2. Clan
    const clanTagEl = document.getElementById('profileClanTag');
    if (data.clan) {
        const roleIcon = data.clan.role === 'LEADER' ? '👑' : '🛡️';
        clanTagEl.innerHTML = `[<span class="clan-tag-highlight">${data.clan.tag}</span>] ${data.clan.name} • ${roleIcon} ${data.clan.role}`;
    } else {
        clanTagEl.textContent = 'Agente Libre';
    }

    // 3. Stats
    document.getElementById('statRating').textContent = data.stats.rating;
    document.getElementById('statRatingChange').textContent = ''; // Calculate change if history available
    document.getElementById('statWinRate').textContent = `${data.stats.win_rate}%`;
    document.getElementById('statMatches').textContent = data.stats.matches;

    // 4. Badges (Dynamic)
    const badgesContainer = document.getElementById('profileBadges');
    badgesContainer.innerHTML = '';

    // Example badges
    if (data.clan?.role === 'LEADER') addBadge(badgesContainer, 'fas fa-crown', 'Líder', 'gold');
    if (data.subscription?.plan === 'PREMIUM') addBadge(badgesContainer, 'fas fa-gem', 'Premium', '#ff00cc');
    if (data.stats.matches > 100) addBadge(badgesContainer, 'fas fa-fire', 'Veterano', '#ff4500');

    // 5. Social
    const tgBtn = document.getElementById('btnTelegram');
    if (data.social_links?.telegram) {
        tgBtn.style.display = 'inline-block';
        tgBtn.title = 'Telegram Vinculado';
    } else {
        tgBtn.style.display = 'none';
    }
}

function addBadge(container, iconClass, text, color) {
    const badge = document.createElement('div');
    badge.className = 'badge-item';
    badge.innerHTML = `<i class="${iconClass} badge-icon" style="color:${color}"></i><span>${text}</span>`;
    container.appendChild(badge);
}

// Auto-init styles
(function injectStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './css/profile-modal.css';
    document.head.appendChild(link);

    // Add FontAwesome if missing
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fa);
    }
})();
