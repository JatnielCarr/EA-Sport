import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Linking,
    ActivityIndicator,
    TextInput,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const QUICK_AMOUNTS = [50, 100, 200, 500];

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
    return `$${Number(amount).toFixed(2)}`;
}

export default function WalletScreen({ navigation }) {
    const { userInfo } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [rechargeLoading, setRechargeLoading] = useState(false);

    // Custom amount modal
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customAmount, setCustomAmount] = useState('');

    // Withdrawal state
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState('paypal');
    const [withdrawDetail, setWithdrawDetail] = useState('');
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [withdrawals, setWithdrawals] = useState([]);

    const fetchBalance = async () => {
        try {
            const response = await api.get('/payment/balance');
            if (response.success) {
                setBalance(response.balance || 0);
            }
        } catch (error) {
            console.warn('Error fetching balance:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await api.get('/payment/history');
            if (response.success && response.data) {
                setTransactions(response.data);
            }
        } catch (error) {
            console.warn('Error fetching payment history:', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchBalance(), fetchHistory(), fetchWithdrawals()]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchBalance(), fetchHistory(), fetchWithdrawals()]);
        setRefreshing(false);
    }, []);

    const handleRecharge = async (amount) => {
        if (amount < 10) {
            Alert.alert('Error', 'El monto mínimo es $10 MXN');
            return;
        }

        setRechargeLoading(true);

        try {
            const response = await api.post('/payment/create-checkout-session', {
                amount: amount,
                currency: 'mxn',
                description: `Recarga de saldo: $${amount} MXN`,
            });

            if (response.success && response.url) {
                await Linking.openURL(response.url);
            } else {
                Alert.alert('Error', response.error || 'No se pudo iniciar el pago.');
            }
        } catch (error) {
            Alert.alert('Error', error?.message || 'Ocurrió un error al procesar la solicitud.');
        } finally {
            setRechargeLoading(false);
        }
    };

    const handleCustomRecharge = () => {
        const amount = parseFloat(customAmount);
        if (isNaN(amount) || amount < 10) {
            Alert.alert('Error', 'Ingresa un monto válido (mínimo $10 MXN)');
            return;
        }
        setShowCustomModal(false);
        setCustomAmount('');
        handleRecharge(amount);
    };

    const fetchWithdrawals = async () => {
        try {
            const response = await api.get('/payment/withdrawals');
            if (response.success && response.data) {
                setWithdrawals(response.data);
            }
        } catch (error) {
            console.warn('Error fetching withdrawals:', error);
        }
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);
        if (isNaN(amount) || amount < 50) {
            Alert.alert('Error', 'El monto mínimo de retiro es $50 MXN');
            return;
        }
        if (amount > balance) {
            Alert.alert('Error', 'Saldo insuficiente para este retiro');
            return;
        }

        setWithdrawLoading(true);
        try {
            const response = await api.post('/payment/withdraw', {
                amount,
                method: withdrawMethod,
                detail: withdrawDetail,
            });
            if (response.success) {
                Alert.alert('Solicitud Enviada', `Tu retiro de $${amount} MXN ha sido solicitado. Será procesado en 1-3 días hábiles.`);
                setShowWithdrawModal(false);
                setWithdrawAmount('');
                setWithdrawDetail('');
                await Promise.all([fetchBalance(), fetchWithdrawals()]);
            } else {
                Alert.alert('Error', response.error || 'No se pudo procesar el retiro');
            }
        } catch (error) {
            Alert.alert('Error', error?.message || 'Error al solicitar retiro');
        } finally {
            setWithdrawLoading(false);
        }
    };

    const getTransactionIcon = (payment) => {
        const status = payment.status;
        const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};

        if (status === 'pending') return { name: 'time-outline', color: colors.warning };
        if (status === 'failed') return { name: 'close-circle', color: colors.error };
        if (metadata?.type === 'name_change') return { name: 'create-outline', color: colors.secondary };
        if (metadata?.type === 'add_funds') return { name: 'arrow-down-circle', color: colors.success };
        if (metadata?.type === 'subscription') return { name: 'star', color: colors.warning };
        return { name: 'card-outline', color: colors.primary };
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'completed': return 'Completado';
            case 'failed': return 'Fallido';
            case 'name_change_approved': return 'Aprobado';
            case 'name_change_used': return 'Aplicado';
            default: return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return colors.warning;
            case 'completed': case 'name_change_approved': case 'name_change_used': return colors.success;
            case 'failed': return colors.error;
            default: return colors.textSecondary;
        }
    };

    const totalDeposits = transactions
        .filter(t => t.status === 'completed' && t.amount > 0)
        .reduce((sum, t) => sum + Number(t.amount), 0);

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Billetera</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Cargando billetera...</Text>
                </View>
            </SafeAreaView>
        );
    }

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
                <Text style={styles.headerTitle}>Billetera</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.balanceGradient}
                    >
                        <Text style={styles.balanceLabel}>Saldo Disponible</Text>
                        <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
                        <Text style={styles.balanceCurrency}>MXN</Text>
                    </LinearGradient>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="arrow-down-circle" size={24} color={colors.success} />
                        <Text style={styles.statAmount}>{formatCurrency(totalDeposits)}</Text>
                        <Text style={styles.statLabel}>Total Recargado</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="receipt-outline" size={24} color={colors.primary} />
                        <Text style={styles.statAmount}>{transactions.length}</Text>
                        <Text style={styles.statLabel}>Transacciones</Text>
                    </View>
                </View>

                {/* Recharge Section */}
                <View style={styles.rechargeSection}>
                    <Text style={styles.sectionTitle}>Recargar Saldo</Text>
                    <Text style={styles.sectionSubtitle}>Selecciona un monto o ingresa uno personalizado</Text>

                    <View style={styles.amountsGrid}>
                        {QUICK_AMOUNTS.map((amount) => (
                            <TouchableOpacity
                                key={amount}
                                style={styles.amountCard}
                                onPress={() => handleRecharge(amount)}
                                disabled={rechargeLoading}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={['rgba(0, 212, 255, 0.08)', 'rgba(121, 40, 202, 0.08)']}
                                    style={styles.amountCardGradient}
                                >
                                    <Text style={styles.amountText}>${amount}</Text>
                                    <Text style={styles.amountCurrency}>MXN</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.customAmountButton}
                        onPress={() => setShowCustomModal(true)}
                        disabled={rechargeLoading}
                    >
                        <Ionicons name="keypad-outline" size={20} color={colors.primary} />
                        <Text style={styles.customAmountText}>Monto Personalizado</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>

                    {rechargeLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={styles.loadingText}>Abriendo pasarela de pago...</Text>
                        </View>
                    )}
                </View>

                {/* Withdraw Section */}
                <View style={styles.withdrawSection}>
                    <Text style={styles.sectionTitle}>Retirar Fondos</Text>
                    <Text style={styles.sectionSubtitle}>Retira tus ganancias de torneos (mín. $50 MXN)</Text>

                    <TouchableOpacity
                        style={styles.withdrawButton}
                        onPress={() => setShowWithdrawModal(true)}
                        activeOpacity={0.7}
                    >
                        <LinearGradient
                            colors={['rgba(255, 51, 102, 0.1)', 'rgba(255, 107, 107, 0.1)']}
                            style={styles.withdrawButtonGradient}
                        >
                            <Ionicons name="arrow-up-circle" size={24} color={colors.error} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.withdrawButtonTitle}>Solicitar Retiro</Text>
                                <Text style={styles.withdrawButtonSubtitle}>PayPal o transferencia bancaria</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                        </LinearGradient>
                    </TouchableOpacity>

                    {withdrawals.length > 0 && (
                        <View style={{ marginTop: 16 }}>
                            <Text style={[styles.sectionSubtitle, { fontWeight: '600', color: colors.textSecondary }]}>
                                Historial de Retiros
                            </Text>
                            {withdrawals.slice(0, 5).map((w) => (
                                <View key={w.id} style={styles.withdrawalItem}>
                                    <View style={[styles.transactionIcon, { backgroundColor: 'rgba(255, 51, 102, 0.1)' }]}>
                                        <Ionicons name="arrow-up-circle" size={22} color={colors.error} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.transactionTitle}>-{formatCurrency(w.amount)} MXN</Text>
                                        <Text style={styles.transactionDate}>{formatDate(w.created_at)}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, {
                                        backgroundColor: w.status === 'PENDING' ? `${colors.warning}15` :
                                            w.status === 'COMPLETED' ? `${colors.success}15` : `${colors.error}15`
                                    }]}>
                                        <Text style={[styles.statusBadgeText, {
                                            color: w.status === 'PENDING' ? colors.warning :
                                                w.status === 'COMPLETED' ? colors.success : colors.error
                                        }]}>
                                            {w.status === 'PENDING' ? 'Pendiente' : w.status === 'COMPLETED' ? 'Completado' : 'Fallido'}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Transactions */}
                <View style={styles.transactionsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Historial de Pagos</Text>
                    </View>

                    {transactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>Sin movimientos</Text>
                            <Text style={styles.emptyText}>Tus transacciones aparecerán aquí</Text>
                        </View>
                    ) : (
                        transactions.map((payment) => {
                            const icon = getTransactionIcon(payment);
                            return (
                                <View key={payment.id} style={styles.transactionCard}>
                                    <View style={[styles.transactionIcon, { backgroundColor: `${icon.color}15` }]}>
                                        <Ionicons name={icon.name} size={22} color={icon.color} />
                                    </View>
                                    <View style={styles.transactionInfo}>
                                        <Text style={styles.transactionTitle}>
                                            {formatCurrency(payment.amount)} {payment.currency?.toUpperCase() || 'MXN'}
                                        </Text>
                                        <Text style={styles.transactionDate}>
                                            {formatDate(payment.created_at)}
                                        </Text>
                                    </View>
                                    <View style={styles.transactionRight}>
                                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(payment.status)}15` }]}>
                                            <Text style={[styles.statusBadgeText, { color: getStatusColor(payment.status) }]}>
                                                {getStatusLabel(payment.status)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Custom Amount Modal */}
            <Modal
                visible={showCustomModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCustomModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Monto Personalizado</Text>
                        <Text style={styles.modalSubtitle}>Ingresa la cantidad a recargar (mín. $10 MXN)</Text>

                        <View style={styles.modalInputContainer}>
                            <Text style={styles.modalCurrencySymbol}>$</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={customAmount}
                                onChangeText={setCustomAmount}
                                placeholder="0.00"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="numeric"
                                autoFocus
                            />
                            <Text style={styles.modalCurrencyLabel}>MXN</Text>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => {
                                    setShowCustomModal(false);
                                    setCustomAmount('');
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirmButton}
                                onPress={handleCustomRecharge}
                            >
                                <LinearGradient
                                    colors={gradients.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.modalConfirmGradient}
                                >
                                    <Text style={styles.modalConfirmText}>Recargar</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Withdrawal Modal */}
            <Modal
                visible={showWithdrawModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowWithdrawModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Solicitar Retiro</Text>
                        <Text style={styles.modalSubtitle}>Mín. $50 MXN • Saldo: {formatCurrency(balance)}</Text>

                        <View style={styles.modalInputContainer}>
                            <Text style={styles.modalCurrencySymbol}>$</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={withdrawAmount}
                                onChangeText={setWithdrawAmount}
                                placeholder="50"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="numeric"
                            />
                            <Text style={styles.modalCurrencyLabel}>MXN</Text>
                        </View>

                        {/* Method Selection */}
                        <View style={styles.methodRow}>
                            <TouchableOpacity
                                style={[styles.methodOption, withdrawMethod === 'paypal' && styles.methodOptionActive]}
                                onPress={() => setWithdrawMethod('paypal')}
                            >
                                <Ionicons name="logo-paypal" size={20} color={withdrawMethod === 'paypal' ? colors.primary : colors.textSecondary} />
                                <Text style={[styles.methodOptionText, withdrawMethod === 'paypal' && { color: colors.primary }]}>PayPal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.methodOption, withdrawMethod === 'bank' && styles.methodOptionActive]}
                                onPress={() => setWithdrawMethod('bank')}
                            >
                                <Ionicons name="business-outline" size={20} color={withdrawMethod === 'bank' ? colors.primary : colors.textSecondary} />
                                <Text style={[styles.methodOptionText, withdrawMethod === 'bank' && { color: colors.primary }]}>Transferencia</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.withdrawDetailInput}
                            value={withdrawDetail}
                            onChangeText={setWithdrawDetail}
                            placeholder={withdrawMethod === 'paypal' ? 'Email de PayPal' : 'CLABE interbancaria (18 dígitos)'}
                            placeholderTextColor={colors.textMuted}
                            keyboardType={withdrawMethod === 'paypal' ? 'email-address' : 'numeric'}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => {
                                    setShowWithdrawModal(false);
                                    setWithdrawAmount('');
                                    setWithdrawDetail('');
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirmButton}
                                onPress={handleWithdraw}
                                disabled={withdrawLoading}
                            >
                                <LinearGradient
                                    colors={['#ff3366', '#ff6b6b']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.modalConfirmGradient}
                                >
                                    {withdrawLoading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Text style={[styles.modalConfirmText, { color: 'white' }]}>Solicitar Retiro</Text>
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
    balanceCard: {
        margin: 16,
        borderRadius: 20,
        overflow: 'hidden',
    },
    balanceGradient: {
        padding: 28,
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 14,
        color: colors.black,
        opacity: 0.8,
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 42,
        fontWeight: '800',
        color: colors.black,
    },
    balanceCurrency: {
        fontSize: 14,
        color: colors.black,
        opacity: 0.7,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    rechargeSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 16,
    },
    amountsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    amountCard: {
        width: '47%',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    amountCardGradient: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    amountText: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
    },
    amountCurrency: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    customAmountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
    },
    customAmountText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    loadingOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        padding: 12,
        backgroundColor: 'rgba(0, 212, 255, 0.08)',
        borderRadius: 10,
    },
    loadingText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '500',
    },
    transactionsSection: {
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 12,
    },
    emptyText: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 4,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    transactionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    transactionDate: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalContent: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 20,
    },
    modalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 14,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 20,
    },
    modalCurrencySymbol: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.primary,
    },
    modalInput: {
        flex: 1,
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        paddingVertical: 16,
        paddingHorizontal: 8,
    },
    modalCurrencyLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalCancelText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
    modalConfirmButton: {
        flex: 2,
        borderRadius: 14,
        overflow: 'hidden',
    },
    modalConfirmGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    modalConfirmText: {
        color: colors.black,
        fontSize: 16,
        fontWeight: '700',
    },
    // Withdrawal styles
    withdrawSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    withdrawButton: {
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 51, 102, 0.2)',
    },
    withdrawButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    withdrawButtonTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    withdrawButtonSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    withdrawalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    methodRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    methodOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
    },
    methodOptionActive: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(0, 212, 255, 0.08)',
    },
    methodOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    withdrawDetailInput: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
    },
});
