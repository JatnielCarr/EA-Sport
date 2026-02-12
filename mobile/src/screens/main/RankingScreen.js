import React, { useEffect, useState, useCallback } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    ScrollView, 
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, gradients } from '../../theme/colors';
import { Loading, EmptyState, Header } from '../../components/common';

const { width } = Dimensions.get('window');

export default function RankingScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [rankings, setRankings] = useState([]);

    const fetchRankings = async () => {
        try {
            const teamsRes = await api.get('/teams');
            const teams = Array.isArray(teamsRes) ? teamsRes : (teamsRes.data || []);

            // Create ranking data based on teams
            const rankedTeams = teams.map((team, idx) => ({
                ...team,
                rank: idx + 1,
                wins: Math.floor(Math.random() * 20) + 5,
                losses: Math.floor(Math.random() * 10),
                points: Math.floor(Math.random() * 5000) + 1000,
                tournamentWins: Math.floor(Math.random() * 5),
            })).sort((a, b) => b.points - a.points);

            setRankings(rankedTeams);
        } catch (error) {
            console.warn('Error fetching rankings:', error);
            setRankings([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRankings();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRankings();
    }, []);

    if (loading) return <Loading text="Cargando ranking..." />;

    const top3 = rankings.slice(0, 3);

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
                    title="Ranking Global"
                    subtitle="Los mejores equipos de la plataforma"
                    badge={{ icon: 'medal', text: 'Competición' }}
                    centered
                />

                {rankings.length === 0 ? (
                    <EmptyState
                        icon="trophy-outline"
                        title="Sin equipos"
                        message="Aún no hay equipos en el ranking"
                    />
                ) : (
                    <>
                        {/* Podium */}
                        <View style={styles.podium}>
                            {/* Second Place */}
                            {top3[1] && (
                                <View style={[styles.podiumItem, styles.podiumSecond]}>
                                    <View style={[styles.podiumRank, styles.rankSilver]}>
                                        <Text style={styles.podiumRankText}>2</Text>
                                    </View>
                                    <View style={styles.podiumAvatar}>
                                        <Ionicons name="shield" size={28} color={colors.silver} />
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                        {top3[1].name}
                                    </Text>
                                    <Text style={styles.podiumPoints}>{top3[1].points} pts</Text>
                                    <View style={[styles.podiumBase, styles.baseSecond]} />
                                </View>
                            )}

                            {/* First Place */}
                            {top3[0] && (
                                <View style={[styles.podiumItem, styles.podiumFirst]}>
                                    <View style={styles.crown}>
                                        <Ionicons name="trophy" size={24} color={colors.gold} />
                                    </View>
                                    <View style={[styles.podiumRank, styles.rankGold]}>
                                        <Text style={styles.podiumRankText}>1</Text>
                                    </View>
                                    <View style={[styles.podiumAvatar, styles.avatarFirst]}>
                                        <Ionicons name="shield" size={32} color={colors.gold} />
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                        {top3[0].name}
                                    </Text>
                                    <Text style={styles.podiumPoints}>{top3[0].points} pts</Text>
                                    <View style={[styles.podiumBase, styles.baseFirst]} />
                                </View>
                            )}

                            {/* Third Place */}
                            {top3[2] && (
                                <View style={[styles.podiumItem, styles.podiumThird]}>
                                    <View style={[styles.podiumRank, styles.rankBronze]}>
                                        <Text style={styles.podiumRankText}>3</Text>
                                    </View>
                                    <View style={styles.podiumAvatar}>
                                        <Ionicons name="shield" size={28} color={colors.bronze} />
                                    </View>
                                    <Text style={styles.podiumName} numberOfLines={1}>
                                        {top3[2].name}
                                    </Text>
                                    <Text style={styles.podiumPoints}>{top3[2].points} pts</Text>
                                    <View style={[styles.podiumBase, styles.baseThird]} />
                                </View>
                            )}
                        </View>

                        {/* Rankings List */}
                        <View style={styles.rankingsList}>
                            <Text style={styles.listTitle}>Clasificación Completa</Text>
                            {rankings.map((team, index) => (
                                <View 
                                    key={team.id} 
                                    style={[
                                        styles.rankingItem,
                                        index < 3 && styles.rankingItemTop,
                                    ]}
                                >
                                    <View style={styles.rankingLeft}>
                                        <View style={[
                                            styles.rankBadge,
                                            index === 0 && styles.rankBadgeGold,
                                            index === 1 && styles.rankBadgeSilver,
                                            index === 2 && styles.rankBadgeBronze,
                                        ]}>
                                            <Text style={[
                                                styles.rankText,
                                                index < 3 && styles.rankTextTop,
                                            ]}>
                                                {index + 1}
                                            </Text>
                                        </View>
                                        <View style={styles.teamInfo}>
                                            <View style={styles.teamAvatar}>
                                                <Ionicons name="shield" size={20} color={colors.primary} />
                                            </View>
                                            <Text style={styles.teamName}>{team.name}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.rankingRight}>
                                        <View style={styles.statColumn}>
                                            <Text style={styles.statValue}>{team.wins}</Text>
                                            <Text style={styles.statLabel}>W</Text>
                                        </View>
                                        <View style={styles.statColumn}>
                                            <Text style={styles.statValue}>{team.losses}</Text>
                                            <Text style={styles.statLabel}>L</Text>
                                        </View>
                                        <View style={styles.statColumn}>
                                            <Ionicons name="trophy" size={12} color={colors.warning} />
                                            <Text style={styles.statValue}>{team.tournamentWins}</Text>
                                        </View>
                                        <View style={styles.pointsColumn}>
                                            <Text style={styles.pointsValue}>{team.points.toLocaleString()}</Text>
                                            <Text style={styles.pointsLabel}>pts</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}

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
    podium: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 24,
        marginBottom: 24,
    },
    podiumItem: {
        alignItems: 'center',
        width: (width - 60) / 3,
    },
    podiumFirst: {
        marginBottom: 20,
    },
    podiumSecond: {
        marginBottom: 0,
    },
    podiumThird: {
        marginBottom: 0,
    },
    crown: {
        marginBottom: 8,
    },
    podiumRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    rankGold: {
        backgroundColor: colors.gold,
    },
    rankSilver: {
        backgroundColor: colors.silver,
    },
    rankBronze: {
        backgroundColor: colors.bronze,
    },
    podiumRankText: {
        color: colors.black,
        fontWeight: '800',
        fontSize: 14,
    },
    podiumAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.card,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    avatarFirst: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderColor: colors.gold,
    },
    podiumName: {
        color: colors.text,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
    },
    podiumPoints: {
        color: colors.textSecondary,
        fontSize: 11,
    },
    podiumBase: {
        position: 'absolute',
        bottom: -20,
        width: '100%',
        backgroundColor: colors.card,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    baseFirst: {
        height: 60,
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
    },
    baseSecond: {
        height: 40,
        backgroundColor: 'rgba(192, 192, 192, 0.2)',
    },
    baseThird: {
        height: 30,
        backgroundColor: 'rgba(205, 127, 50, 0.2)',
    },
    rankingsList: {
        paddingHorizontal: 20,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    rankingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    rankingItemTop: {
        borderColor: colors.primary,
    },
    rankingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankBadgeGold: {
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
    },
    rankBadgeSilver: {
        backgroundColor: 'rgba(192, 192, 192, 0.2)',
    },
    rankBadgeBronze: {
        backgroundColor: 'rgba(205, 127, 50, 0.2)',
    },
    rankText: {
        color: colors.textSecondary,
        fontWeight: '700',
        fontSize: 12,
    },
    rankTextTop: {
        color: colors.text,
    },
    teamInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    teamAvatar: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    teamName: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    rankingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statColumn: {
        alignItems: 'center',
    },
    statValue: {
        color: colors.text,
        fontSize: 12,
        fontWeight: '600',
    },
    statLabel: {
        color: colors.textMuted,
        fontSize: 10,
    },
    pointsColumn: {
        alignItems: 'flex-end',
        minWidth: 50,
    },
    pointsValue: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    pointsLabel: {
        color: colors.textMuted,
        fontSize: 10,
    },
});
