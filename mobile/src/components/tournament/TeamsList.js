import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * TeamsList - Lista de equipos inscritos en un torneo
 *
 * Props:
 * - teams: Array de equipos del torneo
 * - onTeamPress: Callback al tocar un equipo
 * - maxTeamSize: Tamaño máximo del equipo (team_size del torneo)
 */
export default function TeamsList({ teams = [], onTeamPress, maxTeamSize = 5 }) {
    if (teams.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                    <Ionicons name="people-outline" size={56} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>Sin equipos inscritos</Text>
                <Text style={styles.emptyText}>
                    Los equipos aparecerán aquí cuando se inscriban al torneo
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header Stats */}
            <View style={styles.headerStats}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{teams.length}</Text>
                    <Text style={styles.statLabel}>Equipos</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {teams.reduce((acc, t) => acc + (t.players?.length || 0), 0)}
                    </Text>
                    <Text style={styles.statLabel}>Jugadores</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {teams.filter(t => t.approved).length}
                    </Text>
                    <Text style={styles.statLabel}>Aprobados</Text>
                </View>
            </View>

            {/* Teams List */}
            <FlatList
                data={teams}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item: team, index }) => (
                    <TeamCard
                        team={team}
                        index={index}
                        maxTeamSize={maxTeamSize}
                        onPress={() => onTeamPress?.(team)}
                    />
                )}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

function TeamCard({ team, index, maxTeamSize, onPress }) {
    const playerCount = team.players?.length || 0;
    const isFull = playerCount >= maxTeamSize;
    const isApproved = team.approved;
    const isDisqualified = team.disqualified;

    const seedColors = {
        1: colors.gold,
        2: colors.silver,
        3: colors.bronze,
    };
    const seedColor = seedColors[team.seed] || colors.textMuted;

    return (
        <TouchableOpacity
            style={[
                styles.teamCard,
                isDisqualified && styles.teamCardDisqualified,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.teamCardInner}>
                {/* Seed / Position */}
                <View style={[styles.seedBadge, { borderColor: seedColor }]}>
                    {team.seed ? (
                        <Text style={[styles.seedNumber, { color: seedColor }]}>
                            {team.seed}
                        </Text>
                    ) : (
                        <Text style={styles.seedNumber}>
                            {index + 1}
                        </Text>
                    )}
                </View>

                {/* Team Info */}
                <View style={styles.teamInfo}>
                    <View style={styles.teamNameRow}>
                        <Text style={styles.teamName} numberOfLines={1}>
                            {team.name}
                        </Text>
                        <Text style={styles.teamTag}>[{team.tag}]</Text>
                    </View>

                    <View style={styles.teamMeta}>
                        {/* Captain */}
                        <View style={styles.metaItem}>
                            <Ionicons name="star" size={11} color={colors.gold} />
                            <Text style={styles.metaText}>
                                {team.captain?.username || 'Capitán'}
                            </Text>
                        </View>

                        {/* Player Count */}
                        <View style={styles.metaItem}>
                            <Ionicons name="people" size={11} color={colors.primary} />
                            <Text style={[
                                styles.metaText,
                                isFull && { color: colors.success },
                            ]}>
                                {playerCount}/{maxTeamSize}
                            </Text>
                        </View>

                        {/* Status */}
                        {isDisqualified ? (
                            <View style={[styles.statusChip, styles.statusDisqualified]}>
                                <Text style={styles.statusChipText}>Descalificado</Text>
                            </View>
                        ) : isApproved ? (
                            <View style={[styles.statusChip, styles.statusApproved]}>
                                <Ionicons name="checkmark-circle" size={10} color={colors.success} />
                                <Text style={[styles.statusChipText, { color: colors.success }]}>
                                    Aprobado
                                </Text>
                            </View>
                        ) : (
                            <View style={[styles.statusChip, styles.statusPending]}>
                                <Ionicons name="time" size={10} color={colors.warning} />
                                <Text style={[styles.statusChipText, { color: colors.warning }]}>
                                    Pendiente
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>

            {/* Player Avatars */}
            {team.players && team.players.length > 0 && (
                <View style={styles.playersRow}>
                    {team.players.slice(0, 5).map((player, pIdx) => (
                        <View key={player.id || pIdx} style={styles.playerAvatar}>
                            {player.user?.avatar_url ? (
                                <Image
                                    source={{ uri: player.user.avatar_url }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <LinearGradient
                                    colors={['#333', '#222']}
                                    style={styles.avatarPlaceholder}
                                >
                                    <Text style={styles.avatarInitial}>
                                        {(player.user?.username || player.role || '?')[0].toUpperCase()}
                                    </Text>
                                </LinearGradient>
                            )}
                            {player.is_captain && (
                                <View style={styles.captainBadge}>
                                    <Ionicons name="star" size={8} color={colors.gold} />
                                </View>
                            )}
                        </View>
                    ))}
                    {team.players.length > 5 && (
                        <View style={[styles.playerAvatar, styles.moreAvatar]}>
                            <Text style={styles.moreText}>+{team.players.length - 5}</Text>
                        </View>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 16,
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
    // Header stats
    headerStats: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
    },
    statLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.border,
        marginHorizontal: 8,
    },
    // Team card
    listContent: {},
    teamCard: {
        backgroundColor: colors.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
    },
    teamCardDisqualified: {
        borderColor: 'rgba(239, 68, 68, 0.3)',
        opacity: 0.6,
    },
    teamCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    seedBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.textMuted,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    seedNumber: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.textMuted,
    },
    teamInfo: {
        flex: 1,
    },
    teamNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    teamName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        flexShrink: 1,
    },
    teamTag: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
    teamMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    metaText: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusApproved: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    statusPending: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    statusDisqualified: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    statusChipText: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.error,
    },
    // Players row
    playersRow: {
        flexDirection: 'row',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: 4,
    },
    playerAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
    },
    avatarImage: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    avatarPlaceholder: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    captainBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreAvatar: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreText: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSecondary,
    },
});
