import React, { useEffect, useState, useCallback } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    ScrollView, 
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { storage } from '../../services/storage';
import { colors } from '../../theme/colors';
import { Loading, EmptyState, Badge, Header, Button } from '../../components/common';

const FAVORITES_KEY = 'favorites';

export default function FavoritesScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [favorites, setFavorites] = useState({ tournaments: [], teams: [] });
    const [tournaments, setTournaments] = useState([]);
    const [teams, setTeams] = useState([]);

    const loadFavorites = async () => {
        try {
            const stored = await storage.getItem(FAVORITES_KEY);
            if (stored) {
                setFavorites(stored);
            }
        } catch (error) {
            console.warn('Error loading favorites:', error);
        }
    };

    const fetchData = async () => {
        try {
            await loadFavorites();
            
            const [tournamentsRes, teamsRes] = await Promise.all([
                api.get('/tournaments'),
                api.get('/teams'),
            ]);
            
            setTournaments(tournamentsRes.data || tournamentsRes || []);
            setTeams(teamsRes.data || teamsRes || []);
        } catch (error) {
            console.warn('Error fetching data:', error);
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

    const removeFavorite = async (type, id) => {
        const newFavorites = {
            ...favorites,
            [type]: favorites[type].filter(fav => fav.id !== id),
        };
        setFavorites(newFavorites);
        await storage.setItem(FAVORITES_KEY, newFavorites);
    };

    const favoriteTournaments = favorites.tournaments
        ?.map(fav => tournaments.find(t => t.id === fav.id))
        .filter(Boolean) || [];

    const favoriteTeams = favorites.teams
        ?.map(fav => teams.find(t => t.id === fav.id))
        .filter(Boolean) || [];

    const hasFavorites = favoriteTournaments.length > 0 || favoriteTeams.length > 0;

    if (loading) return <Loading text="Cargando favoritos..." />;

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
                    title="Mis Favoritos"
                    subtitle="Tus torneos y equipos guardados"
                    badge={{ icon: 'heart', text: 'Favoritos' }}
                    centered
                />

                {!hasFavorites ? (
                    <EmptyState
                        icon="heart-outline"
                        title="Sin favoritos"
                        message="Aún no has agregado torneos o equipos a tus favoritos. Explora y guarda tus preferidos."
                        actionTitle="Explorar Torneos"
                        onAction={() => navigation.navigate('Tournaments')}
                    />
                ) : (
                    <View style={styles.content}>
                        {/* Tournaments */}
                        {favoriteTournaments.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="trophy" size={20} color={colors.primary} />
                                    <Text style={styles.sectionTitle}>
                                        Torneos ({favoriteTournaments.length})
                                    </Text>
                                </View>
                                
                                {favoriteTournaments.map(tournament => (
                                    <TouchableOpacity 
                                        key={tournament.id}
                                        style={styles.favoriteCard}
                                        activeOpacity={0.8}
                                        onPress={() => navigation.navigate('Tournaments', {
                                            screen: 'TournamentDetail',
                                            params: { id: tournament.id }
                                        })}
                                    >
                                        <View style={styles.cardContent}>
                                            <View style={styles.cardIcon}>
                                                <Ionicons name="trophy" size={24} color={colors.primary} />
                                            </View>
                                            <View style={styles.cardInfo}>
                                                <Text style={styles.cardTitle} numberOfLines={1}>
                                                    {tournament.name}
                                                </Text>
                                                <View style={styles.cardMeta}>
                                                    <Badge 
                                                        text={tournament.status?.replace('_', ' ') || 'OPEN'}
                                                        variant={tournament.status === 'IN_PROGRESS' ? 'live' : 'success'}
                                                        size="small"
                                                    />
                                                    <Text style={styles.cardMetaText}>
                                                        {new Date(tournament.start_date).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        <TouchableOpacity 
                                            style={styles.removeButton}
                                            onPress={() => removeFavorite('tournaments', tournament.id)}
                                        >
                                            <Ionicons name="heart" size={20} color={colors.error} />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Teams */}
                        {favoriteTeams.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="people" size={20} color={colors.secondary} />
                                    <Text style={styles.sectionTitle}>
                                        Equipos ({favoriteTeams.length})
                                    </Text>
                                </View>
                                
                                {favoriteTeams.map(team => (
                                    <View key={team.id} style={styles.favoriteCard}>
                                        <View style={styles.cardContent}>
                                            <View style={[styles.cardIcon, styles.cardIconSecondary]}>
                                                <Ionicons name="shield" size={24} color={colors.secondary} />
                                            </View>
                                            <View style={styles.cardInfo}>
                                                <Text style={styles.cardTitle} numberOfLines={1}>
                                                    {team.name}
                                                </Text>
                                                <Text style={styles.cardSubtitle}>
                                                    {team.member_count || 0} miembros
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity 
                                            style={styles.removeButton}
                                            onPress={() => removeFavorite('teams', team.id)}
                                        >
                                            <Ionicons name="heart" size={20} color={colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
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
    content: {
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    favoriteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardIconSecondary: {
        backgroundColor: 'rgba(121, 40, 202, 0.1)',
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    cardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    cardMetaText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    removeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
});
