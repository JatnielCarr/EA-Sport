import { db, FIREBASE_COLLECTIONS, FirebaseNotification } from '../../config/firebase';
import * as admin from 'firebase-admin';

/**
 * Servicio de Notificaciones en Tiempo Real (Firebase)
 * 
 * Este servicio maneja todas las notificaciones push y en tiempo real.
 * MySQL/Prisma NO maneja notificaciones - todo va por Firebase.
 */
export class NotificationService {
  private collection = db.collection(FIREBASE_COLLECTIONS.NOTIFICATIONS);

  /**
   * Enviar notificación a un usuario
   */
  async sendNotification(
    userId: string,
    type: FirebaseNotification['type'],
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<string> {
    const notification: FirebaseNotification = {
      userId,
      type,
      title,
      message,
      data: data || {},
      read: false,
      createdAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await this.collection.add(notification);
    console.log(`📬 Notificación enviada a usuario ${userId}: ${title}`);
    return docRef.id;
  }

  /**
   * Enviar notificación a múltiples usuarios
   */
  async sendBulkNotifications(
    userIds: string[],
    type: FirebaseNotification['type'],
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<string[]> {
    const batch = db.batch();
    const ids: string[] = [];

    for (const userId of userIds) {
      const docRef = this.collection.doc();
      ids.push(docRef.id);
      
      const notification: FirebaseNotification = {
        userId,
        type,
        title,
        message,
        data: data || {},
        read: false,
        createdAt: admin.firestore.Timestamp.now(),
      };
      
      batch.set(docRef, notification);
    }

    await batch.commit();
    console.log(`📬 Notificaciones enviadas a ${userIds.length} usuarios`);
    return ids;
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<FirebaseNotification[]> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseNotification));
  }

  /**
   * Obtener notificaciones no leídas de un usuario
   */
  async getUnreadNotifications(userId: string): Promise<FirebaseNotification[]> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseNotification));
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.collection.doc(notificationId).update({ read: true });
  }

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(userId: string): Promise<void> {
    const snapshot = await this.collection
      .where('userId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.collection.doc(notificationId).delete();
  }

  /**
   * Eliminar notificaciones antiguas (limpieza)
   */
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const snapshot = await this.collection
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`🗑️ Eliminadas ${snapshot.size} notificaciones antiguas`);
    return snapshot.size;
  }
}

// Exportar instancia singleton
export const notificationService = new NotificationService();
