import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    Alert, 
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, gradients } from '../../theme/colors';
import { Button, Input } from '../../components/common';

export default function RegisterScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const { register, isLoading } = useAuth();

    const validate = () => {
        const newErrors = {};
        if (!email) newErrors.email = 'El email es requerido';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';
        if (!username) newErrors.username = 'El usuario es requerido';
        else if (username.length < 3) newErrors.username = 'Mínimo 3 caracteres';
        if (!password) newErrors.password = 'La contraseña es requerida';
        else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        Keyboard.dismiss();
        if (!validate()) return;

        try {
            await register(email, username, password);
        } catch (e) {
            Alert.alert('Error de Registro', e.message || 'No se pudo crear la cuenta');
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.content}>
                            {/* Header */}
                            <View style={styles.header}>
                                <TouchableOpacity 
                                    style={styles.backButton}
                                    onPress={() => navigation.goBack()}
                                >
                                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                                </TouchableOpacity>
                                <View style={styles.headerText}>
                                    <Text style={styles.title}>Crear Cuenta</Text>
                                    <Text style={styles.subtitle}>Únete a la competición</Text>
                                </View>
                            </View>

                            {/* Formulario */}
                            <View style={styles.form}>
                                <Input
                                    label="Email"
                                    placeholder="ejemplo@email.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    icon="mail-outline"
                                    error={errors.email}
                                    autoCapitalize="none"
                                />

                                <Input
                                    label="Nombre de Usuario"
                                    placeholder="Tu gamertag"
                                    value={username}
                                    onChangeText={setUsername}
                                    icon="person-outline"
                                    error={errors.username}
                                    autoCapitalize="none"
                                />

                                <Input
                                    label="Contraseña"
                                    placeholder="••••••••"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    icon="lock-closed-outline"
                                    error={errors.password}
                                />

                                <Input
                                    label="Confirmar Contraseña"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                    icon="lock-closed-outline"
                                    error={errors.confirmPassword}
                                />

                                <View style={styles.termsContainer}>
                                    <Text style={styles.termsText}>
                                        Al registrarte, aceptas nuestros{' '}
                                        <Text style={styles.termsLink}>Términos de Servicio</Text>
                                        {' '}y{' '}
                                        <Text style={styles.termsLink}>Política de Privacidad</Text>
                                    </Text>
                                </View>

                                <Button
                                    title="Crear Cuenta"
                                    onPress={handleRegister}
                                    loading={isLoading}
                                    icon="rocket-outline"
                                />
                            </View>

                            {/* Features */}
                            <View style={styles.features}>
                                <View style={styles.feature}>
                                    <View style={styles.featureIcon}>
                                        <Ionicons name="trophy-outline" size={18} color={colors.primary} />
                                    </View>
                                    <Text style={styles.featureText}>Torneos épicos</Text>
                                </View>
                                <View style={styles.feature}>
                                    <View style={styles.featureIcon}>
                                        <Ionicons name="people-outline" size={18} color={colors.secondary} />
                                    </View>
                                    <Text style={styles.featureText}>Crea tu clan</Text>
                                </View>
                                <View style={styles.feature}>
                                    <View style={styles.featureIcon}>
                                        <Ionicons name="stats-chart-outline" size={18} color={colors.warning} />
                                    </View>
                                    <Text style={styles.featureText}>Ranking global</Text>
                                </View>
                            </View>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={styles.link}>Inicia Sesión</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textSecondary,
    },
    form: {
        marginBottom: 24,
    },
    termsContainer: {
        marginBottom: 20,
        marginTop: 8,
    },
    termsText: {
        color: colors.textSecondary,
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'center',
    },
    termsLink: {
        color: colors.primary,
    },
    features: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 32,
        paddingVertical: 20,
        backgroundColor: colors.card,
        borderRadius: 16,
    },
    feature: {
        alignItems: 'center',
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    featureText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    footerText: {
        color: colors.textSecondary,
        fontSize: 15,
    },
    link: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 15,
    },
});
