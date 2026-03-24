import admin from 'firebase-admin';

/**
 * =====================================================
 * PUSH NOTIFICATION SERVICE (Firebase Cloud Messaging)
 * =====================================================
 * Envía notificaciones push reales a los dispositivos
 * de los jugadores (iOS/Android) usando Firebase Cloud
 * Messaging.
 * =====================================================
 */

export const pushNotificationService = {

    /**
     * Enviar push a un solo dispositivo
     */
    async sendToDevice(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
        try {
            if (!fcmToken) return false;

            await admin.messaging().send({
                token: fcmToken,
                notification: { title, body },
                data: data || {},
                android: {
                    priority: 'high' as const,
                    notification: {
                        sound: 'default',
                        channelId: 'apex_tournament',
                        icon: 'ic_notification'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            });

            console.log(`📱 Push enviado a dispositivo: ${title}`);
            return true;
        } catch (error: any) {
            // Handle invalid/expired tokens
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                console.warn(`⚠️ FCM token inválido o expirado, ignorando...`);
            } else {
                console.error('❌ Error enviando push:', error.message);
            }
            return false;
        }
    },

    /**
     * Enviar push a múltiples dispositivos
     */
    async sendToMultiple(fcmTokens: string[], title: string, body: string, data?: Record<string, string>): Promise<number> {
        if (!fcmTokens || fcmTokens.length === 0) return 0;

        // Filter out empty tokens
        const validTokens = fcmTokens.filter(t => t && t.trim() !== '');
        if (validTokens.length === 0) return 0;

        let successCount = 0;

        // Send individually (handles errors per token)
        for (const token of validTokens) {
            const sent = await this.sendToDevice(token, title, body, data);
            if (sent) successCount++;
        }

        console.log(`📱 Push enviado a ${successCount}/${validTokens.length} dispositivos`);
        return successCount;
    },

    /**
     * Enviar push a un topic (grupo de usuarios suscritos)
     */
    async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
        try {
            await admin.messaging().send({
                topic,
                notification: { title, body },
                data: data || {}
            });

            console.log(`📱 Push enviado a topic: ${topic}`);
            return true;
        } catch (error: any) {
            console.error(`❌ Error enviando push a topic ${topic}:`, error.message);
            return false;
        }
    }
};
