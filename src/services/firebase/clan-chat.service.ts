import { db, FIREBASE_COLLECTIONS, FirebaseClanChatMessage } from '../../config/firebase';
import * as admin from 'firebase-admin';

/**
 * Servicio de Chat de Clanes en Tiempo Real (Firebase)
 * 
 * Maneja los mensajes de chat en tiempo real para clanes.
 * MySQL/Prisma guarda los mensajes históricos (ClanMessage).
 * Firebase maneja el chat EN VIVO con sincronización instantánea.
 */
export class ClanChatService {
  private collection = db.collection(FIREBASE_COLLECTIONS.CLAN_CHAT);

  /**
   * Enviar mensaje al chat del clan
   */
  async sendMessage(
    clanId: string,
    userId: string,
    username: string,
    content: string,
    type: 'message' | 'announcement' | 'system' = 'message'
  ): Promise<string> {
    const message: FirebaseClanChatMessage = {
      clanId,
      userId,
      username,
      content,
      type,
      createdAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await this.collection.add(message);
    return docRef.id;
  }

  /**
   * Enviar anuncio del clan (solo líderes/oficiales)
   */
  async sendAnnouncement(
    clanId: string,
    userId: string,
    username: string,
    content: string
  ): Promise<string> {
    return this.sendMessage(clanId, userId, username, content, 'announcement');
  }

  /**
   * Enviar mensaje del sistema
   */
  async sendSystemMessage(clanId: string, content: string): Promise<string> {
    return this.sendMessage(clanId, 'system', 'Sistema', content, 'system');
  }

  /**
   * Obtener mensajes recientes del clan
   */
  async getMessages(clanId: string, limit: number = 100): Promise<FirebaseClanChatMessage[]> {
    const snapshot = await this.collection
      .where('clanId', '==', clanId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseClanChatMessage)).reverse();
  }

  /**
   * Obtener mensajes después de cierto tiempo (para paginación)
   */
  async getMessagesSince(
    clanId: string,
    sinceTimestamp: admin.firestore.Timestamp,
    limit: number = 50
  ): Promise<FirebaseClanChatMessage[]> {
    const snapshot = await this.collection
      .where('clanId', '==', clanId)
      .where('createdAt', '>', sinceTimestamp)
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseClanChatMessage));
  }

  /**
   * Eliminar mensaje
   */
  async deleteMessage(messageId: string): Promise<void> {
    await this.collection.doc(messageId).delete();
  }

  /**
   * Eliminar todos los mensajes de un clan (cuando se elimina el clan)
   */
  async deleteAllClanMessages(clanId: string): Promise<number> {
    const snapshot = await this.collection
      .where('clanId', '==', clanId)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  }

  /**
   * Limpiar mensajes antiguos (mantener solo últimos X días)
   */
  async cleanupOldMessages(clanId: string, daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const snapshot = await this.collection
      .where('clanId', '==', clanId)
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  }
}

// Exportar instancia singleton
export const clanChatService = new ClanChatService();
