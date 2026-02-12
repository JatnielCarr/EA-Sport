import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { api } from './api';

const PUSH_TOKEN_KEY = '@push_token';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Register for push notifications and return the token
export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#00D4FF',
        });

        await Notifications.setNotificationChannelAsync('matches', {
            name: 'Partidas',
            description: 'Recordatorios de partidas',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#00D4FF',
        });

        await Notifications.setNotificationChannelAsync('tournaments', {
            name: 'Torneos',
            description: 'Actualizaciones de torneos',
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }

    if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
    }

    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        // Skip push notification registration if no projectId is configured
        if (!projectId) {
            console.log('⚠️  No projectId configured. Push notifications disabled.');
            console.log('   To enable: Set up EAS project or use a development build.');
            return null;
        }

        token = (await Notifications.getExpoPushTokenAsync({
            projectId,
        })).data;

        // Save token locally
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

        // Send token to backend (optional – depends on your backend implementation)
        try {
            await api.post('/users/push-token', { token, platform: Platform.OS });
        } catch (e) {
            // Backend endpoint may not exist yet; that's OK
            console.warn('Could not register push token with server:', e.message);
        }

        console.log('Push token:', token);
    } catch (error) {
        console.warn('⚠️  Push notifications not available:', error.message || error);
        console.log('   This is normal in Expo Go. Use a development build for full functionality.');
    }

    return token;
}

// Get the stored push token
export async function getStoredPushToken() {
    try {
        return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    } catch {
        return null;
    }
}

// Schedule a local notification (e.g., match reminder)
export async function scheduleMatchReminder(matchData) {
    const { title, body, triggerDate, data } = matchData;

    const trigger = new Date(triggerDate);
    // Schedule 15 minutes before
    trigger.setMinutes(trigger.getMinutes() - 15);

    if (trigger <= new Date()) {
        return null; // Don't schedule past notifications
    }

    return await Notifications.scheduleNotificationAsync({
        content: {
            title: title || '⚔️ Partida próxima',
            body: body || 'Tu partida comienza en 15 minutos',
            data: data || {},
            sound: true,
            ...(Platform.OS === 'android' && { channelId: 'matches' }),
        },
        trigger: { date: trigger },
    });
}

// Schedule a tournament update notification
export async function scheduleTournamentNotification(tournamentData) {
    return await Notifications.scheduleNotificationAsync({
        content: {
            title: tournamentData.title || '🏆 Actualización de torneo',
            body: tournamentData.body || 'Hay novedades en tu torneo',
            data: tournamentData.data || {},
            ...(Platform.OS === 'android' && { channelId: 'tournaments' }),
        },
        trigger: null, // Immediate
    });
}

// Cancel all scheduled notifications
export async function cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get scheduled notifications count
export async function getScheduledNotificationsCount() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.length;
}

// Add notification listeners
export function addNotificationListeners(onReceived, onResponse) {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
        (notification) => {
            if (onReceived) onReceived(notification);
        }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
            if (onResponse) onResponse(response);
        }
    );

    return {
        remove: () => {
            receivedSubscription.remove();
            responseSubscription.remove();
        },
    };
}
