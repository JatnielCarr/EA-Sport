// =====================================================
// API Client - User Frontend (Solo endpoints públicos)
// =====================================================

import { getToken, logout } from './auth.js';

const API_BASE = 'http://localhost:3000';

// Cache system
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute default

export class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    // Check if cached data is still valid
    getCached(key) {
        const cached = cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > cached.ttl) {
            cache.delete(key);
            return null;
        }
        return cached.data;
    }

    // Store in cache
    setCache(key, data, ttl = CACHE_TTL) {
        cache.set(key, { data, timestamp: Date.now(), ttl });
    }

    // Clear specific cache entry or all
    clearCache(key) {
        if (key) cache.delete(key);
        else cache.clear();
    }

    async request(endpoint, options = {}, config = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = getToken();
        const cacheKey = `${options.method || 'GET'}:${endpoint}`;
        const { useCache = true, cacheTTL = CACHE_TTL, retries = this.retryAttempts } = config;

        // Check cache for GET requests
        if ((!options.method || options.method === 'GET') && useCache) {
            const cached = this.getCached(cacheKey);
            if (cached) return cached;
        }

        let lastError;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

                // Build headers properly - ensure our headers come last
                const headers = {
                    'Content-Type': 'application/json',
                    ...options.headers,
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                };

                // Spread options first, then override with our values
                const fetchOptions = {
                    ...options,
                    headers,
                    signal: controller.signal
                };

                console.log(`[API] ${options.method || 'GET'} ${url}`);
                const response = await fetch(url, fetchOptions);

                clearTimeout(timeout);

                // Handle non-JSON responses
                const contentType = response.headers.get('content-type');
                let data;
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    console.error('[API] Non-JSON response:', text.substring(0, 200));
                    throw new Error('El servidor no respondió correctamente');
                }

                if (!response.ok) {
                    // Check for 401 Unauthorized
                    if (response.status === 401) {
                        console.warn('[API] Session expired or invalid token');
                        logout(); // Auto-logout on 401
                        throw new Error('Sesión expirada');
                    }

                    // Create error with status for retry logic
                    const error = new Error(data.error || `Error ${response.status}`);
                    error.status = response.status;
                    throw error;
                }

                // Cache successful GET requests
                if ((!options.method || options.method === 'GET') && useCache) {
                    this.setCache(cacheKey, data, cacheTTL);
                }

                return data;
            } catch (error) {
                lastError = error;
                console.warn(`[API] Error on attempt ${attempt + 1}:`, error.message);

                // Don't retry on abort or client errors (4xx)
                if (error.name === 'AbortError' ||
                    (error.status && error.status >= 400 && error.status < 500) ||
                    error.message === 'Sesión expirada') {
                    throw error;
                }

                // Exponential backoff for server errors only
                if (attempt < retries - 1) {
                    const delay = this.retryDelay * Math.pow(2, attempt);
                    console.log(`[API] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error('[API] Failed after retries:', lastError);
        throw lastError;
    }


    get(endpoint, config = {}) {
        return this.request(endpoint, { method: 'GET' }, config);
    }

    post(endpoint, body, config = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        }, { ...config, useCache: false });
    }

    put(endpoint, body, config = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        }, { ...config, useCache: false });
    }

    delete(endpoint, config = {}) {
        return this.request(endpoint, { method: 'DELETE' }, { ...config, useCache: false });
    }
}

const client = new ApiClient(API_BASE);

// Exportar solo endpoints PÚBLICOS (no admin)
export const API = {
    // Health check
    health: () => client.get('/health'),

    // Juegos (público)
    games: {
        getAll: () => client.get('/games'),
        getById: (id) => client.get(`/games/${id}`)
    },

    // Torneos (público - solo lectura)
    tournaments: {
        getAll: () => client.get('/tournaments'),
        getById: (id) => client.get(`/tournaments/${id}`),
        getBracket: (id) => client.get(`/tournaments/${id}/bracket`),
        getStandings: (id) => client.get(`/tournaments/${id}/standings`)
    },

    // Equipos (público - solo lectura)
    teams: {
        getAll: () => client.get('/teams'),
        getByTournament: (tournamentId) => client.get(`/teams?tournament_id=${tournamentId}`),
        getById: (id) => client.get(`/teams/${id}`),
        // Autenticado - crear equipo
        create: (data) => client.post('/teams', data),
        addPlayer: (teamId, data) => client.post(`/teams/${teamId}/players`, data)
    },

    // Partidas (público - solo lectura)
    matches: {
        getAll: () => client.get('/matches'),
        getByTournament: (tournamentId) => client.get(`/matches?tournament_id=${tournamentId}`),
        getById: (id) => client.get(`/matches/${id}`),
        getLive: () => client.get('/matches?status=LIVE')
    },

    // Autenticación
    auth: {
        login: (email, password) => client.post('/auth/login', { email, password }),
        register: (data) => client.post('/auth/register', data),
        me: () => client.get('/auth/me'),
        changePassword: (currentPassword, newPassword) =>
            client.post('/auth/change-password', { currentPassword, newPassword })
    },



    // Clanes
    clans: {
        // Público
        getAll: (filters = {}) => {
            const params = new URLSearchParams();
            if (filters.access_type) params.append('access_type', filters.access_type);
            if (filters.search) params.append('search', filters.search);
            if (filters.location) params.append('location', filters.location);
            const query = params.toString();
            return client.get(`/clans${query ? `?${query}` : ''}`);
        },
        getById: (id) => client.get(`/clans/${id}`),

        // Autenticado
        create: (data) => client.post('/clans', data),
        update: (id, data) => client.put(`/clans/${id}`, data),
        delete: (id) => client.delete(`/clans/${id}`),

        // Unirse
        join: (clanId, userId) => client.post(`/clans/${clanId}/join`, { user_id: userId }),
        sendRequest: (clanId, data) => client.post(`/clans/${clanId}/request`, data),

        // Gestión de solicitudes
        getRequests: (clanId) => client.get(`/clans/${clanId}/requests`),
        approveRequest: (clanId, requestId) =>
            client.post(`/clans/${clanId}/requests/${requestId}/approve`, {}),
        rejectRequest: (clanId, requestId) =>
            client.post(`/clans/${clanId}/requests/${requestId}/reject`, {}),

        // Miembros
        removeMember: (clanId, userId) => client.delete(`/clans/${clanId}/members/${userId}`),
        updateMemberRole: (clanId, userId, role) =>
            client.put(`/clans/${clanId}/members/${userId}/role`, { role }),

        // Chat
        getMessages: (clanId, limit = 50) => client.get(`/clans/${clanId}/messages?limit=${limit}`),
        sendMessage: (clanId, userId, content, isAnnouncement = false) =>
            client.post(`/clans/${clanId}/messages`, {
                user_id: userId,
                content,
                is_announcement: isAnnouncement
            })
    },

    // Suscripciones
    subscriptions: {
        getPlans: () => client.get('/subscriptions/plans'),
        getMySubscription: () => client.get('/subscriptions/me'),
        checkout: (plan, interval) => client.post('/subscriptions/create-checkout-session', { plan, interval }),
        cancel: () => client.post('/subscriptions/cancel', {}),
        reactivate: () => client.post('/subscriptions/reactivate', {}),
        changePlan: (plan, interval) => client.post('/subscriptions/change-plan', { plan, interval })
    },

    // Usuarios
    users: {
        // Public/Admin
        getById: (id) => client.get(`/users/${id}`),
        getStats: (userId) => client.get(`/users/${userId}/stats`),
        getClan: (userId) => client.get(`/users/${userId}/clan`),

        // Context dependent (update by ID for admin, or me) - simplifying to avoid confusion
        // Use updateMe for current user, updateById for others
        updateMe: (data) => client.put('/users/me', data),
        updateById: (id, data) => client.put(`/users/${id}`, data),
        updateProfile: (data) => client.put('/users/me', data),

        // Legacy/Alias support
        getProfile: () => client.get('/users/me', { useCache: false }),
        update: (arg1, arg2) => {
            // If 2 args, it's update(id, data), if 1 arg, it's update(data) for 'me'
            if (arg2) return client.put(`/users/${arg1}`, arg2);
            return client.put('/users/me', arg1);
        }
    },

    // Pagos / Wallet
    payments: {
        getBalance: () => client.get('/payment/balance'),
        createCheckout: (amount, currency = 'mxn', description) =>
            client.post('/payment/create-checkout-session', { amount, currency, description }),
        getHistory: () => client.get('/payment/history'),
        verifySession: (sessionId) => client.get(`/payment/verify-session/${sessionId}`),
        createNameChangeCheckout: () => client.post('/payment/name-change-checkout', {})
    },

    // Mantener compatibilidad con 'payment' sin 's'
    payment: {
        getBalance: () => client.get('/payment/balance'),
        createCheckout: (amount, currency = 'mxn', description) =>
            client.post('/payment/create-checkout-session', { amount, currency, description }),
        getHistory: () => client.get('/payment/history'),
        verifySession: (sessionId) => client.get(`/payment/verify-session/${sessionId}`)
    },

    // Método genérico para llamadas custom
    get: (endpoint, config) => client.get(endpoint, config),
    post: (endpoint, body, config) => client.post(endpoint, body, config),
    put: (endpoint, body, config) => client.put(endpoint, body, config),
    delete: (endpoint, config) => client.delete(endpoint, config)
};

export default API;
