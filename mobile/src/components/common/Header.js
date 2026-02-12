import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients } from '../../theme/colors';

export default function Header({
    title,
    subtitle,
    badge,
    showBack = false,
    onBack,
    rightAction,
    gradient = false,
    centered = false,
    size = 'medium',
}) {
    const titleSize = size === 'large' ? 28 : size === 'small' ? 18 : 22;

    const content = (
        <>
            {showBack && (
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
            )}
            <View style={[styles.textContainer, centered && styles.textCentered]}>
                {badge && (
                    <View style={styles.badge}>
                        <Ionicons name={badge.icon || 'star'} size={12} color={colors.primary} />
                        <Text style={styles.badgeText}>{badge.text}</Text>
                    </View>
                )}
                <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
        </>
    );

    if (gradient) {
        return (
            <LinearGradient
                colors={['rgba(0,212,255,0.1)', 'transparent']}
                style={[styles.container, styles.gradientContainer]}
            >
                {content}
            </LinearGradient>
        );
    }

    return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    gradientContainer: {
        paddingTop: 20,
        paddingBottom: 24,
        marginBottom: 8,
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    textContainer: {
        flex: 1,
    },
    textCentered: {
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    badgeText: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 6,
    },
    title: {
        fontWeight: '800',
        color: colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    rightAction: {
        marginLeft: 12,
    },
});
