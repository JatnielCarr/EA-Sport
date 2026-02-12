import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../../theme/colors';

export default function Button({
    onPress,
    title,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    fullWidth = true,
    style,
}) {
    const isSecondary = variant === 'secondary';
    const isOutline = variant === 'outline';
    const isDanger = variant === 'danger';
    const isGhost = variant === 'ghost';
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    const buttonContent = (
        <View style={styles.content}>
            {loading ? (
                <ActivityIndicator color={isOutline || isGhost ? colors.primary : colors.white} size="small" />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <Ionicons 
                            name={icon} 
                            size={isSmall ? 16 : 20} 
                            color={isOutline || isGhost ? colors.primary : isSecondary ? colors.primary : colors.black}
                            style={styles.iconLeft}
                        />
                    )}
                    <Text style={[
                        styles.text,
                        isSecondary && styles.textSecondary,
                        isOutline && styles.textOutline,
                        isGhost && styles.textGhost,
                        isDanger && styles.textDanger,
                        isSmall && styles.textSmall,
                        isLarge && styles.textLarge,
                    ]}>
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && (
                        <Ionicons 
                            name={icon} 
                            size={isSmall ? 16 : 20} 
                            color={isOutline || isGhost ? colors.primary : isSecondary ? colors.primary : colors.black}
                            style={styles.iconRight}
                        />
                    )}
                </>
            )}
        </View>
    );

    if (variant === 'primary' && !disabled) {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                style={[!fullWidth && styles.autoWidth, style]}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.button,
                        isSmall && styles.buttonSmall,
                        isLarge && styles.buttonLarge,
                        (disabled || loading) && styles.disabled,
                    ]}
                >
                    {buttonContent}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[
                styles.button,
                isSecondary && styles.buttonSecondary,
                isOutline && styles.buttonOutline,
                isGhost && styles.buttonGhost,
                isDanger && styles.buttonDanger,
                isSmall && styles.buttonSmall,
                isLarge && styles.buttonLarge,
                (disabled || loading) && styles.disabled,
                !fullWidth && styles.autoWidth,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {buttonContent}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginVertical: 6,
    },
    buttonSmall: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    buttonLarge: {
        paddingVertical: 18,
        paddingHorizontal: 32,
    },
    buttonSecondary: {
        backgroundColor: colors.transparent,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    buttonOutline: {
        backgroundColor: colors.transparent,
        borderWidth: 1,
        borderColor: colors.border,
    },
    buttonGhost: {
        backgroundColor: colors.transparent,
    },
    buttonDanger: {
        backgroundColor: colors.error,
    },
    autoWidth: {
        width: 'auto',
        alignSelf: 'flex-start',
    },
    disabled: {
        opacity: 0.5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: colors.black,
        fontSize: 16,
        fontWeight: '700',
    },
    textSecondary: {
        color: colors.primary,
    },
    textOutline: {
        color: colors.text,
    },
    textGhost: {
        color: colors.primary,
    },
    textDanger: {
        color: colors.white,
    },
    textSmall: {
        fontSize: 14,
    },
    textLarge: {
        fontSize: 18,
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
});
