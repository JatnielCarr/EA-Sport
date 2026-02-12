import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function Input({
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    label,
    keyboardType,
    icon,
    error,
    autoCapitalize = 'none',
    multiline = false,
    numberOfLines = 1,
    maxLength,
    editable = true,
    onFocus,
    onBlur,
}) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleFocus = () => {
        setIsFocused(true);
        onFocus && onFocus();
    };

    const handleBlur = () => {
        setIsFocused(false);
        onBlur && onBlur();
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputContainer,
                isFocused && styles.inputFocused,
                error && styles.inputError,
                !editable && styles.inputDisabled,
            ]}>
                {icon && (
                    <Ionicons 
                        name={icon} 
                        size={20} 
                        color={isFocused ? colors.primary : colors.textSecondary} 
                        style={styles.icon}
                    />
                )}
                <TextInput
                    style={[
                        styles.input,
                        multiline && styles.inputMultiline,
                        icon && styles.inputWithIcon,
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={secureTextEntry && !showPassword}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    maxLength={maxLength}
                    editable={editable}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
                {secureTextEntry && (
                    <TouchableOpacity 
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons 
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                            size={20} 
                            color={colors.textSecondary} 
                        />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    label: {
        color: colors.text,
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    inputFocused: {
        borderColor: colors.primary,
    },
    inputError: {
        borderColor: colors.error,
    },
    inputDisabled: {
        opacity: 0.6,
    },
    icon: {
        marginLeft: 14,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 14,
        color: colors.text,
        fontSize: 16,
    },
    inputWithIcon: {
        paddingLeft: 10,
    },
    inputMultiline: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    eyeIcon: {
        padding: 14,
    },
    errorText: {
        color: colors.error,
        fontSize: 12,
        marginTop: 6,
    },
});
