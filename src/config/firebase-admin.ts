/**
 * Firebase Admin Configuration - ApexTournament Backend
 * Configura Firebase Admin SDK para verificar tokens
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin
// Note: In production, use environment variables for the service account
const initializeFirebaseAdmin = () => {
    if (admin.apps.length > 0) {
        return admin.apps[0];
    }

    // Option 1: Use environment variables (recommended for production)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }

    // Option 2: Use service account JSON file (for development)
    // Uncomment and update path if you have the JSON file
    // const serviceAccount = require('./firebase-admin-key.json');
    // return admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount),
    // });

    // Option 3: Use default credentials (for Google Cloud environments)
    return admin.initializeApp();
};

const firebaseAdmin = initializeFirebaseAdmin();

/**
 * Verify Firebase ID Token
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<admin.auth.DecodedIdToken>} Decoded token
 */
export const verifyFirebaseToken = async (idToken: string) => {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying Firebase token:', error);
        throw error;
    }
};

/**
 * Get Firebase user by UID
 * @param {string} uid - Firebase user UID
 * @returns {Promise<admin.auth.UserRecord>} User record
 */
export const getFirebaseUser = async (uid: string) => {
    try {
        return await admin.auth().getUser(uid);
    } catch (error) {
        console.error('Error getting Firebase user:', error);
        throw error;
    }
};

export { admin as firebaseAdmin };
export default firebaseAdmin;
