import React, { useEffect, useState, useCallback } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    ScrollView, 
    RefreshControl,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, gradients } from '../../theme/colors';
import { Loading, EmptyState, Badge, Header } from '../../components/common';

const { width } = Dimensions.get('window');

export default function LiveScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [tournaments, setTournaments] = useState([]);

    const fetchData = async () => {
        try {
            const [matchesRes, teamsRes, tournamentsRes] = await Promise.all([
                api.get('/matches'),
                api.get('/teams'),
                api.get('/tournaments'),
            ]);
            
            setMatches(Array.isArray(matchesRes) ? matchesRes : (matchesRes.data || []));
            setTeams(Array.isArray(teamsRes) ? teamsRes : (teamsRes.data || []));
            setTournaments(Array.isArray(tournamentsRes) ? tournamentsRes : (tournamentsRes.data || []));
        } catch (error) {
            console.warn('Error fetching live data:', error);
            setMatches([]);
            setTeams([]);
            setTournaments([]);
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

    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team?.name || 'TBD';
    };

    const getTournamentName = (tournamentId) => {
        const tournament = tournaments.find(t => t.id === tournamentId);
        return tournament?.name || 'Torneo';
    };

    const liveMatches = matches.filter(m => m.status === 'LIVE' || m.status === 'IN_PROGRESS');
    const upcomingMatches = matches.filter(m => m.status === 'SCHEDULED' || m.status === 'PENDING').slice(0, 6);
    const recentMatches = matches.filter(m => m.status === 'COMPLETED').slice(0, 6);

    if (loading) return <Loading text="Cargando partidas..." />;

    const renderMatchCard = (match, type) => (
        <TouchableOpacity 
            key={match.id}
            style={[styles.matchCard, type === 'live' && styles.matchCardLive]}
            activeOpacity={0.8}
        >
            {type === 'live' && (
                <View style={styles.liveBadge}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.liveText}>EN VIVO</Text>
                </View>
            )}
            
            <Text style={styles.matchTournament}>{getTournamentName(match.tournament_id)}</Text>
            
            <View style={styles.matchTeams}>
                <View style={styles.team}>
                    <View style={styles.teamAvatar}>
                        <Ionicons name="shield" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.teamName} numberOfLines={1}>
                        {getTeamName(match.team1_id)}
                    </Text>
                </View>
                
                <View style={styles.scoreContainer}>
                    <Text style={styles.score}>
                        {match.team1_score || 0} - {match.team2_score || 0}
                    </Text>
                    {type === 'live' && (
                        <Text style={styles.round}>Ronda {match.round || 1}</Text>
                    )}
                </View>
                
                <View style={styles.team}>
                    <View style={styles.teamAvatar}>
                        <Ionicons name="shield" size={24} color={colors.secondary} />
                    </View>
                    <Text style={styles.teamName} numberOfLines={1}>
                        {getTeamName(match.team2_id)}
                    </Text>
                </View>
            </View>
            
            {type === 'completed' && match.winner_id && (
                <View style={styles.winnerBadge}>
                    <Ionicons name="trophy" size={12} color={colors.warning} />
                    <Text style={styles.winnerText}>
                        Ganador: {getTeamName(match.winner_id)}
                    </Text>
                </View>
            )}
            
            {type === 'upcoming' && (
                <View style={styles.matchTime}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.matchTimeText}>
                        {match.scheduled_at 
                            ? new Date(match.scheduled_at).toLocaleString()
                            : 'Hora por definir'
                        }
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

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
                <Header
                    title="Partidas en Vivo"
                    subtitle="Sigue las partidas en tiempo real"
                    badge={{ icon: 'radio', text: 'En Vivo' }}
                    centered
                />

                {/* Live Matches */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.liveIndicator}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.liveIndicatorText}>EN VIVO</Text>
                        </View>
                    </View>
                    
                    {liveMatches.length > 0 ? (
                        <View style={styles.matchesList}>
                            {liveMatches.map(match => renderMatchCard(match, 'live'))}
                        </View>
                    ) : (
                        <View style={styles.noLiveBanner}>
                            <Ionicons name="tv-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.noLiveTitle}>No hay partidas en vivo</Text>
                            <Text style={styles.noLiveSubtitle}>
                                Vuelve más tarde o revisa las próximas partidas
                            </Text>
                        </View>
                    )}
                </View>

                {/* Upcoming Matches */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="time-outline" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Próximas Partidas</Text>
                        </View>
                    </View>
                    
                    {upcomingMatches.length > 0 ? (
                        <View style={styles.matchesList}>
                            {upcomingMatches.map(match => renderMatchCard(match, 'upcoming'))}
                        </View>
                    ) : (
                        <View style={styles.emptySection}>
                            <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No hay partidas programadas</Text>
                        </View>
                    )}
                </View>

                {/* Recent Matches */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <Ionicons name="time" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Partidas Recientes</Text>
                        </View>
                    </View>
                    
                    {recentMatches.length > 0 ? (
                        <View style={styles.matchesList}>
                            {recentMatches.map(match => renderMatchCard(match, 'completed'))}
                        </View>
                    ) : (
                        <View style={styles.emptySection}>
                            <Ionicons name="trophy-outline" size={32} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No hay partidas recientes</Text>
                        </View>
                    )}
                </View>

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
    section: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 51, 102, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255, 51, 102, 0.3)',
    },
    liveIndicatorText: {
        color: colors.live,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.live,
        marginRight: 8,
    },
    noLiveBanner: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    noLiveTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    noLiveSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    matchesList: {
        gap: 12,
    },
    matchCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    matchCardLive: {
        borderColor: colors.live,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 51, 102, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
        marginBottom: 12,
    },
    liveText: {
        color: colors.live,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    matchTournament: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
        marginBottom: 12,
    },
    matchTeams: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    team: {
        flex: 1,
        alignItems: 'center',
    },
    teamAvatar: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    teamName: {
        fontSize: 12,
        color: colors.text,
        fontWeight: '600',
        textAlign: 'center',
    },
    scoreContainer: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    score: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
    },
    round: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 4,
    },
    winnerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    winnerText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    matchTime: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
    },
    matchTimeText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    emptySection: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 12,
    },
});
