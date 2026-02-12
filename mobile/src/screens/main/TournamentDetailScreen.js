import React, { useEffect, useState, useCallback } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    ScrollView, 
    Image, 
    TouchableOpacity,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, gradients } from '../../theme/colors';
import { Loading, Button, Badge, Card } from '../../components/common';

const { width } = Dimensions.get('window');
const DEFAULT_IMAGE = 'https://via.placeholder.com/800x400/161616/00d4ff?text=Tournament';

export default function TournamentDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('info');

    const fetchTournament = async () => {
        try {
            const response = await api.get(`/tournaments/${id}`);
            const tournamentData = response.data || response;
            if (tournamentData && tournamentData.id) {
                setTournament(tournamentData);
            } else {
                // Datos de ejemplo cuando no hay respuesta
                setTournament({
                    id,
                    name: 'Torneo de Ejemplo',
                    status: 'REGISTRATION_OPEN',
                    game: { name: 'Juego' },
                    start_date: new Date().toISOString(),
                    format: 'KNOCKOUT',
                    team_size: 1,
                    prize_pool: 0,
                });
            }
        } catch (error) {
            console.warn('Error fetching tournament detail:', error);
            // Datos de ejemplo como fallback
            setTournament({
                id,
                name: 'Torneo de Ejemplo',
                status: 'REGISTRATION_OPEN',
                game: { name: 'Juego' },
                start_date: new Date().toISOString(),
                format: 'KNOCKOUT',
                team_size: 1,
                prize_pool: 0,
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTournament();
    }, [id]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTournament();
    }, []);

    if (loading) return <Loading text="Cargando torneo..." />;

    const getStatusInfo = () => {
        switch (tournament?.status) {
            case 'REGISTRATION_OPEN':
                return { text: 'Inscripciones Abiertas', variant: 'success', icon: 'checkmark-circle' };
            case 'IN_PROGRESS':
                return { text: 'EN VIVO', variant: 'live', icon: 'radio' };
            case 'COMPLETED':
                return { text: 'Finalizado', variant: 'default', icon: 'flag' };
            default:
                return { text: tournament.status, variant: 'warning', icon: 'time' };
        }
    };

    const status = getStatusInfo();
    const isRegistrationOpen = tournament.status === 'REGISTRATION_OPEN';

    const tabs = [
        { key: 'info', label: 'Información', icon: 'information-circle-outline' },
        { key: 'bracket', label: 'Bracket', icon: 'git-network-outline' },
        { key: 'teams', label: 'Equipos', icon: 'people-outline' },
    ];

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
                {/* Banner */}
                <View style={styles.bannerContainer}>
                    <Image
                        source={{ uri: tournament.banner_url || DEFAULT_IMAGE }}
                        style={styles.banner}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.9)', colors.background]}
                        style={styles.bannerOverlay}
                    />
                    
                    {/* Back Button */}
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.white} />
                    </TouchableOpacity>

                    {/* Share Button */}
                    <TouchableOpacity style={styles.shareButton}>
                        <Ionicons name="share-outline" size={22} color={colors.white} />
                    </TouchableOpacity>

                    {/* Status Badge */}
                    <View style={styles.statusContainer}>
                        <Badge text={status.text} variant={status.variant} size="medium" />
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Game Tag */}
                    <View style={styles.gameTag}>
                        <Ionicons name="game-controller" size={14} color={colors.primary} />
                        <Text style={styles.gameText}>{tournament.game?.name || 'JUEGO'}</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{tournament.name}</Text>

                    {/* Quick Stats */}
                    <View style={styles.quickStats}>
                        <View style={styles.quickStatItem}>
                            <LinearGradient colors={gradients.primary} style={styles.quickStatIcon}>
                                <Ionicons name="trophy" size={18} color={colors.black} />
                            </LinearGradient>
                            <View>
                                <Text style={styles.quickStatValue}>${tournament.prize_pool || 0}</Text>
                                <Text style={styles.quickStatLabel}>Premio</Text>
                            </View>
                        </View>
                        <View style={styles.quickStatDivider} />
                        <View style={styles.quickStatItem}>
                            <View style={[styles.quickStatIcon, styles.quickStatIconSecondary]}>
                                <Ionicons name="git-network" size={18} color={colors.secondary} />
                            </View>
                            <View>
                                <Text style={styles.quickStatValue}>{tournament.format}</Text>
                                <Text style={styles.quickStatLabel}>Formato</Text>
                            </View>
                        </View>
                        <View style={styles.quickStatDivider} />
                        <View style={styles.quickStatItem}>
                            <View style={[styles.quickStatIcon, styles.quickStatIconAccent]}>
                                <Ionicons name="people" size={18} color={colors.success} />
                            </View>
                            <View>
                                <Text style={styles.quickStatValue}>{tournament.team_size}v{tournament.team_size}</Text>
                                <Text style={styles.quickStatLabel}>Equipos</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <Ionicons 
                                    name={tab.icon} 
                                    size={18} 
                                    color={activeTab === tab.key ? colors.primary : colors.textSecondary} 
                                />
                                <Text style={[
                                    styles.tabText, 
                                    activeTab === tab.key && styles.tabTextActive
                                ]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tab Content */}
                    {activeTab === 'info' && (
                        <View style={styles.tabContent}>
                            {/* Info Grid */}
                            <Card title="Detalles del Torneo" icon="information-circle">
                                <View style={styles.infoGrid}>
                                    <InfoItem 
                                        icon="calendar" 
                                        label="Fecha de Inicio"
                                        value={new Date(tournament.start_date).toLocaleDateString('es-ES', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long'
                                        })}
                                    />
                                    <InfoItem 
                                        icon="time" 
                                        label="Hora"
                                        value={new Date(tournament.start_date).toLocaleTimeString('es-ES', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    />
                                    <InfoItem 
                                        icon="globe" 
                                        label="Región"
                                        value={tournament.region || 'Global'}
                                    />
                                    <InfoItem 
                                        icon="ribbon" 
                                        label="Plataforma"
                                        value={tournament.platform || 'Todas'}
                                    />
                                </View>
                            </Card>

                            {/* Description */}
                            <Card title="Descripción" icon="document-text">
                                <Text style={styles.description}>
                                    {tournament.description || 'Sin descripción disponible para este torneo.'}
                                </Text>
                            </Card>

                            {/* Rules */}
                            <Card title="Reglas" icon="list">
                                <View style={styles.rulesList}>
                                    <RuleItem text="Todos los jugadores deben estar registrados antes del inicio" />
                                    <RuleItem text="Los partidos se jugarán según el bracket establecido" />
                                    <RuleItem text="Cualquier comportamiento antideportivo resultará en descalificación" />
                                    <RuleItem text="Los resultados deben ser reportados dentro de 15 minutos" />
                                </View>
                            </Card>
                        </View>
                    )}

                    {activeTab === 'bracket' && (
                        <View style={styles.tabContent}>
                            <Card>
                                <View style={styles.emptyState}>
                                    <Ionicons name="git-network-outline" size={48} color={colors.textMuted} />
                                    <Text style={styles.emptyText}>El bracket estará disponible pronto</Text>
                                </View>
                            </Card>
                        </View>
                    )}

                    {activeTab === 'teams' && (
                        <View style={styles.tabContent}>
                            <Card>
                                <View style={styles.emptyState}>
                                    <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                                    <Text style={styles.emptyText}>Los equipos aparecerán cuando se inscriban</Text>
                                </View>
                            </Card>
                        </View>
                    )}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Fixed Action Button */}
            <View style={styles.actionContainer}>
                <Button
                    title={isRegistrationOpen ? "Inscribirse al Torneo" : "Ver Bracket"}
                    icon={isRegistrationOpen ? "add-circle-outline" : "eye-outline"}
                    onPress={() => console.log('Action')}
                    gradient
                    size="large"
                />
            </View>
        </SafeAreaView>
    );
}

function InfoItem({ icon, label, value }) {
    return (
        <View style={styles.infoItem}>
            <View style={styles.infoItemIcon}>
                <Ionicons name={icon} size={16} color={colors.primary} />
            </View>
            <View style={styles.infoItemContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

function RuleItem({ text }) {
    return (
        <View style={styles.ruleItem}>
            <View style={styles.ruleBullet} />
            <Text style={styles.ruleText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    bannerContainer: {
        position: 'relative',
    },
    banner: {
        width: '100%',
        height: 250,
    },
    bannerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
    },
    content: {
        padding: 20,
        marginTop: -30,
    },
    gameTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    gameText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 20,
        lineHeight: 34,
    },
    quickStats: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },
    quickStatItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    quickStatIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickStatIconSecondary: {
        backgroundColor: 'rgba(121, 40, 202, 0.15)',
    },
    quickStatIconAccent: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    quickStatValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    quickStatLabel: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    quickStatDivider: {
        width: 1,
        backgroundColor: colors.border,
        marginHorizontal: 8,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: 'rgba(0, 212, 255, 0.15)',
    },
    tabText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    tabTextActive: {
        color: colors.primary,
    },
    tabContent: {
        gap: 16,
    },
    infoGrid: {
        gap: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoItemIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoItemContent: {},
    infoLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        color: colors.text,
        fontWeight: '600',
    },
    description: {
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 22,
    },
    rulesList: {
        gap: 12,
    },
    ruleItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    ruleBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
        marginTop: 6,
    },
    ruleText: {
        flex: 1,
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
    },
    actionContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 30,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
});
