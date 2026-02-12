import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../../components/common';

// Generar historial de ejemplo si no hay datos (igual que FrontedUser)
function generateSampleHistory() {
    const games = ['FC 25', 'Madden 25', 'NHL 25'];
    const opponents = ['Team Alpha', 'Los Guerreros', 'Phoenix Rising', 'Thunder Strike', 'Elite Squad', 'Victory Legion'];
    const tournaments = ['Liga Premier', 'Copa América', 'Champions League', 'Torneo Nacional'];

    const matches = [];
    const now = new Date();

    for (let i = 0; i < 15; i++) {
        const isWin = Math.random() > 0.4;
        const myScore = isWin ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2);
        const oppScore = isWin ? Math.floor(Math.random() * myScore) : myScore + 1 + Math.floor(Math.random() * 2);

        matches.push({
            id: i + 1,
            game: games[Math.floor(Math.random() * games.length)],
            opponent: opponents[Math.floor(Math.random() * opponents.length)],
            tournament: tournaments[Math.floor(Math.random() * tournaments.length)],
            result: isWin ? 'win' : 'loss',
            myScore,
            oppScore,
            date: new Date(now - (i * 24 * 60 * 60 * 1000 * Math.random() * 7)).toISOString()
        });
    }

    return matches.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function calculateStats(matches) {
    const wins = matches.filter(m => m.result === 'win').length;
    const losses = matches.filter(m => m.result === 'loss').length;
    const totalMatches = matches.length;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    return { totalMatches, wins, losses, winRate };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HistoryScreen({ navigation }) {
    const { userInfo } = useAuth();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');

    const fetchHistory = async () => {
        try {
            const response = await api.get(`/matches/user/${userInfo?.id}`);
            if (response.data && response.data.length > 0) {
                setMatches(response.data);
            } else {
                setMatches(generateSampleHistory());
            }
        } catch (error) {
            console.warn('Error fetching history:', error);
            setMatches(generateSampleHistory());
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHistory();
    }, []);

    if (loading) return <Loading text="Cargando historial..." />;

    const stats = calculateStats(matches);
    const filteredMatches = filter === 'all' 
        ? matches 
        : matches.filter(m => m.result === filter);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Historial de Partidas</Text>
                    <Text style={styles.headerSubtitle}>Revisa tu desempeño</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

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
                {/* Stats Cards - igual que FrontedUser */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(0, 212, 255, 0.1)' }]}>
                            <Ionicons name="game-controller" size={20} color={colors.primary} />
                        </View>
                        <Text style={styles.statValue}>{stats.totalMatches}</Text>
                        <Text style={styles.statLabel}>Partidas Totales</Text>
                    </View>

                    <View style={[styles.statCard, styles.statCardWin]}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(0, 255, 136, 0.1)' }]}>
                            <Ionicons name="trophy" size={20} color={colors.success} />
                        </View>
                        <Text style={[styles.statValue, { color: colors.success }]}>{stats.wins}</Text>
                        <Text style={styles.statLabel}>Victorias</Text>
                    </View>

                    <View style={[styles.statCard, styles.statCardLoss]}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 51, 102, 0.1)' }]}>
                            <Ionicons name="close-circle" size={20} color={colors.error} />
                        </View>
                        <Text style={[styles.statValue, { color: colors.error }]}>{stats.losses}</Text>
                        <Text style={styles.statLabel}>Derrotas</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                            <Ionicons name="analytics" size={20} color={colors.warning} />
                        </View>
                        <Text style={styles.statValue}>{stats.winRate}%</Text>
                        <Text style={styles.statLabel}>Win Rate</Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    <TouchableOpacity 
                        style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
                        onPress={() => setFilter('all')}
                    >
                        <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                            Todos
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.filterTab, filter === 'win' && styles.filterTabActive]}
                        onPress={() => setFilter('win')}
                    >
                        <Text style={[styles.filterText, filter === 'win' && styles.filterTextActive]}>
                            Victorias
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.filterTab, filter === 'loss' && styles.filterTabActive]}
                        onPress={() => setFilter('loss')}
                    >
                        <Text style={[styles.filterText, filter === 'loss' && styles.filterTextActive]}>
                            Derrotas
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Match List - igual que FrontedUser */}
                <View style={styles.matchList}>
                    {filteredMatches.length > 0 ? (
                        filteredMatches.map((match) => (
                            <TouchableOpacity 
                                key={match.id} 
                                style={styles.matchCard}
                                activeOpacity={0.8}
                            >
                                <View style={[
                                    styles.matchResult,
                                    match.result === 'win' ? styles.matchResultWin : styles.matchResultLoss
                                ]}>
                                    <Ionicons 
                                        name={match.result === 'win' ? 'trophy' : 'close'} 
                                        size={24} 
                                        color={match.result === 'win' ? colors.success : colors.error} 
                                    />
                                </View>
                                
                                <View style={styles.matchInfo}>
                                    <Text style={styles.matchTitle}>
                                        {match.result === 'win' ? 'Victoria' : 'Derrota'} vs {match.opponent}
                                    </Text>
                                    <View style={styles.matchMeta}>
                                        <Ionicons name="shield" size={12} color={colors.textSecondary} />
                                        <Text style={styles.matchOpponent}>{match.opponent}</Text>
                                    </View>
                                    <View style={styles.matchGame}>
                                        <Ionicons name="game-controller" size={12} color={colors.primary} />
                                        <Text style={styles.matchGameText}>{match.game}</Text>
                                    </View>
                                </View>

                                <View style={styles.matchRight}>
                                    <Text style={styles.matchScore}>{match.myScore} - {match.oppScore}</Text>
                                    <Text style={styles.matchScoreLabel}>Marcador</Text>
                                </View>

                                <View style={styles.matchDateContainer}>
                                    <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                                    <Text style={styles.matchDate}>{formatDate(match.date)}</Text>
                                    <View style={styles.matchTournament}>
                                        <Ionicons name="trophy-outline" size={10} color={colors.textMuted} />
                                        <Text style={styles.matchTournamentText}>{match.tournament}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="time-outline" size={60} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>Sin historial de partidas</Text>
                            <Text style={styles.emptyText}>Aún no has jugado ninguna partida</Text>
                            <TouchableOpacity 
                                style={styles.emptyButton}
                                onPress={() => navigation.navigate('Tournaments')}
                            >
                                <Text style={styles.emptyButtonText}>Buscar torneos</Text>
                            </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statCardWin: {
        borderColor: 'rgba(0, 255, 136, 0.3)',
    },
    statCardLoss: {
        borderColor: 'rgba(255, 51, 102, 0.3)',
    },
    statIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
    },
    statLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    filterContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    filterTabActive: {
        backgroundColor: colors.primary,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    filterTextActive: {
        color: colors.black,
    },
    matchList: {
        paddingHorizontal: 16,
    },
    matchCard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
    },
    matchResult: {
        width: 60,
        height: 60,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    matchResultWin: {
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        borderWidth: 2,
        borderColor: colors.success,
    },
    matchResultLoss: {
        backgroundColor: 'rgba(255, 51, 102, 0.1)',
        borderWidth: 2,
        borderColor: colors.error,
    },
    matchInfo: {
        flex: 1,
        minWidth: 120,
    },
    matchTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    matchMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    matchOpponent: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    matchGame: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 6,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    matchGameText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '500',
    },
    matchRight: {
        alignItems: 'center',
    },
    matchScore: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
    },
    matchScoreLabel: {
        fontSize: 12,
        color: colors.textMuted,
    },
    matchDateContainer: {
        alignItems: 'flex-end',
    },
    matchDate: {
        fontSize: 13,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    matchTournament: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    matchTournamentText: {
        fontSize: 12,
        color: colors.textMuted,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 8,
    },
    emptyButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 20,
    },
    emptyButtonText: {
        color: colors.black,
        fontWeight: '600',
        fontSize: 14,
    },
});
