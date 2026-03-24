// =====================================================
// Notification Center Component (Bell Icon + Dropdown)
// =====================================================

import API from '../api.js';

let pollInterval = null;

export function initNotificationCenter() {
    injectNotificationBell();
    loadNotifications();
    // Poll every 30 seconds
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(loadNotifications, 30000);
}

function injectNotificationBell() {
    // Find the navbar/header area
    const header = document.querySelector('.navbar-right, .header-actions, .user-actions');
    if (!header || document.getElementById('notificationBell')) return;

    const bellHtml = `
        <div class="notification-bell" id="notificationBell">
            <button class="bell-btn" id="bellBtn">
                <i class="fas fa-bell"></i>
                <span class="bell-badge" id="bellBadge" style="display:none;">0</span>
            </button>
            <div class="notification-dropdown" id="notifDropdown" style="display:none;">
                <div class="notif-header">
                    <h3>Notificaciones</h3>
                    <button class="notif-mark-all" id="markAllRead">Marcar todas leídas</button>
                </div>
                <div class="notif-list" id="notifList">
                    <div class="notif-empty"><i class="fas fa-bell-slash"></i><p>Sin notificaciones</p></div>
                </div>
            </div>
        </div>
    `;

    header.insertAdjacentHTML('afterbegin', bellHtml);

    // Toggle dropdown
    document.getElementById('bellBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const dd = document.getElementById('notifDropdown');
        dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
    });

    // Close on outside click
    document.addEventListener('click', () => {
        const dd = document.getElementById('notifDropdown');
        if (dd) dd.style.display = 'none';
    });

    document.getElementById('notifDropdown')?.addEventListener('click', e => e.stopPropagation());

    // Mark all as read
    document.getElementById('markAllRead')?.addEventListener('click', async () => {
        try {
            await API.post('/notifications/read-all', {});
            loadNotifications();
        } catch (e) { /* ignore */ }
    });

    // Inject styles
    if (!document.getElementById('notifStyles')) {
        const style = document.createElement('style');
        style.id = 'notifStyles';
        style.textContent = `
            .notification-bell { position: relative; }
            .bell-btn {
                background: none; border: none; color: var(--text-primary); cursor: pointer;
                font-size: 20px; padding: 8px; position: relative;
            }
            .bell-btn:hover { color: var(--primary); }
            .bell-badge {
                position: absolute; top: 2px; right: 2px;
                background: #ff3366; color: #fff; font-size: 10px; font-weight: 900;
                min-width: 16px; height: 16px; border-radius: 8px;
                display: flex; align-items: center; justify-content: center; padding: 0 4px;
            }
            .notification-dropdown {
                position: absolute; top: 100%; right: 0; width: 360px; max-height: 450px;
                background: var(--bg-card); border: 1px solid var(--border-color);
                border-radius: 14px; box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                overflow: hidden; z-index: 1000;
            }
            .notif-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 14px 16px; border-bottom: 1px solid var(--border-color);
            }
            .notif-header h3 { margin: 0; font-size: 15px; }
            .notif-mark-all {
                background: none; border: none; color: var(--primary); cursor: pointer;
                font-size: 12px; font-weight: 600;
            }
            .notif-list { max-height: 380px; overflow-y: auto; }
            .notif-item {
                display: flex; gap: 12px; padding: 12px 16px;
                border-bottom: 1px solid var(--border-color); cursor: pointer;
                transition: background 0.2s;
            }
            .notif-item:hover { background: rgba(0,212,255,0.03); }
            .notif-item.unread { background: rgba(0,212,255,0.05); border-left: 3px solid var(--primary); }
            .notif-icon {
                width: 36px; height: 36px; border-radius: 10px;
                display: flex; align-items: center; justify-content: center;
                font-size: 14px; flex-shrink: 0;
            }
            .notif-icon.match { background: rgba(255,107,53,0.15); color: #ff6b35; }
            .notif-icon.prize { background: rgba(255,215,0,0.15); color: #ffd700; }
            .notif-icon.system { background: rgba(0,212,255,0.15); color: #00d4ff; }
            .notif-icon.clan { background: rgba(138,43,226,0.15); color: #8a2be2; }
            .notif-icon.check { background: rgba(0,255,136,0.15); color: #00ff88; }
            .notif-body h4 { font-size: 13px; margin: 0 0 2px; }
            .notif-body p { font-size: 12px; color: var(--text-muted); margin: 0; line-height: 1.4; }
            .notif-time { font-size: 10px; color: var(--text-muted); margin-top: 4px; }
            .notif-empty { text-align: center; padding: 40px 20px; color: var(--text-muted); }
            .notif-empty i { font-size: 28px; opacity: 0.3; margin-bottom: 8px; }

            @media (max-width: 480px) { .notification-dropdown { width: 300px; right: -60px; } }
        `;
        document.head.appendChild(style);
    }
}

async function loadNotifications() {
    try {
        const res = await API.get('/notifications?limit=20');
        const data = res.data || res;
        const { notifications = [], unreadCount = 0 } = data;

        // Update badge
        const badge = document.getElementById('bellBadge');
        if (badge) {
            badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        // Update list
        const list = document.getElementById('notifList');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = '<div class="notif-empty"><i class="fas fa-bell-slash"></i><p>Sin notificaciones</p></div>';
            return;
        }

        list.innerHTML = notifications.map(n => {
            const iconInfo = getNotifIcon(n.type);
            const time = timeAgo(n.created_at);
            return `
                <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
                    <div class="notif-icon ${iconInfo.cls}"><i class="${iconInfo.icon}"></i></div>
                    <div class="notif-body">
                        <h4>${n.title}</h4>
                        <p>${n.message}</p>
                        <div class="notif-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Mark as read on click
        list.querySelectorAll('.notif-item.unread').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.dataset.id;
                try {
                    await API.put(`/notifications/${id}/read`, {});
                    item.classList.remove('unread');
                    loadNotifications();
                } catch (e) { /* ignore */ }
            });
        });
    } catch (e) {
        // silently fail — user might not be logged in
    }
}

function getNotifIcon(type) {
    const map = {
        MATCH_READY: { icon: 'fas fa-gamepad', cls: 'match' },
        MATCH_RESULT: { icon: 'fas fa-flag-checkered', cls: 'match' },
        TOURNAMENT_START: { icon: 'fas fa-trophy', cls: 'prize' },
        TOURNAMENT_END: { icon: 'fas fa-trophy', cls: 'prize' },
        PRIZE_RECEIVED: { icon: 'fas fa-coins', cls: 'prize' },
        WITHDRAWAL_STATUS: { icon: 'fas fa-university', cls: 'check' },
        TEAM_INVITE: { icon: 'fas fa-users', cls: 'clan' },
        CLAN_INVITE: { icon: 'fas fa-shield-alt', cls: 'clan' },
        DISPUTE_UPDATE: { icon: 'fas fa-exclamation-triangle', cls: 'match' },
        CHECK_IN_REMINDER: { icon: 'fas fa-clock', cls: 'check' },
        SYSTEM: { icon: 'fas fa-info-circle', cls: 'system' },
    };
    return map[type] || { icon: 'fas fa-bell', cls: 'system' };
}

function timeAgo(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
}
