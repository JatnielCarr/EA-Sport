import { db, FIREBASE_COLLECTIONS, FirebaseUserPresence } from '../../config/firebase';
import * as admin from 'firebase-admin';

/**
 * Servicio de Presencia de Usuarios (Firebase)
 * 
 * Maneja el estado online/offline de usuarios en tiempo real.
 * MySQL/Prisma NO maneja presencia - esto es exclusivo de Firebase.
 */
export class UserPresenceService {
  private collection = db.collection(FIREBASE_COLLECTIONS.USER_PRESENCE);

  /**
   * Marcar usuario como online
   */
  async setOnline(userId: string, username: string, activity?: string): Promise<void> {
    const presence: FirebaseUserPresence = {
      oderId: userId,
      odername: username,
      online: true,
      lastSeen: admin.firestore.Timestamp.now(),
      currentActivity: activity,
    };

    await this.collection.doc(userId).set(presence, { merge: true });
  }

  /**
   * Marcar usuario como offline
   */
  async setOffline(userId: string): Promise<void> {
    await this.collection.doc(userId).update({
      online: false,
      lastSeen: admin.firestore.Timestamp.now(),
      currentActivity: admin.firestore.FieldValue.delete(),
    });
  }

  /**
   * Actualizar actividad actual del usuario
   */
  async updateActivity(userId: string, activity: string): Promise<void> {
    await this.collection.doc(userId).update({
      currentActivity: activity,
      lastSeen: admin.firestore.Timestamp.now(),
    });
  }

  /**
   * Actualizar último visto (heartbeat)
   */
  async heartbeat(userId: string): Promise<void> {
    await this.collection.doc(userId).update({
      lastSeen: admin.firestore.Timestamp.now(),
    });
  }

  /**
   * Obtener estado de un usuario
   */
  async getPresence(userId: string): Promise<FirebaseUserPresence | null> {
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as FirebaseUserPresence;
  }

  /**
   * Obtener usuarios online
   */
  async getOnlineUsers(limit: number = 100): Promise<FirebaseUserPresence[]> {
    const snapshot = await this.collection
      .where('online', '==', true)
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as FirebaseUserPresence);
  }

  /**
   * Verificar si un usuario está online
   */
  async isOnline(userId: string): Promise<boolean> {
    const presence = await this.getPresence(userId);
    return presence?.online ?? false;
  }

  /**
   * Obtener usuarios online de una lista (ej. miembros de clan)
   */
  async getOnlineFromList(userIds: string[]): Promise<FirebaseUserPresence[]> {
    if (userIds.length === 0) return [];
    
    // Firestore limita 'in' a 30 elementos, dividir si es necesario
    const chunks: string[][] = [];
    for (let i = 0; i < userIds.length; i += 30) {
      chunks.push(userIds.slice(i, i + 30));
    }

    const results: FirebaseUserPresence[] = [];
    for (const chunk of chunks) {
      const snapshot = await this.collection
        .where('online', '==', true)
        .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
        .get();

      results.push(...snapshot.docs.map(doc => doc.data() as FirebaseUserPresence));
    }

    return results;
  }

  /**
   * Limpiar usuarios inactivos (marcar como offline si no hay heartbeat)
   */
  async cleanupInactiveUsers(minutesInactive: number = 5): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setMinutes(cutoffDate.getMinutes() - minutesInactive);

    const snapshot = await this.collection
      .where('online', '==', true)
      .where('lastSeen', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { online: false });
    });

    await batch.commit();
    return snapshot.size;
  }
}

// Exportar instancia singleton
export const userPresenceService = new UserPresenceService();
