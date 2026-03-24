import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Dimensions, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients } from '../theme/colors';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import TournamentsScreen from '../screens/main/TournamentsScreen';
import TournamentDetailScreen from '../screens/main/TournamentDetailScreen';
import TournamentInviteScreen from '../screens/main/TournamentInviteScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import RankingScreen from '../screens/main/RankingScreen';
import ClansScreen from '../screens/main/ClansScreen';
import LiveScreen from '../screens/main/LiveScreen';
import FavoritesScreen from '../screens/main/FavoritesScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import WalletScreen from '../screens/main/WalletScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import SecurityScreen from '../screens/main/SecurityScreen';
import NotificationsScreen from '../screens/main/NotificationsScreen';
import SubscriptionScreen from '../screens/main/SubscriptionScreen';
import SupportScreen from '../screens/main/SupportScreen';
import CreateClanScreen from '../screens/main/CreateClanScreen';
import ClanDetailScreen from '../screens/main/ClanDetailScreen';
import MatchActiveScreen from '../screens/main/MatchActiveScreen';
import DisputeScreen from '../screens/main/DisputeScreen';
import LegalScreen from '../screens/main/LegalScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const TournamentStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

const stackScreenOptions = {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: 'bold' },
    headerShadowVisible: false,
};

// Stack for Home
function HomeStackNavigator() {
    return (
        <HomeStack.Navigator screenOptions={stackScreenOptions}>
            <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
            <HomeStack.Screen name="Ranking" component={RankingScreen} options={{ headerShown: false }} />
            <HomeStack.Screen name="Clans" component={ClansScreen} options={{ headerShown: false }} />
            <HomeStack.Screen name="CreateClan" component={CreateClanScreen} options={{ headerShown: false }} />
            <HomeStack.Screen name="ClanDetail" component={ClanDetailScreen} options={{ headerShown: false }} />
            <HomeStack.Screen name="Live" component={LiveScreen} options={{ headerShown: false }} />
            <HomeStack.Screen name="MatchActive" component={MatchActiveScreen} options={{ headerShown: false }} />
            <HomeStack.Screen name="Dispute" component={DisputeScreen} options={{ headerShown: false }} />
        </HomeStack.Navigator>
    );
}

// Stack for Tournaments
function TournamentStackNavigator() {
    return (
        <TournamentStack.Navigator screenOptions={stackScreenOptions}>
            <TournamentStack.Screen name="TournamentsList" component={TournamentsScreen} options={{ headerShown: false }} />
            <TournamentStack.Screen name="TournamentDetail" component={TournamentDetailScreen} options={{ headerShown: false }} />
            <TournamentStack.Screen name="TournamentInvite" component={TournamentInviteScreen} options={{ headerShown: false }} />
            <TournamentStack.Screen name="MatchActive" component={MatchActiveScreen} options={{ headerShown: false }} />
            <TournamentStack.Screen name="Dispute" component={DisputeScreen} options={{ headerShown: false }} />
        </TournamentStack.Navigator>
    );
}

// Stack for Profile
function ProfileStackNavigator() {
    return (
        <ProfileStack.Navigator screenOptions={stackScreenOptions}>
            <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
            <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
            <ProfileStack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
            <ProfileStack.Screen name="History" component={HistoryScreen} options={{ headerShown: false }} />
            <ProfileStack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: false }} />
            <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
            <ProfileStack.Screen name="Security" component={SecurityScreen} options={{ headerShown: false }} />
            <ProfileStack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
            <ProfileStack.Screen name="Subscription" component={SubscriptionScreen} options={{ headerShown: false }} />
            <ProfileStack.Screen name="Support" component={SupportScreen} options={{ headerShown: false }} />
            <ProfileStack.Screen name="Legal" component={LegalScreen} options={{ headerShown: false }} />
        </ProfileStack.Navigator>
    );
}

// More options stack
function MoreStackNavigator() {
    return (
        <MoreStack.Navigator screenOptions={stackScreenOptions}>
            <MoreStack.Screen name="RankingMain" component={RankingScreen} options={{ headerShown: false }} />
            <MoreStack.Screen name="ClansMain" component={ClansScreen} options={{ headerShown: false }} />
            <MoreStack.Screen name="CreateClan" component={CreateClanScreen} options={{ headerShown: false }} />
            <MoreStack.Screen name="ClanDetail" component={ClanDetailScreen} options={{ headerShown: false }} />
            <MoreStack.Screen name="MatchActive" component={MatchActiveScreen} options={{ headerShown: false }} />
            <MoreStack.Screen name="Dispute" component={DisputeScreen} options={{ headerShown: false }} />
        </MoreStack.Navigator>
    );
}

// =====================================================
// Custom Premium Tab Bar
// =====================================================
const TAB_CONFIG = [
    { route: 'Home', label: 'Inicio', icon: 'home', iconOutline: 'home-outline' },
    { route: 'Tournaments', label: 'Torneos', icon: 'trophy', iconOutline: 'trophy-outline' },
    { route: 'Live', label: 'En Vivo', icon: 'radio', iconOutline: 'radio-outline', isLive: true },
    { route: 'Ranking', label: 'Ranking', icon: 'medal', iconOutline: 'medal-outline' },
    { route: 'Profile', label: 'Perfil', icon: 'person', iconOutline: 'person-outline' },
];

function TabIcon({ focused, config }) {
    const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
    const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.5)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: focused ? 1 : 0.9,
                useNativeDriver: true,
                speed: 20,
                bounciness: focused ? 8 : 0,
            }),
            Animated.timing(opacityAnim, {
                toValue: focused ? 1 : 0.5,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [focused]);

    const iconName = focused ? config.icon : config.iconOutline;

    if (focused) {
        return (
            <Animated.View style={[tabStyles.activeTab, { transform: [{ scale: scaleAnim }] }]}>
                <LinearGradient
                    colors={config.isLive ? ['rgba(255,51,102,0.2)', 'rgba(255,51,102,0.05)'] : ['rgba(0,212,255,0.2)', 'rgba(0,212,255,0.05)']}
                    style={tabStyles.activeIconBg}
                >
                    <Ionicons
                        name={iconName}
                        size={22}
                        color={config.isLive ? colors.live : colors.primary}
                    />
                </LinearGradient>
                <View style={[tabStyles.activeIndicator, config.isLive && tabStyles.liveIndicator]} />
            </Animated.View>
        );
    }

    return (
        <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
            <Ionicons name={iconName} size={22} color={colors.textMuted} />
        </Animated.View>
    );
}

function CustomTabBar({ state, descriptors, navigation }) {
    const insets = useSafeAreaInsets();
    const bottomPadding = Math.max(insets.bottom, 8);

    return (
        <View style={[tabStyles.container, { paddingBottom: bottomPadding }]}>
            {/* Top accent line */}
            <LinearGradient
                colors={['transparent', 'rgba(0,212,255,0.3)', 'rgba(121,40,202,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={tabStyles.accentLine}
            />

            <View style={tabStyles.tabRow}>
                {state.routes.map((route, index) => {
                    const config = TAB_CONFIG[index];
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={tabStyles.tabButton}
                            activeOpacity={0.7}
                        >
                            <TabIcon focused={isFocused} config={config} />
                            <Text style={[
                                tabStyles.label,
                                isFocused && tabStyles.labelActive,
                                config.isLive && isFocused && tabStyles.labelLive,
                            ]}>
                                {config.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const tabStyles = StyleSheet.create({
    container: {
        backgroundColor: colors.tabBarBg,
        borderTopWidth: 1,
        borderTopColor: colors.glassBorder,
        paddingTop: 8,
    },
    accentLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
    },
    tabRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    activeTab: {
        alignItems: 'center',
    },
    activeIconBg: {
        width: 44,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.primary,
        marginTop: 3,
    },
    liveIndicator: {
        backgroundColor: colors.live,
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
        color: colors.textMuted,
        marginTop: 2,
    },
    labelActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    labelLive: {
        color: colors.live,
    },
});

// =====================================================
// Main Navigator
// =====================================================
export default function MainNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Home" component={HomeStackNavigator} options={{ title: 'Inicio' }} />
            <Tab.Screen name="Tournaments" component={TournamentStackNavigator} options={{ title: 'Torneos' }} />
            <Tab.Screen name="Live" component={LiveScreen} options={{ title: 'En Vivo' }} />
            <Tab.Screen name="Ranking" component={MoreStackNavigator} options={{ title: 'Ranking' }} />
            <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ title: 'Perfil' }} />
        </Tab.Navigator>
    );
}
