/**
 * Client API ultra-léger et direct basé sur Fetch natif.
 * Conforme à la consigne : 80% des fonctionnalités réglées par de simples requêtes directes.
 */
const API_BASE = 'http://localhost:5000/api/v1';

export const api = {
  getToken: () => localStorage.getItem('stockpro_token'),
  setToken: (token) => localStorage.setItem('stockpro_token', token),
  clearToken: () => {
    localStorage.removeItem('stockpro_token');
    localStorage.removeItem('stockpro_user');
  },
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('stockpro_user'));
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('stockpro_user', JSON.stringify(user)),

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la requête');
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Raccourcis directs
  get: (url) => api.request(url, { method: 'GET' }),
  post: (url, body) => api.request(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => api.request(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (url, body) => api.request(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url) => api.request(url, { method: 'DELETE' }),
};
