import { db, FIREBASE_COLLECTIONS, FirebaseActivityFeed } from '../../config/firebase';
import * as admin from 'firebase-admin';

/**
 * Servicio de Feed de Actividad (Firebase)
 * 
 * Maneja el feed de actividad en tiempo real de la plataforma.
 * Muestra eventos recientes como partidos completados, torneos iniciados, etc.
 */
export class ActivityFeedService {
  private collection = db.collection(FIREBASE_COLLECTIONS.ACTIVITY_FEED);

  /**
   * Registrar actividad
   */
  async logActivity(
    type: FirebaseActivityFeed['type'],
    actorId: string,
    actorName: string,
    message: string,
    targetId?: string,
    targetName?: string
  ): Promise<string> {
    const activity: FirebaseActivityFeed = {
      type,
      actorId,
      actorName,
      targetId,
      targetName,
      message,
      createdAt: admin.firestore.Timestamp.now(),
    };

    const docRef = await this.collection.add(activity);
    return docRef.id;
  }

  /**
   * Registrar partido completado
   */
  async logMatchCompleted(
    matchId: string,
    winnerName: string,
    loserName: string,
    score: string
  ): Promise<string> {
    return this.logActivity(
      'match_completed',
      matchId,
      winnerName,
      `${winnerName} venció a ${loserName} (${score})`
    );
  }

  /**
   * Registrar torneo iniciado
   */
  async logTournamentStarted(
    tournamentId: string,
    tournamentName: string,
    organizerName: string
  ): Promise<string> {
    return this.logActivity(
      'tournament_started',
      tournamentId,
      tournamentName,
      `El torneo "${tournamentName}" ha comenzado`,
      undefined,
      organizerName
    );
  }

  /**
   * Registrar nuevo usuario
   */
  async logUserJoined(userId: string, username: string): Promise<string> {
    return this.logActivity(
      'user_joined',
      userId,
      username,
      `${username} se ha unido a la plataforma`
    );
  }

  /**
   * Registrar clan creado
   */
  async logClanCreated(
    clanId: string,
    clanName: string,
    leaderName: string
  ): Promise<string> {
    return this.logActivity(
      'clan_created',
      clanId,
      clanName,
      `El clan "${clanName}" ha sido creado por ${leaderName}`,
      undefined,
      leaderName
    );
  }

  /**
   * Obtener feed de actividad reciente
   */
  async getRecentActivity(limit: number = 50): Promise<FirebaseActivityFeed[]> {
    const snapshot = await this.collection
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseActivityFeed));
  }

  /**
   * Obtener actividad por tipo
   */
  async getActivityByType(
    type: FirebaseActivityFeed['type'],
    limit: number = 20
  ): Promise<FirebaseActivityFeed[]> {
    const snapshot = await this.collection
      .where('type', '==', type)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirebaseActivityFeed));
  }

  /**
   * Limpiar actividad antigua
   */
  async cleanupOldActivity(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const snapshot = await this.collection
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
export const activityFeedService = new ActivityFeedService();
