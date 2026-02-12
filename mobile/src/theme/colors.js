export const colors = {
    // Primary colors
    primary: '#00d4ff',
    primaryDark: '#00a8cc',
    secondary: '#7928ca',
    accent: '#ff3366',
    
    // Background colors
    background: '#0a0a0a',
    backgroundLight: '#111111',
    card: '#161616',
    cardHover: '#1a1a1a',
    
    // Text colors
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    textMuted: '#666666',
    
    // Status colors
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    live: '#ff3366',
    
    // Utility colors
    border: '#333333',
    borderLight: '#444444',
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
    
    // Gradient colors
    gradientStart: '#00d4ff',
    gradientEnd: '#7928ca',
    
    // Rank colors
    gold: '#ffd700',
    silver: '#c0c0c0',
    bronze: '#cd7f32',
};

export const gradients = {
    primary: ['#00d4ff', '#7928ca'],
    accent: ['#ff3366', '#ff6b6b'],
    dark: ['#161616', '#0a0a0a'],
    success: ['#10b981', '#059669'],
    gold: ['#ffd700', '#ffb800'],
};

export const shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 6.27,
        elevation: 8,
    },
    glow: (color = '#00d4ff') => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    }),
};
