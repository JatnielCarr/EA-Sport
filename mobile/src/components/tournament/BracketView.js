import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, shadows } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MATCH_CARD_WIDTH = SCREEN_WIDTH * 0.75;
const MATCH_CARD_HEIGHT = 110;
const ROUND_GAP = 20;

/**
 * BracketView - Visualización de brackets de torneo para móvil
 * 
 * Props:
 * - matches: Array de partidos del torneo (de la API)
 * - format: Formato del torneo (SINGLE_ELIMINATION, etc.)
 * - onMatchPress: Callback cuando se toca un partido
 */
export default function BracketView({ matches = [], format = 'SINGLE_ELIMINATION', onMatchPress }) {
    const [selectedRound, setSelectedRound] = useState(1);

    // Agrupar matches por ronda
    const rounds = {};
    matches.forEach(match => {
        const round = match.round || 1;
        if (!rounds[round]) rounds[round] = [];
        rounds[round].push(match);
    });

    // Ordenar partidos dentro de cada ronda
    Object.keys(rounds).forEach(round => {
        rounds[round].sort((a, b) => (a.match_number || 0) - (b.match_number || 0));
    });

    const roundNumbers = Object.keys(rounds).map(Number).sort((a, b) => a - b);
    const totalRounds = roundNumbers.length || 1;

    const getRoundName = (roundNum) => {
        if (totalRounds <= 1) return 'Final';
        const fromEnd = totalRounds - roundNum;
        switch (fromEnd) {
            case 0: return '🏆 Final';
            case 1: return 'Semifinales';
            case 2: return 'Cuartos de Final';
            default: return `Ronda ${roundNum}`;
        }
    };

    const getMatchStatusColor = (status) => {
        switch (status) {
            case 'LIVE': return colors.live;
            case 'COMPLETED': return colors.success;
            case 'SCHEDULED': return colors.primary;
            default: return colors.textMuted;
        }
    };

    const getMatchStatusIcon = (status) => {
        switch (status) {
            case 'LIVE': return 'radio';
            case 'COMPLETED': return 'checkmark-circle';
            case 'SCHEDULED': return 'time';
            default: return 'ellipsis-horizontal';
        }
    };

    if (matches.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                    <Ionicons name="git-network-outline" size={56} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>Bracket no disponible</Text>
                <Text style={styles.emptyText}>
                    El bracket se generará cuando se completen las inscripciones
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Round Selector */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.roundSelector}
            >
                {roundNumbers.map((roundNum) => {
                    const isSelected = selectedRound === roundNum;
                    const roundMatches = rounds[roundNum] || [];
                    const liveCount = roundMatches.filter(m => m.status === 'LIVE').length;
                    const completedCount = roundMatches.filter(m => m.status === 'COMPLETED').length;
                    const totalInRound = roundMatches.length;

                    return (
                        <TouchableOpacity
                            key={roundNum}
                            onPress={() => setSelectedRound(roundNum)}
                            style={[styles.roundTab, isSelected && styles.roundTabActive]}
                        >
                            {isSelected ? (
                                <LinearGradient
                                    colors={gradients.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.roundTabGradient}
                                >
                                    <Text style={styles.roundTabTextActive}>
                                        {getRoundName(roundNum)}
                                    </Text>
                                    {liveCount > 0 && (
                                        <View style={styles.liveDot} />
                                    )}
                                </LinearGradient>
                            ) : (
                                <View style={styles.roundTabInner}>
                                    <Text style={styles.roundTabText}>
                                        {getRoundName(roundNum)}
                                    </Text>
                                    <Text style={styles.roundTabCount}>
                                        {completedCount}/{totalInRound}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Matches for selected round */}
            <ScrollView
                contentContainerStyle={styles.matchesContainer}
                showsVerticalScrollIndicator={false}
            >
                {(rounds[selectedRound] || []).map((match, index) => (
                    <MatchCard
                        key={match.id || index}
                        match={match}
                        matchIndex={index + 1}
                        roundName={getRoundName(selectedRound)}
                        statusColor={getMatchStatusColor(match.status)}
                        statusIcon={getMatchStatusIcon(match.status)}
                        onPress={() => onMatchPress?.(match)}
                        isFinal={selectedRound === totalRounds}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

function MatchCard({ match, matchIndex, roundName, statusColor, statusIcon, onPress, isFinal }) {
    const homeTeam = match.home_team || { name: 'TBD', tag: '---' };
    const awayTeam = match.away_team || { name: 'TBD', tag: '---' };
    const isLive = match.status === 'LIVE';
    const isCompleted = match.status === 'COMPLETED';
    const hasWinner = match.winner_id;

    const homeWon = hasWinner && match.winner_id === match.home_team_id;
    const awayWon = hasWinner && match.winner_id === match.away_team_id;

    return (
        <TouchableOpacity
            style={[styles.matchCard, isFinal && styles.matchCardFinal]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* Match Header */}
            <View style={styles.matchHeader}>
                <View style={styles.matchInfo}>
                    <Text style={styles.matchNumber}>Partido {matchIndex}</Text>
                    {match.scheduled_datetime && (
                        <Text style={styles.matchTime}>
                            {new Date(match.scheduled_datetime).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                    <Ionicons name={statusIcon} size={12} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {isLive ? 'EN VIVO' : isCompleted ? 'Finalizado' : 'Programado'}
                    </Text>
                </View>
            </View>

            {/* Teams */}
            <View style={styles.teamsContainer}>
                {/* Home Team */}
                <View style={[
                    styles.teamRow,
                    homeWon && styles.teamRowWinner,
                    isCompleted && !homeWon && styles.teamRowLoser,
                ]}>
                    <View style={styles.teamLeft}>
                        <View style={[styles.teamSeed, homeWon && styles.teamSeedWinner]}>
                            <Text style={[styles.seedText, homeWon && styles.seedTextWinner]}>
                                {match.home_team?.seed || '?'}
                            </Text>
                        </View>
                        <View style={styles.teamNameContainer}>
                            <Text style={[
                                styles.teamName,
                                homeWon && styles.teamNameWinner,
                                isCompleted && !homeWon && styles.teamNameLoser,
                            ]} numberOfLines={1}>
                                {homeTeam.name}
                            </Text>
                            <Text style={styles.teamTag}>[{homeTeam.tag}]</Text>
                        </View>
                    </View>
                    <View style={[styles.scoreBox, homeWon && styles.scoreBoxWinner]}>
                        <Text style={[styles.scoreText, homeWon && styles.scoreTextWinner]}>
                            {match.home_score || 0}
                        </Text>
                    </View>
                </View>

                {/* VS Divider */}
                <View style={styles.vsDivider}>
                    <View style={styles.vsLine} />
                    <Text style={styles.vsText}>VS</Text>
                    <View style={styles.vsLine} />
                </View>

                {/* Away Team */}
                <View style={[
                    styles.teamRow,
                    awayWon && styles.teamRowWinner,
                    isCompleted && !awayWon && styles.teamRowLoser,
                ]}>
                    <View style={styles.teamLeft}>
                        <View style={[styles.teamSeed, awayWon && styles.teamSeedWinner]}>
                            <Text style={[styles.seedText, awayWon && styles.seedTextWinner]}>
                                {match.away_team?.seed || '?'}
                            </Text>
                        </View>
                        <View style={styles.teamNameContainer}>
                            <Text style={[
                                styles.teamName,
                                awayWon && styles.teamNameWinner,
                                isCompleted && !awayWon && styles.teamNameLoser,
                            ]} numberOfLines={1}>
                                {awayTeam.name}
                            </Text>
                            <Text style={styles.teamTag}>[{awayTeam.tag}]</Text>
                        </View>
                    </View>
                    <View style={[styles.scoreBox, awayWon && styles.scoreBoxWinner]}>
                        <Text style={[styles.scoreText, awayWon && styles.scoreTextWinner]}>
                            {match.away_score || 0}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Live indicator animation bar */}
            {isLive && (
                <LinearGradient
                    colors={[colors.live, colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.liveBar}
                />
            )}

            {/* Final trophy */}
            {isFinal && isCompleted && (
                <View style={styles.trophyContainer}>
                    <Ionicons name="trophy" size={16} color={colors.gold} />
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Empty state
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 212, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    // Round selector
    roundSelector: {
        paddingHorizontal: 4,
        paddingBottom: 16,
        gap: 8,
    },
    roundTab: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    roundTabActive: {},
    roundTabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    roundTabInner: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    roundTabText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    roundTabTextActive: {
        fontSize: 13,
        color: colors.black,
        fontWeight: '700',
    },
    roundTabCount: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 2,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.live,
    },
    // Matches
    matchesContainer: {
        gap: 12,
        paddingBottom: 16,
    },
    matchCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    matchCardFinal: {
        borderColor: 'rgba(255, 215, 0, 0.3)',
        ...shadows.glow('#ffd700'),
    },
    matchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    matchInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    matchNumber: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    matchTime: {
        fontSize: 11,
        color: colors.textMuted,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    // Teams
    teamsContainer: {
        paddingHorizontal: 12,
        paddingBottom: 12,
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 10,
    },
    teamRowWinner: {
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    teamRowLoser: {
        opacity: 0.5,
    },
    teamLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    teamSeed: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    teamSeedWinner: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    seedText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMuted,
    },
    seedTextWinner: {
        color: colors.success,
    },
    teamNameContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    teamName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        flexShrink: 1,
    },
    teamNameWinner: {
        color: colors.success,
    },
    teamNameLoser: {
        color: colors.textMuted,
    },
    teamTag: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '500',
    },
    scoreBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreBoxWinner: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    scoreText: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.textSecondary,
    },
    scoreTextWinner: {
        color: colors.success,
    },
    // VS Divider
    vsDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        marginVertical: 2,
    },
    vsLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    vsText: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.textMuted,
        marginHorizontal: 8,
    },
    // Live bar
    liveBar: {
        height: 3,
    },
    // Trophy
    trophyContainer: {
        position: 'absolute',
        top: 12,
        right: 50,
    },
});
