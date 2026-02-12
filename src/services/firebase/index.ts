// =====================================================
// SERVICIOS FIREBASE - Índice de exportación
// =====================================================
// Estos servicios manejan datos en TIEMPO REAL
// MySQL/Prisma maneja datos PERSISTENTES/ESTRUCTURADOS
// =====================================================

export { notificationService, NotificationService } from './notification.service';
export { liveMatchService, LiveMatchService } from './live-match.service';
export { clanChatService, ClanChatService } from './clan-chat.service';
export { userPresenceService, UserPresenceService } from './user-presence.service';
export { activityFeedService, ActivityFeedService } from './activity-feed.service';

// Re-exportar tipos de Firebase
export {
  db,
  FIREBASE_COLLECTIONS,
  initializeFirebase,
  getFirestore,
  type FirebaseNotification,
  type FirebaseLiveMatch,
  type FirebaseUserPresence,
  type FirebaseClanChatMessage,
  type FirebaseActivityFeed,
} from '../../config/firebase';
