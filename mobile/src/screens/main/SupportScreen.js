import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Linking,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../../theme/colors';

// FAQ items (igual que FrontedUser)
const FAQ_ITEMS = [
    {
        question: '¿Cómo puedo registrarme en un torneo?',
        answer: 'Para registrarte: 1) Crea una cuenta o inicia sesión. 2) Navega a la sección de Torneos. 3) Selecciona el torneo de tu interés. 4) Crea un equipo o únete a uno existente. 5) Confirma tu inscripción.',
    },
    {
        question: '¿Cuántos jugadores necesito para un equipo?',
        answer: 'El número de jugadores depende del juego. FIFA/FC: 1 jugador (1v1). Call of Duty: 4-6 jugadores. Valorant/CS2: 5 jugadores. Revisa los requisitos específicos en cada torneo.',
    },
    {
        question: '¿Cómo funcionan los brackets de eliminación?',
        answer: 'Utilizamos varios formatos: Eliminación Simple (una derrota y sales), Eliminación Doble (segunda oportunidad), Round Robin (todos contra todos), y Sistema Suizo (emparejamiento por rendimiento).',
    },
    {
        question: '¿Cómo se reportan los resultados?',
        answer: 'El capitán del equipo ganador reporta el resultado, sube una captura de pantalla como evidencia, el equipo contrario confirma, y los administradores validan si es necesario.',
    },
    {
        question: '¿Hay premios en los torneos?',
        answer: 'Sí, muchos torneos incluyen premios como dinero en efectivo, gift cards, merchandise exclusivo y puntos de ranking. El pool de premios se muestra en cada torneo.',
    },
    {
        question: '¿Qué pasa si no puedo jugar mi partida?',
        answer: 'Contacta a los organizadores con anticipación, intenta acordar un nuevo horario con tu oponente. Si no te presentas, podrías recibir una derrota por default.',
    },
];

// Contact options
const CONTACT_OPTIONS = [
    { 
        id: 'chat', 
        title: 'Chat en vivo', 
        desc: 'Respuesta inmediata', 
        icon: 'chatbubbles',
        color: colors.primary,
        bgColor: 'rgba(0, 212, 255, 0.15)'
    },
    { 
        id: 'email', 
        title: 'Email', 
        desc: 'soporte@apextournament.com', 
        icon: 'mail',
        color: colors.secondary,
        bgColor: 'rgba(121, 40, 202, 0.15)'
    },
    { 
        id: 'discord', 
        title: 'Discord', 
        desc: 'Comunidad activa', 
        icon: 'logo-discord',
        color: '#5865F2',
        bgColor: 'rgba(88, 101, 242, 0.15)'
    },
];

// Help topics
const HELP_TOPICS = [
    { id: 'tournaments', title: 'Torneos', icon: 'trophy', color: colors.warning },
    { id: 'account', title: 'Cuenta', icon: 'person', color: colors.primary },
    { id: 'payments', title: 'Pagos', icon: 'card', color: colors.success },
    { id: 'teams', title: 'Equipos', icon: 'people', color: colors.secondary },
    { id: 'rules', title: 'Reglas', icon: 'document-text', color: colors.error },
    { id: 'technical', title: 'Técnico', icon: 'construct', color: '#f093fb' },
];

export default function SupportScreen({ navigation }) {
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactSubject, setContactSubject] = useState('');
    const [contactMessage, setContactMessage] = useState('');

    const handleContact = (type) => {
        switch (type) {
            case 'chat':
                Alert.alert('Chat en vivo', 'El chat en vivo estará disponible pronto.');
                break;
            case 'email':
                Linking.openURL('mailto:soporte@apextournament.com');
                break;
            case 'discord':
                Alert.alert('Discord', 'Se abrirá el enlace de Discord.');
                break;
        }
    };

    const handleSendMessage = () => {
        if (!contactName || !contactEmail || !contactMessage) {
            Alert.alert('Error', 'Por favor completa todos los campos requeridos');
            return;
        }

        Alert.alert('¡Mensaje enviado!', 'Te responderemos lo antes posible.');
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
    };

    const handleLegalLink = (type) => {
        switch (type) {
            case 'terms':
                Alert.alert('Términos y Condiciones', 'Se abrirá la página de términos.');
                break;
            case 'privacy':
                Alert.alert('Política de Privacidad', 'Se abrirá la página de privacidad.');
                break;
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
                        <Text style={styles.headerTitle}>Soporte</Text>
                        <Text style={styles.headerSubtitle}>¿Cómo podemos ayudarte?</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Contact Options */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contactar Soporte</Text>
                        
                        <View style={styles.contactOptions}>
                            {CONTACT_OPTIONS.map((option) => (
                                <TouchableOpacity 
                                    key={option.id}
                                    style={styles.contactCard}
                                    onPress={() => handleContact(option.id)}
                                >
                                    <View style={[styles.contactIcon, { backgroundColor: option.bgColor }]}>
                                        <Ionicons name={option.icon} size={24} color={option.color} />
                                    </View>
                                    <Text style={styles.contactTitle}>{option.title}</Text>
                                    <Text style={styles.contactDesc}>{option.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Help Topics */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Temas de Ayuda</Text>
                        
                        <View style={styles.topicsGrid}>
                            {HELP_TOPICS.map((topic) => (
                                <TouchableOpacity 
                                    key={topic.id}
                                    style={styles.topicCard}
                                >
                                    <View style={[styles.topicIcon, { backgroundColor: `${topic.color}15` }]}>
                                        <Ionicons name={topic.icon} size={22} color={topic.color} />
                                    </View>
                                    <Text style={styles.topicTitle}>{topic.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* FAQ Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="help-circle" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
                        </View>
                        
                        {FAQ_ITEMS.map((faq, index) => (
                            <TouchableOpacity 
                                key={index}
                                style={styles.faqItem}
                                onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.faqQuestion}>
                                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                                    <Ionicons 
                                        name={expandedFaq === index ? 'chevron-up' : 'chevron-down'} 
                                        size={20} 
                                        color={colors.textSecondary} 
                                    />
                                </View>
                                {expandedFaq === index && (
                                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Contact Form */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="mail" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Enviar Mensaje</Text>
                        </View>
                        
                        <View style={styles.formCard}>
                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Nombre *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tu nombre"
                                    placeholderTextColor={colors.textMuted}
                                    value={contactName}
                                    onChangeText={setContactName}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Email *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="tu@email.com"
                                    placeholderTextColor={colors.textMuted}
                                    value={contactEmail}
                                    onChangeText={setContactEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Asunto</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="¿En qué podemos ayudarte?"
                                    placeholderTextColor={colors.textMuted}
                                    value={contactSubject}
                                    onChangeText={setContactSubject}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Mensaje *</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Escribe tu mensaje aquí..."
                                    placeholderTextColor={colors.textMuted}
                                    value={contactMessage}
                                    onChangeText={setContactMessage}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>

                            <TouchableOpacity 
                                style={styles.sendButton}
                                onPress={handleSendMessage}
                            >
                                <LinearGradient
                                    colors={gradients.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.sendButtonGradient}
                                >
                                    <Ionicons name="send" size={18} color={colors.black} />
                                    <Text style={styles.sendButtonText}>Enviar Mensaje</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Legal Links */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Legal</Text>
                        
                        <View style={styles.legalCard}>
                            <TouchableOpacity 
                                style={styles.legalRow}
                                onPress={() => handleLegalLink('terms')}
                            >
                                <Ionicons name="document-text" size={20} color={colors.textSecondary} />
                                <Text style={styles.legalText}>Términos y Condiciones</Text>
                                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                            
                            <View style={styles.legalDivider} />
                            
                            <TouchableOpacity 
                                style={styles.legalRow}
                                onPress={() => handleLegalLink('privacy')}
                            >
                                <Ionicons name="shield-checkmark" size={20} color={colors.textSecondary} />
                                <Text style={styles.legalText}>Política de Privacidad</Text>
                                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* App Info */}
                    <View style={styles.appInfo}>
                        <Text style={styles.appName}>ApexTournament</Text>
                        <Text style={styles.appVersion}>Versión 1.0.0</Text>
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
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    contactOptions: {
        flexDirection: 'row',
        gap: 12,
    },
    contactCard: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    contactTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    contactDesc: {
        fontSize: 11,
        color: colors.textMuted,
        textAlign: 'center',
    },
    topicsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    topicCard: {
        width: '30%',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    topicIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    topicTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
    },
    faqItem: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    faqQuestion: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginRight: 12,
    },
    faqAnswer: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 12,
        lineHeight: 20,
    },
    formCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    formGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.cardAlt,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },
    sendButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    sendButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    sendButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.black,
    },
    legalCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    legalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    legalText: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
    },
    legalDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: 48,
    },
    appInfo: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    appName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    appVersion: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 4,
    },
});
