// =====================================================
// API CLIENT - Comunicación con el backend
// =====================================================

import Auth from './auth.js';
import { API_BASE } from './config.js';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = Auth.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      },
      ...options
    };

    try {
      console.log(`🔗 API Request: ${config.method || 'GET'} ${url}`);
      const response = await fetch(url, config);

      // Manejar respuestas no-JSON
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Respuesta no válida del servidor: ${response.status}`);
      }

      console.log(`✅ API Response:`, data);

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || `Error HTTP: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      // Si es un error de red (fetch failed)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('No se puede conectar con el servidor. Verifica que el backend esté corriendo.');
      }
      throw error;
    }
  }

  // GET request
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Crear instancia del cliente API
const api = new ApiClient(API_BASE);

// =====================================================
// API METHODS
// =====================================================

export const API = {
  // Users
  users: {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    getGameAccounts: (userId) => api.get(`/users/${userId}/game-accounts`)
  },

  // Tournaments
  tournaments: {
    getAll: () => api.get('/tournaments'),
    getById: (id) => api.get(`/tournaments/${id}`),
    create: (data) => api.post('/tournaments', data),
    update: (id, data) => api.put(`/tournaments/${id}`, data),
    delete: (id) => api.delete(`/tournaments/${id}`),
    getStandings: (id) => api.get(`/tournaments/${id}/standings`),
    getBracket: (id) => api.get(`/tournaments/${id}/bracket`)
  },

  // Teams
  teams: {
    getAll: (tournamentId) => api.get(`/teams${tournamentId ? `?tournament_id=${tournamentId}` : ''}`),
    getById: (id) => api.get(`/teams/${id}`),
    create: (data) => api.post('/teams', data),
    update: (id, data) => api.put(`/teams/${id}`, data),
    delete: (id) => api.delete(`/teams/${id}`),
    addPlayer: (teamId, data) => api.post(`/teams/${teamId}/players`, data),
    removePlayer: (teamId, playerId) => api.delete(`/teams/${teamId}/players/${playerId}`)
  },

  // Matches
  matches: {
    getAll: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return api.get(`/matches${params ? `?${params}` : ''}`);
    },
    getById: (id) => api.get(`/matches/${id}`),
    create: (data) => api.post('/matches', data),
    update: (id, data) => api.put(`/matches/${id}`, data),
    delete: (id) => api.delete(`/matches/${id}`),
    reportResult: (matchId, data) => api.post(`/matches/${matchId}/results`, data),
    validateResult: (resultId, data) => api.put(`/match-results/${resultId}/validate`, data)
  },

  // Games
  games: {
    getAll: () => api.get('/games'),
    getById: (id) => api.get(`/games/${id}`),
    create: (data) => api.post('/games', data),
    update: (id, data) => api.put(`/games/${id}`, data),
    delete: (id) => api.delete(`/games/${id}`)
  },

  // Standings
  standings: {
    create: (data) => api.post('/standings', data)
  },

  // Player Stats
  players: {
    getStats: (userId, gameId) => api.get(`/players/${userId}/stats${gameId ? `?game_id=${gameId}` : ''}`)
  },

  // Game Accounts
  gameAccounts: {
    create: (data) => api.post('/game-accounts', data)
  },

  // Health check
  health: () => api.get('/health')
};

export default API;
