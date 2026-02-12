import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen({ navigation }) {
    const { userInfo, logout } = useAuth();

    // Estados para formulario de contraseña
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Estados para notificaciones (igual que FrontedUser)
    const [matchReminders, setMatchReminders] = useState(true);
    const [tournamentUpdates, setTournamentUpdates] = useState(true);
    const [teamInvites, setTeamInvites] = useState(true);

    // Cargar preferencias guardadas
    useEffect(() => {
        loadNotificationPrefs();
    }, []);

    const loadNotificationPrefs = async () => {
        try {
            const prefs = await AsyncStorage.getItem('notification_prefs');
            if (prefs) {
                const parsed = JSON.parse(prefs);
                setMatchReminders(parsed.matchReminders ?? true);
                setTournamentUpdates(parsed.tournamentUpdates ?? true);
                setTeamInvites(parsed.teamInvites ?? true);
            }
        } catch (error) {
            console.warn('Error loading preferences:', error);
        }
    };

    const saveNotificationPrefs = async (key, value) => {
        try {
            const prefs = {
                matchReminders,
                tournamentUpdates,
                teamInvites,
                [key]: value
            };
            await AsyncStorage.setItem('notification_prefs', JSON.stringify(prefs));
        } catch (error) {
            console.warn('Error saving preferences:', error);
        }
    };

    const handleToggle = (key, value, setter) => {
        setter(value);
        saveNotificationPrefs(key, value);
    };

    const handleChangePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        // Aquí iría la llamada a la API
        Alert.alert('Éxito', 'Tu contraseña ha sido cambiada');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: () => logout()
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Eliminar Cuenta',
            'Esta acción es permanente y no se puede deshacer. ¿Estás seguro?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto')
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Configuración</Text>
                        <Text style={styles.headerSubtitle}>Administra tu cuenta</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Account Section - igual que FrontedUser */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person-circle" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Cuenta</Text>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Nombre de usuario</Text>
                                    <Text style={styles.settingValue}>{userInfo?.username || 'Usuario'}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => navigation.navigate('EditProfile')}
                                >
                                    <Text style={styles.editButtonText}>Editar</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Correo electrónico</Text>
                                    <Text style={styles.settingValue}>{userInfo?.email || 'email@ejemplo.com'}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() => navigation.navigate('EditProfile')}
                                >
                                    <Text style={styles.editButtonText}>Editar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Security Section - igual que FrontedUser */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="shield" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Seguridad</Text>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.formGroup}>
                                <View style={styles.inputLabel}>
                                    <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                                    <Text style={styles.inputLabelText}>Contraseña actual</Text>
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ingresa tu contraseña actual"
                                        placeholderTextColor={colors.textMuted}
                                        secureTextEntry={!showCurrentPassword}
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                        style={styles.eyeButton}
                                    >
                                        <Ionicons
                                            name={showCurrentPassword ? 'eye-off' : 'eye'}
                                            size={20}
                                            color={colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <View style={styles.inputLabel}>
                                    <Ionicons name="key" size={16} color={colors.textSecondary} />
                                    <Text style={styles.inputLabelText}>Nueva contraseña</Text>
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Mínimo 6 caracteres"
                                        placeholderTextColor={colors.textMuted}
                                        secureTextEntry={!showNewPassword}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowNewPassword(!showNewPassword)}
                                        style={styles.eyeButton}
                                    >
                                        <Ionicons
                                            name={showNewPassword ? 'eye-off' : 'eye'}
                                            size={20}
                                            color={colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <View style={styles.inputLabel}>
                                    <Ionicons name="checkmark-circle" size={16} color={colors.textSecondary} />
                                    <Text style={styles.inputLabelText}>Confirmar contraseña</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, styles.inputFull]}
                                    placeholder="Repite la nueva contraseña"
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleChangePassword}
                            >
                                <Ionicons name="save" size={18} color={colors.black} />
                                <Text style={styles.primaryButtonText}>Cambiar Contraseña</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Notifications Section - igual que FrontedUser */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="notifications" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Notificaciones</Text>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Recordatorios de partidas</Text>
                                    <Text style={styles.settingDesc}>Recibe alertas antes de tus partidas</Text>
                                </View>
                                <Switch
                                    value={matchReminders}
                                    onValueChange={(value) => handleToggle('matchReminders', value, setMatchReminders)}
                                    trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                    thumbColor={colors.white}
                                />
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Actualizaciones de torneos</Text>
                                    <Text style={styles.settingDesc}>Novedades sobre torneos en los que participas</Text>
                                </View>
                                <Switch
                                    value={tournamentUpdates}
                                    onValueChange={(value) => handleToggle('tournamentUpdates', value, setTournamentUpdates)}
                                    trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                    thumbColor={colors.white}
                                />
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Invitaciones de equipo</Text>
                                    <Text style={styles.settingDesc}>Cuando te inviten a un equipo</Text>
                                </View>
                                <Switch
                                    value={teamInvites}
                                    onValueChange={(value) => handleToggle('teamInvites', value, setTeamInvites)}
                                    trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                    thumbColor={colors.white}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Legal Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Legal</Text>
                        </View>

                        <View style={styles.card}>
                            <TouchableOpacity
                                style={styles.settingRow}
                                onPress={() => navigation.navigate('Legal', { type: 'terms' })}
                            >
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Términos de Servicio</Text>
                                    <Text style={styles.settingDesc}>Lee nuestros términos y condiciones</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.settingRow}
                                onPress={() => navigation.navigate('Legal', { type: 'privacy' })}
                            >
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Política de Privacidad</Text>
                                    <Text style={styles.settingDesc}>Cómo protegemos tus datos</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.settingRow}
                                onPress={() => navigation.navigate('Legal', { type: 'rules' })}
                            >
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Reglas Generales</Text>
                                    <Text style={styles.settingDesc}>Reglas de torneos y competencias</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Danger Zone - igual que FrontedUser */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="warning" size={20} color={colors.error} />
                            <Text style={[styles.sectionTitle, { color: colors.error }]}>Zona de Peligro</Text>
                        </View>

                        <View style={[styles.card, styles.dangerCard]}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Cerrar sesión</Text>
                                    <Text style={styles.settingDesc}>Salir de tu cuenta en este dispositivo</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.outlineButton}
                                    onPress={handleLogout}
                                >
                                    <Ionicons name="log-out" size={16} color={colors.text} />
                                    <Text style={styles.outlineButtonText}>Salir</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Eliminar cuenta</Text>
                                    <Text style={styles.settingDesc}>Esto eliminará permanentemente tu cuenta</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.dangerButton}
                                    onPress={handleDeleteAccount}
                                >
                                    <Ionicons name="trash" size={16} color={colors.error} />
                                    <Text style={styles.dangerButtonText}>Eliminar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dangerCard: {
        borderColor: 'rgba(255, 51, 102, 0.3)',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    settingInfo: {
        flex: 1,
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.text,
    },
    settingValue: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    settingDesc: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 8,
    },
    editButton: {
        backgroundColor: colors.cardAlt,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    editButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    formGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    inputLabelText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardAlt,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    input: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    inputFull: {
        backgroundColor: colors.cardAlt,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    eyeButton: {
        padding: 12,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.black,
    },
    outlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    outlineButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    dangerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.error,
    },
    dangerButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.error,
    },
});
