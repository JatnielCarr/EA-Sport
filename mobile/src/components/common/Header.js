import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
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
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(10)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 350,
                delay: 50,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: 50,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const content = (
        <>
            {showBack && (
                <TouchableOpacity style={styles.backButton} onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <View style={styles.backButtonInner}>
                        <Ionicons name="arrow-back" size={22} color={colors.text} />
                    </View>
                </TouchableOpacity>
            )}
            <Animated.View
                style={[
                    styles.textContainer,
                    centered && styles.textCentered,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                {badge && (
                    <View style={styles.badge}>
                        <Ionicons name={badge.icon || 'star'} size={12} color={colors.primary} />
                        <Text style={styles.badgeText}>{badge.text}</Text>
                    </View>
                )}
                <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </Animated.View>
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
        marginRight: 8,
        padding: 4,
    },
    backButtonInner: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        alignItems: 'center',
        justifyContent: 'center',
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
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
        lineHeight: 20,
    },
    rightAction: {
        marginLeft: 12,
    },
});
