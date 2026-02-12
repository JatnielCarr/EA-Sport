import { db, FIREBASE_COLLECTIONS, FirebaseLiveMatch } from '../../config/firebase';
import * as admin from 'firebase-admin';

/**
 * Servicio de Partidos en Vivo (Firebase)
 * 
 * Maneja el estado en tiempo real de los partidos durante torneos.
 * MySQL/Prisma guarda los datos finales del partido.
 * Firebase maneja el estado EN VIVO (scores, estado, viewers).
 */
export class LiveMatchService {
  private collection = db.collection(FIREBASE_COLLECTIONS.LIVE_MATCHES);

  /**
   * Iniciar transmisión en vivo de un partido
   */
  async startLiveMatch(
    matchId: string,
    tournamentId: string,
    homeTeam: { id: string; name: string },
    awayTeam: { id: string; name: string }
  ): Promise<void> {
    const liveMatch: FirebaseLiveMatch = {
      matchId,
      tournamentId,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      homeScore: 0,
      awayScore: 0,
      status: 'waiting',
      viewers: 0,
      updatedAt: admin.firestore.Timestamp.now(),
    };

    await this.collection.doc(matchId).set(liveMatch);
    console.log(`🎮 Partido en vivo iniciado: ${homeTeam.name} vs ${awayTeam.name}`);
  }

  /**
   * Actualizar estado del partido a "en vivo"
   */
  async setMatchLive(matchId: string): Promise<void> {
    await this.collection.doc(matchId).update({
      status: 'live',
      startedAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  /**
   * Actualizar score en tiempo real
   */
  async updateScore(matchId: string, homeScore: number, awayScore: number): Promise<void> {
    await this.collection.doc(matchId).update({
      homeScore,
      awayScore,
      updatedAt: admin.firestore.Timestamp.now(),
    });
    console.log(`📊 Score actualizado: ${homeScore} - ${awayScore}`);
  }

  /**
   * Incrementar score de un equipo
   */
  async incrementHomeScore(matchId: string): Promise<void> {
    await this.collection.doc(matchId).update({
      homeScore: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  async incrementAwayScore(matchId: string): Promise<void> {
    await this.collection.doc(matchId).update({
      awayScore: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  /**
   * Pausar partido
   */
  async pauseMatch(matchId: string): Promise<void> {
    await this.collection.doc(matchId).update({
      status: 'paused',
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  /**
   * Reanudar partido
   */
  async resumeMatch(matchId: string): Promise<void> {
    await this.collection.doc(matchId).update({
      status: 'live',
      updatedAt: admin.firestore.Timestamp.now(),
    });
  }

  /**
   * Finalizar partido
   */
  async finishMatch(matchId: string, homeScore: number, awayScore: number): Promise<void> {
    await this.collection.doc(matchId).update({
      homeScore,
      awayScore,
      status: 'finished',
      updatedAt: admin.firestore.Timestamp.now(),
    });
    console.log(`🏁 Partido finalizado: ${homeScore} - ${awayScore}`);
  }

  /**
   * Obtener estado de un partido en vivo
   */
  async getLiveMatch(matchId: string): Promise<FirebaseLiveMatch | null> {
    const doc = await this.collection.doc(matchId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as FirebaseLiveMatch;
  }

  /**
   * Obtener todos los partidos en vivo
   */
  async getAllLiveMatches(): Promise<FirebaseLiveMatch[]> {
    const snapshot = await this.collection
      .where('status', '==', 'live')
      .get();

    return snapshot.docs.map(doc => doc.data() as FirebaseLiveMatch);
  }

  /**
   * Obtener partidos en vivo de un torneo
   */
  async getTournamentLiveMatches(tournamentId: string): Promise<FirebaseLiveMatch[]> {
    const snapshot = await this.collection
      .where('tournamentId', '==', tournamentId)
      .where('status', 'in', ['waiting', 'live', 'paused'])
      .get();

    return snapshot.docs.map(doc => doc.data() as FirebaseLiveMatch);
  }

  /**
   * Incrementar conteo de viewers
   */
  async addViewer(matchId: string): Promise<void> {
    await this.collection.doc(matchId).update({
      viewers: admin.firestore.FieldValue.increment(1),
    });
  }

  /**
   * Decrementar conteo de viewers
   */
  async removeViewer(matchId: string): Promise<void> {
    await this.collection.doc(matchId).update({
      viewers: admin.firestore.FieldValue.increment(-1),
    });
  }

  /**
   * Eliminar partido en vivo (cuando termina)
   */
  async deleteLiveMatch(matchId: string): Promise<void> {
    await this.collection.doc(matchId).delete();
  }

  /**
   * Limpiar partidos finalizados antiguos
   */
  async cleanupFinishedMatches(): Promise<number> {
    const snapshot = await this.collection
      .where('status', '==', 'finished')
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
export const liveMatchService = new LiveMatchService();
