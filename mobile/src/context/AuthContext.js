import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';
import { storage } from '../services/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let token = await storage.getToken();
            let user = await storage.getItem('user_info');

            if (token) {
                setUserToken(token);
                setUserInfo(user);

                // Verify token validity by fetching profile (but don't block if server is down)
                try {
                    const response = await api.get('/auth/me');
                    if (response && response.success && response.data) {
                        setUserInfo(response.data);
                        storage.setItem('user_info', response.data);
                    }
                } catch (e) {
                    // Only logout if explicitly unauthorized, not on timeout/network errors
                    if (e.status === 401) {
                        logout();
                    }
                    // Otherwise keep the cached user info and continue
                    console.warn('Could not verify token, using cached user info');
                }
            }
        } catch (e) {
            console.log(`Is Logged In Error: ${e}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.success && response.data.token) {
                const token = response.data.token;
                const user = response.data.user;

                setUserToken(token);
                setUserInfo(user);

                await storage.setToken(token);
                await storage.setItem('user_info', user);
            }
            return response;
        } catch (e) {
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email, username, password) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/register', { email, username, password });

            if (response.success && response.data.token) {
                const token = response.data.token;
                const user = response.data.user.user ? response.data.user.user : response.data.user;

                setUserToken(token);
                setUserInfo(user);

                await storage.setToken(token);
                await storage.setItem('user_info', user);
            }
            return response;
        } catch (e) {
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        storage.removeToken();
        storage.removeItem('user_info');
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ login, register, logout, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
