import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../../theme/colors';
import { Badge } from '../common';

const DEFAULT_IMAGE = 'https://via.placeholder.com/300x150/161616/00d4ff?text=Tournament';

export default function TournamentCard({ tournament, onPress, variant = 'default' }) {
    const isRegistrationOpen = tournament.status === 'REGISTRATION_OPEN';
    const isLive = tournament.status === 'IN_PROGRESS';
    
    const getStatusBadge = () => {
        switch (tournament.status) {
            case 'REGISTRATION_OPEN':
                return { text: 'Inscripciones Abiertas', variant: 'success' };
            case 'IN_PROGRESS':
                return { text: 'EN VIVO', variant: 'live' };
            case 'COMPLETED':
                return { text: 'Finalizado', variant: 'default' };
            default:
                return { text: tournament.status?.replace('_', ' '), variant: 'warning' };
        }
    };

    const status = getStatusBadge();

    if (variant === 'compact') {
        return (
            <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.8}>
                <Image
                    source={{ uri: tournament.banner_url || DEFAULT_IMAGE }}
                    style={styles.compactImage}
                />
                <View style={styles.compactContent}>
                    <Text style={styles.compactGame}>{tournament.game?.name}</Text>
                    <Text style={styles.compactTitle} numberOfLines={1}>{tournament.name}</Text>
                    <View style={styles.compactMeta}>
                        <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.compactDate}>
                            {new Date(tournament.start_date).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: tournament.banner_url || DEFAULT_IMAGE }}
                    style={styles.image}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.imageOverlay}
                />
                <View style={styles.badgeContainer}>
                    <Badge text={status.text} variant={status.variant} />
                </View>
                {isLive && (
                    <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                    </View>
                )}
            </View>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.gameTag}>
                        <Ionicons name="game-controller" size={12} color={colors.primary} />
                        <Text style={styles.game}>{tournament.game?.name || 'Juego'}</Text>
                    </View>
                    {tournament.prize_pool > 0 && (
                        <View style={styles.prizeTag}>
                            <Ionicons name="trophy" size={12} color={colors.warning} />
                            <Text style={styles.prize}>${tournament.prize_pool}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.title} numberOfLines={2}>{tournament.name}</Text>

                <View style={styles.footer}>
                    <View style={styles.infoItem}>
                        <Ionicons name="git-network-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.info}>{tournament.format}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.info}>{tournament.team_size}v{tournament.team_size}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                        <Text style={styles.info}>
                            {new Date(tournament.start_date).toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'short' 
                            })}
                        </Text>
                    </View>
                </View>

                {isRegistrationOpen && (
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.registerButton}
                    >
                        <Text style={styles.registerText}>Inscribirse</Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.black} />
                    </LinearGradient>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 150,
        backgroundColor: colors.background,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    badgeContainer: {
        position: 'absolute',
        top: 12,
        left: 12,
    },
    liveIndicator: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
    liveDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.live,
    },
    content: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    gameTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    game: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    prizeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    prize: {
        color: colors.warning,
        fontWeight: '700',
        fontSize: 12,
    },
    title: {
        color: colors.text,
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 12,
        lineHeight: 24,
    },
    footer: {
        flexDirection: 'row',
        gap: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    info: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '500',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 10,
    },
    registerText: {
        color: colors.black,
        fontSize: 14,
        fontWeight: '700',
    },
    // Compact variant styles
    compactCard: {
        width: 160,
        backgroundColor: colors.card,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 12,
    },
    compactImage: {
        width: '100%',
        height: 90,
        backgroundColor: colors.background,
    },
    compactContent: {
        padding: 10,
    },
    compactGame: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    compactTitle: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 6,
    },
    compactMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    compactDate: {
        color: colors.textSecondary,
        fontSize: 12,
        fontStyle: 'italic',
    },
});
