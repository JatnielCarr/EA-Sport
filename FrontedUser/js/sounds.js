// =====================================================
// Sound Effects System
// =====================================================

class SoundManager {
    constructor() {
        this.enabled = this.loadPreference();
        this.volume = this.loadVolume();
        this.sounds = {};
        this.audioContext = null;

        // Initialize AudioContext on first user interaction
        this.initOnInteraction();
    }

    /**
     * Initialize AudioContext on user interaction (required by browsers)
     */
    initOnInteraction() {
        const init = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            document.removeEventListener('click', init);
            document.removeEventListener('keydown', init);
        };

        document.addEventListener('click', init, { once: true });
        document.addEventListener('keydown', init, { once: true });
    }

    /**
     * Load sound preference from localStorage
     */
    loadPreference() {
        const stored = localStorage.getItem('apex_sounds_enabled');
        return stored !== null ? JSON.parse(stored) : true;
    }

    /**
     * Load volume from localStorage
     */
    loadVolume() {
        const stored = localStorage.getItem('apex_sounds_volume');
        return stored !== null ? parseFloat(stored) : 0.5;
    }

    /**
     * Save sound preference
     */
    savePreference() {
        localStorage.setItem('apex_sounds_enabled', JSON.stringify(this.enabled));
    }

    /**
     * Save volume
     */
    saveVolume() {
        localStorage.setItem('apex_sounds_volume', this.volume.toString());
    }

    /**
     * Enable sounds
     */
    enable() {
        this.enabled = true;
        this.savePreference();
    }

    /**
     * Disable sounds
     */
    disable() {
        this.enabled = false;
        this.savePreference();
    }

    /**
     * Toggle sounds
     */
    toggle() {
        this.enabled = !this.enabled;
        this.savePreference();
        return this.enabled;
    }

    /**
     * Set volume (0-1)
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        this.saveVolume();
    }

    /**
     * Generate a sound using Web Audio API
     */
    generateSound(frequency, type = 'sine', duration = 0.1, volume = 0.3) {
        if (!this.enabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            const adjustedVolume = volume * this.volume;
            gainNode.gain.setValueAtTime(adjustedVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Sound generation failed:', e);
        }
    }

    /**
     * Play click sound
     */
    click() {
        this.generateSound(800, 'sine', 0.05, 0.2);
    }

    /**
     * Play hover sound
     */
    hover() {
        this.generateSound(600, 'sine', 0.03, 0.1);
    }

    /**
     * Play success sound
     */
    success() {
        if (!this.enabled || !this.audioContext) return;

        // Play ascending notes
        setTimeout(() => this.generateSound(523, 'sine', 0.15, 0.3), 0);    // C5
        setTimeout(() => this.generateSound(659, 'sine', 0.15, 0.3), 100);  // E5
        setTimeout(() => this.generateSound(784, 'sine', 0.25, 0.3), 200);  // G5
    }

    /**
     * Play error sound
     */
    error() {
        if (!this.enabled || !this.audioContext) return;

        // Play descending dissonant notes
        setTimeout(() => this.generateSound(400, 'sawtooth', 0.15, 0.2), 0);
        setTimeout(() => this.generateSound(300, 'sawtooth', 0.2, 0.2), 100);
    }

    /**
     * Play notification sound
     */
    notification() {
        if (!this.enabled || !this.audioContext) return;

        // Two-note notification
        setTimeout(() => this.generateSound(880, 'sine', 0.1, 0.3), 0);   // A5
        setTimeout(() => this.generateSound(1108, 'sine', 0.15, 0.3), 120); // C#6
    }

    /**
     * Play victory/celebration sound
     */
    victory() {
        if (!this.enabled || !this.audioContext) return;

        const notes = [523, 587, 659, 784, 880, 1047]; // C major scale
        notes.forEach((freq, i) => {
            setTimeout(() => this.generateSound(freq, 'sine', 0.15, 0.25), i * 80);
        });
    }

    /**
     * Play warning sound
     */
    warning() {
        if (!this.enabled || !this.audioContext) return;

        setTimeout(() => this.generateSound(440, 'triangle', 0.1, 0.3), 0);
        setTimeout(() => this.generateSound(440, 'triangle', 0.1, 0.3), 150);
    }

    /**
     * Play swoosh sound (for transitions)
     */
    swoosh() {
        if (!this.enabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);

            const adjustedVolume = 0.15 * this.volume;
            gainNode.gain.setValueAtTime(adjustedVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            console.warn('Swoosh sound failed:', e);
        }
    }

    /**
     * Play countdown tick
     */
    tick() {
        this.generateSound(1000, 'sine', 0.05, 0.2);
    }

    /**
     * Play countdown final beep
     */
    finalBeep() {
        this.generateSound(880, 'sine', 0.3, 0.4);
    }

    /**
     * Play match start fanfare
     */
    matchStart() {
        if (!this.enabled || !this.audioContext) return;

        // Epic fanfare
        const fanfare = [
            { freq: 392, delay: 0, duration: 0.2 },     // G4
            { freq: 523, delay: 200, duration: 0.2 },   // C5
            { freq: 659, delay: 400, duration: 0.2 },   // E5
            { freq: 784, delay: 600, duration: 0.4 },   // G5
        ];

        fanfare.forEach(note => {
            setTimeout(() => this.generateSound(note.freq, 'sine', note.duration, 0.3), note.delay);
        });
    }
}

// Create singleton instance
const soundManager = new SoundManager();

// Export functions
export function initSounds() {
    // Add sound toggle button UI if needed
    addSoundToggleUI();
}

function addSoundToggleUI() {
    // Check if already exists
    if (document.getElementById('sound-toggle')) return;

    // The toggle will be added in settings page
}

export function playClick() { soundManager.click(); }
export function playHover() { soundManager.hover(); }
export function playSuccess() { soundManager.success(); }
export function playError() { soundManager.error(); }
export function playNotification() { soundManager.notification(); }
export function playVictory() { soundManager.victory(); }
export function playWarning() { soundManager.warning(); }
export function playSwoosh() { soundManager.swoosh(); }
export function playTick() { soundManager.tick(); }
export function playMatchStart() { soundManager.matchStart(); }
export function toggleSounds() { return soundManager.toggle(); }
export function setSoundVolume(value) { soundManager.setVolume(value); }
export function isSoundEnabled() { return soundManager.enabled; }
export function getSoundVolume() { return soundManager.volume; }

// Make available globally
window.soundManager = soundManager;
window.playSuccess = playSuccess;
window.playError = playError;
window.playVictory = playVictory;
window.playNotification = playNotification;
