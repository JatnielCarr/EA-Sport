import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { colors, gradients } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../../components/common';
import { PLANS, COMPARISON_FEATURES, FAQ_ITEMS } from '../../utils/constants';

export default function SubscriptionScreen({ navigation }) {
    const { userInfo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [isYearly, setIsYearly] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);

    useEffect(() => {
        fetchSubscriptionData();
    }, []);

    const fetchSubscriptionData = async () => {
        try {
            // Intentar obtener suscripción actual
            try {
                const subResponse = await api.subscriptions.getMySubscription();
                setCurrentSubscription(subResponse.data || subResponse);
            } catch (e) {
                setCurrentSubscription({ plan: 'FREE', status: 'ACTIVE' });
            }
        } catch (error) {
            console.warn('Error fetching subscription:', error);
            setCurrentSubscription({ plan: 'FREE', status: 'ACTIVE' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = (planId) => {
        if (planId === 'FREE') {
            Alert.alert('Plan Gratuito', 'Ya tienes acceso al plan gratuito.');
            return;
        }

        const plan = PLANS[planId];
        const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
        const period = isYearly ? 'año' : 'mes';

        Alert.alert(
            `Suscribirse a ${plan.name}`,
            `¿Deseas suscribirte al plan ${plan.name} por $${price.toLocaleString()}/${period}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Continuar',
                    onPress: () => {
                        // Aquí iría la integración con Stripe
                        Alert.alert('Próximamente', 'El sistema de pagos estará disponible pronto en la aplicación móvil. Por ahora, puedes suscribirte desde la versión web.');
                    }
                }
            ]
        );
    };

    if (loading) return <Loading text="Cargando planes..." />;

    const currentPlan = currentSubscription?.plan || 'FREE';
    const isStandard = currentPlan === 'STANDARD';
    const isPremium = currentPlan === 'PREMIUM';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroBadge}>
                        <Ionicons name="diamond" size={14} color={colors.warning} />
                        <Text style={styles.heroBadgeText}>ADMIN DE TORNEOS</Text>
                    </View>
                    <Text style={styles.heroTitle}>
                        Crea y administra{'\n'}
                        <Text style={styles.heroTitleGradient}>tus propios torneos</Text>
                    </Text>
                    <Text style={styles.heroSubtitle}>
                        Suscríbete para crear torneos, invitar jugadores por URL y cobrar cuota de inscripción
                    </Text>

                    {/* Billing Toggle */}
                    <View style={styles.billingToggle}>
                        <Text style={[styles.billingOption, !isYearly && styles.billingOptionActive]}>
                            Mensual
                        </Text>
                        <TouchableOpacity
                            style={styles.toggleSwitch}
                            onPress={() => setIsYearly(!isYearly)}
                        >
                            <View style={[
                                styles.toggleThumb,
                                isYearly && styles.toggleThumbActive
                            ]} />
                        </TouchableOpacity>
                        <View style={styles.billingYearly}>
                            <Text style={[styles.billingOption, isYearly && styles.billingOptionActive]}>
                                Anual
                            </Text>
                            <View style={styles.saveBadge}>
                                <Text style={styles.saveBadgeText}>-17%</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Current Plan Banner */}
                {(isStandard || isPremium) && (
                    <View style={styles.currentPlanBanner}>
                        <LinearGradient
                            colors={isPremium ?
                                ['rgba(240, 147, 251, 0.2)', 'rgba(245, 87, 108, 0.2)'] :
                                ['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.2)']
                            }
                            style={styles.currentPlanCard}
                        >
                            <View style={styles.currentPlanInfo}>
                                <View style={[styles.currentPlanBadge, isPremium && styles.premiumBadgeBg]}>
                                    <Text style={styles.currentPlanBadgeText}>{currentPlan}</Text>
                                </View>
                                <Text style={styles.currentPlanStatus}>Plan Activo</Text>
                            </View>
                            {currentSubscription.current_period_end && (
                                <Text style={styles.currentPlanPeriod}>
                                    Válido hasta: {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                                </Text>
                            )}
                        </LinearGradient>
                    </View>
                )}

                {/* Plan Cards */}
                <View style={styles.plansContainer}>
                    {/* Free Plan */}
                    <View style={[styles.planCard, currentPlan === 'FREE' && styles.planCardCurrent]}>
                        <View style={styles.planHeader}>
                            <Ionicons name="person" size={24} color={colors.textSecondary} />
                            <Text style={styles.planName}>Gratis</Text>
                        </View>
                        <View style={styles.planPrice}>
                            <Text style={styles.planPriceValue}>$0</Text>
                            <Text style={styles.planPricePeriod}>/siempre</Text>
                        </View>
                        <View style={styles.planFeatures}>
                            {PLANS.FREE.features.map((feature, index) => (
                                <View key={index} style={styles.planFeature}>
                                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                                    <Text style={styles.planFeatureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={[styles.planButton, styles.planButtonOutline]}
                            disabled={true}
                        >
                            <Text style={styles.planButtonTextOutline}>
                                {currentPlan === 'FREE' ? 'Plan Actual' : 'Plan Base'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Standard Plan */}
                    <View style={[styles.planCard, styles.planCardStandard, currentPlan === 'STANDARD' && styles.planCardCurrent]}>
                        <LinearGradient
                            colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
                            style={styles.planCardGradient}
                        >
                            <View style={styles.popularBadge}>
                                <Ionicons name="flash" size={12} color={colors.white} />
                                <Text style={styles.popularBadgeText}>POPULAR</Text>
                            </View>
                            <View style={styles.planHeader}>
                                <Ionicons name="rocket" size={24} color="#667eea" />
                                <Text style={[styles.planName, { color: '#667eea' }]}>Standard</Text>
                            </View>
                            <View style={styles.planPrice}>
                                <Text style={[styles.planPriceValue, { color: '#667eea' }]}>
                                    ${isYearly ? PLANS.STANDARD.yearlyPrice.toLocaleString() : PLANS.STANDARD.monthlyPrice}
                                </Text>
                                <Text style={styles.planPricePeriod}>/{isYearly ? 'año' : 'mes'}</Text>
                            </View>
                            {isYearly && (
                                <Text style={styles.monthlyEquivalent}>
                                    ${Math.round(PLANS.STANDARD.yearlyPrice / 12)}/mes equivalente
                                </Text>
                            )}
                            <View style={styles.planFeatures}>
                                {PLANS.STANDARD.features.map((feature, index) => (
                                    <View key={index} style={styles.planFeature}>
                                        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                                        <Text style={styles.planFeatureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={styles.planButtonStandard}
                                onPress={() => handleSubscribe('STANDARD')}
                                disabled={isStandard}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.planButtonGradient}
                                >
                                    <Ionicons name="rocket" size={18} color={colors.white} />
                                    <Text style={styles.planButtonTextPremium}>
                                        {isStandard ? 'Plan Actual' : 'Obtener Standard'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>

                    {/* Premium Plan */}
                    <View style={[styles.planCard, styles.planCardPremium, currentPlan === 'PREMIUM' && styles.planCardCurrent]}>
                        <LinearGradient
                            colors={['rgba(240, 147, 251, 0.1)', 'rgba(245, 87, 108, 0.1)']}
                            style={styles.planCardGradient}
                        >
                            <View style={[styles.popularBadge, styles.premiumBadgeBg]}>
                                <Ionicons name="diamond" size={12} color={colors.white} />
                                <Text style={styles.popularBadgeText}>MEJOR VALOR</Text>
                            </View>
                            <View style={styles.planHeader}>
                                <Ionicons name="diamond" size={24} color="#f093fb" />
                                <Text style={[styles.planName, { color: '#f093fb' }]}>Premium</Text>
                            </View>
                            <View style={styles.planPrice}>
                                <Text style={[styles.planPriceValue, { color: '#f093fb' }]}>
                                    ${isYearly ? PLANS.PREMIUM.yearlyPrice.toLocaleString() : PLANS.PREMIUM.monthlyPrice}
                                </Text>
                                <Text style={styles.planPricePeriod}>/{isYearly ? 'año' : 'mes'}</Text>
                            </View>
                            {isYearly && (
                                <Text style={styles.monthlyEquivalent}>
                                    ${Math.round(PLANS.PREMIUM.yearlyPrice / 12)}/mes equivalente
                                </Text>
                            )}
                            <View style={styles.planFeatures}>
                                {PLANS.PREMIUM.features.map((feature, index) => (
                                    <View key={index} style={styles.planFeature}>
                                        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                                        <Text style={styles.planFeatureText}>{feature}</Text>
                                    </View>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={styles.planButtonPremium}
                                onPress={() => handleSubscribe('PREMIUM')}
                                disabled={isPremium}
                            >
                                <LinearGradient
                                    colors={['#f093fb', '#f5576c']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.planButtonGradient}
                                >
                                    <Ionicons name="diamond" size={18} color={colors.white} />
                                    <Text style={styles.planButtonTextPremium}>
                                        {isPremium ? 'Plan Actual' : 'Obtener Premium'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>

                {/* Comparison Table */}
                <View style={styles.comparisonSection}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="git-compare" size={20} color={colors.primary} /> Comparación de Planes
                    </Text>

                    <View style={styles.comparisonTable}>
                        <View style={styles.comparisonHeader}>
                            <Text style={styles.comparisonHeaderCell}>Característica</Text>
                            <Text style={styles.comparisonHeaderCell}>Gratis</Text>
                            <Text style={[styles.comparisonHeaderCell, styles.comparisonHeaderStandard]}>Standard</Text>
                            <Text style={[styles.comparisonHeaderCell, styles.comparisonHeaderPremium]}>Premium</Text>
                        </View>

                        {COMPARISON_FEATURES.map((feature, index) => (
                            <View key={index} style={styles.comparisonRow}>
                                <View style={styles.comparisonFeature}>
                                    <Ionicons name={feature.icon} size={14} color={colors.primary} />
                                    <Text style={styles.comparisonFeatureText}>{feature.name}</Text>
                                </View>
                                <View style={styles.comparisonCell}>
                                    {feature.free ? (
                                        <Ionicons name="checkmark" size={18} color={colors.success} />
                                    ) : (
                                        <Ionicons name="close" size={18} color={colors.textMuted} />
                                    )}
                                </View>
                                <View style={[styles.comparisonCell, styles.comparisonCellStandard]}>
                                    {typeof feature.standard === 'string' ? (
                                        <View style={styles.standardBadge}>
                                            <Text style={styles.standardBadgeText}>{feature.standard}</Text>
                                        </View>
                                    ) : feature.standard ? (
                                        <Ionicons name="checkmark" size={18} color={colors.success} />
                                    ) : (
                                        <Ionicons name="close" size={18} color={colors.textMuted} />
                                    )}
                                </View>
                                <View style={[styles.comparisonCell, styles.comparisonCellPremium]}>
                                    {typeof feature.premium === 'string' ? (
                                        <View style={styles.legendBadge}>
                                            <Text style={styles.legendBadgeText}>{feature.premium}</Text>
                                        </View>
                                    ) : feature.premium ? (
                                        <Ionicons name="checkmark" size={18} color={colors.success} />
                                    ) : (
                                        <Ionicons name="close" size={18} color={colors.textMuted} />
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* FAQ Section */}
                <View style={styles.faqSection}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="help-circle" size={20} color={colors.primary} /> Preguntas Frecuentes
                    </Text>

                    {FAQ_ITEMS.map((faq, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.faqItem}
                            onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        >
                            <View style={styles.faqQuestion}>
                                <Ionicons name={faq.icon} size={20} color={colors.primary} />
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

                {/* CTA Section */}
                <View style={styles.ctaSection}>
                    <LinearGradient
                        colors={gradients.primary}
                        style={styles.ctaCard}
                    >
                        <Text style={styles.ctaTitle}>¿Listo para organizar?</Text>
                        <Text style={styles.ctaSubtitle}>
                            Crea torneos, genera URLs de invitación y cobra cuotas de inscripción
                        </Text>
                        <TouchableOpacity
                            style={styles.ctaButton}
                            onPress={() => handleSubscribe('PREMIUM')}
                        >
                            <Ionicons name="rocket" size={18} color={colors.primary} />
                            <Text style={styles.ctaButtonText}>Comenzar Ahora</Text>
                        </TouchableOpacity>
                    </LinearGradient>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroSection: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 30,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.3)',
        marginBottom: 16,
    },
    heroBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: 1,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    heroTitleGradient: {
        color: colors.primary,
    },
    heroSubtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    billingToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 50,
        padding: 8,
        gap: 12,
    },
    billingOption: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textMuted,
    },
    billingOptionActive: {
        color: colors.text,
        fontWeight: '600',
    },
    billingYearly: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    saveBadge: {
        backgroundColor: colors.success,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    saveBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.white,
    },
    toggleSwitch: {
        width: 50,
        height: 26,
        backgroundColor: colors.cardAlt,
        borderRadius: 13,
        padding: 3,
    },
    toggleThumb: {
        width: 20,
        height: 20,
        backgroundColor: colors.primary,
        borderRadius: 10,
    },
    toggleThumbActive: {
        marginLeft: 24,
    },
    currentPlanBanner: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    currentPlanCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#667eea',
    },
    currentPlanInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    currentPlanBadge: {
        backgroundColor: '#667eea',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    premiumBadgeBg: {
        backgroundColor: '#f093fb',
    },
    currentPlanBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.white,
    },
    currentPlanStatus: {
        fontSize: 14,
        color: colors.text,
    },
    currentPlanPeriod: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    plansContainer: {
        paddingHorizontal: 16,
        gap: 16,
    },
    planCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },
    planCardCurrent: {
        borderColor: colors.success,
        borderWidth: 2,
    },
    planCardStandard: {
        padding: 0,
        overflow: 'hidden',
        borderColor: '#667eea',
        borderWidth: 2,
    },
    planCardPremium: {
        padding: 0,
        overflow: 'hidden',
        borderColor: '#f093fb',
        borderWidth: 2,
    },
    planCardGradient: {
        padding: 24,
    },
    popularBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#667eea',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    popularBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.white,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    planName: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    planPrice: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    planPriceValue: {
        fontSize: 36,
        fontWeight: '800',
        color: colors.text,
    },
    planPricePeriod: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 6,
    },
    monthlyEquivalent: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 12,
    },
    planFeatures: {
        gap: 12,
        marginBottom: 24,
    },
    planFeature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    planFeatureText: {
        fontSize: 14,
        color: colors.text,
    },
    planButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    planButtonOutline: {
        borderWidth: 1,
        borderColor: colors.border,
    },
    planButtonTextOutline: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    planButtonStandard: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    planButtonPremium: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    planButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    planButtonTextPremium: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.white,
    },
    comparisonSection: {
        padding: 16,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    comparisonTable: {
        backgroundColor: colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    comparisonHeader: {
        flexDirection: 'row',
        backgroundColor: colors.cardAlt,
        paddingVertical: 14,
        paddingHorizontal: 8,
    },
    comparisonHeaderCell: {
        flex: 1,
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSecondary,
        textAlign: 'center',
    },
    comparisonHeaderStandard: {
        color: '#667eea',
    },
    comparisonHeaderPremium: {
        color: '#f093fb',
    },
    comparisonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    comparisonFeature: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    comparisonFeatureText: {
        fontSize: 11,
        color: colors.text,
    },
    comparisonCell: {
        flex: 1,
        alignItems: 'center',
    },
    comparisonCellStandard: {
        backgroundColor: 'rgba(102, 126, 234, 0.05)',
    },
    comparisonCellPremium: {
        backgroundColor: 'rgba(240, 147, 251, 0.05)',
    },
    standardBadge: {
        backgroundColor: '#667eea',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    standardBadgeText: {
        fontSize: 8,
        fontWeight: '700',
        color: colors.white,
    },
    legendBadge: {
        backgroundColor: '#f093fb',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    legendBadgeText: {
        fontSize: 8,
        fontWeight: '700',
        color: colors.white,
    },
    faqSection: {
        padding: 16,
    },
    faqItem: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    faqQuestionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    faqAnswer: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 12,
        lineHeight: 20,
    },
    ctaSection: {
        padding: 16,
    },
    ctaCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.black,
        marginBottom: 8,
    },
    ctaSubtitle: {
        fontSize: 14,
        color: colors.black,
        opacity: 0.8,
        textAlign: 'center',
        marginBottom: 20,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.black,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    ctaButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
});
