import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';

export default function Loading({ text, size = 'large', fullScreen = true }) {
    if (!fullScreen) {
        return (
            <View style={styles.inline}>
                <ActivityIndicator size={size} color={colors.primary} />
                {text && <Text style={styles.inlineText}>{text}</Text>}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <ActivityIndicator size={size} color={colors.primary} />
                {text && <Text style={styles.text}>{text}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    content: {
        alignItems: 'center',
        padding: 24,
    },
    text: {
        color: colors.textSecondary,
        marginTop: 16,
        fontSize: 14,
    },
    inline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    inlineText: {
        color: colors.textSecondary,
        marginLeft: 12,
        fontSize: 14,
    },
});
