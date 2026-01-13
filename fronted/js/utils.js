// =====================================================
// UTILS - Utility Functions
// =====================================================

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) return '';

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Sanitize an object's string values
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
export function sanitizeObject(obj) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = escapeHtml(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

/**
 * Create safe HTML from template with escaped values
 * @param {TemplateStringsArray} strings - Template strings
 * @param  {...any} values - Values to escape
 * @returns {string} - Safe HTML string
 */
export function safeHtml(strings, ...values) {
    return strings.reduce((result, str, i) => {
        const value = values[i - 1];
        const escaped = typeof value === 'string' ? escapeHtml(value) : value;
        return result + (escaped ?? '') + str;
    });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in ms
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Get initials from a name safely
 * @param {string} name - Name to get initials from
 * @returns {string} - Initials (1-2 characters)
 */
export function getInitials(name) {
    if (!name || typeof name !== 'string') return 'U';

    return name
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'U';
}

/**
 * Format a date string
 * @param {string} dateString - ISO date string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date
 */
export function formatDate(dateString, options = {}) {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            ...options
        };

        return date.toLocaleDateString('es-ES', defaultOptions);
    } catch {
        return '-';
    }
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} - Formatted currency
 */
export function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency
    }).format(amount || 0);
}

/**
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            return true;
        } catch {
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp a number between min and max
 * @param {number} num - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped number
 */
export function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

export default {
    escapeHtml,
    sanitizeObject,
    safeHtml,
    debounce,
    throttle,
    getInitials,
    formatDate,
    formatCurrency,
    generateId,
    copyToClipboard,
    sleep,
    clamp
};
