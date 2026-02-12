// =====================================================
// Auth State Management
// =====================================================

const TOKEN_KEY = 'apex_auth_token';
const USER_KEY = 'apex_user';

// Token management
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// User management
export function getStoredUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

export function setStoredUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Check if authenticated
export function isAuthenticated() {
    return !!getToken();
}

// Logout
export function logout() {
    clearToken();
    window.dispatchEvent(new CustomEvent('authChanged'));
    window.location.hash = '#/';
    window.location.reload();
}

// Get auth headers
export function getAuthHeaders() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Handle login success
export function handleLoginSuccess(data) {
    setToken(data.token);
    setStoredUser(data.user);
    window.dispatchEvent(new CustomEvent('authChanged'));
}

export default {
    getToken,
    setToken,
    clearToken,
    getStoredUser,
    setStoredUser,
    isAuthenticated,
    logout,
    getAuthHeaders,
    handleLoginSuccess
};
