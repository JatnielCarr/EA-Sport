import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_AVATAR = 'https://via.placeholder.com/150/161616/00d4ff?text=User';

// Configuración de planes (igual que FrontedUser)
const PLAN_CONFIG = {
    FREE: { badgeClass: '', badgeLabel: null, icon: 'person' },
    STANDARD: { badgeClass: 'standard', badgeLabel: 'PRO', icon: 'rocket' },
    PREMIUM: { badgeClass: 'premium', badgeLabel: 'LEGEND', icon: 'diamond' }
};

export default function EditProfileScreen({ navigation }) {
    const { userInfo } = useAuth();
    
    const [username, setUsername] = useState(userInfo?.username || '');
    const [email, setEmail] = useState(userInfo?.email || '');
    const [description, setDescription] = useState(userInfo?.description || '');
    const [saving, setSaving] = useState(false);

    const plan = userInfo?.subscription?.plan || 'FREE';
    const planConfig = PLAN_CONFIG[plan] || PLAN_CONFIG.FREE;
    const isPaid = plan !== 'FREE';

    const handleSave = () => {
        if (!username.trim()) {
            Alert.alert('Error', 'El nombre de usuario es requerido');
            return;
        }

        setSaving(true);
        
        // Simular guardado
        setTimeout(() => {
            setSaving(false);
            Alert.alert('Éxito', 'Perfil actualizado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        }, 1000);
    };

    const handleChangeAvatar = () => {
        Alert.alert(
            'Cambiar Foto',
            'Elige una opción',
            [
                { text: 'Cámara', onPress: () => {} },
                { text: 'Galería', onPress: () => {} },
                { text: 'Cancelar', style: 'cancel' }
            ]
        );
    };

    const handleChangeBanner = () => {
        Alert.alert(
            'Cambiar Banner',
            'Elige una opción',
            [
                { text: 'Cámara', onPress: () => {} },
                { text: 'Galería', onPress: () => {} },
                { text: 'Cancelar', style: 'cancel' }
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
                    <Text style={styles.headerTitle}>Editar Perfil</Text>
                    <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <Text style={styles.saveButtonText}>
                            {saving ? 'Guardando...' : 'Guardar'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Banner & Avatar Section - igual que FrontedUser */}
                    <View style={styles.profileHeader}>
                        <TouchableOpacity 
                            style={styles.bannerContainer}
                            onPress={handleChangeBanner}
                        >
                            <LinearGradient
                                colors={isPaid ? ['#f093fb', '#f5576c'] : [colors.card, colors.cardAlt]}
                                style={styles.banner}
                            >
                                <Ionicons name="image" size={32} color={colors.textMuted} />
                                <View style={styles.editBannerButton}>
                                    <Ionicons name="camera" size={16} color={colors.white} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.avatarContainer}
                            onPress={handleChangeAvatar}
                        >
                            <View style={[
                                styles.avatarWrapper,
                                isPaid && styles.avatarWrapperPremium
                            ]}>
                                <Image
                                    source={{ uri: userInfo?.avatar_url || DEFAULT_AVATAR }}
                                    style={styles.avatar}
                                />
                            </View>
                            <View style={styles.editAvatarButton}>
                                <Ionicons name="camera" size={16} color={colors.white} />
                            </View>
                        </TouchableOpacity>

                        {planConfig.badgeLabel && (
                            <View style={styles.planBadge}>
                                <Ionicons name={planConfig.icon} size={12} color={colors.white} />
                                <Text style={styles.planBadgeText}>{planConfig.badgeLabel}</Text>
                            </View>
                        )}
                    </View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        <View style={styles.formGroup}>
                            <View style={styles.inputLabel}>
                                <Ionicons name="person" size={16} color={colors.textSecondary} />
                                <Text style={styles.inputLabelText}>Nombre de usuario</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Tu nombre de usuario"
                                placeholderTextColor={colors.textMuted}
                                value={username}
                                onChangeText={setUsername}
                            />
                            <Text style={styles.inputHint}>
                                Este nombre será visible para otros jugadores
                            </Text>
                        </View>

                        <View style={styles.formGroup}>
                            <View style={styles.inputLabel}>
                                <Ionicons name="mail" size={16} color={colors.textSecondary} />
                                <Text style={styles.inputLabelText}>Correo electrónico</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="tu@email.com"
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <View style={styles.inputLabel}>
                                <Ionicons name="document-text" size={16} color={colors.textSecondary} />
                                <Text style={styles.inputLabelText}>Descripción</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Cuéntanos sobre ti..."
                                placeholderTextColor={colors.textMuted}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                            <Text style={styles.inputHint}>
                                {description.length}/200 caracteres
                            </Text>
                        </View>
                    </View>

                    {/* Info Cards */}
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Información de la cuenta</Text>
                        
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Miembro desde</Text>
                                <Text style={styles.infoValue}>
                                    {new Date(userInfo?.created_at || Date.now()).toLocaleDateString('es-MX', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </View>
                            
                            <View style={styles.infoDivider} />
                            
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Plan actual</Text>
                                <View style={styles.planInfo}>
                                    <Text style={styles.infoValue}>{plan}</Text>
                                    {!isPaid && (
                                        <TouchableOpacity 
                                            onPress={() => navigation.navigate('Subscription')}
                                        >
                                            <Text style={styles.upgradeLink}>Mejorar</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                            
                            <View style={styles.infoDivider} />
                            
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Rol</Text>
                                <Text style={styles.infoValue}>{userInfo?.role || 'PLAYER'}</Text>
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.black,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    bannerContainer: {
        width: '100%',
        height: 140,
    },
    banner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editBannerButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarContainer: {
        marginTop: -50,
        position: 'relative',
    },
    avatarWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: colors.background,
        overflow: 'hidden',
    },
    avatarWrapperPremium: {
        borderColor: '#f093fb',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: colors.background,
    },
    planBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f093fb',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 12,
    },
    planBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.white,
    },
    formSection: {
        paddingHorizontal: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    inputLabelText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    input: {
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: colors.text,
    },
    textArea: {
        height: 100,
        paddingTop: 14,
    },
    inputHint: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 6,
    },
    infoSection: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
    },
    infoCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    infoDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 4,
    },
    planInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    upgradeLink: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: '600',
    },
});
