import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Web support fallback since SecureStore doesn't work on web
const isWeb = Platform.OS === 'web';

// Cache prefix for identification
const CACHE_PREFIX = '@cache_';

export const storage = {
    // ==========================================
    // Sensitive data (Tokens)
    // ==========================================
    async setToken(token) {
        if (isWeb) {
            await AsyncStorage.setItem('auth_token', token);
        } else {
            await SecureStore.setItemAsync('auth_token', token);
        }
    },

    async getToken() {
        if (isWeb) {
            return await AsyncStorage.getItem('auth_token');
        } else {
            try {
                return await SecureStore.getItemAsync('auth_token');
            } catch (e) {
                return null;
            }
        }
    },

    async removeToken() {
        if (isWeb) {
            await AsyncStorage.removeItem('auth_token');
        } else {
            await SecureStore.deleteItemAsync('auth_token');
        }
    },

    // ==========================================
    // Non-sensitive data (User profile, settings)
    // ==========================================
    async setItem(key, value) {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
    },

    async getItem(key) {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    },

    async removeItem(key) {
        await AsyncStorage.removeItem(key);
    },

    // ==========================================
    // Cache System with TTL (Time-To-Live)
    // ==========================================

    /**
     * Store data in cache with expiration time
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttlMinutes - Time to live in minutes (default: 10)
     */
    async setCache(key, data, ttlMinutes = 10) {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);
        const cacheEntry = {
            data,
            expiresAt,
            createdAt: Date.now(),
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    },

    /**
     * Get cached data if not expired
     * @param {string} key - Cache key
     * @returns {any|null} - Cached data or null if expired/not found
     */
    async getCache(key) {
        try {
            const cacheKey = `${CACHE_PREFIX}${key}`;
            const jsonValue = await AsyncStorage.getItem(cacheKey);

            if (!jsonValue) return null;

            const cacheEntry = JSON.parse(jsonValue);

            // Check if cache has expired
            if (Date.now() > cacheEntry.expiresAt) {
                // Cache expired, remove it
                await AsyncStorage.removeItem(cacheKey);
                return null;
            }

            return cacheEntry.data;
        } catch (error) {
            console.warn('Cache read error:', error);
            return null;
        }
    },

    /**
     * Check if cache exists and is valid
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    async hasValidCache(key) {
        const data = await this.getCache(key);
        return data !== null;
    },

    /**
     * Remove specific cache entry
     * @param {string} key - Cache key
     */
    async removeCache(key) {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        await AsyncStorage.removeItem(cacheKey);
    },

    /**
     * Clear all cached data (preserves tokens and user data)
     */
    async clearCache() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
            await AsyncStorage.multiRemove(cacheKeys);
            console.log(`🗑️ Cleared ${cacheKeys.length} cache entries`);
        } catch (error) {
            console.warn('Clear cache error:', error);
        }
    },

    /**
     * Clear only expired cache entries
     */
    async clearExpiredCache() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));

            let expiredCount = 0;
            for (const cacheKey of cacheKeys) {
                const jsonValue = await AsyncStorage.getItem(cacheKey);
                if (jsonValue) {
                    const cacheEntry = JSON.parse(jsonValue);
                    if (Date.now() > cacheEntry.expiresAt) {
                        await AsyncStorage.removeItem(cacheKey);
                        expiredCount++;
                    }
                }
            }

            if (expiredCount > 0) {
                console.log(`🗑️ Cleared ${expiredCount} expired cache entries`);
            }
        } catch (error) {
            console.warn('Clear expired cache error:', error);
        }
    },

    /**
     * Get cache statistics
     * @returns {Object} - { totalEntries, validEntries, expiredEntries, totalSizeKB }
     */
    async getCacheStats() {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));

            let validCount = 0;
            let expiredCount = 0;
            let totalSize = 0;

            for (const cacheKey of cacheKeys) {
                const jsonValue = await AsyncStorage.getItem(cacheKey);
                if (jsonValue) {
                    totalSize += jsonValue.length;
                    const cacheEntry = JSON.parse(jsonValue);
                    if (Date.now() > cacheEntry.expiresAt) {
                        expiredCount++;
                    } else {
                        validCount++;
                    }
                }
            }

            return {
                totalEntries: cacheKeys.length,
                validEntries: validCount,
                expiredEntries: expiredCount,
                totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
            };
        } catch (error) {
            console.warn('Cache stats error:', error);
            return { totalEntries: 0, validEntries: 0, expiredEntries: 0, totalSizeKB: 0 };
        }
    },
};
