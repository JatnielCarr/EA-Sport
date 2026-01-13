// =====================================================
// CONFIG - Centralized Configuration
// =====================================================

// API Configuration - Change this when deploying to production
export const API_BASE = 'http://localhost:3000';

// Environment detection
export const IS_PRODUCTION = window.location.hostname !== 'localhost' && 
                             window.location.hostname !== '127.0.0.1';

// App Configuration
export const APP_CONFIG = {
  name: 'EA Sports Tournament Hub',
  version: '1.0.0',
  tokenKey: 'ea_sports_token',
  userKey: 'ea_sports_user',
  
  // UI Settings
  toastDuration: 5000,
  animationDuration: 300,
  
  // Pagination
  defaultPageSize: 10,
  maxPageSize: 100
};

// Feature flags
export const FEATURES = {
  enableAnimations: true,
  enableSoundEffects: true,
  enableMouseGlow: true,
  enableCardTilt: true,
  enableConfetti: true
};

export default {
  API_BASE,
  IS_PRODUCTION,
  APP_CONFIG,
  FEATURES
};
