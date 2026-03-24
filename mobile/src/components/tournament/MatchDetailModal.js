import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    Modal,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * MatchDetailModal - Modal para ver detalles completos de un partido
 *
 * Props:
 * - visible: boolean - Si el modal está abierto
 * - match: object - Datos del partido
 * - roundName: string - Nombre de la ronda (ej: "Semifinales")
 * - onClose: function - Callback para cerrar el modal
 */
export default function MatchDetailModal({ visible, match, roundName = '', onClose }) {
    if (!match) return null;

    const homeTeam = match.home_team || { name: 'TBD', tag: '---' };
    const awayTeam = match.away_team || { name: 'TBD', tag: '---' };
    const isLive = match.status === 'LIVE';
    const isCompleted = match.status === 'COMPLETED';
    const isScheduled = match.status === 'SCHEDULED' || (!isLive && !isCompleted);
    const hasWinner = !!match.winner_id;
    const homeWon = hasWinner && match.winner_id === match.home_team_id;
    const awayWon = hasWinner && match.winner_id === match.away_team_id;

    const getStatusConfig = () => {
        if (isLive) return { text: 'EN VIVO', color: colors.live, icon: 'radio', bg: 'rgba(255,51,102,0.15)' };
        if (isCompleted) return { text: 'Finalizado', color: colors.success, icon: 'checkmark-circle', bg: 'rgba(16,185,129,0.15)' };
        return { text: 'Programado', color: colors.primary, icon: 'time', bg: 'rgba(0,212,255,0.15)' };
    };

    const status = getStatusConfig();

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Por confirmar';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const bestOf = match.best_of || 1;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onClose} />

                <View style={styles.modalContainer}>
                    {/* Header with gradient */}
                    <LinearGradient
                        colors={isLive ? ['rgba(255,51,102,0.3)', 'rgba(255,51,102,0.05)'] : gradients.primary.map(c => c + '33')}
                        style={styles.header}
                    >
                        {/* Close button */}
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={22} color={colors.text} />
                        </TouchableOpacity>

                        {/* Round & Match info */}
                        <Text style={styles.roundLabel}>{roundName}</Text>
                        <Text style={styles.matchLabel}>Partido {match.match_number || '?'}</Text>

                        {/* Status badge */}
                        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                            {isLive && <View style={styles.livePulse} />}
                            <Ionicons name={status.icon} size={14} color={status.color} />
                            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                        </View>
                    </LinearGradient>

                    {/* Teams & Score */}
                    <View style={styles.matchContent}>
                        {/* Home Team */}
                        <View style={styles.teamSection}>
                            <View style={[
                                styles.teamAvatar,
                                homeWon && styles.teamAvatarWinner,
                                isCompleted && !homeWon && styles.teamAvatarLoser,
                            ]}>
                                <Text style={[
                                    styles.teamInitial,
                                    homeWon && styles.teamInitialWinner,
                                ]}>
                                    {(homeTeam.name || 'T')[0].toUpperCase()}
                                </Text>
                                {homeWon && (
                                    <View style={styles.winnerCrown}>
                                        <Ionicons name="trophy" size={12} color={colors.gold} />
                                    </View>
                                )}
                            </View>
                            <Text style={[
                                styles.teamName,
                                homeWon && styles.teamNameWinner,
                                isCompleted && !homeWon && styles.teamNameLoser,
                            ]} numberOfLines={2}>
                                {homeTeam.name}
                            </Text>
                            <Text style={styles.teamTag}>[{homeTeam.tag || '---'}]</Text>
                            {homeTeam.seed && (
                                <Text style={styles.seedLabel}>Seed #{homeTeam.seed}</Text>
                            )}
                        </View>

                        {/* Score */}
                        <View style={styles.scoreSection}>
                            <View style={styles.scoreRow}>
                                <View style={[styles.scoreBox, homeWon && styles.scoreBoxWinner]}>
                                    <Text style={[styles.scoreValue, homeWon && styles.scoreValueWinner]}>
                                        {match.home_score ?? 0}
                                    </Text>
                                </View>
                                <Text style={styles.scoreDivider}>-</Text>
                                <View style={[styles.scoreBox, awayWon && styles.scoreBoxWinner]}>
                                    <Text style={[styles.scoreValue, awayWon && styles.scoreValueWinner]}>
                                        {match.away_score ?? 0}
                                    </Text>
                                </View>
                            </View>
                            {bestOf > 1 && (
                                <Text style={styles.bestOfLabel}>Al mejor de {bestOf}</Text>
                            )}
                        </View>

                        {/* Away Team */}
                        <View style={styles.teamSection}>
                            <View style={[
                                styles.teamAvatar,
                                awayWon && styles.teamAvatarWinner,
                                isCompleted && !awayWon && styles.teamAvatarLoser,
                            ]}>
                                <Text style={[
                                    styles.teamInitial,
                                    awayWon && styles.teamInitialWinner,
                                ]}>
                                    {(awayTeam.name || 'T')[0].toUpperCase()}
                                </Text>
                                {awayWon && (
                                    <View style={styles.winnerCrown}>
                                        <Ionicons name="trophy" size={12} color={colors.gold} />
                                    </View>
                                )}
                            </View>
                            <Text style={[
                                styles.teamName,
                                awayWon && styles.teamNameWinner,
                                isCompleted && !awayWon && styles.teamNameLoser,
                            ]} numberOfLines={2}>
                                {awayTeam.name}
                            </Text>
                            <Text style={styles.teamTag}>[{awayTeam.tag || '---'}]</Text>
                            {awayTeam.seed && (
                                <Text style={styles.seedLabel}>Seed #{awayTeam.seed}</Text>
                            )}
                        </View>
                    </View>

                    {/* Match Details */}
                    <View style={styles.detailsSection}>
                        {/* Date/Time */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Fecha</Text>
                                <Text style={styles.detailValue}>
                                    {formatDate(match.scheduled_datetime)}
                                </Text>
                            </View>
                        </View>

                        {match.scheduled_datetime && (
                            <View style={styles.detailRow}>
                                <View style={styles.detailIcon}>
                                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Hora</Text>
                                    <Text style={styles.detailValue}>
                                        {formatTime(match.scheduled_datetime)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Bracket position */}
                        <View style={styles.detailRow}>
                            <View style={styles.detailIcon}>
                                <Ionicons name="git-network-outline" size={16} color={colors.primary} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Ronda</Text>
                                <Text style={styles.detailValue}>
                                    {roundName} · Posición {match.bracket_position || match.match_number || '?'}
                                </Text>
                            </View>
                        </View>

                        {/* Winner announcement */}
                        {isCompleted && hasWinner && (
                            <View style={styles.winnerBanner}>
                                <LinearGradient
                                    colors={['rgba(255,215,0,0.15)', 'rgba(255,184,0,0.05)']}
                                    style={styles.winnerBannerGradient}
                                >
                                    <Ionicons name="trophy" size={20} color={colors.gold} />
                                    <View style={styles.winnerInfo}>
                                        <Text style={styles.winnerLabel}>Ganador</Text>
                                        <Text style={styles.winnerName}>
                                            {homeWon ? homeTeam.name : awayTeam.name}
                                        </Text>
                                    </View>
                                    <Text style={styles.winnerAdvance}>
                                        Avanza →
                                    </Text>
                                </LinearGradient>
                            </View>
                        )}

                        {/* Pending match info */}
                        {isScheduled && (
                            <View style={styles.pendingInfo}>
                                <Ionicons name="hourglass-outline" size={16} color={colors.textMuted} />
                                <Text style={styles.pendingText}>
                                    Este partido aún no inicia. El ganador avanzará a la siguiente ronda.
                                </Text>
                            </View>
                        )}

                        {/* Live match info */}
                        {isLive && (
                            <View style={[styles.pendingInfo, { borderColor: 'rgba(255,51,102,0.2)' }]}>
                                <Ionicons name="radio" size={16} color={colors.live} />
                                <Text style={[styles.pendingText, { color: colors.live }]}>
                                    ¡Este partido se está jugando en este momento!
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayTouch: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContainer: {
        width: SCREEN_WIDTH - 40,
        maxWidth: 400,
        backgroundColor: colors.card,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    // Header
    header: {
        padding: 20,
        paddingTop: 16,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    roundLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    matchLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    livePulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.live,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    // Teams & Score
    matchContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    teamSection: {
        flex: 1,
        alignItems: 'center',
    },
    teamAvatar: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: colors.border,
        position: 'relative',
    },
    teamAvatarWinner: {
        borderColor: colors.success,
        backgroundColor: 'rgba(16,185,129,0.1)',
    },
    teamAvatarLoser: {
        opacity: 0.4,
    },
    teamInitial: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textSecondary,
    },
    teamInitialWinner: {
        color: colors.success,
    },
    winnerCrown: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.gold,
    },
    teamName: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 2,
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
    seedLabel: {
        fontSize: 10,
        color: colors.primary,
        fontWeight: '600',
        marginTop: 4,
    },
    // Score
    scoreSection: {
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    scoreBox: {
        width: 44,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    scoreBoxWinner: {
        backgroundColor: 'rgba(16,185,129,0.15)',
        borderColor: colors.success,
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textSecondary,
    },
    scoreValueWinner: {
        color: colors.success,
    },
    scoreDivider: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textMuted,
    },
    bestOfLabel: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 6,
    },
    // Details
    detailsSection: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 6,
    },
    detailIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(0,212,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailContent: {},
    detailLabel: {
        fontSize: 10,
        color: colors.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 13,
        color: colors.text,
        fontWeight: '600',
    },
    // Winner banner
    winnerBanner: {
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 4,
    },
    winnerBannerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    winnerInfo: {
        flex: 1,
    },
    winnerLabel: {
        fontSize: 10,
        color: colors.gold,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    winnerName: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.text,
    },
    winnerAdvance: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.gold,
    },
    // Pending info
    pendingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: 4,
    },
    pendingText: {
        flex: 1,
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 18,
    },
});
