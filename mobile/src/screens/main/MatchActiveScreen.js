import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    ActivityIndicator,
    Modal,
    TextInput,
    Dimensions,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, gradients, shadows } from '../../theme/colors';
import { Loading, Badge, Button, Card } from '../../components/common';

const { width } = Dimensions.get('window');

const MATCH_STATES = {
    WAITING: 'WAITING',
    CHECK_IN: 'CHECK_IN',
    LIVE: 'LIVE',
    REPORTING: 'REPORTING',
    DISPUTED: 'DISPUTED',
    COMPLETED: 'COMPLETED',
};

export default function MatchActiveScreen({ route, navigation }) {
    const { matchId } = route.params;
    const { userInfo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [match, setMatch] = useState(null);
    const [tournament, setTournament] = useState(null);
    const [myTeam, setMyTeam] = useState(null);
    const [opponentTeam, setOpponentTeam] = useState(null);
    const [isCaptain, setIsCaptain] = useState(false);

    // Result reporting
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [homeScore, setHomeScore] = useState('0');
    const [awayScore, setAwayScore] = useState('0');
    const [screenshotUri, setScreenshotUri] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Dispute state
    const [disputeModalVisible, setDisputeModalVisible] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [submittingDispute, setSubmittingDispute] = useState(false);

    // Existing results
    const [existingResults, setExistingResults] = useState([]);
    const [disputeDetected, setDisputeDetected] = useState(false);

    // Live pulse animation
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const fetchMatchData = useCallback(async () => {
        try {
            const matchRes = await api.get(`/matches/${matchId}`);
            const matchData = matchRes?.data || matchRes;
            setMatch(matchData);

            // Fetch tournament info
            if (matchData.tournament_id) {
                try {
                    const tournRes = await api.get(`/tournaments/${matchData.tournament_id}`);
                    setTournament(tournRes?.data || tournRes);
                } catch { }
            }

            // Determine user's team
            const homeTeam = matchData.home_team;
            const awayTeam = matchData.away_team;

            if (homeTeam?.captain_id === userInfo?.id ||
                homeTeam?.players?.some(p => p.user_id === userInfo?.id)) {
                setMyTeam(homeTeam);
                setOpponentTeam(awayTeam);
                setIsCaptain(homeTeam?.captain_id === userInfo?.id);
            } else if (awayTeam?.captain_id === userInfo?.id ||
                awayTeam?.players?.some(p => p.user_id === userInfo?.id)) {
                setMyTeam(awayTeam);
                setOpponentTeam(homeTeam);
                setIsCaptain(awayTeam?.captain_id === userInfo?.id);
            }

            // Fetch existing results
            if (matchData.results && matchData.results.length > 0) {
                setExistingResults(matchData.results);
                checkForDispute(matchData.results);
            }
        } catch (error) {
            console.warn('Error fetching match:', error);
            Alert.alert('Error', 'No se pudo cargar el partido');
        } finally {
            setLoading(false);
        }
    }, [matchId, userInfo]);

    useEffect(() => {
        fetchMatchData();
        // Poll every 10 seconds for live match updates
        const interval = setInterval(fetchMatchData, 10000);
        return () => clearInterval(interval);
    }, [fetchMatchData]);

    const checkForDispute = (results) => {
        if (results.length >= 2) {
            const team1Result = results[0];
            const team2Result = results[1];
            // Different teams claiming different winners = dispute
            if (team1Result.winning_team_id !== team2Result.winning_team_id) {
                setDisputeDetected(true);
            }
        }
    };

    // ===================== SCREENSHOT =====================

    const pickScreenshot = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permisos', 'Se necesitan permisos para acceder a la galería.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
        });

        if (!result.canceled && result.assets?.[0]) {
            setScreenshotUri(result.assets[0].uri);
        }
    };

    const takeScreenshot = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permisos', 'Se necesitan permisos para usar la cámara.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
            allowsEditing: true,
        });

        if (!result.canceled && result.assets?.[0]) {
            setScreenshotUri(result.assets[0].uri);
        }
    };

    // ===================== REPORT RESULT =====================

    const handleReportResult = async () => {
        const h = parseInt(homeScore) || 0;
        const a = parseInt(awayScore) || 0;

        if (h === a) {
            Alert.alert('Error', 'No puede haber empate. Debe haber un ganador.');
            return;
        }

        if (!screenshotUri) {
            Alert.alert(
                'Screenshot Requerido',
                '¿Deseas reportar sin screenshot? El resultado podría ser disputado.',
                [
                    { text: 'Volver', style: 'cancel' },
                    { text: 'Continuar sin screenshot', onPress: () => submitResult(h, a, null) },
                ]
            );
            return;
        }

        await submitResult(h, a, screenshotUri);
    };

    const submitResult = async (h, a, screenshot) => {
        setSubmitting(true);
        try {
            const isHome = myTeam?.id === match?.home_team_id || myTeam?.id === match?.home_team?.id;
            const winnerTeamId = h > a ? match?.home_team_id || match?.home_team?.id
                : match?.away_team_id || match?.away_team?.id;

            const payload = {
                match_id: matchId,
                reported_by_team_id: myTeam?.id,
                winning_team_id: winnerTeamId,
                home_score: h,
                away_score: a,
                screenshot_url: screenshot || undefined,
            };

            await api.post(`/matches/${matchId}/results`, payload);
            Alert.alert('Resultado Reportado', 'Tu reporte ha sido enviado. Espera la confirmación del oponente.');
            setReportModalVisible(false);
            fetchMatchData();
        } catch (error) {
            Alert.alert('Error', error?.message || 'No se pudo reportar el resultado');
        } finally {
            setSubmitting(false);
        }
    };

    // ===================== DISPUTE =====================

    const handleSubmitDispute = async () => {
        if (!disputeReason.trim()) {
            Alert.alert('Error', 'Debe proporcionar una razón para la disputa.');
            return;
        }

        setSubmittingDispute(true);
        try {
            await api.post(`/matches/${matchId}/dispute`, {
                reason: disputeReason.trim(),
                reported_by_team_id: myTeam?.id,
            });
            Alert.alert(
                'Disputa Enviada',
                'El partido ha sido congelado y un administrador revisará el caso. Ambos equipos serán notificados.',
            );
            setDisputeModalVisible(false);
            setDisputeReason('');
            fetchMatchData();
        } catch (error) {
            Alert.alert('Error', error?.message || 'No se pudo enviar la disputa');
        } finally {
            setSubmittingDispute(false);
        }
    };

    // ===================== RENDER =====================

    if (loading) return <Loading text="Cargando partido..." />;
    if (!match) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>Partido no encontrado</Text>
                <Button label="Volver" onPress={() => navigation.goBack()} />
            </SafeAreaView>
        );
    }

    const homeTeam = match.home_team;
    const awayTeam = match.away_team;
    const isLive = match.status === 'LIVE' || match.status === 'CHECK_IN';
    const isCompleted = match.status === 'COMPLETED';
    const isDisputed = match.status === 'DISPUTED' || disputeDetected;
    const alreadyReported = existingResults.some(r => r.reported_by_team_id === myTeam?.id);

    const getStatusConfig = () => {
        switch (match.status) {
            case 'LIVE': return { label: 'EN VIVO', color: colors.live, icon: 'radio' };
            case 'CHECK_IN': return { label: 'CHECK-IN', color: colors.warning, icon: 'time' };
            case 'SCHEDULED': return { label: 'PROGRAMADO', color: colors.info, icon: 'calendar' };
            case 'COMPLETED': return { label: 'FINALIZADO', color: colors.success, icon: 'checkmark-circle' };
            case 'DISPUTED': return { label: 'EN DISPUTA', color: colors.error, icon: 'warning' };
            case 'CANCELLED': return { label: 'CANCELADO', color: colors.textMuted, icon: 'close-circle' };
            default: return { label: match.status, color: colors.textSecondary, icon: 'help-circle' };
        }
    };

    const status = getStatusConfig();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.white} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>
                            {tournament?.name || 'Torneo'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            Ronda {match.round} — Partido #{match.match_number}
                        </Text>
                    </View>
                </View>

                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: status.color + '20', borderColor: status.color + '40' }]}>
                    {isLive && (
                        <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }], backgroundColor: status.color }]} />
                    )}
                    <Ionicons name={status.icon} size={18} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    {match.best_of > 1 && (
                        <Text style={styles.bestOfText}>BO{match.best_of}</Text>
                    )}
                </View>

                {/* Dispute Alert */}
                {isDisputed && (
                    <View style={styles.disputeAlert}>
                        <LinearGradient colors={[colors.error + '20', colors.error + '10']} style={styles.disputeAlertGradient}>
                            <Ionicons name="warning" size={24} color={colors.error} />
                            <View style={styles.disputeAlertContent}>
                                <Text style={styles.disputeAlertTitle}>⚠️ Partido en Disputa</Text>
                                <Text style={styles.disputeAlertText}>
                                    Los resultados reportados no coinciden. Un administrador revisará el caso.
                                    Ambos equipos han sido notificados.
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {/* Scoreboard */}
                <View style={styles.scoreboard}>
                    {/* Home Team */}
                    <View style={styles.teamSide}>
                        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.teamShield}>
                            <Ionicons name="shield" size={32} color={colors.primary} />
                        </LinearGradient>
                        <Text style={styles.teamName} numberOfLines={2}>
                            {homeTeam?.name || 'TBD'}
                        </Text>
                        <Text style={styles.teamTag}>[{homeTeam?.tag || '???'}]</Text>
                        {homeTeam?.id === myTeam?.id && (
                            <Badge label="TU EQUIPO" variant="info" small />
                        )}
                    </View>

                    {/* Score */}
                    <View style={styles.scoreCenter}>
                        <View style={styles.scoreBox}>
                            <Text style={styles.scoreText}>{match.home_score || 0}</Text>
                        </View>
                        <Text style={styles.vsText}>VS</Text>
                        <View style={styles.scoreBox}>
                            <Text style={styles.scoreText}>{match.away_score || 0}</Text>
                        </View>
                    </View>

                    {/* Away Team */}
                    <View style={styles.teamSide}>
                        <LinearGradient colors={['#1a1a2e', '#2d1b3d']} style={styles.teamShield}>
                            <Ionicons name="shield" size={32} color={colors.accent} />
                        </LinearGradient>
                        <Text style={styles.teamName} numberOfLines={2}>
                            {awayTeam?.name || 'TBD'}
                        </Text>
                        <Text style={styles.teamTag}>[{awayTeam?.tag || '???'}]</Text>
                        {awayTeam?.id === myTeam?.id && (
                            <Badge label="TU EQUIPO" variant="info" small />
                        )}
                    </View>
                </View>

                {/* Existing Results Summary */}
                {existingResults.length > 0 && (
                    <Card title="Resultados Reportados" icon="document-text-outline">
                        {existingResults.map((result, idx) => (
                            <View key={result.id || idx} style={styles.resultRow}>
                                <View style={styles.resultTeamInfo}>
                                    <Ionicons name="person" size={16} color={colors.primary} />
                                    <Text style={styles.resultTeamName}>
                                        Reportado por: {result.reported_by_team?.name || 'Equipo'}
                                    </Text>
                                </View>
                                <Text style={styles.resultScore}>
                                    {result.home_score} - {result.away_score}
                                </Text>
                                <View style={styles.resultMeta}>
                                    {result.screenshot_url && (
                                        <Badge label="📸 Screenshot" variant="info" small />
                                    )}
                                    {result.validated && (
                                        <Badge label="✓ Validado" variant="success" small />
                                    )}
                                    {result.disputed && (
                                        <Badge label="⚠ Disputado" variant="error" small />
                                    )}
                                </View>
                            </View>
                        ))}
                    </Card>
                )}

                {/* Match Details */}
                <Card title="Detalles del Partido" icon="information-circle-outline">
                    <View style={styles.detailGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Formato</Text>
                            <Text style={styles.detailValue}>BO{match.best_of || 1}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Ronda</Text>
                            <Text style={styles.detailValue}>{match.round}</Text>
                        </View>
                        {match.scheduled_datetime && (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Fecha</Text>
                                <Text style={styles.detailValue}>
                                    {new Date(match.scheduled_datetime).toLocaleDateString('es-ES')}
                                </Text>
                            </View>
                        )}
                    </View>
                </Card>

                {/* Winner Banner */}
                {isCompleted && match.winner_id && (
                    <LinearGradient colors={gradients.gold} style={styles.winnerBanner}>
                        <Ionicons name="trophy" size={24} color="#000" />
                        <Text style={styles.winnerText}>
                            🏆 Ganador: {match.winner?.name || (match.winner_id === homeTeam?.id ? homeTeam?.name : awayTeam?.name) || 'Equipo'}
                        </Text>
                    </LinearGradient>
                )}

                {/* Actions */}
                {isCaptain && isLive && !isCompleted && !isDisputed && (
                    <View style={styles.actions}>
                        {!alreadyReported ? (
                            <TouchableOpacity
                                style={styles.reportBtn}
                                onPress={() => setReportModalVisible(true)}
                            >
                                <LinearGradient colors={gradients.primary} style={styles.reportBtnGradient}>
                                    <Ionicons name="camera" size={22} color={colors.white} />
                                    <Text style={styles.reportBtnText}>Reportar Resultado</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.reportedBanner}>
                                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                <Text style={styles.reportedText}>
                                    Ya reportaste tu resultado. Esperando al oponente...
                                </Text>
                            </View>
                        )}

                        {existingResults.length > 0 && !alreadyReported && (
                            <TouchableOpacity
                                style={styles.disputeBtn}
                                onPress={() => setDisputeModalVisible(true)}
                            >
                                <Ionicons name="flag" size={18} color={colors.error} />
                                <Text style={styles.disputeBtnText}>Abrir Disputa</Text>
                            </TouchableOpacity>
                        )}

                        {disputeDetected && (
                            <TouchableOpacity
                                style={styles.disputeBtn}
                                onPress={() => setDisputeModalVisible(true)}
                            >
                                <Ionicons name="warning" size={18} color={colors.error} />
                                <Text style={styles.disputeBtnText}>Resultados no coinciden — Disputar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Report Result Modal */}
            <Modal visible={reportModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Reportar Resultado</Text>
                            <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Ingresa el marcador final del partido
                        </Text>

                        {/* Score Input */}
                        <View style={styles.scoreInputRow}>
                            <View style={styles.scoreInputTeam}>
                                <Text style={styles.scoreInputLabel}>
                                    {homeTeam?.tag || 'HOME'}
                                </Text>
                                <TextInput
                                    style={styles.scoreInput}
                                    value={homeScore}
                                    onChangeText={setHomeScore}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                            </View>
                            <Text style={styles.scoreInputVs}>-</Text>
                            <View style={styles.scoreInputTeam}>
                                <Text style={styles.scoreInputLabel}>
                                    {awayTeam?.tag || 'AWAY'}
                                </Text>
                                <TextInput
                                    style={styles.scoreInput}
                                    value={awayScore}
                                    onChangeText={setAwayScore}
                                    keyboardType="numeric"
                                    maxLength={2}
                                />
                            </View>
                        </View>

                        {/* Screenshot */}
                        <Text style={styles.screenshotTitle}>
                            📸 Screenshot del resultado (recomendado)
                        </Text>
                        <View style={styles.screenshotActions}>
                            <TouchableOpacity style={styles.screenshotBtn} onPress={pickScreenshot}>
                                <Ionicons name="images" size={22} color={colors.primary} />
                                <Text style={styles.screenshotBtnText}>Galería</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.screenshotBtn} onPress={takeScreenshot}>
                                <Ionicons name="camera" size={22} color={colors.primary} />
                                <Text style={styles.screenshotBtnText}>Cámara</Text>
                            </TouchableOpacity>
                        </View>

                        {screenshotUri && (
                            <View style={styles.screenshotPreview}>
                                <Image source={{ uri: screenshotUri }} style={styles.screenshotImage} />
                                <TouchableOpacity
                                    style={styles.removeScreenshot}
                                    onPress={() => setScreenshotUri(null)}
                                >
                                    <Ionicons name="close-circle" size={24} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Submit */}
                        <TouchableOpacity
                            style={styles.submitResultBtn}
                            onPress={handleReportResult}
                            disabled={submitting}
                        >
                            <LinearGradient colors={gradients.primary} style={styles.submitResultGradient}>
                                {submitting ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <Text style={styles.submitResultText}>Enviar Resultado</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Dispute Modal */}
            <Modal visible={disputeModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>🚩 Abrir Disputa</Text>
                            <TouchableOpacity onPress={() => setDisputeModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.disputeWarning}>
                            <Ionicons name="alert-circle" size={20} color={colors.warning} />
                            <Text style={styles.disputeWarningText}>
                                Al abrir una disputa, el partido será congelado y un administrador intervendrá.
                                Asegúrate de tener evidencia (screenshots) para respaldar tu caso.
                            </Text>
                        </View>

                        <TextInput
                            style={[styles.modalInput, styles.modalTextArea]}
                            value={disputeReason}
                            onChangeText={setDisputeReason}
                            placeholder="Describe por qué estás disputando este resultado...&#10;&#10;Ejemplo: El oponente reportó un marcador incorrecto. Mi screenshot muestra que ganamos 2-1."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            maxLength={1000}
                            numberOfLines={4}
                        />

                        <View style={styles.disputeActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setDisputeModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.disputeSubmitBtn}
                                onPress={handleSubmitDispute}
                                disabled={submittingDispute}
                            >
                                <LinearGradient colors={[colors.error, '#cc0000']} style={styles.disputeSubmitGradient}>
                                    {submittingDispute ? (
                                        <ActivityIndicator color={colors.white} size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="flag" size={16} color={colors.white} />
                                            <Text style={styles.disputeSubmitText}>Enviar Disputa</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: 32 },
    errorText: { color: colors.error, fontSize: 16, textAlign: 'center', marginTop: 40 },
    // Header
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flex: 1 },
    headerTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
    headerSubtitle: { color: colors.textSecondary, fontSize: 13 },
    // Status
    statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
    liveDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
    bestOfText: { color: colors.textMuted, fontSize: 12, marginLeft: 8 },
    // Dispute Alert
    disputeAlert: { marginHorizontal: 16, marginTop: 12, borderRadius: 12, overflow: 'hidden' },
    disputeAlertGradient: { flexDirection: 'row', padding: 14, gap: 12, alignItems: 'flex-start' },
    disputeAlertContent: { flex: 1 },
    disputeAlertTitle: { color: colors.error, fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
    disputeAlertText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
    // Scoreboard
    scoreboard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 24, marginTop: 16 },
    teamSide: { flex: 1, alignItems: 'center', gap: 8 },
    teamShield: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border },
    teamName: { color: colors.text, fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
    teamTag: { color: colors.textSecondary, fontSize: 12 },
    scoreCenter: { alignItems: 'center', gap: 4, paddingHorizontal: 12 },
    scoreBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    scoreText: { color: colors.text, fontSize: 28, fontWeight: 'bold' },
    vsText: { color: colors.textMuted, fontSize: 12, fontWeight: 'bold' },
    // Results
    resultRow: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    resultTeamInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    resultTeamName: { color: colors.text, fontSize: 13, fontWeight: '600' },
    resultScore: { color: colors.primary, fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
    resultMeta: { flexDirection: 'row', gap: 8 },
    // Details
    detailGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    detailItem: { alignItems: 'center', gap: 4 },
    detailLabel: { color: colors.textMuted, fontSize: 12 },
    detailValue: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
    // Winner
    winnerBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 12 },
    winnerText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
    // Actions
    actions: { paddingHorizontal: 16, marginTop: 20, gap: 12 },
    reportBtn: { borderRadius: 14, overflow: 'hidden' },
    reportBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    reportBtnText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
    reportedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.success + '15', borderColor: colors.success + '30', borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16 },
    reportedText: { color: colors.success, flex: 1, fontSize: 14 },
    disputeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.error + '40' },
    disputeBtnText: { color: colors.error, fontWeight: '600', fontSize: 14 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
    modalSubtitle: { color: colors.textSecondary, fontSize: 14, marginBottom: 16 },
    modalInput: { backgroundColor: colors.backgroundLight, borderRadius: 12, padding: 14, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
    modalTextArea: { minHeight: 120, textAlignVertical: 'top' },
    modalCancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    modalCancelText: { color: colors.textSecondary, fontWeight: '600' },
    // Score input
    scoreInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 },
    scoreInputTeam: { alignItems: 'center', gap: 8 },
    scoreInputLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: 'bold' },
    scoreInput: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.backgroundLight, borderWidth: 2, borderColor: colors.primary + '60', color: colors.text, fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
    scoreInputVs: { color: colors.textMuted, fontSize: 24, fontWeight: 'bold' },
    // Screenshot
    screenshotTitle: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 10 },
    screenshotActions: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    screenshotBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.backgroundLight, borderWidth: 1, borderColor: colors.border },
    screenshotBtnText: { color: colors.primary, fontWeight: '600' },
    screenshotPreview: { position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
    screenshotImage: { width: '100%', height: 200, borderRadius: 12, resizeMode: 'cover' },
    removeScreenshot: { position: 'absolute', top: 8, right: 8 },
    // Submit result
    submitResultBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
    submitResultGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    submitResultText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
    // Dispute
    disputeWarning: { flexDirection: 'row', gap: 10, backgroundColor: colors.warning + '15', borderRadius: 12, padding: 12, marginBottom: 16, alignItems: 'flex-start' },
    disputeWarningText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
    disputeActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    disputeSubmitBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    disputeSubmitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
    disputeSubmitText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
});
