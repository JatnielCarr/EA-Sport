/**
 * Capacitor Initialization - Optimizado para iPhone 15 A16 Bionic
 * 
 * Características específicas:
 * - ProMotion display support (hasta 120Hz)
 * - Dynamic Island awareness
 * - Haptic Feedback con Taptic Engine
 * - Optimizaciones de memoria GPU
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { Network } from '@capacitor/network';
import { PushNotifications } from '@capacitor/push-notifications';

// =====================================================
// APP STATE
// =====================================================
const AppState = {
  isNative: Capacitor.isNativePlatform(),
  platform: Capacitor.getPlatform(),
  isOnline: true,
  keyboardVisible: false,
  notificationToken: null
};

// Exportar estado global
window.AppState = AppState;

// =====================================================
// INITIALIZATION
// =====================================================
async function initializeApp() {
  if (!AppState.isNative) {
    console.log('📱 Running in browser mode');
    hideSplash();
    return;
  }

  console.log('📱 Initializing Capacitor for', AppState.platform);

  try {
    // Initialize all plugins in parallel for faster startup
    await Promise.all([
      initStatusBar(),
      initKeyboard(),
      initNetwork(),
      initAppEvents(),
      initHaptics()
    ]);

    // Push notifications (separate due to permissions)
    await initPushNotifications();

    // Hide splash after everything is ready
    await SplashScreen.hide({ fadeOutDuration: 300 });
    hideSplash();

    console.log('✅ Capacitor initialized successfully');
  } catch (error) {
    console.error('❌ Capacitor initialization error:', error);
    hideSplash();
  }
}

// =====================================================
// STATUS BAR (Optimizado para Dynamic Island)
// =====================================================
async function initStatusBar() {
  if (AppState.platform !== 'ios') return;

  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: '#0a0a0f' });
  
  // Overlay for Dynamic Island support
  await StatusBar.setOverlaysWebView({ overlay: true });
}

// =====================================================
// KEYBOARD
// =====================================================
async function initKeyboard() {
  // Keyboard show event
  Keyboard.addListener('keyboardWillShow', (info) => {
    AppState.keyboardVisible = true;
    document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    document.body.classList.add('keyboard-visible');
    
    // Hide tab bar when keyboard shows
    const tabBar = document.querySelector('.tab-bar');
    if (tabBar) tabBar.style.transform = 'translateY(100%)';
  });

  // Keyboard hide event  
  Keyboard.addListener('keyboardWillHide', () => {
    AppState.keyboardVisible = false;
    document.body.style.setProperty('--keyboard-height', '0px');
    document.body.classList.remove('keyboard-visible');
    
    // Show tab bar when keyboard hides
    const tabBar = document.querySelector('.tab-bar');
    if (tabBar) tabBar.style.transform = 'translateY(0)';
  });

  // Auto scroll to input on focus
  Keyboard.setScroll({ isDisabled: false });
  Keyboard.setAccessoryBarVisible({ isVisible: true });
}

// =====================================================
// NETWORK
// =====================================================
async function initNetwork() {
  const status = await Network.getStatus();
  AppState.isOnline = status.connected;
  updateOnlineStatus(status.connected);

  Network.addListener('networkStatusChange', (status) => {
    AppState.isOnline = status.connected;
    updateOnlineStatus(status.connected);
    
    // Haptic feedback for network changes
    if (status.connected) {
      triggerHaptic('success');
    } else {
      triggerHaptic('error');
    }
  });
}

function updateOnlineStatus(isOnline) {
  if (isOnline) {
    document.body.classList.remove('offline');
    hideOfflineBanner();
  } else {
    document.body.classList.add('offline');
    showOfflineBanner();
  }
}

function showOfflineBanner() {
  let banner = document.getElementById('offline-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.className = 'offline-banner';
    banner.innerHTML = '<i class="fas fa-wifi-slash"></i> Sin conexión';
    document.body.prepend(banner);
  }
  banner.classList.add('visible');
}

function hideOfflineBanner() {
  const banner = document.getElementById('offline-banner');
  if (banner) banner.classList.remove('visible');
}

// =====================================================
// APP LIFECYCLE EVENTS
// =====================================================
async function initAppEvents() {
  // App state change (background/foreground)
  App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      console.log('📱 App resumed');
      // Refresh data when app comes to foreground
      window.dispatchEvent(new CustomEvent('app:resume'));
    } else {
      console.log('📱 App backgrounded');
      window.dispatchEvent(new CustomEvent('app:pause'));
    }
  });

  // Back button handler (for Android, but safe to add)
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      // Confirm exit
      if (confirm('¿Salir de ApexTournament?')) {
        App.exitApp();
      }
    }
  });

  // URL open handler (deep links)
  App.addListener('appUrlOpen', ({ url }) => {
    console.log('📱 Deep link:', url);
    handleDeepLink(url);
  });
}

function handleDeepLink(url) {
  // Parse deep link and navigate
  const path = url.replace('apextournament://', '').replace('https://apextournament.com', '');
  if (path) {
    window.location.hash = path;
  }
}

// =====================================================
// HAPTIC FEEDBACK (Taptic Engine A16)
// =====================================================
let hapticsReady = false;

async function initHaptics() {
  hapticsReady = true;
  
  // Add haptic feedback to interactive elements
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-haptic]');
    if (target) {
      const intensity = target.dataset.haptic || 'light';
      triggerHaptic(intensity);
    }
  });
}

export async function triggerHaptic(type = 'light') {
  if (!hapticsReady || !AppState.isNative) return;

  try {
    switch (type) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        break;
      case 'selection':
        await Haptics.selectionStart();
        await Haptics.selectionEnd();
        break;
      default:
        await Haptics.impact({ style: ImpactStyle.Light });
    }
  } catch (error) {
    // Haptics not available, fail silently
  }
}

// Make haptic function globally available
window.triggerHaptic = triggerHaptic;

// =====================================================
// PUSH NOTIFICATIONS
// =====================================================
async function initPushNotifications() {
  if (AppState.platform !== 'ios') return;

  try {
    // Request permission
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
    }

    // Listen for registration
    PushNotifications.addListener('registration', (token) => {
      console.log('📱 Push registration success:', token.value);
      AppState.notificationToken = token.value;
      // Send token to server
      sendTokenToServer(token.value);
    });

    // Listen for push received
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('📱 Push received:', notification);
      triggerHaptic('success');
      showLocalNotification(notification);
    });

    // Listen for action performed
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('📱 Push action:', action);
      handleNotificationAction(action);
    });
  } catch (error) {
    console.log('Push notifications not available:', error);
  }
}

function sendTokenToServer(token) {
  // TODO: Send to your backend
  console.log('Token to send:', token);
}

function showLocalNotification(notification) {
  // Update badge
  const badge = document.getElementById('notifBadge');
  if (badge) {
    const current = parseInt(badge.textContent) || 0;
    badge.textContent = current + 1;
    badge.classList.add('has-notifications');
  }
}

function handleNotificationAction(action) {
  const data = action.notification.data;
  if (data?.url) {
    window.location.hash = data.url;
  }
}

// =====================================================
// SPLASH SCREEN HELPER
// =====================================================
function hideSplash() {
  const splash = document.getElementById('splash-overlay');
  if (splash) {
    splash.classList.add('fade-out');
    setTimeout(() => splash.remove(), 500);
  }
}

// =====================================================
// PERFORMANCE OPTIMIZATIONS FOR A16 BIONIC
// =====================================================

// Enable smooth scrolling with GPU acceleration
document.documentElement.style.setProperty('scroll-behavior', 'smooth');

// Optimize animations for ProMotion (120Hz)
if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  document.documentElement.classList.add('enable-animations');
}

// Intersection Observer for lazy loading
window.lazyLoadObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (el.dataset.src) {
          el.src = el.dataset.src;
          el.removeAttribute('data-src');
        }
        if (el.dataset.bg) {
          el.style.backgroundImage = `url(${el.dataset.bg})`;
          el.removeAttribute('data-bg');
        }
        window.lazyLoadObserver.unobserve(el);
      }
    });
  },
  { rootMargin: '50px' }
);

// =====================================================
// INITIALIZE ON DOM READY
// =====================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

export { AppState };
