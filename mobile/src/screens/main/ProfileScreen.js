import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    RefreshControl,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, gradients } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { Loading, Button, Badge, Card, AnimatedScreen, AnimatedItem } from '../../components/common';

const DEFAULT_AVATAR = 'https://via.placeholder.com/150/161616/00d4ff?text=User';

export default function ProfileScreen({ navigation }) {
    const { userInfo, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const avatarGlow = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(avatarGlow, {
                    toValue: 0.8,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(avatarGlow, {
                    toValue: 0.3,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/me');
            const profileData = response.data || response;
            if (profileData && profileData.username) {
                setProfile(profileData);
            } else {
                // Usar datos del contexto si la API no devuelve datos válidos
                setProfile(userInfo || { username: 'Usuario', email: 'user@example.com', role: 'PLAYER' });
            }
        } catch (error) {
            console.warn('Error fetching profile:', error);
            // Usar datos del contexto como fallback
            setProfile(userInfo || { username: 'Usuario', email: 'user@example.com', role: 'PLAYER' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfile();
    }, []);

    if (loading) return <Loading text="Cargando perfil..." />;

    const getRoleBadge = (role) => {
        switch (role) {
            case 'ADMIN': return { variant: 'error', text: 'Admin' };
            case 'MODERATOR': return { variant: 'warning', text: 'Moderador' };
            case 'VIP': return { variant: 'primary', text: 'VIP' };
            default: return { variant: 'default', text: 'Jugador' };
        }
    };

    const roleBadge = getRoleBadge(profile?.role);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Header with gradient */}
                <AnimatedScreen>
                    <LinearGradient
                        colors={['rgba(0, 212, 255, 0.2)', 'rgba(121, 40, 202, 0.08)', 'transparent']}
                        style={styles.headerGradient}
                    >
                        <View style={styles.header}>
                            <View style={styles.avatarContainer}>
                                <Animated.View style={[
                                    styles.avatarGlowRing,
                                    { opacity: avatarGlow },
                                ]} />
                                <Image
                                    source={{ uri: profile?.avatar_url || DEFAULT_AVATAR }}
                                    style={styles.avatar}
                                />
                                <TouchableOpacity
                                    style={styles.editAvatarButton}
                                    onPress={() => navigation.navigate('EditProfile')}
                                >
                                    <Ionicons name="camera" size={16} color={colors.white} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.username}>{profile?.username || 'Usuario'}</Text>
                            <Text style={styles.email}>{profile?.email}</Text>
                            <Badge text={roleBadge.text} variant={roleBadge.variant} size="medium" />
                        </View>
                    </LinearGradient>
                </AnimatedScreen>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <LinearGradient colors={gradients.primary} style={styles.statIcon}>
                            <Ionicons name="cash" size={20} color={colors.black} />
                        </LinearGradient>
                        <Text style={styles.statValue}>{profile?.balance || 0}</Text>
                        <Text style={styles.statLabel}>Créditos</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, styles.statIconSecondary]}>
                            <Ionicons name="trophy" size={20} color={colors.secondary} />
                        </View>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Torneos</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, styles.statIconAccent]}>
                            <Ionicons name="trending-up" size={20} color={colors.success} />
                        </View>
                        <Text style={styles.statValue}>0%</Text>
                        <Text style={styles.statLabel}>Win Rate</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => navigation.navigate('Favorites')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                            <Ionicons name="heart" size={22} color={colors.error} />
                        </View>
                        <Text style={styles.quickActionText}>Favoritos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => navigation.navigate('History')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                            <Ionicons name="time" size={22} color={colors.warning} />
                        </View>
                        <Text style={styles.quickActionText}>Historial</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => navigation.navigate('Wallet')}
                    >
                        <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(0, 212, 255, 0.15)' }]}>
                            <Ionicons name="wallet" size={22} color={colors.primary} />
                        </View>
                        <Text style={styles.quickActionText}>Billetera</Text>
                    </TouchableOpacity>
                </View>

                {/* Menu Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cuenta</Text>
                    <Card>
                        <MenuItem
                            icon="person-outline"
                            label="Editar Perfil"
                            onPress={() => navigation.navigate('EditProfile')}
                        />
                        <MenuItem
                            icon="settings-outline"
                            label="Configuración"
                            onPress={() => navigation.navigate('Settings')}
                        />
                        <MenuItem
                            icon="notifications-outline"
                            label="Notificaciones"
                            onPress={() => navigation.navigate('Notifications')}
                        />
                        <MenuItem
                            icon="shield-checkmark-outline"
                            label="Seguridad"
                            onPress={() => navigation.navigate('Security')}
                            isLast
                        />
                    </Card>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Suscripción</Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('Subscription')}
                    >
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.subscriptionCard}
                        >
                            <View style={styles.subscriptionContent}>
                                <View style={styles.subscriptionIcon}>
                                    <Ionicons name="diamond" size={24} color={colors.black} />
                                </View>
                                <View style={styles.subscriptionInfo}>
                                    <Text style={styles.subscriptionTitle}>Hazte Premium</Text>
                                    <Text style={styles.subscriptionDesc}>
                                        Accede a beneficios exclusivos
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={colors.black} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Soporte</Text>
                    <Card>
                        <MenuItem
                            icon="help-circle-outline"
                            label="Centro de Ayuda"
                            onPress={() => navigation.navigate('Support')}
                        />
                        <MenuItem
                            icon="chatbubble-outline"
                            label="Contactar Soporte"
                            onPress={() => navigation.navigate('Support')}
                        />
                        <MenuItem
                            icon="document-text-outline"
                            label="Términos y Condiciones"
                            onPress={() => navigation.navigate('Support')}
                        />
                        <MenuItem
                            icon="shield-outline"
                            label="Política de Privacidad"
                            onPress={() => navigation.navigate('Support')}
                            isLast
                        />
                    </Card>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información</Text>
                    <Card>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Versión</Text>
                            <Text style={styles.infoValue}>1.0.0</Text>
                        </View>
                    </Card>
                </View>

                <View style={styles.logoutContainer}>
                    <Button
                        title="Cerrar Sesión"
                        variant="outline"
                        onPress={logout}
                        icon="log-out-outline"
                    />
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

function MenuItem({ icon, label, onPress, isLast = false }) {
    return (
        <TouchableOpacity
            style={[styles.menuItem, !isLast && styles.menuItemBorder]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.menuItemLeft}>
                <Ionicons name={icon} size={22} color={colors.textSecondary} />
                <Text style={styles.menuText}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerGradient: {
        paddingTop: 20,
    },
    header: {
        alignItems: 'center',
        padding: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: colors.primary,
    },
    avatarGlowRing: {
        position: 'absolute',
        width: 112,
        height: 112,
        borderRadius: 56,
        borderWidth: 2,
        borderColor: colors.primary,
        top: -6,
        left: -6,
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: colors.background,
    },
    username: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        marginHorizontal: 20,
        marginTop: -10,
        padding: 20,
        borderRadius: 16,
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statItem: {
        alignItems: 'center',
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statIconSecondary: {
        backgroundColor: 'rgba(121, 40, 202, 0.15)',
    },
    statIconAccent: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.border,
        marginVertical: 10,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    quickAction: {
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickActionText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuText: {
        fontSize: 15,
        color: colors.text,
    },
    subscriptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
    },
    subscriptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    subscriptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    subscriptionInfo: {},
    subscriptionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.black,
        marginBottom: 2,
    },
    subscriptionDesc: {
        fontSize: 13,
        color: 'rgba(0,0,0,0.6)',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    infoLabel: {
        fontSize: 15,
        color: colors.text,
    },
    infoValue: {
        fontSize: 15,
        color: colors.textSecondary,
    },
    logoutContainer: {
        paddingHorizontal: 20,
        marginTop: 8,
    },
});
