import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import TournamentsScreen from '../screens/main/TournamentsScreen';
import TournamentDetailScreen from '../screens/main/TournamentDetailScreen';
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
import LegalScreen from '../screens/main/LegalScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const TournamentStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

// Stack for Home
function HomeStackNavigator() {
    return (
        <HomeStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: 'bold' },
                headerShadowVisible: false,
            }}
        >
            <HomeStack.Screen
                name="HomeMain"
                component={HomeScreen}
                options={{ headerShown: false }}
            />
            <HomeStack.Screen
                name="Ranking"
                component={RankingScreen}
                options={{ headerShown: false }}
            />
            <HomeStack.Screen
                name="Clans"
                component={ClansScreen}
                options={{ headerShown: false }}
            />
            <HomeStack.Screen
                name="CreateClan"
                component={CreateClanScreen}
                options={{ headerShown: false }}
            />
            <HomeStack.Screen
                name="Live"
                component={LiveScreen}
                options={{ headerShown: false }}
            />
        </HomeStack.Navigator>
    );
}

// Stack for Tournaments (List -> Detail)
function TournamentStackNavigator() {
    return (
        <TournamentStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: 'bold' },
                headerShadowVisible: false,
            }}
        >
            <TournamentStack.Screen
                name="TournamentsList"
                component={TournamentsScreen}
                options={{ headerShown: false }}
            />
            <TournamentStack.Screen
                name="TournamentDetail"
                component={TournamentDetailScreen}
                options={{
                    headerShown: false,
                }}
            />
        </TournamentStack.Navigator>
    );
}

// Stack for Profile (Profile -> Settings, Favorites, etc.)
function ProfileStackNavigator() {
    return (
        <ProfileStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: 'bold' },
                headerShadowVisible: false,
            }}
        >
            <ProfileStack.Screen
                name="ProfileMain"
                component={ProfileScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="Favorites"
                component={FavoritesScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="History"
                component={HistoryScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="Wallet"
                component={WalletScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="Security"
                component={SecurityScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="Subscription"
                component={SubscriptionScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="Support"
                component={SupportScreen}
                options={{ headerShown: false }}
            />
            <ProfileStack.Screen
                name="Legal"
                component={LegalScreen}
                options={{ headerShown: false }}
            />
        </ProfileStack.Navigator>
    );
}

// More options stack
function MoreStackNavigator() {
    return (
        <MoreStack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: 'bold' },
                headerShadowVisible: false,
            }}
        >
            <MoreStack.Screen
                name="RankingMain"
                component={RankingScreen}
                options={{ headerShown: false }}
            />
            <MoreStack.Screen
                name="ClansMain"
                component={ClansScreen}
                options={{ headerShown: false }}
            />
            <MoreStack.Screen
                name="CreateClan"
                component={CreateClanScreen}
                options={{ headerShown: false }}
            />
        </MoreStack.Navigator>
    );
}

export default function MainNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    height: 65,
                    paddingBottom: 10,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Tournaments':
                            iconName = focused ? 'trophy' : 'trophy-outline';
                            break;
                        case 'Live':
                            iconName = focused ? 'radio' : 'radio-outline';
                            break;
                        case 'Ranking':
                            iconName = focused ? 'medal' : 'medal-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        default:
                            iconName = 'ellipsis-horizontal';
                    }

                    // Special styling for active tab
                    if (focused) {
                        return (
                            <View style={styles.activeIconContainer}>
                                <Ionicons name={iconName} size={size} color={color} />
                            </View>
                        );
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeStackNavigator}
                options={{ title: 'Inicio' }}
            />
            <Tab.Screen
                name="Tournaments"
                component={TournamentStackNavigator}
                options={{ title: 'Torneos' }}
            />
            <Tab.Screen
                name="Live"
                component={LiveScreen}
                options={{
                    title: 'En Vivo',
                    tabBarBadge: undefined, // Can add badge for live matches count
                }}
            />
            <Tab.Screen
                name="Ranking"
                component={MoreStackNavigator}
                options={{ title: 'Ranking' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileStackNavigator}
                options={{ title: 'Perfil' }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    activeIconContainer: {
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 12,
        padding: 6,
    },
});
