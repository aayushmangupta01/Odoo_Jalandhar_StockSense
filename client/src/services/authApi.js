import axios from 'axios';

const TOKEN_KEY = 'stocksense.auth-token';
const USER_KEY = 'stocksense.auth-user';
const API = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_BASE_URL || '/api/auth',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

function getStoredToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeSession(token, user) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
  window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
}

export const authApi = {
  async login({ email, password, role }) {
    const { data } = await API.post('/login', { email, password, role });
    storeSession(data.token, data.user);
    return data;
  },

  getCurrentUser() {
    try {
      const serializedUser = window.sessionStorage.getItem(USER_KEY);
      const token = getStoredToken();
      if (!serializedUser || !token) return null;
      const user = JSON.parse(serializedUser);
      return user && typeof user.email === 'string' ? user : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return getStoredToken();
  },

  async logout() {
    const token = getStoredToken();
    clearSession();
    if (token) {
      await API.post('/logout', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  },

  async signup({ name, email, password }) {
    const { data } = await API.post('/signup', { name, email, password });
    return data;
  },

  async requestPasswordReset() {
    throw new Error('Password recovery is not configured because this project has no email delivery service.');
  },

  async verifyPasswordResetCode() {
    throw new Error('Password recovery is not configured because this project has no email delivery service.');
  },

  async resetPassword() {
    throw new Error('Password recovery is not configured because this project has no email delivery service.');
  },

  async getUsers() {
    const { data } = await API.get('/users', { headers: { Authorization: `Bearer ${getStoredToken()}` } });
    return data;
  },

  async createUser(user) {
    const { data } = await API.post('/users', user, { headers: { Authorization: `Bearer ${getStoredToken()}` } });
    return data;
  },

  async updateUser(id, updates) {
    const { data } = await API.patch(`/users/${id}`, updates, { headers: { Authorization: `Bearer ${getStoredToken()}` } });
    return data;
  },
};

export default authApi;