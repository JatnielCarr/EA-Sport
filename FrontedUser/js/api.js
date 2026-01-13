// =====================================================
// API Client - User Frontend (Solo endpoints públicos)
// =====================================================

import { getToken } from './auth.js';

const API_BASE = 'http://localhost:3000';

class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = getToken();

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en la solicitud');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
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

    // Usuario (autenticado)
    users: {
        getById: (id) => client.get(`/users/${id}`),
        update: (id, data) => client.put(`/users/${id}`, data),
        getStats: (userId) => client.get(`/users/${userId}/stats`)
    }
};

export default API;
