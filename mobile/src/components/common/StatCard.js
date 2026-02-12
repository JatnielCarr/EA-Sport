import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../../theme/colors';

export default function StatCard({
    value,
    label,
    icon,
    variant = 'default',
    size = 'medium',
}) {
    const iconColors = {
        default: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        warning: colors.warning,
        success: colors.success,
    };

    const isLarge = size === 'large';

    return (
        <View style={[styles.container, isLarge && styles.containerLarge]}>
            <View style={[
                styles.iconWrapper,
                { backgroundColor: `${iconColors[variant]}20` },
                isLarge && styles.iconWrapperLarge,
            ]}>
                <Ionicons 
                    name={icon} 
                    size={isLarge ? 28 : 22} 
                    color={iconColors[variant]} 
                />
            </View>
            <Text style={[styles.value, isLarge && styles.valueLarge]}>{value}</Text>
            <Text style={[styles.label, isLarge && styles.labelLarge]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 100,
    },
    containerLarge: {
        padding: 20,
        minWidth: 140,
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    iconWrapperLarge: {
        width: 56,
        height: 56,
        borderRadius: 16,
    },
    value: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 4,
    },
    valueLarge: {
        fontSize: 28,
    },
    label: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    labelLarge: {
        fontSize: 14,
    },
});
