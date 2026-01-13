// =====================================================
// Notifications System
// =====================================================

const NOTIFICATIONS_KEY = 'apex_notifications';

// Get all notifications
export function getNotifications() {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Add a notification
export function addNotification(notification) {
    const notifications = getNotifications();
    const newNotification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
        ...notification
    };
    notifications.unshift(newNotification);

    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications.pop();
    }

    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    updateNotificationBadge();

    return newNotification;
}

// Mark notification as read
export function markAsRead(notificationId) {
    const notifications = getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
        updateNotificationBadge();
    }
}

// Mark all as read
export function markAllAsRead() {
    const notifications = getNotifications();
    notifications.forEach(n => n.read = true);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    updateNotificationBadge();
}

// Get unread count
export function getUnreadCount() {
    const notifications = getNotifications();
    return notifications.filter(n => !n.read).length;
}

// Clear all notifications
export function clearAllNotifications() {
    localStorage.removeItem(NOTIFICATIONS_KEY);
    updateNotificationBadge();
}

// Update the notification badge in navbar
export function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const count = getUnreadCount();

    if (badge) {
        badge.textContent = count > 9 ? '9+' : count.toString();
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Initialize notification listeners
export function initNotifications() {
    updateNotificationBadge();

    // Listen for custom notification events
    window.addEventListener('newNotification', (e) => {
        const { title, message, type } = e.detail;
        addNotification({ title, message, type });
    });
}

// Notification types with icons
export const NOTIFICATION_TYPES = {
    MATCH_REMINDER: {
        icon: 'fas fa-clock',
        color: 'var(--primary)'
    },
    MATCH_RESULT: {
        icon: 'fas fa-trophy',
        color: 'var(--warning)'
    },
    TEAM_INVITE: {
        icon: 'fas fa-users',
        color: 'var(--secondary)'
    },
    TOURNAMENT_UPDATE: {
        icon: 'fas fa-bullhorn',
        color: 'var(--accent)'
    },
    SYSTEM: {
        icon: 'fas fa-info-circle',
        color: 'var(--text-muted)'
    }
};

// Create demo notifications for testing
export function createDemoNotifications() {
    addNotification({
        type: 'MATCH_REMINDER',
        title: 'Partida en 30 minutos',
        message: 'Tu partida contra Team Alpha comienza pronto'
    });

    addNotification({
        type: 'TOURNAMENT_UPDATE',
        title: 'Torneo actualizado',
        message: 'El Torneo Apertura 2026 ha comenzado las inscripciones'
    });
}
