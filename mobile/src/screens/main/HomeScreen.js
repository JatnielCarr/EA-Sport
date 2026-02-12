import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { colors, gradients, shadows } from '../../theme/colors';
import { Button, Card, StatCard, Loading, Badge } from '../../components/common';
import { PLANS, APP_STATS } from '../../utils/constants';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    const { userInfo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [games, setGames] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [clans, setClans] = useState([]);
    const [stats, setStats] = useState({
        tournaments: 0,
        players: 10000,
        games: 0,
        prizes: 50000,
    });

    const fetchData = async () => {
        try {
            const [gamesRes, tournamentsRes, clansRes] = await Promise.all([
                api.games.getAll(),
                api.tournaments.getAll(),
                api.clans.getAll(),
            ]);

            const gamesData = Array.isArray(gamesRes) ? gamesRes : (gamesRes.data || []);
            const tournamentsData = Array.isArray(tournamentsRes) ? tournamentsRes : (tournamentsRes.data || []);
            const clansData = Array.isArray(clansRes) ? clansRes : (clansRes.data || []);

            // Si no hay datos de la API, usar datos de ejemplo
            const finalGames = gamesData.length > 0 ? gamesData : [
                { id: 1, name: 'FIFA 24', icon_url: null },
                { id: 2, name: 'Call of Duty', icon_url: null },
                { id: 3, name: 'Fortnite', icon_url: null },
            ];

            const finalTournaments = tournamentsData.length > 0 ? tournamentsData : [
                { id: 1, name: 'Torneo de Ejemplo', status: 'REGISTRATION_OPEN', game: { name: 'FIFA 24' }, start_date: new Date().toISOString(), format: 'KNOCKOUT', team_size: 1 },
            ];

            const finalClans = clansData.length > 0 ? clansData : [
                { id: 1, name: 'Elite Gamers', tag: 'ELT', member_count: 25 },
                { id: 2, name: 'Apex Legends', tag: 'APX', member_count: 18 },
                { id: 3, name: 'Pro Fighters', tag: 'PRO', member_count: 32 },
            ];

            setGames(finalGames);
            setTournaments(finalTournaments);
            setClans(finalClans.slice(0, 3));
            setStats(prev => ({
                ...prev,
                tournaments: finalTournaments.length,
                games: finalGames.length,
            }));
        } catch (error) {
            console.warn('Error fetching data:', error);
            // Datos de ejemplo cuando falla la API
            setGames([
                { id: 1, name: 'FIFA 24', icon_url: null },
                { id: 2, name: 'Call of Duty', icon_url: null },
            ]);
            setTournaments([]);
            setClans([
                { id: 1, name: 'Elite Gamers', tag: 'ELT', member_count: 25 },
                { id: 2, name: 'Apex Legends', tag: 'APX', member_count: 18 },
            ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);

    const handleSubscribe = (planId) => {
        if (planId === 'FREE') {
            Alert.alert('Plan Gratuito', 'Ya tienes acceso al plan gratuito.');
            return;
        }

        const plan = PLANS[planId];
        Alert.alert(
            `Suscribirse a ${plan.name}`,
            `¿Deseas suscribirte al plan ${plan.name} por $${plan.monthlyPrice}/mes?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Ver detalles',
                    onPress: () => navigation.navigate('Profile', { screen: 'Subscription' })
                }
            ]
        );
    };

    const featuredTournaments = tournaments
        .filter(t => t.status === 'REGISTRATION_OPEN' || t.status === 'IN_PROGRESS')
        .slice(0, 3);

    if (loading) return <Loading text="Cargando..." />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Hero Section */}
                <LinearGradient
                    colors={['rgba(0,212,255,0.15)', 'transparent']}
                    style={styles.heroGradient}
                >
                    <View style={styles.hero}>
                        <View style={styles.heroBadge}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.heroBadgeText}>🎮 La mejor plataforma de esports</Text>
                        </View>

                        <Text style={styles.heroTitle}>
                            Tu portal hacia{'\n'}
                            <Text style={styles.heroTitleGradient}>la gloria competitiva</Text>
                        </Text>

                        <Text style={styles.heroSubtitle}>
                            Compite en torneos épicos, crea tu clan y escala en el ranking mundial.
                        </Text>

                        <View style={styles.heroActions}>
                            <Button
                                title="Explorar Torneos"
                                icon="trophy-outline"
                                onPress={() => navigation.navigate('Tournaments')}
                            />
                        </View>

                        <View style={styles.trustBadges}>
                            <TouchableOpacity style={styles.trustBadge} onPress={() => navigation.navigate('Profile', { screen: 'Security' })}>
                                <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                                <Text style={styles.trustText}>100% Seguro</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.trustBadge} onPress={() => navigation.navigate('Live')}>
                                <Ionicons name="flash" size={16} color={colors.warning} />
                                <Text style={styles.trustText}>Tiempo Real</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.trustBadge} onPress={() => navigation.navigate('Ranking')}>
                                <Ionicons name="globe" size={16} color={colors.primary} />
                                <Text style={styles.trustText}>Global</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                {/* Stats Section */}
                <View style={styles.statsSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.statsScroll}
                    >
                        <StatCard
                            icon="trophy"
                            value={`${stats.tournaments}+`}
                            label="Torneos Activos"
                            variant="default"
                        />
                        <StatCard
                            icon="people"
                            value={APP_STATS.players}
                            label="Jugadores"
                            variant="secondary"
                        />
                        <StatCard
                            icon="game-controller"
                            value={`${stats.games}+`}
                            label="Juegos"
                            variant="accent"
                        />
                        <StatCard
                            icon="cash"
                            value={`${APP_STATS.prizes} En Premios`}
                            label="Total Acumulado"
                            variant="warning"
                        />
                    </ScrollView>
                </View>

                {/* Features Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Badge text="Características" variant="primary" size="small" />
                        <Text style={styles.sectionTitle}>
                            <Text style={styles.gradientText}>Miles de cosas</Text> que puedes hacer
                        </Text>
                    </View>

                    <View style={styles.featuresGrid}>
                        <TouchableOpacity
                            style={[styles.featureCard, styles.featureHighlight]}
                            onPress={() => navigation.navigate('Tournaments')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={gradients.primary}
                                style={styles.featureIconLarge}
                            >
                                <Ionicons name="trophy" size={28} color={colors.black} />
                            </LinearGradient>
                            <Text style={styles.featureTitle}>Compite en Torneos</Text>
                            <Text style={styles.featureDesc}>Participa en torneos con premios reales</Text>
                            <View style={styles.featureLink}>
                                <Text style={styles.featureLinkText}>Explorar</Text>
                                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.featureCard}
                            onPress={() => navigation.navigate('Clans')}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.featureIcon, styles.featureIconSecondary]}>
                                <Ionicons name="shield" size={22} color={colors.secondary} />
                            </View>
                            <Text style={styles.featureTitle}>Crea tu Clan</Text>
                            <Text style={styles.featureDesc}>Forma tu equipo y domina</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.featureCard}
                            onPress={() => navigation.navigate('Ranking')}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.featureIcon, styles.featureIconAccent]}>
                                <Ionicons name="trending-up" size={22} color={colors.accent} />
                            </View>
                            <Text style={styles.featureTitle}>Escala el Ranking</Text>
                            <Text style={styles.featureDesc}>Demuestra tu habilidad</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.featureCard}
                            onPress={() => navigation.navigate('Live')}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.featureIcon, styles.featureIconLive]}>
                                <Ionicons name="radio" size={22} color={colors.live} />
                            </View>
                            <Text style={styles.featureTitle}>Partidas en Vivo</Text>
                            <Text style={styles.featureDesc}>Sigue en tiempo real</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Featured Tournaments */}
                {featuredTournaments.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <View>
                                <Badge text="🔥 HOT" variant="error" size="small" />
                                <Text style={styles.sectionTitle}>Torneos Destacados</Text>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('Tournaments')}>
                                <Text style={styles.seeAll}>Ver todos</Text>
                            </TouchableOpacity>
                        </View>

                        {featuredTournaments.map((tournament, index) => (
                            <TouchableOpacity
                                key={tournament.id}
                                style={styles.tournamentCard}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('Tournaments', {
                                    screen: 'TournamentDetail',
                                    params: { id: tournament.id }
                                })}
                            >
                                <View style={styles.tournamentHeader}>
                                    <Badge
                                        text={tournament.status === 'IN_PROGRESS' ? 'EN VIVO' : 'ABIERTO'}
                                        variant={tournament.status === 'IN_PROGRESS' ? 'live' : 'success'}
                                        size="small"
                                        pulse={tournament.status === 'IN_PROGRESS'}
                                    />
                                    <Text style={styles.tournamentGame}>
                                        {tournament.game?.name || 'Juego'}
                                    </Text>
                                </View>
                                <Text style={styles.tournamentName}>{tournament.name}</Text>
                                <View style={styles.tournamentInfo}>
                                    <View style={styles.tournamentInfoItem}>
                                        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                                        <Text style={styles.tournamentInfoText}>
                                            {new Date(tournament.start_date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={styles.tournamentInfoItem}>
                                        <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                                        <Text style={styles.tournamentInfoText}>
                                            {tournament.max_participants || '∞'} equipos
                                        </Text>
                                    </View>
                                    {tournament.prize_pool && (
                                        <View style={styles.tournamentPrize}>
                                            <Ionicons name="cash-outline" size={14} color={colors.warning} />
                                            <Text style={styles.tournamentPrizeText}>
                                                {tournament.prize_pool.toLocaleString()} en premios
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Games Section */}
                {games.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Juegos Disponibles</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.gamesScroll}
                        >
                            {games.map(game => (
                                <TouchableOpacity
                                    key={game.id}
                                    style={styles.gameCard}
                                    activeOpacity={0.8}
                                    onPress={() => navigation.navigate('Tournaments')}
                                >
                                    <LinearGradient
                                        colors={['#1a1a2e', '#16213e']}
                                        style={styles.gameGradient}
                                    >
                                        <Ionicons name="game-controller" size={32} color={colors.primary} />
                                        <Text style={styles.gameName}>{game.name}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Community Section - Clans Preview */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View>
                            <Badge text="👥 Comunidad" variant="secondary" size="small" />
                            <Text style={styles.sectionTitle}>Clanes Destacados</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Clans')}>
                            <Text style={styles.seeAll}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.clansPreview}>
                        {clans.map((clan, index) => (
                            <TouchableOpacity
                                key={clan.id}
                                style={[styles.clanCard, { zIndex: clans.length - index }]}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('Clans')}
                            >
                                <View style={styles.clanAvatar}>
                                    <Ionicons name="shield" size={24} color={colors.secondary} />
                                </View>
                                <View style={styles.clanInfo}>
                                    <Text style={styles.clanName}>{clan.name}</Text>
                                    <Text style={styles.clanTag}>[{clan.tag}]</Text>
                                </View>
                                <View style={styles.clanMembers}>
                                    <Ionicons name="people" size={14} color={colors.textSecondary} />
                                    <Text style={styles.clanMembersText}>{clan.member_count || clan._count?.members || 0}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Subscription Preview Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Badge text="💎 Planes" variant="warning" size="small" />
                        <Text style={styles.sectionTitle}>
                            Elige tu <Text style={styles.gradientText}>plan perfecto</Text>
                        </Text>
                        <Text style={styles.sectionSubtitle}>
                            Desbloquea funciones exclusivas y maximiza tu experiencia
                        </Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.plansScroll}
                    >
                        {/* Free Plan */}
                        <View style={styles.planPreviewCard}>
                            <View style={styles.planPreviewHeader}>
                                <Ionicons name="person" size={20} color={colors.textSecondary} />
                                <Text style={styles.planPreviewName}>Gratis</Text>
                            </View>
                            <View style={styles.planPreviewPrice}>
                                <Text style={styles.planPreviewPriceValue}>$0</Text>
                                <Text style={styles.planPreviewPeriod}>/siempre</Text>
                            </View>
                            <View style={styles.planPreviewFeatures}>
                                <View style={styles.planPreviewFeature}>
                                    <Ionicons name="checkmark" size={14} color={colors.success} />
                                    <Text style={styles.planPreviewFeatureText}>Torneos gratuitos</Text>
                                </View>
                                <View style={styles.planPreviewFeature}>
                                    <Ionicons name="checkmark" size={14} color={colors.success} />
                                    <Text style={styles.planPreviewFeatureText}>Perfil básico</Text>
                                </View>
                                <View style={styles.planPreviewFeature}>
                                    <Ionicons name="checkmark" size={14} color={colors.success} />
                                    <Text style={styles.planPreviewFeatureText}>Chat global</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.planPreviewButtonOutline}
                                disabled={true}
                            >
                                <Text style={styles.planPreviewButtonTextOutline}>Plan Base</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Standard Plan */}
                        <View style={[styles.planPreviewCard, styles.planPreviewCardStandard]}>
                            <View style={styles.planPreviewPopularBadge}>
                                <Ionicons name="flash" size={10} color={colors.white} />
                                <Text style={styles.planPreviewPopularText}>POPULAR</Text>
                            </View>
                            <View style={styles.planPreviewHeader}>
                                <Ionicons name="rocket" size={20} color="#667eea" />
                                <Text style={[styles.planPreviewName, { color: '#667eea' }]}>Standard</Text>
                            </View>
                            <View style={styles.planPreviewPrice}>
                                <Text style={[styles.planPreviewPriceValue, { color: '#667eea' }]}>${PLANS.STANDARD.monthlyPrice}</Text>
                                <Text style={styles.planPreviewPeriod}>/mes</Text>
                            </View>
                            <View style={styles.planPreviewFeatures}>
                                <View style={styles.planPreviewFeature}>
                                    <Ionicons name="checkmark" size={14} color={colors.success} />
                                    <Text style={styles.planPreviewFeatureText}>Todo de Gratis</Text>
                                </View>
                                <View style={styles.planPreviewFeature}>
                                    <Ionicons name="checkmark" size={14} color={colors.success} />
                                    <Text style={styles.planPreviewFeatureText}>Torneos premium</Text>
                                </View>
                                <View style={styles.planPreviewFeature}>
                                    <Ionicons name="checkmark" size={14} color={colors.success} />
                                    <Text style={styles.planPreviewFeatureText}>Sin anuncios</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.planPreviewButtonStandard}
                                onPress={() => handleSubscribe('STANDARD')}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.planPreviewButtonGradient}
                                >
                                    <Text style={styles.planPreviewButtonTextGradient}>Obtener</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Premium Plan */}
                        <View style={[styles.planPreviewCard, styles.planPreviewCardPremium]}>
                            <View style={[styles.planPreviewPopularBadge, styles.planPreviewPremiumBadge]}>
                                <Ionicons name="diamond" size={10} color={colors.white} />
                                <Text style={styles.planPreviewPopularText}>MEJOR</Text>
                            </View>
                            <View style={styles.planPreviewHeader}>
                                <Ionicons name="diamond" size={20} color="#f093fb" />
                                <Text style={[styles.planPreviewName, { color: '#f093fb' }]}>Premium</Text>
                            </View>
                            <View style={styles.planPreviewPrice}>
                                <Text style={[styles.planPreviewPriceValue, { color: '#f093fb' }]}>${PLANS.PREMIUM.monthlyPrice}</Text>
                                <Text style={styles.planPreviewPeriod}>/mes</Text>
                            </View>
                            <View style={styles.planPreviewFeatures}>
                                <View style={styles.planPreviewFeature}>
                                    <Ionicons name="checkmark" size={14} color={colors.success} />
                                    <Text style={styles.planPreviewFeatureText}>Todo de Standard</Text>
                                </View>
                                <View style={styles.planPreviewFeature}>
                                    <Ionicons name="checkmark" size={14} color={colors.success} />
                                    <Text style={styles.planPreviewFeatureText}>Badge LEGEND</Text>
                                </View>
                                <View style={styles.planPreviewFeature}>
                                    <Ionicons name="checkmark" size={14} color={colors.success} />
                                    <Text style={styles.planPreviewFeatureText}>Soporte prioritario</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.planPreviewButtonPremium}
                                onPress={() => handleSubscribe('PREMIUM')}
                            >
                                <LinearGradient
                                    colors={['#f093fb', '#f5576c']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.planPreviewButtonGradient}
                                >
                                    <Text style={styles.planPreviewButtonTextGradient}>Obtener</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.viewAllPlansButton}
                        onPress={() => navigation.navigate('Profile', { screen: 'Subscription' })}
                    >
                        <Text style={styles.viewAllPlansText}>Ver todos los planes y comparar</Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Final CTA Section */}
                <View style={styles.ctaSection}>
                    <LinearGradient
                        colors={gradients.primary}
                        style={styles.ctaCard}
                    >
                        <View style={styles.ctaIcon}>
                            <Ionicons name="rocket" size={32} color={colors.black} />
                        </View>
                        <Text style={styles.ctaTitle}>¿Listo para dominar?</Text>
                        <Text style={styles.ctaSubtitle}>
                            Únete a miles de gamers que ya están compitiendo y ganando
                        </Text>
                        <View style={styles.ctaButtons}>
                            <TouchableOpacity
                                style={styles.ctaButtonPrimary}
                                onPress={() => navigation.navigate('Tournaments')}
                            >
                                <Ionicons name="trophy" size={18} color={colors.primary} />
                                <Text style={styles.ctaButtonPrimaryText}>Ver Torneos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.ctaButtonSecondary}
                                onPress={() => navigation.navigate('Profile', { screen: 'Subscription' })}
                            >
                                <Ionicons name="diamond" size={18} color={colors.black} />
                                <Text style={styles.ctaButtonSecondaryText}>Hacerse Premium</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* Bottom spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    heroGradient: {
        paddingTop: 20,
    },
    hero: {
        padding: 24,
        alignItems: 'center',
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        marginBottom: 24,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.success,
        marginRight: 8,
    },
    heroBadgeText: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '500',
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        lineHeight: 40,
        marginBottom: 16,
    },
    heroTitleGradient: {
        color: colors.primary,
    },
    heroSubtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    heroActions: {
        width: '100%',
        marginBottom: 24,
    },
    trustBadges: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    trustBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    trustText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    statsSection: {
        marginTop: 8,
    },
    statsScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        marginBottom: 20,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        marginTop: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 8,
    },
    gradientText: {
        color: colors.primary,
    },
    seeAll: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    featureCard: {
        width: (width - 52) / 2,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    featureHighlight: {
        width: '100%',
        borderColor: colors.primary,
    },
    featureIconLarge: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
    },
    featureIconSecondary: {
        backgroundColor: 'rgba(121, 40, 202, 0.15)',
    },
    featureIconAccent: {
        backgroundColor: 'rgba(255, 51, 102, 0.15)',
    },
    featureIconLive: {
        backgroundColor: 'rgba(255, 51, 102, 0.15)',
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    featureLink: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 4,
    },
    featureLinkText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    tournamentCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tournamentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tournamentGame: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    tournamentName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    tournamentInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    tournamentInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tournamentInfoText: {
        color: colors.textSecondary,
        fontSize: 13,
    },
    tournamentPrize: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    tournamentPrizeText: {
        color: colors.warning,
        fontSize: 13,
        fontWeight: '600',
    },
    gamesScroll: {
        gap: 12,
        marginTop: 12,
    },
    gameCard: {
        width: 140,
        height: 100,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gameGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    gameName: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
    },
    // Community / Clans Section
    clansPreview: {
        gap: 12,
    },
    clanCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    clanAvatar: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(121, 40, 202, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    clanInfo: {
        flex: 1,
    },
    clanName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    clanTag: {
        fontSize: 12,
        color: colors.secondary,
        fontWeight: '600',
    },
    clanMembers: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    clanMembersText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    // Subscription Preview Section
    plansScroll: {
        gap: 12,
        paddingRight: 20,
    },
    planPreviewCard: {
        width: 180,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    planPreviewCardStandard: {
        borderColor: '#667eea',
        borderWidth: 2,
    },
    planPreviewCardPremium: {
        borderColor: '#f093fb',
        borderWidth: 2,
    },
    planPreviewPopularBadge: {
        position: 'absolute',
        top: -10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#667eea',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    planPreviewPremiumBadge: {
        backgroundColor: '#f093fb',
    },
    planPreviewPopularText: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.white,
    },
    planPreviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    planPreviewName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    planPreviewPrice: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    planPreviewPriceValue: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
    },
    planPreviewPeriod: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    planPreviewFeatures: {
        gap: 8,
        marginBottom: 16,
    },
    planPreviewFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    planPreviewFeatureText: {
        fontSize: 12,
        color: colors.text,
    },
    planPreviewButtonOutline: {
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    planPreviewButtonTextOutline: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    planPreviewButtonStandard: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    planPreviewButtonPremium: {
        borderRadius: 10,
        overflow: 'hidden',
    },
    planPreviewButtonGradient: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    planPreviewButtonTextGradient: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.white,
    },
    viewAllPlansButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 12,
    },
    viewAllPlansText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    // CTA Section
    ctaSection: {
        padding: 20,
    },
    ctaCard: {
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
    },
    ctaIcon: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    ctaTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.black,
        marginBottom: 8,
        textAlign: 'center',
    },
    ctaSubtitle: {
        fontSize: 14,
        color: colors.black,
        opacity: 0.8,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    ctaButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    ctaButtonPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.black,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
    },
    ctaButtonPrimaryText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
    ctaButtonSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.15)',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
    },
    ctaButtonSecondaryText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.black,
    },
});
