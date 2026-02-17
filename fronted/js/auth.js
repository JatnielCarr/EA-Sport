// =====================================================
// AUTH MODULE - Authentication Management
// =====================================================

import { API_BASE, APP_CONFIG } from './config.js';
import CacheManager from './cache.js';

class Auth {
  constructor() {
    this.tokenKey = APP_CONFIG.tokenKey;
    this.userKey = APP_CONFIG.userKey;
  }

  // Get stored token
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user
  getUser() {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  // Check if user is logged in
  isLoggedIn() {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  // Check if user has admin access
  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'ADMIN';
  }

  // Check if user is Super Admin (Platform Owner)
  isSuperAdmin() {
    const user = this.getUser();
    return user && user.role === 'ADMIN';
  }

  // Login
  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store token and user
    localStorage.setItem(this.tokenKey, data.data.token);
    localStorage.setItem(this.userKey, JSON.stringify(data.data.user));

    return data.data;
  }

  // Register
  async register(email, username, password, firebaseUid = null) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        username, 
        password,
        firebaseUid
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Solo guardar token si el usuario tiene permisos de admin
    const user = data.data.user;
    if (user.role === 'ADMIN') {
      localStorage.setItem(this.tokenKey, data.data.token);
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } else {
      // Usuario normal, no guardar en el panel de admin
      console.log('Usuario registrado pero sin permisos de admin');
    }

    return data.data;
  }

  // Logout
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    
    // Clear all cache on logout for security
    if (typeof CacheManager !== 'undefined') {
      CacheManager.clearAll();
    }
    
    window.location.hash = '#/login';
    window.location.reload();
  }

  // Verify token with server
  async verifyToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      localStorage.setItem(this.userKey, JSON.stringify(data.data));
      return true;
    } catch {
      return false;
    }
  }
}

export default new Auth();
