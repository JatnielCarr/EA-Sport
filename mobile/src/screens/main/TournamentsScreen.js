import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    Text,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, gradients } from '../../theme/colors';
import { Badge, Loading, EmptyState, AnimatedScreen } from '../../components/common';
import TournamentCard from '../../components/tournament/TournamentCard';

const { width } = Dimensions.get('window');

export default function TournamentsScreen({ navigation }) {
    const [tournaments, setTournaments] = useState([]);
    const [games, setGames] = useState([]);
    const [filteredTournaments, setFilteredTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGame, setSelectedGame] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [myTournaments, setMyTournaments] = useState([]);

    const fetchData = async () => {
        try {
            const [tournamentsRes, gamesRes, myRes] = await Promise.allSettled([
                api.get('/tournaments'),
                api.get('/games'),
                api.get('/tournaments/my/list').catch(() => ({ data: [] })),
            ]);

            if (tournamentsRes.status === 'fulfilled') {
                const tournamentsData = Array.isArray(tournamentsRes.value) ? tournamentsRes.value : (tournamentsRes.value?.data || []);
                setTournaments(tournamentsData);
                setFilteredTournaments(tournamentsData);
            }

            if (gamesRes.status === 'fulfilled') {
                const gamesData = Array.isArray(gamesRes.value) ? gamesRes.value : (gamesRes.value?.data || []);
                setGames(gamesData);
            }

            if (myRes.status === 'fulfilled' && myRes.value) {
                const myData = myRes.value?.data || myRes.value || [];
                setMyTournaments(Array.isArray(myData) ? myData : []);
            }
        } catch (error) {
            console.warn('Error fetching tournaments:', error);
            setTournaments([]);
            setGames([]);
            setFilteredTournaments([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = [...tournaments];

        if (searchQuery) {
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedGame) {
            filtered = filtered.filter(t => t.game_id === selectedGame);
        }

        if (selectedStatus) {
            filtered = filtered.filter(t => t.status === selectedStatus);
        }

        setFilteredTournaments(filtered);
    }, [searchQuery, selectedGame, selectedStatus, tournaments]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);

    const featuredTournaments = tournaments
        .filter(t => t.status === 'REGISTRATION_OPEN' || t.status === 'IN_PROGRESS')
        .sort((a, b) => (b.prize_pool || 0) - (a.prize_pool || 0))
        .slice(0, 3);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedGame('');
        setSelectedStatus('');
    };

    if (loading) return <Loading text="Cargando torneos..." />;

    const ListHeader = () => (
        <>
            {/* Hero */}
            <AnimatedScreen>
                <LinearGradient
                    colors={['rgba(0, 212, 255, 0.15)', 'rgba(121,40,202,0.06)', 'transparent']}
                    style={styles.hero}
                >
                    <View style={styles.heroContent}>
                        <Badge text="Competición" variant="primary" size="small" />
                        <Text style={styles.heroTitle}>
                            <Ionicons name="trophy" size={28} color={colors.primary} />
                            {'  '}Torneos <Text style={styles.gradientText}>Épicos</Text>
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            Encuentra tu próximo desafío entre cientos de torneos activos.
                            <Text style={styles.heroHighlight}> ¡Compite y gana premios reales!</Text>
                        </Text>
                    </View>
                </LinearGradient>
            </AnimatedScreen>

            {/* My Tournaments */}
            {myTournaments.length > 0 && (
                <View style={styles.myTourneysSection}>
                    <View style={styles.myTourneysHeader}>
                        <View style={styles.myTourneysTitleGroup}>
                            <Badge text="⚔️ MIS TORNEOS" variant="success" size="small" />
                            <Text style={styles.myTourneysTitle}>Inscrito</Text>
                        </View>
                        <View style={styles.myTourneysCount}>
                            <Text style={styles.myTourneysCountText}>{myTournaments.length}</Text>
                        </View>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.myTourneysScroll}
                    >
                        {myTournaments.map((t) => {
                            const isLive = t.status === 'IN_PROGRESS';
                            const isCompleted = t.status === 'COMPLETED';
                            return (
                                <TouchableOpacity
                                    key={t.id}
                                    style={styles.myTourneyCard}
                                    onPress={() => navigation.navigate('TournamentDetail', { id: t.id })}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={isLive
                                            ? ['rgba(255, 51, 102, 0.12)', 'rgba(255, 51, 102, 0.04)']
                                            : isCompleted
                                                ? ['rgba(100, 100, 120, 0.12)', 'rgba(100, 100, 120, 0.04)']
                                                : ['rgba(16, 185, 129, 0.12)', 'rgba(0, 212, 255, 0.06)']}
                                        style={styles.myTourneyGradient}
                                    >
                                        <View style={styles.myTourneyTop}>
                                            <View style={[styles.myTourneyTag,
                                            isLive && { borderColor: 'rgba(255, 51, 102, 0.4)' }
                                            ]}>
                                                <Text style={styles.myTourneyTagText}>
                                                    {t.my_team?.tag || '??'}
                                                </Text>
                                            </View>
                                            {isLive && (
                                                <View style={styles.myTourneyLive}>
                                                    <View style={[styles.pulseDot, { backgroundColor: '#ff3366' }]} />
                                                    <Text style={styles.myTourneyLiveText}>LIVE</Text>
                                                </View>
                                            )}
                                            {isCompleted && (
                                                <Ionicons name="checkmark-done" size={16} color="#64748b" />
                                            )}
                                            {!isLive && !isCompleted && (
                                                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                                            )}
                                        </View>
                                        <Text style={styles.myTourneyName} numberOfLines={2}>{t.name}</Text>
                                        <View style={styles.myTourneyBottom}>
                                            <Text style={styles.myTourneyTeamName}>{t.my_team?.name}</Text>
                                            {t.my_team?.seed && (
                                                <Text style={styles.myTourneySeed}>#{t.my_team.seed}</Text>
                                            )}
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Featured Tournaments */}
            {featuredTournaments.length > 0 && (
                <View style={styles.featuredSection}>
                    <View style={styles.featuredHeader}>
                        <View style={styles.featuredTitleGroup}>
                            <Badge text="🔥 HOT" variant="error" size="small" />
                            <Text style={styles.featuredTitle}>Torneos Destacados</Text>
                        </View>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.featuredScroll}
                    >
                        {featuredTournaments.map((tournament, index) => {
                            const game = games.find(g => g.id === tournament.game_id);
                            const isLive = tournament.status === 'IN_PROGRESS';
                            return (
                                <TouchableOpacity
                                    key={tournament.id}
                                    style={[styles.featuredCard, index === 0 && styles.featuredCardMain]}
                                    onPress={() => navigation.navigate('TournamentDetail', { id: tournament.id })}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={index === 0 ? gradients.primary : ['#1a1a2e', '#16213e']}
                                        style={styles.featuredGradient}
                                    >
                                        {isLive ? (
                                            <View style={styles.featuredLiveBadge}>
                                                <View style={styles.pulseDot} />
                                                <Text style={styles.featuredLiveText}>EN VIVO</Text>
                                            </View>
                                        ) : (
                                            <Badge text="Inscripciones Abiertas" variant="success" size="small" />
                                        )}

                                        <Text style={styles.featuredGame}>
                                            <Ionicons name="game-controller" size={12} /> {game?.name || 'Juego'}
                                        </Text>

                                        <Text style={[
                                            styles.featuredName,
                                            index === 0 && styles.featuredNameMain
                                        ]} numberOfLines={2}>
                                            {tournament.name}
                                        </Text>

                                        <View style={styles.featuredInfo}>
                                            <Text style={styles.featuredInfoText}>
                                                <Ionicons name="calendar" size={12} /> {new Date(tournament.start_date).toLocaleDateString()}
                                            </Text>
                                        </View>

                                        {tournament.prize_pool && (
                                            <View style={styles.featuredPrize}>
                                                <Ionicons name="cash" size={16} color={colors.warning} />
                                                <Text style={styles.featuredPrizeText}>
                                                    ${tournament.prize_pool.toLocaleString()}
                                                </Text>
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Filters */}
            <View style={styles.filtersSection}>
                <Text style={styles.allTournamentsTitle}>
                    <Ionicons name="list" size={20} color={colors.primary} /> Todos los Torneos
                </Text>

                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar torneos..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                >
                    <TouchableOpacity
                        style={[styles.filterChip, selectedStatus === '' && selectedGame === '' && styles.filterChipActive]}
                        onPress={clearFilters}
                    >
                        <Text style={[styles.filterChipText, selectedStatus === '' && selectedGame === '' && styles.filterChipTextActive]}>
                            Todos
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, selectedStatus === 'REGISTRATION_OPEN' && styles.filterChipActive]}
                        onPress={() => setSelectedStatus(selectedStatus === 'REGISTRATION_OPEN' ? '' : 'REGISTRATION_OPEN')}
                    >
                        <Ionicons name="enter-outline" size={14} color={selectedStatus === 'REGISTRATION_OPEN' ? colors.black : colors.text} />
                        <Text style={[styles.filterChipText, selectedStatus === 'REGISTRATION_OPEN' && styles.filterChipTextActive]}>
                            Abiertos
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, selectedStatus === 'IN_PROGRESS' && styles.filterChipActive]}
                        onPress={() => setSelectedStatus(selectedStatus === 'IN_PROGRESS' ? '' : 'IN_PROGRESS')}
                    >
                        <Ionicons name="play" size={14} color={selectedStatus === 'IN_PROGRESS' ? colors.black : colors.text} />
                        <Text style={[styles.filterChipText, selectedStatus === 'IN_PROGRESS' && styles.filterChipTextActive]}>
                            En Curso
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, selectedStatus === 'COMPLETED' && styles.filterChipActive]}
                        onPress={() => setSelectedStatus(selectedStatus === 'COMPLETED' ? '' : 'COMPLETED')}
                    >
                        <Ionicons name="checkmark-circle" size={14} color={selectedStatus === 'COMPLETED' ? colors.black : colors.text} />
                        <Text style={[styles.filterChipText, selectedStatus === 'COMPLETED' && styles.filterChipTextActive]}>
                            Finalizados
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                <View style={styles.resultsBar}>
                    <Text style={styles.resultsText}>{filteredTournaments.length} torneos</Text>
                    {(selectedGame || selectedStatus || searchQuery) && (
                        <TouchableOpacity onPress={clearFilters}>
                            <Text style={styles.clearFilters}>Limpiar filtros</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <FlatList
                    data={filteredTournaments}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.cardWrapper}>
                            <TournamentCard
                                tournament={item}
                                onPress={() => navigation.navigate('TournamentDetail', { id: item.id })}
                            />
                        </View>
                    )}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={ListHeader}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            icon="trophy-outline"
                            title="No hay torneos"
                            message={searchQuery || selectedStatus || selectedGame
                                ? 'No se encontraron torneos con esos filtros'
                                : 'No hay torneos disponibles por ahora'
                            }
                            actionTitle="Limpiar filtros"
                            onAction={clearFilters}
                        />
                    }
                    ListFooterComponent={<View style={{ height: 100 }} />}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    hero: {
        paddingTop: 20,
        paddingBottom: 24,
    },
    heroContent: {
        paddingHorizontal: 20,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        marginTop: 12,
        marginBottom: 12,
    },
    gradientText: {
        color: colors.primary,
    },
    heroSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    heroHighlight: {
        fontWeight: '700',
        color: colors.text,
    },
    featuredSection: {
        marginBottom: 24,
    },
    featuredHeader: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    featuredTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featuredTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    featuredScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    featuredCard: {
        width: width * 0.7,
        borderRadius: 16,
        overflow: 'hidden',
    },
    featuredCardMain: {
        width: width * 0.75,
    },
    featuredGradient: {
        padding: 16,
        minHeight: 160,
        justifyContent: 'space-between',
    },
    featuredLiveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 51, 102, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.live,
        marginRight: 6,
    },
    featuredLiveText: {
        color: colors.live,
        fontSize: 10,
        fontWeight: '700',
    },
    featuredGame: {
        color: colors.textSecondary,
        fontSize: 11,
        marginTop: 8,
    },
    featuredName: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
        marginTop: 8,
    },
    featuredNameMain: {
        fontSize: 18,
        color: colors.black,
    },
    featuredInfo: {
        marginTop: 8,
    },
    featuredInfoText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    featuredPrize: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
    },
    featuredPrizeText: {
        color: colors.warning,
        fontSize: 16,
        fontWeight: '700',
    },
    filtersSection: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    allTournamentsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        color: colors.text,
        fontSize: 15,
    },
    filterScroll: {
        flexGrow: 0,
        marginBottom: 12,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 100,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: colors.black,
    },
    resultsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resultsText: {
        color: colors.textSecondary,
        fontSize: 13,
    },
    clearFilters: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    list: {
        flexGrow: 1,
    },
    cardWrapper: {
        paddingHorizontal: 20,
    },
    // My Tournaments
    myTourneysSection: {
        marginBottom: 24,
    },
    myTourneysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    myTourneysTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    myTourneysTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    myTourneysCount: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    myTourneysCountText: {
        color: '#10b981',
        fontWeight: '800',
        fontSize: 13,
    },
    myTourneysScroll: {
        paddingHorizontal: 20,
        gap: 12,
    },
    myTourneyCard: {
        width: width * 0.55,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    myTourneyGradient: {
        padding: 16,
        minHeight: 120,
        justifyContent: 'space-between',
    },
    myTourneyTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    myTourneyTag: {
        backgroundColor: 'rgba(0, 212, 255, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    myTourneyTagText: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 12,
        letterSpacing: 1,
    },
    myTourneyLive: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    myTourneyLiveText: {
        color: '#ff3366',
        fontSize: 10,
        fontWeight: '800',
    },
    myTourneyName: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 20,
    },
    myTourneyBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    myTourneyTeamName: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    myTourneySeed: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: '700',
    },
});
