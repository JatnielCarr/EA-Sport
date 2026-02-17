import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import {
    registerForPushNotificationsAsync,
    addNotificationListeners,
} from '../services/notifications';

// Define the URL prefix for deep linking
const prefix = Linking.createURL('/');

// Deep link configuration – maps URL paths to screen names
const linking = {
    prefixes: [prefix, 'apextournament://'],
    config: {
        screens: {
            // Auth screens
            Login: 'login',
            Register: 'register',
            // Main tab screens
            Main: {
                screens: {
                    HomeTab: {
                        screens: {
                            HomeMain: 'home',
                            Clans: 'clans',
                            CreateClan: 'clans/create',
                            Ranking: 'ranking',
                            Live: 'live',
                        },
                    },
                    TournamentsTab: {
                        screens: {
                            TournamentsList: 'tournaments',
                            TournamentDetail: 'tournaments/:id',
                            TournamentInvite: 'tournament/invite/:inviteCode',
                        },
                    },
                    ProfileTab: {
                        screens: {
                            ProfileMain: 'profile',
                            Settings: 'settings',
                            Wallet: 'wallet',
                            EditProfile: 'profile/edit',
                            Favorites: 'favorites',
                            History: 'history',
                            Security: 'security',
                            Subscription: 'subscription',
                            Support: 'support',
                            Legal: {
                                path: 'legal/:type',
                                parse: { type: (type) => type || 'terms' },
                            },
                        },
                    },
                },
            },
        },
    },
};

export default function AppNavigator() {
    const { userToken, isLoading } = useAuth();
    const navigationRef = useRef(null);

    useEffect(() => {
        // Register push notifications on app start
        registerForPushNotificationsAsync();

        // Listen for notifications and navigate accordingly
        const subscription = addNotificationListeners(
            // Notification received while app is in foreground
            (notification) => {
                console.log('Notification received:', notification);
            },
            // User tapped on notification
            (response) => {
                const data = response.notification.request.content.data;
                if (data?.screen && navigationRef.current) {
                    navigationRef.current.navigate(data.screen, data.params || {});
                }
            }
        );

        return () => subscription.remove();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer
            ref={navigationRef}
            linking={linking}
            fallback={
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            }
        >
            {userToken ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}
