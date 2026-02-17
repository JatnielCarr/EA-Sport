// =====================================================
// Componente de Visualización de Transmisiones
// Soporte para Twitch y YouTube
// =====================================================

/**
 * Extrae el ID del canal de Twitch de una URL
 * @param {string} url - URL de Twitch
 * @returns {string|null} - ID del canal o null si es inválida
 */
function extractTwitchChannel(url) {
    if (!url) return null;

    // Remover protocolo y www si existen
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');

    // Match patterns de Twitch
    const patterns = [
        /^twitch\.tv\/([a-zA-Z0-9_]+)$/,
        /^twitch\.tv\/([a-zA-Z0-9_]+)\/?.*$/
    ];

    for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Extrae el ID del canal de YouTube de una URL
 * @param {string} url - URL de YouTube
 * @returns {string|null} - ID del canal o null si es inválida
 */
function extractYouTubeChannel(url) {
    if (!url) return null;

    // Remover protocolo y www si existen
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');

    // Match patterns de YouTube
    const patterns = [
        /^youtube\.com\/channel\/([UC][a-zA-Z0-9_-]+)$/,
        /^youtube\.com\/user\/([a-zA-Z0-9_-]+)$/,
        /^youtube\.com\/c\/([a-zA-Z0-9_-]+)$/,
        /^youtube\.com\/@([a-zA-Z0-9_-]+)$/,
        /^youtu\.be\/([a-zA-Z0-9_-]+)$/
    ];

    for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Crea el HTML para un embed de Twitch
 * @param {string} channel - Nombre del canal de Twitch
 * @param {string} title - Título del stream
 * @returns {string} - HTML del embed
 */
function createTwitchEmbed(channel, title = 'Transmisión en Vivo') {
    return `
        <div class="stream-embed twitch-embed">
            <div class="stream-header">
                <i class="fab fa-twitch"></i>
                <span class="stream-title">${title}</span>
                <a href="https://twitch.tv/${channel}" target="_blank" class="stream-link">
                    <i class="fas fa-external-link-alt"></i> Ver en Twitch
                </a>
            </div>
            <div class="stream-content">
                <iframe
                    src="https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=false"
                    height="400"
                    width="100%"
                    frameborder="0"
                    scrolling="no"
                    allowfullscreen="true">
                </iframe>
            </div>
        </div>
    `;
}

/**
 * Crea el HTML para un embed de YouTube
 * @param {string} channelId - ID del canal de YouTube
 * @param {string} title - Título del stream
 * @returns {string} - HTML del embed
 */
function createYouTubeEmbed(channelId, title = 'Transmisión en Vivo') {
    return `
        <div class="stream-embed youtube-embed">
            <div class="stream-header">
                <i class="fab fa-youtube"></i>
                <span class="stream-title">${title}</span>
                <a href="https://youtube.com/channel/${channelId}" target="_blank" class="stream-link">
                    <i class="fas fa-external-link-alt"></i> Ver en YouTube
                </a>
            </div>
            <div class="stream-content">
                <iframe
                    src="https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=0"
                    height="400"
                    width="100%"
                    frameborder="0"
                    allowfullscreen="true">
                </iframe>
            </div>
        </div>
    `;
}

/**
 * Renderiza las transmisiones disponibles para un torneo o partido
 * @param {Object} data - Datos del torneo o partido con URLs de streaming
 * @param {string} type - 'tournament' o 'match'
 * @returns {string} - HTML de las transmisiones
 */
export function renderStreams(data, type = 'tournament') {
    if (!data) return '';

    const streams = [];

    // Verificar URLs de streaming
    if (data.twitch_url) {
        const channel = extractTwitchChannel(data.twitch_url);
        if (channel) {
            const title = type === 'tournament' ? 'Transmisión del Torneo' : 'Transmisión del Partido';
            streams.push(createTwitchEmbed(channel, title));
        }
    }

    if (data.youtube_url) {
        const channelId = extractYouTubeChannel(data.youtube_url);
        if (channelId) {
            const title = type === 'tournament' ? 'Transmisión del Torneo' : 'Transmisión del Partido';
            streams.push(createYouTubeEmbed(channelId, title));
        }
    }

    if (streams.length === 0) return '';

    return `
        <div class="streams-section">
            <h3 class="streams-title">
                <i class="fas fa-video"></i>
                Transmisiones en Vivo
            </h3>
            <div class="streams-container">
                ${streams.join('')}
            </div>
        </div>
    `;
}

/**
 * Verifica si hay transmisiones disponibles
 * @param {Object} data - Datos del torneo o partido
 * @returns {boolean} - True si hay transmisiones disponibles
 */
export function hasStreams(data) {
    return !!(data?.twitch_url || data?.youtube_url);
}

/**
 * Obtiene las URLs de streaming válidas
 * @param {Object} data - Datos del torneo o partido
 * @returns {Object} - Objeto con twitch y youtube URLs válidas
 */
export function getValidStreamUrls(data) {
    const result = {};

    if (data?.twitch_url && extractTwitchChannel(data.twitch_url)) {
        result.twitch = data.twitch_url;
    }

    if (data?.youtube_url && extractYouTubeChannel(data.youtube_url)) {
        result.youtube = data.youtube_url;
    }

    return result;
}