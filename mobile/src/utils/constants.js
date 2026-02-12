import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator to access host localhost
// Use your machine's local IP (e.g., 192.168.1.x) for physical device testing
export const API_URL = 'http://192.168.0.101:3000';

export const APP_NAME = 'ApexTournament';
export const VERSION = '1.0.0';

// ==========================================
// Subscription Plans (matching FrontedUser)
// ==========================================
export const PLANS = {
    FREE: {
        id: 'FREE',
        name: 'Gratis',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
            'Torneos gratuitos',
            'Perfil básico',
            'Chat global',
            'Estadísticas básicas',
            'Ver partidas en vivo',
        ],
    },
    STANDARD: {
        id: 'STANDARD',
        name: 'Standard',
        monthlyPrice: 499,
        yearlyPrice: 4999,
        features: [
            'Todo lo de Gratis',
            'Torneos premium',
            'Estadísticas avanzadas',
            'Badge STANDARD exclusivo',
            'Sin anuncios',
        ],
    },
    PREMIUM: {
        id: 'PREMIUM',
        name: 'Premium',
        monthlyPrice: 999,
        yearlyPrice: 9999,
        features: [
            'Todo lo de Standard',
            'Torneos exclusivos',
            'Badge LEGEND exclusivo',
            'Soporte prioritario',
            'Acceso anticipado a funciones',
        ],
    },
};

// ==========================================
// Cache TTL (Time-To-Live) in minutes
// ==========================================
export const CACHE_TTL = {
    GAMES: 30,           // 30 minutes - games don't change often
    TOURNAMENTS: 5,      // 5 minutes - tournaments update frequently
    RANKINGS: 10,        // 10 minutes
    USER_PROFILE: 15,    // 15 minutes
    CLANS: 10,           // 10 minutes
    LIVE_MATCHES: 1,     // 1 minute - live data needs frequent refresh
    SUBSCRIPTION: 60,    // 1 hour - subscription status rarely changes
};

// ==========================================
// Feature Comparison (for subscription screen)
// ==========================================
export const COMPARISON_FEATURES = [
    { name: 'Torneos Gratuitos', free: true, standard: true, premium: true, icon: 'trophy' },
    { name: 'Torneos Premium', free: false, standard: true, premium: true, icon: 'diamond' },
    { name: 'Torneos Exclusivos', free: false, standard: false, premium: true, icon: 'star' },
    { name: 'Estadísticas Avanzadas', free: false, standard: true, premium: true, icon: 'analytics' },
    { name: 'Badge Exclusivo', free: false, standard: 'STANDARD', premium: 'LEGEND', icon: 'ribbon' },
    { name: 'Sin Anuncios', free: false, standard: true, premium: true, icon: 'ban' },
    { name: 'Soporte Prioritario', free: false, standard: false, premium: true, icon: 'headset' },
    { name: 'Acceso Anticipado', free: false, standard: false, premium: true, icon: 'flask' },
];

// ==========================================
// FAQ Items (for subscription screen)
// ==========================================
export const FAQ_ITEMS = [
    {
        question: '¿Qué métodos de pago aceptan?',
        answer: 'Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express) a través de Stripe.',
        icon: 'card',
    },
    {
        question: '¿Puedo cancelar en cualquier momento?',
        answer: 'Sí, puedes cancelar tu suscripción cuando quieras. Mantendrás el acceso hasta el final de tu período de facturación.',
        icon: 'refresh',
    },
    {
        question: '¿Puedo cambiar de plan?',
        answer: 'Claro, puedes actualizar o bajar de plan en cualquier momento. Los cambios se aplican inmediatamente.',
        icon: 'swap-horizontal',
    },
    {
        question: '¿Mis pagos son seguros?',
        answer: 'Absolutamente. Utilizamos Stripe para procesar todos los pagos con encriptación de nivel bancario.',
        icon: 'shield-checkmark',
    },
];

// ==========================================
// App Statistics (matching FrontedUser home.js)
// ==========================================
export const APP_STATS = {
    countries: '25+',
    players: '10K+',
    tournaments: '500+',
    prizes: '50K+',
};
