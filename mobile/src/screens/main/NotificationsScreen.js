import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme/colors';

export default function NotificationsScreen({ navigation }) {
    // Estados para notificaciones (igual que FrontedUser settings)
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    
    // Alertas de actividad
    const [matchReminders, setMatchReminders] = useState(true);
    const [tournamentUpdates, setTournamentUpdates] = useState(true);
    const [teamInvites, setTeamInvites] = useState(true);
    const [clanActivity, setClanActivity] = useState(true);
    
    // Marketing
    const [promotions, setPromotions] = useState(false);
    const [newsletter, setNewsletter] = useState(false);
    
    // Preferencias
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);

    // Cargar preferencias guardadas
    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const prefs = await AsyncStorage.getItem('notification_prefs');
            if (prefs) {
                const parsed = JSON.parse(prefs);
                setPushEnabled(parsed.pushEnabled ?? true);
                setEmailEnabled(parsed.emailEnabled ?? true);
                setMatchReminders(parsed.matchReminders ?? true);
                setTournamentUpdates(parsed.tournamentUpdates ?? true);
                setTeamInvites(parsed.teamInvites ?? true);
                setClanActivity(parsed.clanActivity ?? true);
                setPromotions(parsed.promotions ?? false);
                setNewsletter(parsed.newsletter ?? false);
                setSoundEnabled(parsed.soundEnabled ?? true);
                setVibrationEnabled(parsed.vibrationEnabled ?? true);
            }
        } catch (error) {
            console.warn('Error loading preferences:', error);
        }
    };

    const savePreferences = async (updates) => {
        try {
            const current = {
                pushEnabled,
                emailEnabled,
                matchReminders,
                tournamentUpdates,
                teamInvites,
                clanActivity,
                promotions,
                newsletter,
                soundEnabled,
                vibrationEnabled,
                ...updates
            };
            await AsyncStorage.setItem('notification_prefs', JSON.stringify(current));
        } catch (error) {
            console.warn('Error saving preferences:', error);
        }
    };

    const handleToggle = (key, value, setter) => {
        setter(value);
        savePreferences({ [key]: value });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Notificaciones</Text>
                    <Text style={styles.headerSubtitle}>Gestiona tus alertas</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* General */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="notifications" size={20} color={colors.primary} />
                        <Text style={styles.sectionTitle}>General</Text>
                    </View>
                    
                    <View style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={styles.settingIconContainer}>
                                    <Ionicons name="phone-portrait" size={20} color={colors.primary} />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingLabel}>Notificaciones push</Text>
                                    <Text style={styles.settingDesc}>Alertas en tu dispositivo</Text>
                                </View>
                            </View>
                            <Switch
                                value={pushEnabled}
                                onValueChange={(value) => handleToggle('pushEnabled', value, setPushEnabled)}
                                trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                thumbColor={colors.white}
                            />
                        </View>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(121, 40, 202, 0.15)' }]}>
                                    <Ionicons name="mail" size={20} color={colors.secondary} />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingLabel}>Notificaciones por email</Text>
                                    <Text style={styles.settingDesc}>Recibe alertas en tu correo</Text>
                                </View>
                            </View>
                            <Switch
                                value={emailEnabled}
                                onValueChange={(value) => handleToggle('emailEnabled', value, setEmailEnabled)}
                                trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                thumbColor={colors.white}
                            />
                        </View>
                    </View>
                </View>

                {/* Actividad */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="pulse" size={20} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Actividad</Text>
                    </View>
                    
                    <View style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                    <Ionicons name="time" size={20} color={colors.warning} />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingLabel}>Recordatorios de partidas</Text>
                                    <Text style={styles.settingDesc}>Alertas antes de tus partidas</Text>
                                </View>
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
                                <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                    <Ionicons name="trophy" size={20} color={colors.success} />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingLabel}>Actualizaciones de torneos</Text>
                                    <Text style={styles.settingDesc}>Novedades sobre tus torneos</Text>
                                </View>
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
                                <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                    <Ionicons name="people" size={20} color={colors.error} />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingLabel}>Invitaciones de equipo</Text>
                                    <Text style={styles.settingDesc}>Cuando te inviten a un equipo</Text>
                                </View>
                            </View>
                            <Switch
                                value={teamInvites}
                                onValueChange={(value) => handleToggle('teamInvites', value, setTeamInvites)}
                                trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                thumbColor={colors.white}
                            />
                        </View>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(0, 212, 255, 0.15)' }]}>
                                    <Ionicons name="shield" size={20} color={colors.primary} />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingLabel}>Actividad del clan</Text>
                                    <Text style={styles.settingDesc}>Mensajes y actualizaciones</Text>
                                </View>
                            </View>
                            <Switch
                                value={clanActivity}
                                onValueChange={(value) => handleToggle('clanActivity', value, setClanActivity)}
                                trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                thumbColor={colors.white}
                            />
                        </View>
                    </View>
                </View>

                {/* Marketing */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="megaphone" size={20} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Marketing</Text>
                    </View>
                    
                    <View style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(240, 147, 251, 0.15)' }]}>
                                    <Ionicons name="pricetag" size={20} color="#f093fb" />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingLabel}>Promociones</Text>
                                    <Text style={styles.settingDesc}>Ofertas y descuentos especiales</Text>
                                </View>
                            </View>
                            <Switch
                                value={promotions}
                                onValueChange={(value) => handleToggle('promotions', value, setPromotions)}
                                trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                thumbColor={colors.white}
                            />
                        </View>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                    <Ionicons name="newspaper" size={20} color="#3b82f6" />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingLabel}>Newsletter</Text>
                                    <Text style={styles.settingDesc}>Noticias y novedades semanales</Text>
                                </View>
                            </View>
                            <Switch
                                value={newsletter}
                                onValueChange={(value) => handleToggle('newsletter', value, setNewsletter)}
                                trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                thumbColor={colors.white}
                            />
                        </View>
                    </View>
                </View>

                {/* Preferencias */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="settings" size={20} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Preferencias</Text>
                    </View>
                    
                    <View style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                    <Ionicons name="volume-high" size={20} color={colors.warning} />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingLabel}>Sonido</Text>
                                    <Text style={styles.settingDesc}>Reproducir sonido con notificaciones</Text>
                                </View>
                            </View>
                            <Switch
                                value={soundEnabled}
                                onValueChange={(value) => handleToggle('soundEnabled', value, setSoundEnabled)}
                                trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                thumbColor={colors.white}
                            />
                        </View>
                        
                        <View style={styles.divider} />
                        
                        <View style={styles.settingRow}>
                            <View style={styles.settingInfo}>
                                <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(121, 40, 202, 0.15)' }]}>
                                    <Ionicons name="phone-portrait" size={20} color={colors.secondary} />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingLabel}>Vibración</Text>
                                    <Text style={styles.settingDesc}>Vibrar con notificaciones</Text>
                                </View>
                            </View>
                            <Switch
                                value={vibrationEnabled}
                                onValueChange={(value) => handleToggle('vibrationEnabled', value, setVibrationEnabled)}
                                trackColor={{ false: colors.cardAlt, true: colors.primary }}
                                thumbColor={colors.white}
                            />
                        </View>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
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
    settingTextContainer: {
        flex: 1,
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
});
