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

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const { login, isLoading } = useAuth();

    const validate = () => {
        const newErrors = {};
        if (!email) newErrors.email = 'El email es requerido';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';
        if (!password) newErrors.password = 'La contraseña es requerida';
        else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        Keyboard.dismiss();
        if (!validate()) return;

        try {
            await login(email, password);
        } catch (e) {
            Alert.alert('Error de Login', e.message || 'Credenciales inválidas');
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
                            {/* Logo y título */}
                            <View style={styles.header}>
                                <LinearGradient
                                    colors={gradients.primary}
                                    style={styles.logoContainer}
                                >
                                    <Ionicons name="trophy" size={40} color={colors.black} />
                                </LinearGradient>
                                <Text style={styles.title}>ApexTournament</Text>
                                <Text style={styles.subtitle}>Bienvenido de nuevo</Text>
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
                                    label="Contraseña"
                                    placeholder="••••••••"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    icon="lock-closed-outline"
                                    error={errors.password}
                                />

                                <TouchableOpacity style={styles.forgotPassword}>
                                    <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                                </TouchableOpacity>

                                <Button
                                    title="Iniciar Sesión"
                                    onPress={handleLogin}
                                    loading={isLoading}
                                    icon="log-in-outline"
                                />
                            </View>

                            {/* Divisor */}
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>o continúa con</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            {/* Social login */}
                            <View style={styles.socialButtons}>
                                <TouchableOpacity style={styles.socialButton}>
                                    <Ionicons name="logo-google" size={24} color={colors.text} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialButton}>
                                    <Ionicons name="logo-apple" size={24} color={colors.text} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialButton}>
                                    <Ionicons name="logo-discord" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.link}>Regístrate</Text>
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
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    form: {
        marginBottom: 24,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 16,
        marginTop: -8,
    },
    forgotPasswordText: {
        color: colors.primary,
        fontSize: 14,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        color: colors.textSecondary,
        paddingHorizontal: 16,
        fontSize: 13,
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 32,
    },
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
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
