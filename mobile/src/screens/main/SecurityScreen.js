import React, { useState } from 'react';
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
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function SecurityScreen({ navigation }) {
    const { userInfo } = useAuth();
    
    // Estados para formulario de contraseña
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    
    // Estados para opciones de seguridad
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [loginAlerts, setLoginAlerts] = useState(true);

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

        Alert.alert('Éxito', 'Tu contraseña ha sido cambiada correctamente');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleToggle2FA = (value) => {
        if (value) {
            Alert.alert(
                'Activar 2FA',
                'La autenticación de dos factores añade una capa extra de seguridad a tu cuenta.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Activar', onPress: () => setTwoFactorEnabled(true) }
                ]
            );
        } else {
            setTwoFactorEnabled(false);
        }
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
                        <Text style={styles.headerTitle}>Seguridad</Text>
                        <Text style={styles.headerSubtitle}>Protege tu cuenta</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Change Password Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="key" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>
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

                    {/* Security Options */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Opciones de Seguridad</Text>
                        </View>
                        
                        <View style={styles.card}>
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <View style={styles.settingIconContainer}>
                                        <Ionicons name="phone-portrait" size={20} color={colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.settingLabel}>Autenticación de 2 factores</Text>
                                        <Text style={styles.settingDesc}>Añade una capa extra de seguridad</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={twoFactorEnabled}
                                    onValueChange={handleToggle2FA}
                                    trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                    thumbColor={colors.white}
                                />
                            </View>
                            
                            <View style={styles.divider} />
                            
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(121, 40, 202, 0.15)' }]}>
                                        <Ionicons name="finger-print" size={20} color={colors.secondary} />
                                    </View>
                                    <View>
                                        <Text style={styles.settingLabel}>Inicio de sesión biométrico</Text>
                                        <Text style={styles.settingDesc}>Usa huella o Face ID</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={biometricEnabled}
                                    onValueChange={setBiometricEnabled}
                                    trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                    thumbColor={colors.white}
                                />
                            </View>
                            
                            <View style={styles.divider} />
                            
                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                        <Ionicons name="notifications" size={20} color={colors.warning} />
                                    </View>
                                    <View>
                                        <Text style={styles.settingLabel}>Alertas de inicio de sesión</Text>
                                        <Text style={styles.settingDesc}>Notificaciones de nuevos dispositivos</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={loginAlerts}
                                    onValueChange={setLoginAlerts}
                                    trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                    thumbColor={colors.white}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Active Sessions */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="laptop" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Sesiones Activas</Text>
                        </View>
                        
                        <View style={styles.card}>
                            <View style={styles.sessionRow}>
                                <View style={styles.sessionInfo}>
                                    <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                        <Ionicons name="phone-portrait" size={20} color={colors.success} />
                                    </View>
                                    <View>
                                        <Text style={styles.sessionDevice}>Este dispositivo</Text>
                                        <Text style={styles.sessionDetails}>Activo ahora • México</Text>
                                    </View>
                                </View>
                                <View style={styles.currentBadge}>
                                    <Text style={styles.currentBadgeText}>Actual</Text>
                                </View>
                            </View>
                        </View>
                        
                        <TouchableOpacity style={styles.logoutAllButton}>
                            <Ionicons name="log-out" size={18} color={colors.error} />
                            <Text style={styles.logoutAllText}>Cerrar todas las demás sesiones</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Danger Zone */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="warning" size={20} color={colors.error} />
                            <Text style={[styles.sectionTitle, { color: colors.error }]}>Zona de Peligro</Text>
                        </View>
                        
                        <View style={[styles.card, styles.dangerCard]}>
                            <View style={styles.dangerRow}>
                                <View>
                                    <Text style={styles.settingLabel}>Eliminar cuenta</Text>
                                    <Text style={styles.settingDesc}>Esta acción es permanente</Text>
                                </View>
                                <TouchableOpacity style={styles.dangerButton}>
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
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 212, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.text,
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
    sessionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sessionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sessionDevice: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.text,
    },
    sessionDetails: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 2,
    },
    currentBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    currentBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.success,
    },
    logoutAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: colors.error,
        borderRadius: 12,
    },
    logoutAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.error,
    },
    dangerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
