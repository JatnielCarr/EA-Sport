import { notificationService } from '../src/services/firebase/notification.service';
import { liveMatchService } from '../src/services/firebase/live-match.service';
import { clanChatService } from '../src/services/firebase/clan-chat.service';
import { userPresenceService } from '../src/services/firebase/user-presence.service';
import { activityFeedService } from '../src/services/firebase/activity-feed.service';

/**
 * Script para crear datos de prueba en Firebase
 * Ejecutar con: npx tsx scripts/test-firebase-data.ts
 */

async function createTestData() {
  console.log('🚀 Creando datos de prueba en Firebase...\n');

  try {
    // 1. Crear notificación de prueba
    console.log('📬 Creando notificación de prueba...');
    const notificationId = await notificationService.sendNotification(
      'user-test-123',
      'system',
      '¡Bienvenido a ApexTournament!',
      'Tu cuenta ha sido configurada correctamente.',
      { action: 'welcome', version: '1.0' }
    );
    console.log(`✅ Notificación creada con ID: ${notificationId}`);

    // 2. Crear partido en vivo de prueba
    console.log('\n🎮 Creando partido en vivo de prueba...');
    await liveMatchService.startLiveMatch(
      'match-test-456',
      'tournament-test-789',
      { id: 'team-home-1', name: 'Los Guerreros' },
      { id: 'team-away-2', name: 'Los Campeones' }
    );
    console.log('✅ Partido en vivo iniciado');

    // Actualizar score
    await liveMatchService.updateScore('match-test-456', 2, 1);
    console.log('✅ Score actualizado: 2-1');

    // 3. Crear mensajes de chat de clan
    console.log('\n💬 Creando mensajes de chat de clan...');
    const messageId1 = await clanChatService.sendMessage(
      'clan-test-101',
      'user-admin-1',
      'Admin',
      '¡Bienvenidos al clan Los Invencibles!',
      'announcement'
    );
    console.log(`✅ Anuncio creado con ID: ${messageId1}`);

    const messageId2 = await clanChatService.sendMessage(
      'clan-test-101',
      'user-player-2',
      'Jugador1',
      '¡Gracias por aceptarme!',
      'message'
    );
    console.log(`✅ Mensaje creado con ID: ${messageId2}`);

    // 4. Configurar presencia de usuarios
    console.log('\n👤 Configurando presencia de usuarios...');
    await userPresenceService.setOnline('user-admin-1', 'Admin', 'Gestionando torneo');
    await userPresenceService.setOnline('user-player-2', 'Jugador1', 'Jugando ranked');
    await userPresenceService.setOnline('user-player-3', 'Jugador2', 'Viendo stream');
    console.log('✅ Usuarios marcados como online');

    // 5. Crear actividad en el feed
    console.log('\n📊 Creando actividad en el feed...');
    const activityId1 = await activityFeedService.logTournamentStarted(
      'tournament-test-789',
      'Torneo de Verano 2026',
      'Admin'
    );
    console.log(`✅ Actividad de torneo creada con ID: ${activityId1}`);

    const activityId2 = await activityFeedService.logMatchCompleted(
      'match-test-456',
      'Los Guerreros',
      'Los Campeones',
      '2-1'
    );
    console.log(`✅ Actividad de partido creada con ID: ${activityId2}`);

    console.log('\n🎉 ¡Todos los datos de prueba han sido creados exitosamente!');
    console.log('\n📍 Ve a Firebase Console > Firestore Database para ver los datos:');
    console.log('   - Colección: notifications');
    console.log('   - Colección: live_matches');
    console.log('   - Colección: clan_chat');
    console.log('   - Colección: user_presence');
    console.log('   - Colección: activity_feed');

    console.log('\n🔗 URL: https://console.firebase.google.com/project/apextournament-bb8a9/firestore');

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestData().then(() => {
    console.log('\n✨ Script completado. Los datos deberían aparecer en Firebase Console en unos segundos.');
    process.exit(0);
  });
}

export { createTestData };