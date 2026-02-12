import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../../theme/colors';

// =============================================
// Legal content data
// =============================================

const LEGAL_PAGES = {
    terms: {
        title: 'Términos de Servicio',
        icon: 'document-text',
        updated: 'Enero 2026',
        sections: [
            {
                title: '1. Aceptación de los Términos',
                content: 'Al acceder o utilizar ApexTournament, aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no podrás utilizar nuestros servicios.',
            },
            {
                title: '2. Descripción del Servicio',
                content: 'ApexTournament es una plataforma de organización y gestión de torneos de esports que permite a los usuarios:',
                items: [
                    'Participar en torneos de videojuegos',
                    'Formar y gestionar equipos',
                    'Competir contra otros jugadores',
                    'Seguir estadísticas y rankings',
                ],
            },
            {
                title: '3. Requisitos de la Cuenta',
                items: [
                    'Debes tener al menos 16 años de edad',
                    'Debes proporcionar información precisa y actualizada',
                    'Eres responsable de mantener la confidencialidad de tu cuenta',
                    'Una persona solo puede tener una cuenta',
                ],
            },
            {
                title: '4. Conducta del Usuario',
                content: 'Te comprometes a NO:',
                items: [
                    'Violar las reglas de los torneos',
                    'Usar software no autorizado (hacks, cheats, bots)',
                    'Acosar, intimidar o discriminar a otros usuarios',
                    'Publicar contenido ofensivo, ilegal o inapropiado',
                    'Intentar acceder a cuentas de otros usuarios',
                    'Manipular resultados o participar en amaños',
                ],
            },
            {
                title: '5. Torneos y Competencias',
                items: [
                    'Cada torneo tiene sus propias reglas específicas',
                    'Las decisiones de los organizadores son finales',
                    'Los premios están sujetos a verificación',
                    'Nos reservamos el derecho de descalificar a participantes',
                ],
            },
            {
                title: '6. Propiedad Intelectual',
                content: 'Todo el contenido de ApexTournament, incluyendo diseño, código, logos y marca, es propiedad de ApexTournament o sus licenciantes. No puedes copiar, modificar o distribuir nuestro contenido sin autorización.',
            },
            {
                title: '7. Limitación de Responsabilidad',
                content: 'ApexTournament se proporciona "tal cual". No garantizamos:',
                items: [
                    'Disponibilidad ininterrumpida del servicio',
                    'Ausencia de errores o bugs',
                    'Resultados específicos de participación',
                ],
            },
            {
                title: '8. Terminación',
                content: 'Podemos suspender o terminar tu cuenta si:',
                items: [
                    'Violas estos términos',
                    'Participas en actividades fraudulentas',
                    'Tu conducta afecta negativamente a otros usuarios',
                ],
            },
            {
                title: '9. Modificaciones',
                content: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor al publicarse en la plataforma.',
            },
            {
                title: '10. Ley Aplicable',
                content: 'Estos términos se rigen por las leyes de México. Cualquier disputa será resuelta en los tribunales de la Ciudad de México.',
            },
        ],
    },
    privacy: {
        title: 'Política de Privacidad',
        icon: 'shield-checkmark',
        updated: 'Enero 2026',
        sections: [
            {
                title: '1. Información que Recopilamos',
                content: 'Recopilamos información que nos proporcionas directamente:',
                items: [
                    'Datos de cuenta: nombre de usuario, correo electrónico, contraseña',
                    'Perfil: avatar, biografía, cuentas de juego vinculadas',
                    'Participación: equipos, torneos, partidas, resultados',
                    'Comunicaciones: mensajes de soporte, reportes',
                ],
            },
            {
                title: '2. Uso de la Información',
                content: 'Utilizamos tu información para:',
                items: [
                    'Proporcionar y mejorar nuestros servicios',
                    'Gestionar torneos y partidas',
                    'Enviar notificaciones sobre tus actividades',
                    'Prevenir fraude y mantener la seguridad',
                    'Comunicar actualizaciones importantes',
                ],
            },
            {
                title: '3. Compartir Información',
                content: 'No vendemos tu información personal. Podemos compartirla con:',
                items: [
                    'Otros usuarios (nombre de usuario, estadísticas públicas)',
                    'Organizadores de torneos (participantes de sus torneos)',
                    'Proveedores de servicios que nos ayudan a operar',
                    'Autoridades cuando sea requerido por ley',
                ],
            },
            {
                title: '4. Seguridad',
                content: 'Implementamos medidas de seguridad para proteger tus datos:',
                items: [
                    'Encriptación de contraseñas con bcrypt',
                    'Conexiones seguras (HTTPS)',
                    'Acceso restringido a datos sensibles',
                    'Monitoreo de actividad sospechosa',
                ],
            },
            {
                title: '5. Tus Derechos',
                content: 'Tienes derecho a:',
                items: [
                    'Acceder a tus datos personales',
                    'Corregir información incorrecta',
                    'Solicitar la eliminación de tu cuenta',
                    'Exportar tus datos',
                    'Retirar tu consentimiento',
                ],
            },
            {
                title: '6. Menores de Edad',
                content: 'Nuestro servicio está dirigido a personas mayores de 16 años. No recopilamos intencionalmente información de menores de esta edad.',
            },
            {
                title: '7. Cambios a esta Política',
                content: 'Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos a través de la plataforma o por correo electrónico.',
            },
        ],
    },
    rules: {
        title: 'Reglas Generales',
        icon: 'hammer',
        updated: 'Enero 2026',
        sections: [
            {
                title: '1. Elegibilidad',
                icon: 'person-circle',
                items: [
                    'Debes tener al menos 16 años para participar',
                    'Una cuenta por persona - No se permiten cuentas múltiples',
                    'Debes usar tu cuenta personal del juego',
                    'Los jugadores deben residir en la región del torneo (si aplica)',
                ],
            },
            {
                title: '2. Equipos',
                icon: 'people',
                items: [
                    'Los equipos deben tener el número mínimo de jugadores requerido',
                    'Un jugador solo puede estar en un equipo por torneo',
                    'Los cambios de roster deben notificarse a los organizadores',
                    'No se permiten cambios de roster una vez iniciado el bracket',
                ],
            },
            {
                title: '3. Partidas',
                icon: 'game-controller',
                items: [
                    'Los jugadores deben estar listos 15 minutos antes del horario programado',
                    'Se toleran máximo 10 minutos de retraso, después se otorga la victoria por default',
                    'Las pausas están limitadas a 5 minutos por equipo por partida',
                    'Las desconexiones se manejan según las reglas específicas del juego',
                ],
            },
            {
                title: '4. Conducta Prohibida',
                icon: 'ban',
                items: [
                    'Uso de hacks, cheats o software no autorizado',
                    'Amaño de partidas o resultados',
                    'Acoso, insultos o comportamiento tóxico',
                    'Suplantación de identidad',
                    'Compartir cuentas o boosting',
                ],
            },
            {
                title: '5. Reportar Resultados',
                icon: 'clipboard',
                items: [
                    'El equipo ganador debe reportar el resultado en 15 minutos',
                    'Incluye capturas de pantalla como evidencia',
                    'Disputas deben reportarse dentro de las 24 horas',
                    'La decisión de los administradores es final',
                ],
            },
            {
                title: '6. Premios',
                icon: 'trophy',
                items: [
                    'Los premios se distribuyen dentro de 30 días después del torneo',
                    'Los ganadores deben proporcionar información válida para el pago',
                    'Los impuestos son responsabilidad del ganador',
                    'Descalificación = pérdida del derecho a premios',
                ],
            },
            {
                title: '7. Sanciones',
                icon: 'warning',
                content: 'Tabla de sanciones aplicables:',
                sanctions: [
                    { offense: 'Lenguaje inapropiado leve', sanction: 'Advertencia' },
                    { offense: 'Retraso sin justificación', sanction: 'Derrota por default' },
                    { offense: 'Conducta antideportiva', sanction: 'Descalificación del torneo' },
                    { offense: 'Uso de cheats/hacks', sanction: 'Ban permanente' },
                    { offense: 'Amaño de partidas', sanction: 'Ban permanente + reporte' },
                ],
            },
        ],
    },
};

export default function LegalScreen({ route, navigation }) {
    const pageType = route?.params?.type || 'terms';
    const page = LEGAL_PAGES[pageType] || LEGAL_PAGES.terms;

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
                <Text style={styles.headerTitle}>{page.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <LinearGradient
                    colors={['rgba(0, 212, 255, 0.12)', 'transparent']}
                    style={styles.hero}
                >
                    <View style={styles.heroIconContainer}>
                        <LinearGradient colors={gradients.primary} style={styles.heroIcon}>
                            <Ionicons name={page.icon} size={28} color={colors.black} />
                        </LinearGradient>
                    </View>
                    <Text style={styles.heroTitle}>{page.title}</Text>
                    <Text style={styles.heroSubtitle}>Última actualización: {page.updated}</Text>
                </LinearGradient>

                {/* Sections */}
                <View style={styles.content}>
                    {page.sections.map((section, index) => (
                        <View key={index} style={styles.section}>
                            <View style={styles.sectionHeader}>
                                {section.icon && (
                                    <Ionicons name={section.icon} size={18} color={colors.primary} style={{ marginRight: 8 }} />
                                )}
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                            </View>

                            {section.content && (
                                <Text style={styles.sectionText}>{section.content}</Text>
                            )}

                            {section.items && (
                                <View style={styles.itemsList}>
                                    {section.items.map((item, i) => (
                                        <View key={i} style={styles.itemRow}>
                                            <Ionicons name="chevron-forward" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                                            <Text style={styles.itemText}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {section.sanctions && (
                                <View style={styles.sanctionsTable}>
                                    <View style={styles.sanctionHeader}>
                                        <Text style={[styles.sanctionHeaderText, { flex: 1 }]}>Infracción</Text>
                                        <Text style={[styles.sanctionHeaderText, { flex: 1 }]}>Sanción</Text>
                                    </View>
                                    {section.sanctions.map((s, i) => (
                                        <View key={i} style={[styles.sanctionRow, i % 2 === 0 && styles.sanctionRowAlternate]}>
                                            <Text style={[styles.sanctionText, { flex: 1 }]}>{s.offense}</Text>
                                            <Text style={[styles.sanctionValue, { flex: 1 }]}>{s.sanction}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                <View style={{ height: 60 }} />
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
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
    },
    hero: {
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 20,
    },
    heroIconContainer: {
        marginBottom: 14,
    },
    heroIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    content: {
        paddingHorizontal: 20,
    },
    section: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        flex: 1,
    },
    sectionText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 22,
        marginBottom: 8,
    },
    itemsList: {
        gap: 8,
    },
    itemRow: {
        flexDirection: 'row',
        gap: 8,
    },
    itemText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        flex: 1,
    },
    sanctionsTable: {
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: 8,
    },
    sanctionHeader: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        padding: 10,
    },
    sanctionHeaderText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },
    sanctionRow: {
        flexDirection: 'row',
        padding: 10,
    },
    sanctionRowAlternate: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    sanctionText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    sanctionValue: {
        fontSize: 13,
        color: colors.error,
        fontWeight: '600',
    },
});
