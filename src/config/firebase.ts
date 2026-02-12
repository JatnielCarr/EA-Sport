import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

// =====================================================
// FIREBASE ADMIN SDK - CONFIGURACIÓN PARA TIEMPO REAL
// =====================================================
// Firebase maneja: Notificaciones, Chat, Estado en vivo de partidos,
// Actividad de usuarios, Presencia online
// MySQL/Prisma maneja: Usuarios, Torneos, Equipos, Pagos, Estadísticas
// =====================================================

const serviceAccount = {
  type: "service_account",
  project_id: "apextournament-bb8a9",
  private_key_id: "61baac3df8203384e07e32d412fcf4b65ca1b1c6",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCIn6DOe5eTc6ad\nNt76yt/+0NFiV1GRslO8Hr6+HDSCUC7UkAxtu/+7hJ9XTe5oJuIR6ryZdkyacjbR\n2u3pI4ZP08ulsZBhXyLiHDRTHVvH+79DdkhFkMmEjFeerJ9pFQCGZmb7a9/ZtPOb\nzbj3Qx0zGJAHfC/vOAr+8hgbt2ux0THWAUXL/3qcd3YRIwwEXrBmqS2b5IlZjXBe\nxGROEiGASoRj5c9inMfFmom/QX0Bar9x5FMoo2xuH3fDwsRXfmVGP9oLT3zvqh6G\n8jL6NMT4r6jvP/ylrpVxRSNpv4ow128QntiNXQgWg278J7KNC+1nsA51Qh6OWXD/\nCOfBbfeLAgMBAAECggEAIdnbUA3TWpd3GtDzopQNt+cpWgJklYLnuF6tyBDY+cjA\nMa6XRcEk9eNAT7NhdLDdpq7Ql/11sXbHGmvyMqe4qaLCfIVoTpfx3rA6TrWhfgVk\nOGTgN0xOgeb79raysKihfqt0rKrnxdtN2La6M5mPbI+TcCdXASCTqON3Ebb6mg3s\na/fZwjt1z+oMgvKiXkvCTZDqePEdbk83A4eJVuz4Zg0FGy1lB2SJAXRHvIHSDwwR\nYu5sB4KubCby7pBM/K3wLlGQyY0DZp/oqNC7c14W2pp1BjQjSZkcLUMshjCh/3NI\nPxp5wdvJNMTLKyOWrtqktk/pbz478ugZ23i04K36IQKBgQC72qkWYKAXIo9yCJik\nqJ+zBuYih7Z5Enjm96zHrRuHcELiQLY2VqeG6XtWqhKSPmAKlWa10DrItM9tgf9K\n67A30hXzKUGnX3biofN8CXHNs4TLQCv3z/DbGlPHbUFsMBim1pxiCP5IOqkU04YV\niS6Kp98RbBMkId/EEa8xfaA24wKBgQC6L13FQNmB4cWDn5533a7mRcLafejpB9m1\n6adA1bWwr43fvvDpN7LHn5f513PdyfoFD3Kgb7r/4DNESBT1GgftwdQWsqqHNupQ\naOYNnhg44A73h2TXPsvLVDW4ysADlCHjhr6gUmaVePC1aRGVKCrlTdJxXfGpx/Ik\nsEQblWR1OQKBgHWJ9W5o+wI+v55MPqYYVARCdtB4NfY/VqK9qcAuUiFGXrMOZnRN\nd/j0MhYhyAj1OkalAGUWaxGWAIu2YTRRkCr9KnrA/7FoDAz15FFh33EjuB0sg9ZE\np6GQMYeAlwTIe0Q42BSHKAOtoInFaAolkZd0PiC6jKd5Ane90O6YehydAoGAS2gJ\ns207arY1F8UbGnMHdi4E6BccsNzEGUBDxCeKCcBgVqFv0xUC7IS/uanAPLCj+U6z\nXzVBaIa2XM5Q5qAfW/Un3/WGyXK9XcnOeu9v4gElLq2Acwj04yn9BBXhxNFHFG6r\nYCVfdORhoSenvmBhVzO4qr+gs+HOOXvGaeGMqUkCgYA02+HvFJUAZGYqtB2imoL1\nFkOMYkfxHONx9oRIV9K46My9rQ0kxjH1rv+JrsDF+9NPm6ZVPkRjrr5m6uxqaANE\nLX0+VpknKQWMLGndIhd4B07Lmb2dS0fgpnG4m3f5uu5o/lVfx/yCOuOPITUEM+ow\nHlvtezm/byEblvSBltWHbA==\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@apextournament-bb8a9.iam.gserviceaccount.com",
  client_id: "100465477940166679558",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40apextournament-bb8a9.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Singleton para evitar múltiples inicializaciones
let firebaseApp: admin.app.App | null = null;
let firestoreDb: Firestore | null = null;

/**
 * Inicializa Firebase Admin SDK
 */
export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Verificar si ya existe una app inicializada
    if (admin.apps.length > 0) {
      firebaseApp = admin.apps[0]!;
      console.log('🔥 Firebase Admin SDK ya inicializado');
      return firebaseApp;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    console.log('🔥 Firebase Admin SDK inicializado correctamente');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    throw error;
  }
}

/**
 * Obtiene la instancia de Firestore
 */
export function getFirestore(): Firestore {
  if (firestoreDb) {
    return firestoreDb;
  }

  initializeFirebase();
  firestoreDb = admin.firestore();
  
  // Configuración de Firestore
  firestoreDb.settings({
    ignoreUndefinedProperties: true,
  });

  return firestoreDb;
}

// Exportar instancia de Firestore para uso directo
export const db = getFirestore();

// =====================================================
// COLECCIONES FIREBASE (Definición de estructura)
// =====================================================
export const FIREBASE_COLLECTIONS = {
  // Notificaciones en tiempo real
  NOTIFICATIONS: 'notifications',
  
  // Chat de clanes en tiempo real
  CLAN_CHAT: 'clan_chat',
  
  // Estado en vivo de partidos
  LIVE_MATCHES: 'live_matches',
  
  // Presencia/estado online de usuarios
  USER_PRESENCE: 'user_presence',
  
  // Actividad reciente (feed)
  ACTIVITY_FEED: 'activity_feed',
  
  // Actualizaciones de torneos en vivo
  LIVE_TOURNAMENTS: 'live_tournaments',
} as const;

// =====================================================
// TIPOS PARA FIREBASE
// =====================================================
export interface FirebaseNotification {
  id?: string;
  userId: string;
  type: 'match_start' | 'match_result' | 'tournament_update' | 'clan_invite' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: admin.firestore.Timestamp;
}

export interface FirebaseLiveMatch {
  matchId: string;
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  status: 'waiting' | 'live' | 'paused' | 'finished';
  currentRound?: number;
  startedAt?: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  viewers: number;
}

export interface FirebaseUserPresence {
  oderId: string;
  odername: string;
  online: boolean;
  lastSeen: admin.firestore.Timestamp;
  currentActivity?: string;
}

export interface FirebaseClanChatMessage {
  id?: string;
  clanId: string;
  userId: string;
  username: string;
  content: string;
  type: 'message' | 'announcement' | 'system';
  createdAt: admin.firestore.Timestamp;
}

export interface FirebaseActivityFeed {
  id?: string;
  type: 'match_completed' | 'tournament_started' | 'user_joined' | 'clan_created';
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  message: string;
  createdAt: admin.firestore.Timestamp;
}