// =====================================================
// Share Module - Social Media Sharing
// =====================================================

/**
 * Share to Twitter/X
 */
export function shareToTwitter(url, text = '') {
    const shareUrl = new URL('https://twitter.com/intent/tweet');
    shareUrl.searchParams.set('url', url);
    if (text) {
        shareUrl.searchParams.set('text', text);
    }
    openShareWindow(shareUrl.toString(), 'twitter');
}

/**
 * Share to Facebook
 */
export function shareToFacebook(url) {
    const shareUrl = new URL('https://www.facebook.com/sharer/sharer.php');
    shareUrl.searchParams.set('u', url);
    openShareWindow(shareUrl.toString(), 'facebook');
}

/**
 * Share to WhatsApp
 */
export function shareToWhatsApp(url, text = '') {
    const message = text ? `${text} ${url}` : url;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    openShareWindow(shareUrl, 'whatsapp');
}

/**
 * Share to Telegram
 */
export function shareToTelegram(url, text = '') {
    const shareUrl = new URL('https://t.me/share/url');
    shareUrl.searchParams.set('url', url);
    if (text) {
        shareUrl.searchParams.set('text', text);
    }
    openShareWindow(shareUrl.toString(), 'telegram');
}

/**
 * Share to LinkedIn
 */
export function shareToLinkedIn(url, title = '') {
    const shareUrl = new URL('https://www.linkedin.com/sharing/share-offsite/');
    shareUrl.searchParams.set('url', url);
    openShareWindow(shareUrl.toString(), 'linkedin');
}

/**
 * Copy link to clipboard
 */
export async function copyToClipboard(text, showFeedback = true) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }

        if (showFeedback && window.showToast) {
            window.showToast('success', 'Enlace copiado', 'El enlace ha sido copiado al portapapeles');
        }

        return true;
    } catch (error) {
        console.error('Failed to copy:', error);

        if (showFeedback && window.showToast) {
            window.showToast('error', 'Error', 'No se pudo copiar el enlace');
        }

        return false;
    }
}

/**
 * Use native Web Share API if available
 */
export async function nativeShare(data) {
    if (!navigator.share) {
        return false;
    }

    try {
        await navigator.share({
            title: data.title || 'ApexTournament',
            text: data.text || '',
            url: data.url || window.location.href
        });
        return true;
    } catch (error) {
        // User cancelled or error
        if (error.name !== 'AbortError') {
            console.error('Share failed:', error);
        }
        return false;
    }
}

/**
 * Check if native sharing is available
 */
export function canNativeShare() {
    return typeof navigator.share === 'function';
}

/**
 * Open share popup window
 */
function openShareWindow(url, name) {
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2 + window.screenX;
    const top = (window.innerHeight - height) / 2 + window.screenY;

    window.open(
        url,
        name,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );
}

/**
 * Create share buttons HTML
 */
export function createShareButtons(url, text = '', options = {}) {
    const showLabels = options.showLabels !== false;
    const compact = options.compact || false;

    return `
        <div class="share-buttons ${compact ? 'compact' : ''}">
            <button class="share-btn twitter" data-network="twitter" data-url="${url}" data-text="${text}" title="Compartir en Twitter">
                <i class="fab fa-twitter"></i>
                ${showLabels && !compact ? '<span>Twitter</span>' : ''}
            </button>
            <button class="share-btn facebook" data-network="facebook" data-url="${url}" title="Compartir en Facebook">
                <i class="fab fa-facebook-f"></i>
                ${showLabels && !compact ? '<span>Facebook</span>' : ''}
            </button>
            <button class="share-btn whatsapp" data-network="whatsapp" data-url="${url}" data-text="${text}" title="Compartir en WhatsApp">
                <i class="fab fa-whatsapp"></i>
                ${showLabels && !compact ? '<span>WhatsApp</span>' : ''}
            </button>
            <button class="share-btn telegram" data-network="telegram" data-url="${url}" data-text="${text}" title="Compartir en Telegram">
                <i class="fab fa-telegram-plane"></i>
                ${showLabels && !compact ? '<span>Telegram</span>' : ''}
            </button>
            <button class="share-btn copy" data-network="copy" data-url="${url}" title="Copiar enlace">
                <i class="fas fa-link"></i>
                ${showLabels && !compact ? '<span>Copiar</span>' : ''}
            </button>
        </div>
    `;
}

/**
 * Initialize share button event listeners
 */
export function initShareButtons(container = document) {
    container.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const network = btn.dataset.network;
            const url = btn.dataset.url || window.location.href;
            const text = btn.dataset.text || '';

            switch (network) {
                case 'twitter':
                    shareToTwitter(url, text);
                    break;
                case 'facebook':
                    shareToFacebook(url);
                    break;
                case 'whatsapp':
                    shareToWhatsApp(url, text);
                    break;
                case 'telegram':
                    shareToTelegram(url, text);
                    break;
                case 'linkedin':
                    shareToLinkedIn(url, text);
                    break;
                case 'copy':
                    copyToClipboard(url);
                    break;
            }
        });
    });
}

/**
 * Create a share dropdown/modal
 */
export function createShareModal(url, title = '', text = '') {
    const fullText = text || `¡Mira ${title} en ApexTournament!`;

    return `
        <div class="share-modal-content">
            <h3 class="share-modal-title">
                <i class="fas fa-share-alt"></i>
                Compartir
            </h3>
            <p class="share-modal-text">${title || 'Compartir este contenido'}</p>
            
            <div class="share-url-box">
                <input type="text" value="${url}" readonly class="share-url-input">
                <button class="share-url-copy" data-url="${url}">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            
            <div class="share-networks">
                ${createShareButtons(url, fullText, { showLabels: true })}
            </div>
        </div>
    `;
}

export default {
    shareToTwitter,
    shareToFacebook,
    shareToWhatsApp,
    shareToTelegram,
    shareToLinkedIn,
    copyToClipboard,
    nativeShare,
    canNativeShare,
    createShareButtons,
    initShareButtons,
    createShareModal
};
