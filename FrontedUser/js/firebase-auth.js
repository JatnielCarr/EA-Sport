/**
 * Firebase Authentication Service - ApexTournament
 * Maneja autenticación con Firebase Auth
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Auth state listeners
const authListeners = [];

// Listen to auth state changes
onAuthStateChanged(auth, (user) => {
    authListeners.forEach(callback => callback(user));
});

/**
 * Firebase Auth Service
 */
const FirebaseAuth = {
    /**
     * Get current user
     */
    getCurrentUser() {
        return auth.currentUser;
    },

    /**
     * Register auth state listener
     */
    onAuthStateChanged(callback) {
        authListeners.push(callback);
        // Call immediately with current state
        callback(auth.currentUser);
        // Return unsubscribe function
        return () => {
            const index = authListeners.indexOf(callback);
            if (index > -1) authListeners.splice(index, 1);
        };
    },

    /**
     * Login with email and password
     */
    async loginWithEmail(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await result.user.getIdToken();

            // Sync with backend
            const backendResponse = await this.syncWithBackend(idToken);

            // Check if user is banned
            if (backendResponse.banned) {
                await signOut(auth);
                return {
                    success: false,
                    banned: true,
                    ban_info: backendResponse.ban_info
                };
            }

            return {
                success: true,
                user: result.user,
                token: idToken,
                backendUser: backendResponse.user
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    },

    /**
     * Register with email and password
     */
    async registerWithEmail(email, password, username) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);

            // Update profile with username
            await updateProfile(result.user, {
                displayName: username
            });

            const idToken = await result.user.getIdToken();

            // Sync with backend (creates user in MySQL)
            const backendResponse = await this.syncWithBackend(idToken, { username });

            return {
                success: true,
                user: result.user,
                token: idToken,
                backendUser: backendResponse.user
            };
        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    },

    /**
     * Login with Google
     */
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            // Sync with backend
            const backendResponse = await this.syncWithBackend(idToken);

            // Check if user is banned
            if (backendResponse.banned) {
                await signOut(auth);
                return {
                    success: false,
                    banned: true,
                    ban_info: backendResponse.ban_info
                };
            }

            return {
                success: true,
                user: result.user,
                token: idToken,
                backendUser: backendResponse.user
            };
        } catch (error) {
            console.error('Google login error:', error);
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    },

    /**
     * Logout
     */
    async logout() {
        try {
            await signOut(auth);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send password reset email
     */
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    },

    /**
     * Get Firebase ID token (for API calls)
     */
    async getIdToken() {
        const user = auth.currentUser;
        if (!user) return null;
        return await user.getIdToken(true);
    },

    /**
     * Sync Firebase user with backend (MySQL)
     */
    async syncWithBackend(idToken, additionalData = {}) {
        try {
            const API_URL = window.API_BASE_URL || 'http://localhost:3000';

            const response = await fetch(`${API_URL}/auth/firebase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(additionalData)
            });

            const data = await response.json();

            // Check if user is banned
            if (response.status === 403 && data.banned === true) {
                return { banned: true, ban_info: data.ban_info };
            }

            if (data.success) {
                // Store backend token for API calls
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
            }

            return data.data || {};
        } catch (error) {
            console.error('Backend sync error:', error);
            return {};
        }
    },

    /**
     * Get user-friendly error messages
     */
    getErrorMessage(errorCode) {
        const messages = {
            'auth/email-already-in-use': 'Este email ya está registrado',
            'auth/invalid-email': 'Email inválido',
            'auth/operation-not-allowed': 'Operación no permitida',
            'auth/weak-password': 'La contraseña es muy débil',
            'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/invalid-credential': 'Credenciales inválidas',
            'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
            'auth/popup-closed-by-user': 'Popup cerrado por el usuario'
        };
        return messages[errorCode] || 'Error de autenticación';
    }
};

export default FirebaseAuth;
