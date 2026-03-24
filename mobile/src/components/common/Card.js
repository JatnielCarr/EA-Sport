import React, { useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, shadows } from '../../theme/colors';

export default function Card({
    children,
    title,
    subtitle,
    icon,
    headerAction,
    onPress,
    variant = 'default',
    style,
    gradient = false,
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (onPress) {
            Animated.spring(scaleAnim, {
                toValue: 0.975,
                useNativeDriver: true,
                speed: 50,
                bounciness: 4,
            }).start();
        }
    };

    const handlePressOut = () => {
        if (onPress) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                speed: 40,
                bounciness: 6,
            }).start();
        }
    };

    const cardContent = (
        <>
            {(title || icon || headerAction) && (
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        {icon && (
                            <View style={[styles.iconContainer, variant === 'highlight' && styles.iconHighlight]}>
                                <Ionicons name={icon} size={20} color={colors.primary} />
                            </View>
                        )}
                        <View>
                            {title && <Text style={styles.title}>{title}</Text>}
                            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                        </View>
                    </View>
                    {headerAction}
                </View>
            )}
            {children}
        </>
    );

    const cardStyle = [
        styles.card,
        variant === 'highlight' && styles.cardHighlight,
        variant === 'flat' && styles.cardFlat,
        variant === 'elevated' && styles.cardElevated,
        style,
    ];

    if (gradient) {
        if (onPress) {
            return (
                <TouchableOpacity
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={1}
                >
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <LinearGradient
                            colors={[colors.card, colors.background]}
                            style={[styles.card, styles.cardGradient, style]}
                        >
                            {cardContent}
                        </LinearGradient>
                    </Animated.View>
                </TouchableOpacity>
            );
        }
        return (
            <LinearGradient
                colors={[colors.card, colors.background]}
                style={[styles.card, styles.cardGradient, style]}
            >
                {cardContent}
            </LinearGradient>
        );
    }

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                <Animated.View style={[cardStyle, { transform: [{ scale: scaleAnim }] }]}>
                    {cardContent}
                </Animated.View>
            </TouchableOpacity>
        );
    }

    return (
        <View style={cardStyle}>
            {cardContent}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 12,
        ...shadows.small,
    },
    cardHighlight: {
        borderColor: colors.primary,
        borderWidth: 1.5,
    },
    cardFlat: {
        borderWidth: 0,
        ...shadows.medium,
    },
    cardElevated: {
        backgroundColor: colors.cardElevated,
        borderColor: colors.glassBorder,
        ...shadows.large,
    },
    cardGradient: {
        borderWidth: 1,
        borderColor: colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconHighlight: {
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
});
