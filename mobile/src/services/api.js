import { API_URL, CACHE_TTL } from '../utils/constants';
import { storage } from './storage';

const TIMEOUT_MS = 10000; // 10 segundos de timeout

const getHeaders = async () => {
    const token = await storage.getToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

// Fetch with timeout
const fetchWithTimeout = (url, options, timeout = TIMEOUT_MS) => {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout: El servidor no responde')), timeout)
        )
    ]);
};

// Generic request handler
const request = async (endpoint, method, body = null) => {
    const headers = await getHeaders();
    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetchWithTimeout(`${API_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw {
                status: response.status,
                message: data.error || data.message || 'Error desconocido',
                data
            };
        }

        return data;
    } catch (error) {
        console.warn(`API Error (${method} ${endpoint}):`, error.message || error);
        // Retornar datos vacíos en lugar de lanzar error para que la UI no se quede cargando
        if (method === 'GET') {
            return { data: [], success: false, error: error.message };
        }
        throw error;
    }
};

// ==========================================
// Cached API Methods
// ==========================================

/**
 * Fetch data with caching support
 * @param {string} endpoint - API endpoint
 * @param {string} cacheKey - Key for caching (optional, defaults to endpoint)
 * @param {number} ttlMinutes - Cache TTL in minutes (optional, defaults to 10)
 * @returns {Promise<any>} - API response data
 */
const getCached = async (endpoint, cacheKey = null, ttlMinutes = 10) => {
    const key = cacheKey || endpoint.replace(/\//g, '_');

    // Try to get from cache first
    const cachedData = await storage.getCache(key);
    if (cachedData) {
        console.log(`📦 Cache HIT: ${key}`);
        return cachedData;
    }

    console.log(`🌐 Cache MISS: ${key}, fetching from API...`);

    // Fetch from API
    const response = await request(endpoint, 'GET');

    // Cache the response if successful
    if (response && !response.error) {
        await storage.setCache(key, response, ttlMinutes);
    }

    return response;
};

/**
 * Invalidate cache and fetch fresh data
 * @param {string} endpoint - API endpoint
 * @param {string} cacheKey - Key for caching
 * @param {number} ttlMinutes - Cache TTL in minutes
 * @returns {Promise<any>} - Fresh API response data
 */
const refreshCached = async (endpoint, cacheKey = null, ttlMinutes = 10) => {
    const key = cacheKey || endpoint.replace(/\//g, '_');

    // Remove existing cache
    await storage.removeCache(key);

    // Fetch fresh data
    return getCached(endpoint, key, ttlMinutes);
};

export const api = {
    // Standard methods
    get: (endpoint) => request(endpoint, 'GET'),
    post: (endpoint, body) => request(endpoint, 'POST', body),
    put: (endpoint, body) => request(endpoint, 'PUT', body),
    delete: (endpoint) => request(endpoint, 'DELETE'),

    // Cached methods
    getCached,
    refreshCached,

    // ==========================================
    // Pre-configured cached endpoints
    // ==========================================

    games: {
        getAll: () => getCached('/games', 'games', CACHE_TTL.GAMES),
        refresh: () => refreshCached('/games', 'games', CACHE_TTL.GAMES),
    },

    tournaments: {
        getAll: () => getCached('/tournaments', 'tournaments', CACHE_TTL.TOURNAMENTS),
        getById: (id) => getCached(`/tournaments/${id}`, `tournament_${id}`, CACHE_TTL.TOURNAMENTS),
        getMatches: (id) => getCached(`/tournaments/${id}/matches`, `tournament_${id}_matches`, CACHE_TTL.TOURNAMENTS),
        getTeams: (id) => getCached(`/tournaments/${id}/teams`, `tournament_${id}_teams`, CACHE_TTL.TOURNAMENTS),
        getBracket: (id) => getCached(`/tournaments/${id}/bracket`, `tournament_${id}_bracket`, 2),
        register: (id, data) => request(`/tournaments/${id}/register`, 'POST', data),
        refresh: () => refreshCached('/tournaments', 'tournaments', CACHE_TTL.TOURNAMENTS),
        refreshDetail: (id) => {
            refreshCached(`/tournaments/${id}`, `tournament_${id}`, CACHE_TTL.TOURNAMENTS);
            refreshCached(`/tournaments/${id}/matches`, `tournament_${id}_matches`, CACHE_TTL.TOURNAMENTS);
            refreshCached(`/tournaments/${id}/teams`, `tournament_${id}_teams`, CACHE_TTL.TOURNAMENTS);
            refreshCached(`/tournaments/${id}/bracket`, `tournament_${id}_bracket`, 2);
        },
        // Invite system
        getByInviteCode: (inviteCode) => request(`/tournaments/invite/${inviteCode}`, 'GET'),
        registerViaInvite: (inviteCode, data) => request(`/tournaments/invite/${inviteCode}/register`, 'POST', data),
    },

    rankings: {
        getAll: () => getCached('/rankings', 'rankings', CACHE_TTL.RANKINGS),
        refresh: () => refreshCached('/rankings', 'rankings', CACHE_TTL.RANKINGS),
    },

    clans: {
        getAll: () => getCached('/clans', 'clans', CACHE_TTL.CLANS),
        getById: (id) => getCached(`/clans/${id}`, `clan_${id}`, CACHE_TTL.CLANS),
        create: (data) => request('/clans', 'POST', data),
        refresh: () => refreshCached('/clans', 'clans', CACHE_TTL.CLANS),
    },

    live: {
        getMatches: () => getCached('/matches/live', 'live_matches', CACHE_TTL.LIVE_MATCHES),
        refresh: () => refreshCached('/matches/live', 'live_matches', CACHE_TTL.LIVE_MATCHES),
    },

    subscriptions: {
        getPlans: () => getCached('/subscriptions/plans', 'subscription_plans', CACHE_TTL.SUBSCRIPTION),
        getMySubscription: () => request('/subscriptions/me', 'GET'), // Not cached - user specific
    },

    user: {
        getProfile: () => getCached('/users/me', 'user_profile', CACHE_TTL.USER_PROFILE),
        refreshProfile: () => refreshCached('/users/me', 'user_profile', CACHE_TTL.USER_PROFILE),
    },

    payment: {
        getBalance: () => request('/payment/balance', 'GET'),
        getHistory: () => request('/payment/history', 'GET'),
        createCheckout: (amount, currency = 'mxn', description = '') =>
            request('/payment/create-checkout-session', 'POST', { amount, currency, description }),
    },
};
