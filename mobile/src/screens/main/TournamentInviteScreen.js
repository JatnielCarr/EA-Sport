import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../../components/common';

const FORMAT_LABELS = {
    SINGLE_ELIMINATION: 'Eliminación Simple',
    DOUBLE_ELIMINATION: 'Doble Eliminación',
    ROUND_ROBIN: 'Round Robin',
    SWISS: 'Suizo',
};

export default function TournamentInviteScreen({ route, navigation }) {
    const { inviteCode } = route.params;
    const { userInfo, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState(null);
    const [error, setError] = useState(null);
    const [teamName, setTeamName] = useState('');
    const [teamTag, setTeamTag] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [registrationResult, setRegistrationResult] = useState(null);

    useEffect(() => {
        fetchTournament();
    }, [inviteCode]);

    const fetchTournament = async () => {
        try {
            const response = await api.tournaments.getByInviteCode(inviteCode);
            setTournament(response.data);
        } catch (err) {
            setError(err.message || 'Invitación no válida');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!teamName.trim() || teamName.length < 3) {
            Alert.alert('Error', 'El nombre del equipo debe tener al menos 3 caracteres');
            return;
        }
        if (!teamTag.trim() || teamTag.length < 2) {
            Alert.alert('Error', 'El tag debe tener al menos 2 caracteres');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.tournaments.registerViaInvite(inviteCode, {
                team_name: teamName.trim(),
                team_tag: teamTag.trim().toUpperCase(),
            });
            setRegistered(true);
            setRegistrationResult(response.data);
        } catch (err) {
            Alert.alert('Error', err.message || 'No se pudo registrar');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading text="Cargando invitación..." />;

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.errorContainer}>
                    <Ionicons name="link-outline" size={64} color={colors.danger} />
                    <Text style={styles.errorTitle}>Invitación no válida</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const isFull = tournament.spots_left <= 0;
    const requiresPayment = tournament.requires_payment;

    if (registered && registrationResult) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.successContainer}>
                    <Ionicons
                        name={registrationResult.requires_payment ? 'checkmark-circle' : 'trophy'}
                        size={64}
                        color={colors.success}
                    />
                    <Text style={styles.successTitle}>
                        {registrationResult.requires_payment ? '¡Equipo Registrado!' : '¡Inscripción Exitosa!'}
                    </Text>
                    <Text style={styles.successText}>{registrationResult.message}</Text>

                    {registrationResult.requires_payment && (
                        <View style={styles.paymentNotice}>
                            <Ionicons name="card" size={24} color={colors.warning} />
                            <Text style={styles.paymentNoticeText}>
                                Cuota pendiente: ${Number(registrationResult.entry_fee).toLocaleString()} MXN
                            </Text>
                            <Text style={styles.paymentNoticeSubtext}>
                                Tu lugar no se confirma hasta completar el pago.
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.viewTournamentBtn}
                        onPress={() => navigation.navigate('TournamentDetail', { id: tournament.id })}
                    >
                        <LinearGradient
                            colors={['#00d4ff', '#0099cc']}
                            style={styles.gradientBtn}
                        >
                            <Ionicons name="eye" size={18} color={colors.white} />
                            <Text style={styles.gradientBtnText}>Ver Torneo</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Invite Badge */}
                <View style={styles.inviteBadge}>
                    <Ionicons name="mail-open" size={16} color={colors.primary} />
                    <Text style={styles.inviteBadgeText}>INVITACIÓN A TORNEO</Text>
                </View>

                {/* Tournament Name */}
                <Text style={styles.tournamentName}>{tournament.name}</Text>
                <Text style={styles.organizer}>
                    Organizado por {tournament.organizer?.username || 'Admin'}
                </Text>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoGrid}>
                        <InfoItem icon="game-controller" label="Juego" value={tournament.game?.name || 'N/A'} />
                        <InfoItem icon="calendar" label="Inicio" value={new Date(tournament.start_date).toLocaleDateString()} />
                        <InfoItem icon="git-branch" label="Formato" value={FORMAT_LABELS[tournament.format] || tournament.format} />
                        <InfoItem icon="globe" label="Región" value={tournament.region || 'Global'} />
                        <InfoItem icon="people" label="Equipos" value={`${tournament.current_teams}/${tournament.max_participants}`} />
                        <InfoItem
                            icon="ticket"
                            label="Lugares"
                            value={isFull ? 'COMPLETO' : `${tournament.spots_left} disponibles`}
                            valueColor={isFull ? colors.danger : colors.success}
                        />
                    </View>

                    {tournament.prize_pool && Number(tournament.prize_pool) > 0 && (
                        <View style={styles.prizeSection}>
                            <Text style={styles.prizeLabel}>Premio Total</Text>
                            <Text style={styles.prizeValue}>
                                ${Number(tournament.prize_pool).toLocaleString()} MXN
                            </Text>
                        </View>
                    )}

                    {requiresPayment ? (
                        <View style={[styles.feeNotice, { borderColor: 'rgba(255,193,7,0.3)', backgroundColor: 'rgba(255,193,7,0.1)' }]}>
                            <Ionicons name="card" size={18} color={colors.warning} />
                            <Text style={[styles.feeText, { color: colors.warning }]}>
                                Cuota de inscripción: ${Number(tournament.entry_fee).toLocaleString()} MXN
                            </Text>
                        </View>
                    ) : (
                        <View style={[styles.feeNotice, { borderColor: 'rgba(0,200,83,0.3)', backgroundColor: 'rgba(0,200,83,0.1)' }]}>
                            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                            <Text style={[styles.feeText, { color: colors.success }]}>Registro gratuito</Text>
                        </View>
                    )}
                </View>

                {/* Registration Form */}
                {isFull ? (
                    <View style={styles.fullNotice}>
                        <Ionicons name="ban" size={48} color={colors.danger} />
                        <Text style={styles.fullTitle}>Torneo Completo</Text>
                        <Text style={styles.fullText}>Ya no hay lugares disponibles.</Text>
                    </View>
                ) : !isAuthenticated ? (
                    <View style={styles.loginNotice}>
                        <Ionicons name="lock-closed" size={48} color={colors.primary} />
                        <Text style={styles.loginTitle}>Inicia sesión para registrarte</Text>
                        <TouchableOpacity
                            style={styles.loginBtn}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>
                            <Ionicons name="person-add" size={20} color={colors.primary} /> Registrar Equipo
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nombre del Equipo *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Mi Equipo Pro"
                                placeholderTextColor={colors.textMuted}
                                value={teamName}
                                onChangeText={setTeamName}
                                maxLength={30}
                            />
                            <Text style={styles.inputHint}>3-30 caracteres</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Tag del Equipo *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="MEP"
                                placeholderTextColor={colors.textMuted}
                                value={teamTag}
                                onChangeText={(text) => setTeamTag(text.toUpperCase())}
                                maxLength={5}
                                autoCapitalize="characters"
                            />
                            <Text style={styles.inputHint}>2-5 caracteres (ej: NaVi, FaZe)</Text>
                        </View>

                        <View style={styles.infoNote}>
                            <Ionicons name="information-circle" size={16} color={colors.primary} />
                            <Text style={styles.infoNoteText}>
                                Serás el capitán del equipo.
                                {requiresPayment ? ' Después del registro deberás pagar la cuota.' : ''}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.submitBtn}
                            onPress={handleRegister}
                            disabled={submitting}
                        >
                            <LinearGradient
                                colors={['#00d4ff', '#0099cc']}
                                style={styles.gradientBtn}
                            >
                                {submitting ? (
                                    <Text style={styles.gradientBtnText}>Registrando...</Text>
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                                        <Text style={styles.gradientBtnText}>
                                            {requiresPayment ? 'Registrarse y Pagar' : 'Registrarse al Torneo'}
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoItem({ icon, label, value, valueColor }) {
    return (
        <View style={styles.infoItem}>
            <Ionicons name={icon} size={16} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    inviteBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(0,212,255,0.1)',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(0,212,255,0.3)',
        marginBottom: 12,
    },
    inviteBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: 1,
    },
    tournamentName: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 4,
        paddingHorizontal: 20,
    },
    organizer: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    infoCard: {
        marginHorizontal: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 20,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    infoItem: {
        width: '50%',
        flexDirection: 'column',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    prizeSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        alignItems: 'center',
    },
    prizeLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    prizeValue: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.warning,
    },
    feeNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    feeText: {
        fontSize: 14,
        fontWeight: '600',
    },
    formCard: {
        marginHorizontal: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 6,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        padding: 12,
        color: colors.text,
        fontSize: 14,
    },
    inputHint: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 4,
    },
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: 'rgba(0,212,255,0.05)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,212,255,0.2)',
        marginBottom: 20,
    },
    infoNoteText: {
        flex: 1,
        fontSize: 12,
        color: colors.textSecondary,
    },
    submitBtn: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    gradientBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.white,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginTop: 16,
    },
    errorText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    backButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: colors.card,
        borderRadius: 12,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.success,
        marginTop: 16,
    },
    successText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    paymentNotice: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,193,7,0.1)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,193,7,0.3)',
        marginBottom: 24,
    },
    paymentNoticeText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.warning,
        marginTop: 8,
    },
    paymentNoticeSubtext: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    viewTournamentBtn: {
        borderRadius: 12,
        overflow: 'hidden',
        width: '80%',
    },
    fullNotice: {
        alignItems: 'center',
        marginHorizontal: 16,
        padding: 24,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    fullTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.danger,
        marginTop: 12,
    },
    fullText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    loginNotice: {
        alignItems: 'center',
        marginHorizontal: 16,
        padding: 24,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    loginTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginTop: 12,
        marginBottom: 16,
    },
    loginBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: colors.primary,
        borderRadius: 12,
    },
    loginBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.white,
    },
});
