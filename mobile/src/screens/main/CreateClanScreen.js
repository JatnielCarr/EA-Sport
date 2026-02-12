import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Input from '../../components/common/Input';
import { Button } from '../../components/common';

const ACCESS_TYPES = [
    { value: 'OPEN', label: 'Abierto', icon: 'lock-open-outline', desc: 'Cualquiera puede unirse', color: colors.success },
    { value: 'INVITE_ONLY', label: 'Invitación', icon: 'mail-outline', desc: 'Requiere solicitud', color: colors.warning },
    { value: 'CLOSED', label: 'Cerrado', icon: 'lock-closed-outline', desc: 'No acepta nuevos miembros', color: colors.error },
];

export default function CreateClanScreen({ navigation }) {
    const { userInfo } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [tag, setTag] = useState('');
    const [description, setDescription] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [location, setLocation] = useState('');
    const [accessType, setAccessType] = useState('OPEN');
    const [maxMembers, setMaxMembers] = useState('50');
    const [requirements, setRequirements] = useState('');

    // Validation errors
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = 'El nombre es obligatorio';
        } else if (name.trim().length < 3) {
            newErrors.name = 'Mínimo 3 caracteres';
        } else if (name.trim().length > 50) {
            newErrors.name = 'Máximo 50 caracteres';
        }

        if (!tag.trim()) {
            newErrors.tag = 'El tag es obligatorio';
        } else if (tag.trim().length < 2) {
            newErrors.tag = 'Mínimo 2 caracteres';
        } else if (tag.trim().length > 5) {
            newErrors.tag = 'Máximo 5 caracteres';
        }

        const members = parseInt(maxMembers);
        if (isNaN(members) || members < 5 || members > 100) {
            newErrors.maxMembers = 'Entre 5 y 100 miembros';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);

        const data = {
            name: name.trim(),
            tag: tag.trim().toUpperCase(),
            description: description.trim() || null,
            banner_url: bannerUrl.trim() || null,
            location: location.trim() || null,
            access_type: accessType,
            requirements: requirements.trim() || null,
            max_members: parseInt(maxMembers) || 50,
            leader_id: userInfo?.id,
        };

        try {
            const response = await api.post('/clans', data);
            Alert.alert(
                '¡Clan Creado!',
                `Tu clan "${data.name}" [${data.tag}] ha sido creado exitosamente.`,
                [
                    {
                        text: 'Ver Clanes',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            Alert.alert(
                'Error',
                error?.message || 'No se pudo crear el clan. Inténtalo de nuevo.'
            );
        } finally {
            setLoading(false);
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
                    <Text style={styles.headerTitle}>Crear Clan</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Hero */}
                    <LinearGradient
                        colors={['rgba(121, 40, 202, 0.2)', 'transparent']}
                        style={styles.hero}
                    >
                        <View style={styles.heroIconContainer}>
                            <LinearGradient
                                colors={gradients.primary}
                                style={styles.heroIcon}
                            >
                                <Ionicons name="shield-checkmark" size={32} color={colors.black} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.heroTitle}>Crea tu Clan</Text>
                        <Text style={styles.heroSubtitle}>
                            Lidera a tu equipo hacia la victoria en torneos competitivos
                        </Text>
                    </LinearGradient>

                    {/* Section: Basic Info */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="information-circle" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Información Básica</Text>
                        </View>

                        <Input
                            label="Nombre del Clan *"
                            value={name}
                            onChangeText={setName}
                            placeholder="Ej: Los Guerreros Supremos"
                            icon="shield-outline"
                            maxLength={50}
                            autoCapitalize="words"
                            error={errors.name}
                        />

                        <Input
                            label="Tag (Abreviación) *"
                            value={tag}
                            onChangeText={(t) => setTag(t.toUpperCase())}
                            placeholder="Ej: GS"
                            icon="pricetag-outline"
                            maxLength={5}
                            autoCapitalize="characters"
                            error={errors.tag}
                        />

                        <Input
                            label="Descripción"
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Describe tu clan, su historia, objetivos..."
                            icon="document-text-outline"
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {/* Section: Appearance */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="image" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Apariencia</Text>
                        </View>

                        <Input
                            label="URL del Banner"
                            value={bannerUrl}
                            onChangeText={setBannerUrl}
                            placeholder="https://ejemplo.com/banner.jpg"
                            icon="link-outline"
                            keyboardType="url"
                        />

                        {bannerUrl ? (
                            <View style={styles.bannerPreview}>
                                <Text style={styles.bannerPreviewText}>
                                    <Ionicons name="checkmark-circle" size={14} color={colors.success} /> Banner URL configurado
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Section: Access Type */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="settings" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Configuración</Text>
                        </View>

                        <Text style={styles.fieldLabel}>Tipo de Acceso *</Text>
                        <View style={styles.accessTypeContainer}>
                            {ACCESS_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.accessTypeCard,
                                        accessType === type.value && styles.accessTypeCardActive,
                                        accessType === type.value && { borderColor: type.color },
                                    ]}
                                    onPress={() => setAccessType(type.value)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.accessTypeIconContainer,
                                        { backgroundColor: `${type.color}20` },
                                    ]}>
                                        <Ionicons name={type.icon} size={22} color={type.color} />
                                    </View>
                                    <Text style={[
                                        styles.accessTypeLabel,
                                        accessType === type.value && { color: type.color },
                                    ]}>
                                        {type.label}
                                    </Text>
                                    <Text style={styles.accessTypeDesc}>{type.desc}</Text>
                                    {accessType === type.value && (
                                        <View style={[styles.accessTypeCheck, { backgroundColor: type.color }]}>
                                            <Ionicons name="checkmark" size={14} color={colors.white} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Input
                            label="Máximo de Miembros"
                            value={maxMembers}
                            onChangeText={setMaxMembers}
                            placeholder="50"
                            icon="people-outline"
                            keyboardType="numeric"
                            maxLength={3}
                            error={errors.maxMembers}
                        />

                        <Input
                            label="Región / Ubicación"
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Ej: México, Latinoamérica, Global..."
                            icon="location-outline"
                            autoCapitalize="words"
                        />

                        <Input
                            label="Requisitos para Unirse"
                            value={requirements}
                            onChangeText={setRequirements}
                            placeholder="Ej: Nivel mínimo, disponibilidad horaria..."
                            icon="list-outline"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Preview Card */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="eye" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Vista Previa</Text>
                        </View>
                        <View style={styles.previewCard}>
                            <LinearGradient
                                colors={gradients.primary}
                                style={styles.previewBanner}
                            >
                                <Ionicons name="shield" size={32} color={colors.white} />
                            </LinearGradient>
                            <View style={styles.previewContent}>
                                <Text style={styles.previewName}>
                                    {name || 'Nombre del Clan'}
                                    {tag ? ` [${tag.toUpperCase()}]` : ''}
                                </Text>
                                <Text style={styles.previewDesc} numberOfLines={2}>
                                    {description || 'Sin descripción'}
                                </Text>
                                <View style={styles.previewMeta}>
                                    <View style={styles.previewMetaItem}>
                                        <Ionicons name="people" size={12} color={colors.textSecondary} />
                                        <Text style={styles.previewMetaText}>0/{maxMembers || '50'}</Text>
                                    </View>
                                    <View style={styles.previewMetaItem}>
                                        <Ionicons name={ACCESS_TYPES.find(t => t.value === accessType)?.icon || 'shield'} size={12} color={colors.textSecondary} />
                                        <Text style={styles.previewMetaText}>
                                            {ACCESS_TYPES.find(t => t.value === accessType)?.label}
                                        </Text>
                                    </View>
                                    {location ? (
                                        <View style={styles.previewMetaItem}>
                                            <Ionicons name="location" size={12} color={colors.textSecondary} />
                                            <Text style={styles.previewMetaText}>{location}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Submit */}
                    <View style={styles.submitSection}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={loading ? [colors.textMuted, colors.textMuted] : gradients.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitButtonGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color={colors.black} />
                                ) : (
                                    <Ionicons name="checkmark-circle" size={22} color={colors.black} />
                                )}
                                <Text style={styles.submitButtonText}>
                                    {loading ? 'Creando...' : 'Crear Clan'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
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
    scrollContent: {
        paddingBottom: 20,
    },
    hero: {
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 20,
    },
    heroIconContainer: {
        marginBottom: 16,
    },
    heroIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
    },
    fieldLabel: {
        color: colors.text,
        marginBottom: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    accessTypeContainer: {
        gap: 10,
        marginBottom: 16,
    },
    accessTypeCard: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    accessTypeCardActive: {
        backgroundColor: colors.backgroundLight,
    },
    accessTypeIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    accessTypeLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        marginRight: 8,
    },
    accessTypeDesc: {
        fontSize: 12,
        color: colors.textSecondary,
        flex: 1,
    },
    accessTypeCheck: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerPreview: {
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    bannerPreviewText: {
        color: colors.success,
        fontSize: 13,
        fontWeight: '500',
    },
    previewCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    previewBanner: {
        height: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewContent: {
        padding: 14,
    },
    previewName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    previewDesc: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 10,
    },
    previewMeta: {
        flexDirection: 'row',
        gap: 14,
    },
    previewMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    previewMetaText: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    submitSection: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
    submitButton: {
        flex: 2,
        borderRadius: 14,
        overflow: 'hidden',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    submitButtonText: {
        color: colors.black,
        fontSize: 16,
        fontWeight: '700',
    },
});
