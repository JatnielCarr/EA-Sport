/**
 * QR Code Service - ApexTournament Mobile
 * 
 * Funcionalidades:
 * - Generar QR para compartir perfil, torneos, clanes
 * - Escanear QR usando la cámara del dispositivo
 * - Deep links para acciones rápidas
 */

import QRCodeStyling from 'qr-code-styling';

// Import Capacitor only if available (for native builds)
let Haptics = null;
let ImpactStyle = null;
let NotificationType = null;

// Dynamic import for Capacitor (only in native context)
async function loadCapacitorHaptics() {
  try {
    const module = await import('@capacitor/haptics');
    Haptics = module.Haptics;
    ImpactStyle = module.ImpactStyle;
    NotificationType = module.NotificationType;
  } catch (e) {
    console.log('Haptics not available (web mode)');
  }
}
loadCapacitorHaptics();

// =====================================================
// QR CODE GENERATOR
// =====================================================

/**
 * Configuración de estilo del QR
 */
const QR_STYLE_CONFIG = {
  width: 280,
  height: 280,
  type: 'svg',
  dotsOptions: {
    color: '#00d4ff',
    type: 'rounded'
  },
  cornersSquareOptions: {
    color: '#00d4ff',
    type: 'extra-rounded'
  },
  cornersDotOptions: {
    color: '#ffffff',
    type: 'dot'
  },
  backgroundOptions: {
    color: '#0a0a0f'
  },
  imageOptions: {
    crossOrigin: 'anonymous',
    margin: 10
  }
};

/**
 * Generar código QR estilizado
 */
export function generateQRCode(data, options = {}) {
  const config = {
    ...QR_STYLE_CONFIG,
    data,
    ...options
  };

  return new QRCodeStyling(config);
}

/**
 * Generar QR y renderizar en un elemento
 */
export async function renderQRCode(containerId, data, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('QR container not found:', containerId);
    return null;
  }

  // Limpiar contenedor
  container.innerHTML = '';

  const qr = generateQRCode(data, options);
  await qr.append(container);

  return qr;
}

/**
 * Descargar QR como imagen
 */
export async function downloadQRCode(data, filename = 'apex-qr', options = {}) {
  const qr = generateQRCode(data, options);
  await qr.download({ name: filename, extension: 'png' });
  
  // Haptic feedback
  if (Haptics && NotificationType) {
    await Haptics.notification({ type: NotificationType.Success });
  }
}

// =====================================================
// QR TYPES - Deep Links
// =====================================================

export const QR_TYPES = {
  PROFILE: 'profile',
  TOURNAMENT: 'tournament',
  CLAN: 'clan',
  TEAM: 'team',
  MATCH: 'match',
  INVITE: 'invite'
};

/**
 * Generar URL para código QR
 */
export function generateQRUrl(type, id, extra = {}) {
  const baseUrl = 'apextournament://';
  
  switch (type) {
    case QR_TYPES.PROFILE:
      return `${baseUrl}user/${id}`;
    case QR_TYPES.TOURNAMENT:
      return `${baseUrl}tournament/${id}`;
    case QR_TYPES.CLAN:
      return `${baseUrl}clan/${id}`;
    case QR_TYPES.TEAM:
      return `${baseUrl}team/${id}`;
    case QR_TYPES.MATCH:
      return `${baseUrl}match/${id}/live`;
    case QR_TYPES.INVITE:
      return `${baseUrl}invite/${id}?type=${extra.inviteType || 'clan'}&token=${extra.token || ''}`;
    default:
      return `${baseUrl}${type}/${id}`;
  }
}

/**
 * Parsear URL de QR escaneado
 */
export function parseQRUrl(url) {
  try {
    // Soportar ambos formatos: apextournament:// y https://
    const cleanUrl = url
      .replace('apextournament://', '')
      .replace('https://apextournament.com/', '')
      .replace('http://localhost:5175/#/', '');
    
    const parts = cleanUrl.split('/');
    const params = new URLSearchParams(cleanUrl.split('?')[1] || '');
    
    return {
      type: parts[0],
      id: parts[1]?.split('?')[0],
      params: Object.fromEntries(params),
      raw: url
    };
  } catch (error) {
    console.error('Error parsing QR URL:', error);
    return null;
  }
}

// =====================================================
// QR SCANNER (Web-based usando Camera API)
// =====================================================

let scannerActive = false;
let videoStream = null;

/**
 * Iniciar escáner de QR
 */
export async function startQRScanner(onScan, onError) {
  if (scannerActive) {
    console.warn('Scanner already active');
    return;
  }

  try {
    // Crear overlay del escáner
    createScannerUI();
    
    // Obtener stream de la cámara
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    const video = document.getElementById('qr-scanner-video');
    if (video) {
      video.srcObject = videoStream;
      video.play();
    }

    scannerActive = true;
    
    // Iniciar detección con BarcodeDetector (si está disponible)
    if ('BarcodeDetector' in window) {
      startBarcodeDetection(video, onScan);
    } else {
      // Fallback: usar librería JS
      startJSDetection(video, onScan);
    }

    // Haptic feedback
    if (Haptics && ImpactStyle) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }

  } catch (error) {
    console.error('Error starting scanner:', error);
    if (onError) onError(error);
    stopQRScanner();
  }
}

/**
 * Detener escáner
 */
export async function stopQRScanner() {
  scannerActive = false;

  // Detener stream de video
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }

  // Remover UI del escáner
  const overlay = document.getElementById('qr-scanner-overlay');
  if (overlay) {
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 300);
  }
}

/**
 * Crear UI del escáner
 */
function createScannerUI() {
  // Remover si ya existe
  const existing = document.getElementById('qr-scanner-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'qr-scanner-overlay';
  overlay.className = 'qr-scanner-overlay';
  overlay.innerHTML = `
    <div class="qr-scanner-header">
      <button class="qr-scanner-close" id="qr-scanner-close">
        <i class="fas fa-times"></i>
      </button>
      <h2>Escanear QR</h2>
      <div style="width: 44px;"></div>
    </div>
    
    <div class="qr-scanner-viewport">
      <video id="qr-scanner-video" playsinline autoplay muted></video>
      <div class="qr-scanner-frame">
        <div class="qr-scanner-corner top-left"></div>
        <div class="qr-scanner-corner top-right"></div>
        <div class="qr-scanner-corner bottom-left"></div>
        <div class="qr-scanner-corner bottom-right"></div>
        <div class="qr-scanner-line"></div>
      </div>
    </div>
    
    <div class="qr-scanner-hint">
      <i class="fas fa-qrcode"></i>
      <p>Apunta la cámara al código QR</p>
    </div>
    
    <div class="qr-scanner-actions">
      <button class="btn btn-secondary" id="qr-scanner-gallery">
        <i class="fas fa-image"></i> Galería
      </button>
      <button class="btn btn-primary" id="qr-scanner-flash">
        <i class="fas fa-bolt"></i> Flash
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Event listeners
  document.getElementById('qr-scanner-close').addEventListener('click', stopQRScanner);
  document.getElementById('qr-scanner-gallery').addEventListener('click', scanFromGallery);
  document.getElementById('qr-scanner-flash').addEventListener('click', toggleFlash);

  // Animación de entrada
  requestAnimationFrame(() => overlay.classList.add('active'));
}

/**
 * Detección usando BarcodeDetector API (nativo en Chrome/Safari)
 */
async function startBarcodeDetection(video, onScan) {
  const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
  
  const detect = async () => {
    if (!scannerActive) return;

    try {
      const barcodes = await barcodeDetector.detect(video);
      
      if (barcodes.length > 0) {
        const result = barcodes[0].rawValue;
        await handleScanResult(result, onScan);
        return;
      }
    } catch (error) {
      // Silently continue
    }

    requestAnimationFrame(detect);
  };

  detect();
}

/**
 * Fallback: Detección usando Canvas + jsQR
 */
async function startJSDetection(video, onScan) {
  // Cargar jsQR dinámicamente
  if (!window.jsQR) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    document.head.appendChild(script);
    await new Promise(resolve => script.onload = resolve);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const detect = () => {
    if (!scannerActive) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        handleScanResult(code.data, onScan);
        return;
      }
    }

    requestAnimationFrame(detect);
  };

  detect();
}

/**
 * Manejar resultado del escaneo
 */
async function handleScanResult(result, onScan) {
  // Haptic feedback
  if (Haptics && NotificationType) {
    await Haptics.notification({ type: NotificationType.Success });
  }

  // Parsear URL
  const parsed = parseQRUrl(result);

  // Callback
  if (onScan) {
    onScan(result, parsed);
  }

  // Cerrar escáner
  stopQRScanner();
}

/**
 * Escanear desde galería (usando input de archivo HTML5)
 */
async function scanFromGallery() {
  return new Promise((resolve, reject) => {
    // Crear input de archivo oculto
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Usar jsQR para decodificar
            if (!window.jsQR) {
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
              document.head.appendChild(script);
              await new Promise(res => script.onload = res);
            }

            const code = window.jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
              handleScanResult(code.data, window._currentScanCallback);
              resolve(code.data);
            } else {
              if (Haptics && NotificationType) {
                await Haptics.notification({ type: NotificationType.Error });
              }
              alert('No se encontró un código QR en la imagen');
              reject(new Error('No QR code found'));
            }
          };
          
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      } catch (error) {
        reject(error);
      }
      
      document.body.removeChild(input);
    };
    
    input.oncancel = () => {
      document.body.removeChild(input);
      reject(new Error('Cancelled'));
    };
    
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Toggle flash/linterna
 */
async function toggleFlash() {
  if (!videoStream) return;

  const track = videoStream.getVideoTracks()[0];
  const capabilities = track.getCapabilities();

  if (capabilities.torch) {
    const settings = track.getSettings();
    const newTorchState = !settings.torch;
    
    await track.applyConstraints({
      advanced: [{ torch: newTorchState }]
    });

    const btn = document.getElementById('qr-scanner-flash');
    btn.classList.toggle('active', newTorchState);
    
    if (Haptics && ImpactStyle) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  }
}

// =====================================================
// QUICK QR GENERATORS
// =====================================================

/**
 * Generar QR de perfil de usuario
 */
export function generateProfileQR(userId, username) {
  return {
    data: generateQRUrl(QR_TYPES.PROFILE, userId),
    title: `Perfil de ${username}`,
    subtitle: 'Escanea para ver el perfil'
  };
}

/**
 * Generar QR de torneo
 */
export function generateTournamentQR(tournamentId, tournamentName) {
  return {
    data: generateQRUrl(QR_TYPES.TOURNAMENT, tournamentId),
    title: tournamentName,
    subtitle: 'Escanea para ver el torneo'
  };
}

/**
 * Generar QR de invitación a clan
 */
export function generateClanInviteQR(clanId, clanName, inviteToken) {
  return {
    data: generateQRUrl(QR_TYPES.INVITE, clanId, { 
      inviteType: 'clan', 
      token: inviteToken 
    }),
    title: `Únete a ${clanName}`,
    subtitle: 'Escanea para unirte al clan'
  };
}

/**
 * Generar QR de partido en vivo
 */
export function generateMatchQR(matchId, matchTitle) {
  return {
    data: generateQRUrl(QR_TYPES.MATCH, matchId),
    title: matchTitle,
    subtitle: 'Escanea para ver en vivo'
  };
}

export default {
  generateQRCode,
  renderQRCode,
  downloadQRCode,
  startQRScanner,
  stopQRScanner,
  parseQRUrl,
  generateQRUrl,
  QR_TYPES,
  generateProfileQR,
  generateTournamentQR,
  generateClanInviteQR,
  generateMatchQR
};
