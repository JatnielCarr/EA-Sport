import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
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
    const Wrapper = onPress ? TouchableOpacity : View;
    const wrapperProps = onPress ? { onPress, activeOpacity: 0.8 } : {};

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

    if (gradient) {
        return (
            <Wrapper {...wrapperProps}>
                <LinearGradient
                    colors={[colors.card, colors.background]}
                    style={[styles.card, styles.cardGradient, style]}
                >
                    {cardContent}
                </LinearGradient>
            </Wrapper>
        );
    }

    return (
        <Wrapper 
            {...wrapperProps}
            style={[
                styles.card,
                variant === 'highlight' && styles.cardHighlight,
                variant === 'flat' && styles.cardFlat,
                style
            ]}
        >
            {cardContent}
        </Wrapper>
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
