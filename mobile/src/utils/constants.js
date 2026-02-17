import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator to access host localhost
// Use your machine's local IP (e.g., 192.168.1.x) for physical device testing
export const API_URL = 'http://10.3.0.132:3000';

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
        maxParticipants: 0,
        maxTournaments: 0,
        features: [
            'Participar en torneos por invitación',
            'Perfil básico',
            'Chat global',
            'Ver partidas en vivo',
        ],
    },
    STANDARD: {
        id: 'STANDARD',
        name: 'Standard',
        monthlyPrice: 499,
        yearlyPrice: 4999,
        maxParticipants: 16,
        maxTournaments: 3,
        features: [
            'Crear y administrar torneos',
            'Hasta 16 jugadores por torneo',
            'Hasta 3 torneos activos',
            'URL de invitación al torneo',
            'Cobro de cuota de inscripción',
            'Estadísticas avanzadas',
            'Sin anuncios',
        ],
    },
    PREMIUM: {
        id: 'PREMIUM',
        name: 'Premium',
        monthlyPrice: 999,
        yearlyPrice: 9999,
        maxParticipants: 64,
        maxTournaments: 10,
        features: [
            'Todo lo de Standard',
            'Hasta 64 jugadores por torneo',
            'Hasta 10 torneos activos',
            'Análisis profesional',
            'Soporte prioritario 24/7',
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
    { name: 'Unirse a torneos por invitación', free: true, standard: true, premium: true, icon: 'trophy' },
    { name: 'Crear torneos', free: false, standard: true, premium: true, icon: 'add-circle' },
    { name: 'Máx. jugadores por torneo', free: '-', standard: '16', premium: '64', icon: 'people' },
    { name: 'Torneos activos', free: '-', standard: '3', premium: '10', icon: 'list' },
    { name: 'URL de invitación', free: false, standard: true, premium: true, icon: 'link' },
    { name: 'Cobrar cuota de inscripción', free: false, standard: true, premium: true, icon: 'cash' },
    { name: 'Estadísticas Avanzadas', free: false, standard: true, premium: true, icon: 'analytics' },
    { name: 'Sin Anuncios', free: false, standard: true, premium: true, icon: 'ban' },
    { name: 'Soporte Prioritario', free: false, standard: false, premium: true, icon: 'headset' },
    { name: 'Análisis Profesional', free: false, standard: false, premium: true, icon: 'flask' },
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
