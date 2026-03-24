import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Alert,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, gradients } from '../../theme/colors';
import { Loading, Button, Badge, Card } from '../../components/common';
import BracketView from '../../components/tournament/BracketView';
import TeamsList from '../../components/tournament/TeamsList';
import MatchDetailModal from '../../components/tournament/MatchDetailModal';

const { width } = Dimensions.get('window');
const DEFAULT_IMAGE = 'https://via.placeholder.com/800x400/161616/00d4ff?text=Tournament';

export default function TournamentDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const [tournament, setTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [registering, setRegistering] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [matchModalVisible, setMatchModalVisible] = useState(false);
    const [myRegistration, setMyRegistration] = useState(null);
    const [showRegForm, setShowRegForm] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [teamTag, setTeamTag] = useState('');

    const fetchTournament = async () => {
        try {
            // Fetch tournament details, bracket, teams, and registration status in parallel
            const [detailRes, bracketRes, teamsRes, regRes] = await Promise.allSettled([
                api.tournaments.getDetail ? api.tournaments.getDetail(id) : api.get(`/tournaments/${id}`),
                api.tournaments.getBracket(id),
                api.get(`/tournaments/${id}/teams`),
                api.get(`/tournaments/${id}/my-registration`).catch(() => null),
            ]);

            // Tournament data
            if (detailRes.status === 'fulfilled' && detailRes.value) {
                const d = detailRes.value.data || detailRes.value;
                if (d && (d.id || d.name)) {
                    setTournament(d);
                }
            }

            // Bracket data
            if (bracketRes.status === 'fulfilled' && bracketRes.value) {
                const b = bracketRes.value.data || bracketRes.value;
                const matchesArr = b.matches || b || [];
                setMatches(Array.isArray(matchesArr) ? matchesArr : []);
            }

            // Teams data
            if (teamsRes.status === 'fulfilled' && teamsRes.value) {
                const t = teamsRes.value.data || teamsRes.value;
                setTeams(Array.isArray(t) ? t : []);
            }

            // Registration status
            if (regRes.status === 'fulfilled' && regRes.value) {
                const r = regRes.value;
                if (r.registered && r.data) {
                    setMyRegistration(r.data);
                } else {
                    setMyRegistration(null);
                }
            }
        } catch (error) {
            console.warn('Error fetching tournament detail:', error);
            setTournament({
                id, name: 'Torneo de Ejemplo', status: 'REGISTRATION_OPEN',
                game: { name: 'Juego' }, start_date: new Date().toISOString(),
                format: 'KNOCKOUT', team_size: 1, prize_pool: 0,
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRegister = async () => {
        if (registering) return;
        if (myRegistration) {
            Alert.alert('Ya inscrito', `Ya estás inscrito con el equipo "${myRegistration.team?.name}"`);
            return;
        }
        setShowRegForm(true);
    };

    const submitRegistration = async () => {
        if (!teamName.trim() || teamName.trim().length < 2) {
            Alert.alert('Error', 'El nombre del equipo debe tener al menos 2 caracteres');
            return;
        }
        if (!teamTag.trim() || teamTag.trim().length < 2 || teamTag.trim().length > 6) {
            Alert.alert('Error', 'El tag debe tener entre 2 y 6 caracteres');
            return;
        }

        setRegistering(true);
        try {
            const result = await api.post(`/tournaments/${id}/register`, {
                team_name: teamName.trim(),
                team_tag: teamTag.trim().toUpperCase(),
            });
            setShowRegForm(false);
            setTeamName('');
            setTeamTag('');
            Alert.alert(
                '🎮 ¡Inscripción Exitosa!',
                result.data?.message || '¡Te has inscrito al torneo!',
                [{ text: '¡Vamos!', onPress: () => fetchTournament() }]
            );
        } catch (error) {
            const msg = error?.response?.data?.error || error?.message || 'No se pudo completar la inscripción';
            Alert.alert('Error', msg);
        } finally {
            setRegistering(false);
        }
    };

    useEffect(() => {
        fetchTournament();
    }, [id]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Invalidate cache and fetch fresh data
        api.tournaments.refreshDetail(id);
        fetchTournament();
    }, [id]);

    // Helper: compute round name based on total rounds
    const getRoundName = useCallback((roundNum) => {
        // Group matches by round to find total rounds
        const roundNums = [...new Set(matches.map(m => m.round || 1))].sort((a, b) => a - b);
        const totalRounds = roundNums.length || 1;
        if (totalRounds <= 1) return 'Final';
        const fromEnd = totalRounds - roundNum;
        switch (fromEnd) {
            case 0: return '🏆 Final';
            case 1: return 'Semifinales';
            case 2: return 'Cuartos de Final';
            default: return `Ronda ${roundNum}`;
        }
    }, [matches]);

    // Handlers for bracket and teams interactions
    const handleMatchPress = useCallback((match) => {
        setSelectedMatch(match);
        setMatchModalVisible(true);
    }, []);

    const handleTeamPress = useCallback((team) => {
        const playerCount = team.players?.length || 0;
        const captainName = team.captain?.username || team.players?.find(p => p.is_captain)?.user?.username || 'Desconocido';
        const statusLabel = team.disqualified ? '❌ Descalificado' : (team.approved ? '✅ Aprobado' : '⏳ Pendiente');

        Alert.alert(
            `${team.name} [${team.tag}]`,
            `Capitán: ${captainName}\nJugadores: ${playerCount}/${tournament?.team_size || '?'}\nEstado: ${statusLabel}${team.seed ? `\nSeed: #${team.seed}` : ''}`,
            [{ text: 'Cerrar' }]
        );
    }, [tournament]);

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
    const isRegistrationOpen = tournament.status === 'REGISTRATION_OPEN' || tournament.status === 'PUBLISHED';
    const isRegistered = !!myRegistration;

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
                            <BracketView
                                matches={matches}
                                format={tournament.format}
                                onMatchPress={handleMatchPress}
                            />
                        </View>
                    )}

                    {activeTab === 'teams' && (
                        <View style={styles.tabContent}>
                            <TeamsList
                                teams={teams}
                                maxTeamSize={tournament.team_size || 5}
                                onTeamPress={handleTeamPress}
                            />
                        </View>
                    )}
                </View>

                {/* Registered Banner */}
                {isRegistered && (
                    <View style={styles.registeredBanner}>
                        <LinearGradient
                            colors={['rgba(16, 185, 129, 0.15)', 'rgba(0, 212, 255, 0.1)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.registeredGradient}
                        >
                            <View style={styles.registeredHeader}>
                                <View style={styles.registeredBadge}>
                                    <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                                    <Text style={styles.registeredTitle}>¡INSCRITO!</Text>
                                </View>
                                <View style={styles.registeredSeedBadge}>
                                    <Ionicons name="shield" size={12} color={colors.primary} />
                                    <Text style={styles.registeredSeedText}>
                                        {myRegistration.team?.seed ? `Seed #${myRegistration.team.seed}` : 'Sin Seed'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.registeredTeamRow}>
                                <View style={styles.teamInitials}>
                                    <Text style={styles.teamInitialsText}>
                                        {myRegistration.team?.tag || '??'}
                                    </Text>
                                </View>
                                <View style={styles.registeredTeamInfo}>
                                    <Text style={styles.registeredTeamName}>{myRegistration.team?.name || 'Mi Equipo'}</Text>
                                    <Text style={styles.registeredTeamMeta}>
                                        {myRegistration.is_captain ? '👑 Capitán' : '⚔️ Miembro'}
                                        {' • '}
                                        {myRegistration.team?.approved ? '✅ Aprobado' : '⏳ Pendiente'}
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Fixed Action Button */}
            <View style={styles.actionContainer}>
                {isRegistered ? (
                    <TouchableOpacity
                        style={styles.registeredButton}
                        onPress={() => setActiveTab('bracket')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.registeredButtonGradient}
                        >
                            <Ionicons name="checkmark-circle" size={22} color="#fff" />
                            <Text style={styles.registeredButtonText}>Ya Inscrito — Ver Bracket</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <Button
                        title={registering ? "Inscribiendo..." : isRegistrationOpen ? "⚔️ Inscribirse al Torneo" : "Ver Bracket"}
                        icon={isRegistrationOpen ? "add-circle-outline" : "eye-outline"}
                        onPress={() => {
                            if (isRegistrationOpen) {
                                handleRegister();
                            } else {
                                setActiveTab('bracket');
                            }
                        }}
                        gradient
                        size="large"
                        disabled={registering}
                    />
                )}
            </View>

            {/* Registration Form Modal */}
            <Modal
                visible={showRegForm}
                transparent
                animationType="slide"
                onRequestClose={() => setShowRegForm(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.regModalOverlay}
                >
                    <TouchableOpacity
                        style={styles.regModalDismiss}
                        activeOpacity={1}
                        onPress={() => setShowRegForm(false)}
                    />
                    <View style={styles.regModalContainer}>
                        <LinearGradient
                            colors={[colors.card, colors.background]}
                            style={styles.regModalContent}
                        >
                            {/* Header */}
                            <View style={styles.regModalHeader}>
                                <View style={styles.regModalHandle} />
                                <View style={styles.regModalIconContainer}>
                                    <LinearGradient
                                        colors={[colors.primary, '#7928CA']}
                                        style={styles.regModalIcon}
                                    >
                                        <Ionicons name="game-controller" size={32} color="#fff" />
                                    </LinearGradient>
                                </View>
                                <Text style={styles.regModalTitle}>Inscripción al Torneo</Text>
                                <Text style={styles.regModalSubtitle}>{tournament.name}</Text>
                                {Number(tournament.entry_fee) > 0 && (
                                    <View style={styles.regFeeContainer}>
                                        <Ionicons name="cash-outline" size={16} color="#fbbf24" />
                                        <Text style={styles.regFeeText}>Cuota: ${tournament.entry_fee} MXN</Text>
                                    </View>
                                )}
                                {Number(tournament.entry_fee) === 0 && (
                                    <View style={[styles.regFeeContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                        <Ionicons name="gift-outline" size={16} color="#10b981" />
                                        <Text style={[styles.regFeeText, { color: '#10b981' }]}>Inscripción Gratuita</Text>
                                    </View>
                                )}
                            </View>

                            {/* Form */}
                            <View style={styles.regFormGroup}>
                                <Text style={styles.regFormLabel}>
                                    <Ionicons name="people" size={14} color={colors.primary} /> Nombre del Equipo
                                </Text>
                                <TextInput
                                    style={styles.regFormInput}
                                    placeholder="Ej: Shadow Warriors"
                                    placeholderTextColor={colors.textMuted}
                                    value={teamName}
                                    onChangeText={setTeamName}
                                    maxLength={50}
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.regFormGroup}>
                                <Text style={styles.regFormLabel}>
                                    <Ionicons name="pricetag" size={14} color={colors.primary} /> Tag del Equipo
                                </Text>
                                <TextInput
                                    style={styles.regFormInput}
                                    placeholder="Ej: SW"
                                    placeholderTextColor={colors.textMuted}
                                    value={teamTag}
                                    onChangeText={(t) => setTeamTag(t.toUpperCase())}
                                    maxLength={6}
                                    autoCapitalize="characters"
                                />
                                <Text style={styles.regFormHint}>2-6 caracteres (se muestra en el bracket)</Text>
                            </View>

                            {/* Buttons */}
                            <TouchableOpacity
                                style={[styles.regSubmitBtn, registering && { opacity: 0.6 }]}
                                onPress={submitRegistration}
                                disabled={registering}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[colors.primary, '#7928CA']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.regSubmitGradient}
                                >
                                    <Ionicons name={registering ? 'hourglass-outline' : 'rocket-outline'} size={20} color="#fff" />
                                    <Text style={styles.regSubmitText}>
                                        {registering ? 'Inscribiendo...' : '¡Inscribirme Ahora!'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.regCancelBtn}
                                onPress={() => setShowRegForm(false)}
                            >
                                <Text style={styles.regCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Match Detail Modal */}
            <MatchDetailModal
                visible={matchModalVisible}
                match={selectedMatch}
                roundName={selectedMatch ? getRoundName(selectedMatch.round || 1) : ''}
                onClose={() => {
                    setMatchModalVisible(false);
                    setSelectedMatch(null);
                }}
            />
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
    // Registered Banner
    registeredBanner: {
        marginTop: 20,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    registeredGradient: {
        padding: 16,
    },
    registeredHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    registeredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    registeredTitle: {
        color: '#10b981',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 1,
    },
    registeredSeedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.2)',
    },
    registeredSeedText: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: '700',
    },
    registeredTeamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    teamInitials: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 212, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    teamInitialsText: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 1,
    },
    registeredTeamInfo: {
        flex: 1,
    },
    registeredTeamName: {
        color: colors.text,
        fontWeight: '700',
        fontSize: 16,
    },
    registeredTeamMeta: {
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    // Registered Button
    registeredButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    registeredButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 14,
    },
    registeredButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    // Registration Modal
    regModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    regModalDismiss: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    regModalContainer: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
    },
    regModalContent: {
        padding: 24,
        paddingBottom: 40,
    },
    regModalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    regModalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 20,
    },
    regModalIconContainer: {
        marginBottom: 16,
    },
    regModalIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    regModalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 4,
    },
    regModalSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 12,
    },
    regFeeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    regFeeText: {
        color: '#fbbf24',
        fontWeight: '700',
        fontSize: 13,
    },
    regFormGroup: {
        marginBottom: 16,
    },
    regFormLabel: {
        color: colors.text,
        fontWeight: '600',
        fontSize: 13,
        marginBottom: 8,
    },
    regFormInput: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    regFormHint: {
        color: colors.textMuted,
        fontSize: 11,
        marginTop: 6,
    },
    regSubmitBtn: {
        marginTop: 8,
        borderRadius: 14,
        overflow: 'hidden',
    },
    regSubmitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    regSubmitText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    regCancelBtn: {
        alignItems: 'center',
        paddingVertical: 14,
    },
    regCancelText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
});
