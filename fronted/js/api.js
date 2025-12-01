// =====================================================
// API CLIENT - Comunicación con el backend
// =====================================================

const API_BASE = 'http://localhost:3000';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Error en la petición');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
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
    reportResult: (matchId, data) => api.post(`/matches/${matchId}/results`, data),
    validateResult: (resultId, data) => api.put(`/match-results/${resultId}/validate`, data)
  },

  // Games
  games: {
    getAll: () => api.get('/games'),
    create: (data) => api.post('/games', data)
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
