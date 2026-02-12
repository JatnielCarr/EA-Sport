import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors } from '../../theme/colors';

export default function Badge({
    text,
    variant = 'default',
    size = 'medium',
    icon,
    pulse = false,
}) {
    const variantStyles = {
        default: { bg: colors.card, text: colors.text, border: colors.border },
        primary: { bg: 'rgba(0, 212, 255, 0.15)', text: colors.primary, border: colors.primary },
        success: { bg: 'rgba(16, 185, 129, 0.15)', text: colors.success, border: colors.success },
        warning: { bg: 'rgba(245, 158, 11, 0.15)', text: colors.warning, border: colors.warning },
        error: { bg: 'rgba(239, 68, 68, 0.15)', text: colors.error, border: colors.error },
        live: { bg: 'rgba(255, 51, 102, 0.15)', text: colors.live, border: colors.live },
        info: { bg: 'rgba(59, 130, 246, 0.15)', text: colors.info, border: colors.info },
    };

    const sizeStyles = {
        small: { paddingH: 6, paddingV: 2, fontSize: 10 },
        medium: { paddingH: 10, paddingV: 4, fontSize: 12 },
        large: { paddingH: 14, paddingV: 6, fontSize: 14 },
    };

    const style = variantStyles[variant] || variantStyles.default;
    const sizeStyle = sizeStyles[size] || sizeStyles.medium;

    return (
        <View style={[
            styles.badge,
            {
                backgroundColor: style.bg,
                borderColor: style.border,
                paddingHorizontal: sizeStyle.paddingH,
                paddingVertical: sizeStyle.paddingV,
            }
        ]}>
            {pulse && <View style={[styles.pulseDot, { backgroundColor: style.text }]} />}
            <Text style={[styles.text, { color: style.text, fontSize: sizeStyle.fontSize }]}>
                {text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 100,
        borderWidth: 1,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    text: {
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
