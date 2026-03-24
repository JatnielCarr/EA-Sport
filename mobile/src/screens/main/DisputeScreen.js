import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, gradients } from '../../theme/colors';
import { Loading, EmptyState, Badge, Card, Header } from '../../components/common';

const { width } = Dimensions.get('window');

export default function DisputeScreen({ route, navigation }) {
    const { matchId, disputeId } = route.params || {};
    const { userInfo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [match, setMatch] = useState(null);
    const [results, setResults] = useState([]);
    const [myDisputes, setMyDisputes] = useState([]);

    const fetchDisputeData = useCallback(async () => {
        try {
            if (matchId) {
                const res = await api.get(`/matches/${matchId}`);
                const matchData = res?.data || res;
                setMatch(matchData);
                setResults(matchData?.results || []);
            }

            // Fetch user's dispute history
            try {
                const disputeRes = await api.get('/disputes/my');
                setMyDisputes(disputeRes?.data || disputeRes || []);
            } catch { }
        } catch (error) {
            console.warn('Error fetching dispute:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [matchId]);

    useEffect(() => {
        fetchDisputeData();
    }, [fetchDisputeData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDisputeData();
    }, [fetchDisputeData]);

    const getDisputeStatus = (disputed, validated) => {
        if (validated) return { label: 'Resuelto', color: colors.success, icon: 'checkmark-circle' };
        if (disputed) return { label: 'En Revisión', color: colors.warning, icon: 'time' };
        return { label: 'Pendiente', color: colors.info, icon: 'hourglass' };
    };

    // ===================== RENDERS =====================

    const renderMatchDispute = () => {
        if (!match) return null;

        const homeTeam = match.home_team;
        const awayTeam = match.away_team;
        const disputedResults = results.filter(r => r.disputed);

        return (
            <View style={styles.section}>
                {/* Match Info */}
                <Card title="Partido en Disputa" icon="warning-outline">
                    <View style={styles.matchHeader}>
                        <View style={styles.disputeTeam}>
                            <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.teamBadge}>
                                <Ionicons name="shield" size={24} color={colors.primary} />
                            </LinearGradient>
                            <Text style={styles.teamName}>{homeTeam?.name || 'TBD'}</Text>
                        </View>
                        <View style={styles.vs}>
                            <Text style={styles.vsScore}>
                                {match.home_score} - {match.away_score}
                            </Text>
                            <Badge label="DISPUTADO" variant="error" />
                        </View>
                        <View style={styles.disputeTeam}>
                            <LinearGradient colors={['#1a1a2e', '#2d1b3d']} style={styles.teamBadge}>
                                <Ionicons name="shield" size={24} color={colors.accent} />
                            </LinearGradient>
                            <Text style={styles.teamName}>{awayTeam?.name || 'TBD'}</Text>
                        </View>
                    </View>
                </Card>

                {/* Conflicting Results */}
                <Card title="Resultados Reportados en Conflicto" icon="git-compare-outline">
                    {results.map((result, idx) => {
                        const status = getDisputeStatus(result.disputed, result.validated);
                        return (
                            <View key={result.id || idx} style={styles.resultCard}>
                                <View style={styles.resultHeader}>
                                    <View style={styles.resultTeam}>
                                        <Ionicons name="person-circle" size={20} color={colors.primary} />
                                        <Text style={styles.resultTeamName}>
                                            {result.reported_by_team?.name || 'Equipo'}
                                        </Text>
                                    </View>
                                    <Badge label={status.label} variant={result.disputed ? 'error' : result.validated ? 'success' : 'warning'} small />
                                </View>

                                <View style={styles.resultBody}>
                                    <View style={styles.resultScoreBox}>
                                        <Text style={styles.resultScoreLabel}>Marcador reportado</Text>
                                        <Text style={styles.resultScoreValue}>
                                            {result.home_score} - {result.away_score}
                                        </Text>
                                    </View>
                                    <View style={styles.resultWinner}>
                                        <Text style={styles.resultWinnerLabel}>Ganador según reporte</Text>
                                        <Text style={styles.resultWinnerName}>
                                            {result.winning_team?.name || 'Equipo'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Screenshot Evidence */}
                                {result.screenshot_url && (
                                    <View style={styles.evidenceContainer}>
                                        <Text style={styles.evidenceTitle}>📸 Evidencia:</Text>
                                        <Image
                                            source={{ uri: result.screenshot_url }}
                                            style={styles.evidenceImage}
                                            resizeMode="cover"
                                        />
                                    </View>
                                )}

                                {result.dispute_reason && (
                                    <View style={styles.reasonContainer}>
                                        <Ionicons name="chatbox-ellipses" size={16} color={colors.warning} />
                                        <Text style={styles.reasonText}>{result.dispute_reason}</Text>
                                    </View>
                                )}

                                <Text style={styles.resultDate}>
                                    Reportado: {new Date(result.submitted_at).toLocaleString('es-ES')}
                                </Text>
                            </View>
                        );
                    })}
                </Card>

                {/* Resolution Status */}
                <Card title="Estado de la Resolución" icon="gavel-outline">
                    <View style={styles.resolutionStatus}>
                        <View style={styles.resolutionStep}>
                            <View style={[styles.stepDot, styles.stepDotActive]}>
                                <Ionicons name="checkmark" size={12} color={colors.white} />
                            </View>
                            <View style={styles.stepInfo}>
                                <Text style={styles.stepTitle}>Resultados reportados</Text>
                                <Text style={styles.stepDesc}>Ambos equipos enviaron sus resultados</Text>
                            </View>
                        </View>
                        <View style={styles.stepLine} />

                        <View style={styles.resolutionStep}>
                            <View style={[styles.stepDot, match.status === 'DISPUTED' && styles.stepDotActive]}>
                                {match.status === 'DISPUTED' ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <Ionicons name="time" size={12} color={colors.textMuted} />
                                )}
                            </View>
                            <View style={styles.stepInfo}>
                                <Text style={[styles.stepTitle, match.status === 'DISPUTED' && { color: colors.warning }]}>
                                    En revisión por Admin
                                </Text>
                                <Text style={styles.stepDesc}>
                                    Un organizador revisará la evidencia de ambas partes
                                </Text>
                            </View>
                        </View>
                        <View style={styles.stepLine} />

                        <View style={styles.resolutionStep}>
                            <View style={styles.stepDot}>
                                <Ionicons name="flag" size={12} color={colors.textMuted} />
                            </View>
                            <View style={styles.stepInfo}>
                                <Text style={styles.stepTitle}>Resolución final</Text>
                                <Text style={styles.stepDesc}>El admin tomará la decisión definitiva</Text>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Tips */}
                <Card title="¿Qué puedes hacer?" icon="help-circle-outline">
                    <View style={styles.tipItem}>
                        <Ionicons name="camera" size={18} color={colors.primary} />
                        <Text style={styles.tipText}>Sube un screenshot del resultado final de la partida</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="videocam" size={18} color={colors.primary} />
                        <Text style={styles.tipText}>Si tienes un clip de video, proporciona el link al admin</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="chatbox" size={18} color={colors.primary} />
                        <Text style={styles.tipText}>Contacta a soporte si el problema no se resuelve en 24h</Text>
                    </View>
                </Card>
            </View>
        );
    };

    const renderMyDisputes = () => {
        if (myDisputes.length === 0) {
            return (
                <EmptyState
                    icon="checkmark-circle-outline"
                    title="Sin Disputas"
                    message="No tienes disputas activas. ¡Todo limpio!"
                />
            );
        }

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Historial de Disputas</Text>
                {myDisputes.map((dispute) => {
                    const status = getDisputeStatus(true, dispute.resolved);
                    return (
                        <TouchableOpacity
                            key={dispute.id}
                            style={styles.disputeCard}
                            onPress={() => navigation.navigate('MatchActive', { matchId: dispute.match_id })}
                        >
                            <View style={styles.disputeCardHeader}>
                                <Ionicons name="flag" size={20} color={status.color} />
                                <View style={styles.disputeCardInfo}>
                                    <Text style={styles.disputeCardTitle}>
                                        {dispute.match?.tournament?.name || 'Torneo'}
                                    </Text>
                                    <Text style={styles.disputeCardSubtitle}>
                                        Ronda {dispute.match?.round || '?'} — Partido #{dispute.match?.match_number || '?'}
                                    </Text>
                                </View>
                                <Badge label={status.label} variant={dispute.resolved ? 'success' : 'warning'} small />
                            </View>
                            {dispute.reason && (
                                <Text style={styles.disputeCardReason} numberOfLines={2}>
                                    {dispute.reason}
                                </Text>
                            )}
                            <Text style={styles.disputeCardDate}>
                                {new Date(dispute.created_at).toLocaleDateString('es-ES')}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    if (loading) return <Loading text="Cargando disputa..." />;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {matchId ? 'Detalle de Disputa' : 'Mis Disputas'}
                </Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {matchId ? renderMatchDispute() : renderMyDisputes()}
                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
    section: { padding: 16 },
    sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    // Match header
    matchHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    disputeTeam: { flex: 1, alignItems: 'center', gap: 6 },
    teamBadge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    teamName: { color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'center' },
    vs: { alignItems: 'center', gap: 4, paddingHorizontal: 8 },
    vsScore: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
    // Results
    resultCard: { backgroundColor: colors.backgroundLight, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    resultTeam: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    resultTeamName: { color: colors.text, fontWeight: '600', fontSize: 14 },
    resultBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    resultScoreBox: { alignItems: 'center' },
    resultScoreLabel: { color: colors.textMuted, fontSize: 11 },
    resultScoreValue: { color: colors.primary, fontSize: 20, fontWeight: 'bold' },
    resultWinner: { alignItems: 'center' },
    resultWinnerLabel: { color: colors.textMuted, fontSize: 11 },
    resultWinnerName: { color: colors.success, fontSize: 14, fontWeight: 'bold' },
    // Evidence
    evidenceContainer: { marginTop: 8, marginBottom: 8 },
    evidenceTitle: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 6 },
    evidenceImage: { width: '100%', height: 160, borderRadius: 10 },
    reasonContainer: { flexDirection: 'row', gap: 8, backgroundColor: colors.warning + '10', borderRadius: 8, padding: 10, marginTop: 8, alignItems: 'flex-start' },
    reasonText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
    resultDate: { color: colors.textMuted, fontSize: 11, marginTop: 8 },
    // Resolution steps
    resolutionStatus: { paddingVertical: 8 },
    resolutionStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.backgroundLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    stepInfo: { flex: 1 },
    stepTitle: { color: colors.text, fontSize: 14, fontWeight: '600' },
    stepDesc: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    stepLine: { width: 2, height: 20, backgroundColor: colors.border, marginLeft: 13 },
    // Tips
    tipItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    tipText: { flex: 1, color: colors.textSecondary, fontSize: 13 },
    // My disputes list
    disputeCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    disputeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    disputeCardInfo: { flex: 1 },
    disputeCardTitle: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
    disputeCardSubtitle: { color: colors.textSecondary, fontSize: 12 },
    disputeCardReason: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
    disputeCardDate: { color: colors.textMuted, fontSize: 11 },
});
