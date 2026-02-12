import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, gradients } from '../../theme/colors';
import { Loading, EmptyState, Badge, Button } from '../../components/common';

const { width } = Dimensions.get('window');

export default function ClansScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [clans, setClans] = useState([]);
    const [filteredClans, setFilteredClans] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAccess, setFilterAccess] = useState('');

    const fetchClans = async () => {
        try {
            const response = await api.get('/clans');
            const clansData = Array.isArray(response) ? response : (response.data || []);
            setClans(clansData);
            setFilteredClans(clansData);
        } catch (error) {
            console.warn('Error fetching clans:', error);
            setClans([]);
            setFilteredClans([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchClans();
    }, []);

    useEffect(() => {
        let filtered = [...clans];

        if (searchQuery) {
            filtered = filtered.filter(clan =>
                clan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                clan.tag?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterAccess) {
            filtered = filtered.filter(clan => clan.access_type === filterAccess);
        }

        setFilteredClans(filtered);
    }, [searchQuery, filterAccess, clans]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchClans();
    }, []);

    const getAccessIcon = (type) => {
        switch (type) {
            case 'OPEN': return 'lock-open-outline';
            case 'INVITE_ONLY': return 'mail-outline';
            case 'CLOSED': return 'lock-closed-outline';
            default: return 'shield-outline';
        }
    };

    const getAccessLabel = (type) => {
        switch (type) {
            case 'OPEN': return 'Abierto';
            case 'INVITE_ONLY': return 'Invitación';
            case 'CLOSED': return 'Cerrado';
            default: return type;
        }
    };

    const getAccessVariant = (type) => {
        switch (type) {
            case 'OPEN': return 'success';
            case 'INVITE_ONLY': return 'warning';
            case 'CLOSED': return 'error';
            default: return 'default';
        }
    };

    if (loading) return <Loading text="Cargando clanes..." />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {/* Hero */}
                    <LinearGradient
                        colors={['rgba(121, 40, 202, 0.15)', 'transparent']}
                        style={styles.hero}
                    >
                        <View style={styles.heroContent}>
                            <Text style={styles.heroTitle}>
                                <Ionicons name="shield" size={28} color={colors.secondary} />
                                {'  '}Encuentra tu{' '}
                                <Text style={styles.gradientText}>Clan</Text>
                            </Text>
                            <Text style={styles.heroSubtitle}>
                                Únete a una comunidad de jugadores, compite en equipo y conquista torneos juntos
                            </Text>
                            <View style={styles.heroActions}>
                                <Button
                                    title="Crear Clan"
                                    icon="add"
                                    size="small"
                                    fullWidth={false}
                                    onPress={() => navigation.navigate('CreateClan')}
                                />
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Search and Filters */}
                    <View style={styles.filters}>
                        <View style={styles.searchBox}>
                            <Ionicons name="search" size={20} color={colors.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar clanes..."
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
                                style={[
                                    styles.filterChip,
                                    filterAccess === '' && styles.filterChipActive,
                                ]}
                                onPress={() => setFilterAccess('')}
                            >
                                <Text style={[
                                    styles.filterChipText,
                                    filterAccess === '' && styles.filterChipTextActive,
                                ]}>Todos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    filterAccess === 'OPEN' && styles.filterChipActive,
                                ]}
                                onPress={() => setFilterAccess('OPEN')}
                            >
                                <Ionicons name="lock-open-outline" size={14} color={filterAccess === 'OPEN' ? colors.black : colors.text} />
                                <Text style={[
                                    styles.filterChipText,
                                    filterAccess === 'OPEN' && styles.filterChipTextActive,
                                ]}>Abiertos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    filterAccess === 'INVITE_ONLY' && styles.filterChipActive,
                                ]}
                                onPress={() => setFilterAccess('INVITE_ONLY')}
                            >
                                <Ionicons name="mail-outline" size={14} color={filterAccess === 'INVITE_ONLY' ? colors.black : colors.text} />
                                <Text style={[
                                    styles.filterChipText,
                                    filterAccess === 'INVITE_ONLY' && styles.filterChipTextActive,
                                ]}>Invitación</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.filterChip,
                                    filterAccess === 'CLOSED' && styles.filterChipActive,
                                ]}
                                onPress={() => setFilterAccess('CLOSED')}
                            >
                                <Ionicons name="lock-closed-outline" size={14} color={filterAccess === 'CLOSED' ? colors.black : colors.text} />
                                <Text style={[
                                    styles.filterChipText,
                                    filterAccess === 'CLOSED' && styles.filterChipTextActive,
                                ]}>Cerrados</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    {/* Results count */}
                    <View style={styles.resultsBar}>
                        <Text style={styles.resultsText}>{filteredClans.length} clanes encontrados</Text>
                    </View>

                    {/* Clans Grid */}
                    {filteredClans.length === 0 ? (
                        <EmptyState
                            icon="shield-outline"
                            title={clans.length === 0 ? '¡Sé el primero!' : 'Sin resultados'}
                            message={clans.length === 0
                                ? 'Aún no hay clanes. Crea el tuyo y lidera la comunidad.'
                                : 'No se encontraron clanes con esos filtros'
                            }
                            actionTitle="Crear Clan"
                            onAction={() => { }}
                        />
                    ) : (
                        <View style={styles.clansGrid}>
                            {filteredClans.map(clan => (
                                <TouchableOpacity
                                    key={clan.id}
                                    style={styles.clanCard}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.clanBanner}>
                                        <LinearGradient
                                            colors={gradients.primary}
                                            style={styles.clanBannerGradient}
                                        >
                                            <Ionicons name="shield" size={40} color={colors.white} />
                                        </LinearGradient>
                                        <View style={styles.clanAccessBadge}>
                                            <Badge
                                                text={getAccessLabel(clan.access_type)}
                                                variant={getAccessVariant(clan.access_type)}
                                                size="small"
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.clanContent}>
                                        <View style={styles.clanHeader}>
                                            <Text style={styles.clanName} numberOfLines={1}>{clan.name}</Text>
                                            <Text style={styles.clanTag}>[{clan.tag}]</Text>
                                        </View>
                                        <Text style={styles.clanDescription} numberOfLines={2}>
                                            {clan.description || 'Sin descripción'}
                                        </Text>
                                        <View style={styles.clanMeta}>
                                            <View style={styles.clanMetaItem}>
                                                <Ionicons name="people" size={14} color={colors.textSecondary} />
                                                <Text style={styles.clanMetaText}>
                                                    {clan.member_count || 0} miembros
                                                </Text>
                                            </View>
                                            {clan.location && (
                                                <View style={styles.clanMetaItem}>
                                                    <Ionicons name="location" size={14} color={colors.textSecondary} />
                                                    <Text style={styles.clanMetaText}>{clan.location}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.clanLeader}>
                                            <Ionicons name="crown" size={14} color={colors.warning} />
                                            <Text style={styles.clanLeaderText}>
                                                Líder: {clan.leader?.username || 'N/A'}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity style={styles.clanButton}>
                                        <Ionicons name="eye" size={18} color={colors.primary} />
                                        <Text style={styles.clanButtonText}>Ver Clan</Text>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
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
        fontSize: 26,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 12,
    },
    gradientText: {
        color: colors.secondary,
    },
    heroSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 22,
        marginBottom: 20,
    },
    heroActions: {
        flexDirection: 'row',
    },
    filters: {
        paddingHorizontal: 20,
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
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    resultsText: {
        color: colors.textSecondary,
        fontSize: 13,
    },
    clansGrid: {
        paddingHorizontal: 20,
    },
    clanCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    clanBanner: {
        height: 80,
        position: 'relative',
    },
    clanBannerGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clanAccessBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    clanContent: {
        padding: 16,
    },
    clanHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    clanName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        flex: 1,
    },
    clanTag: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    clanDescription: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
        marginBottom: 12,
    },
    clanMeta: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    clanMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    clanMetaText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    clanLeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    clanLeaderText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    clanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    clanButtonText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
