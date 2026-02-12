/**
 * Firebase Authentication Routes for Fastify - ApexTournament
 * Endpoint para autenticación con Firebase (compatible con Fastify)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyFirebaseToken, getFirebaseUser } from '../config/firebase-admin';
import { prisma } from '../config/database';

interface FirebaseAuthBody {
    username?: string;
}

interface FirebaseLoginBody {
    firebaseUid: string;
    email: string;
    displayName?: string;
}

export async function firebaseAuthRoutes(app: FastifyInstance) {

    /**
     * POST /auth/firebase-login
     * Login with Firebase UID (for Google Sign-In users)
     */
    app.post('/auth/firebase-login', {
        schema: {
            tags: ['Auth'],
            description: 'Login with Firebase UID',
            body: {
                type: 'object',
                required: ['firebaseUid', 'email'],
                properties: {
                    firebaseUid: { type: 'string' },
                    email: { type: 'string' },
                    displayName: { type: 'string' }
                }
            }
        }
    }, async (request: FastifyRequest<{ Body: FirebaseLoginBody }>, reply: FastifyReply) => {
        try {
            const { firebaseUid, email, displayName } = request.body;

            // Find user by Firebase UID or email
            let user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { id: firebaseUid },
                        { email: email.toLowerCase() }
                    ]
                }
            });

            if (!user) {
                return reply.status(404).send({
                    success: false,
                    error: 'Usuario no encontrado. Por favor, regístrate primero.'
                });
            }

            // Generate JWT token
            const token = app.jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    firebaseUid
                },
                { expiresIn: '7d' }
            );

            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role
                }
            };

        } catch (error: any) {
            console.error('Firebase login error:', error);
            return reply.status(500).send({
                success: false,
                error: 'Error en el servidor'
            });
        }
    });
    /**
     * POST /auth/firebase
     * Authenticate with Firebase token and sync with MySQL
     */
    app.post('/auth/firebase', {
        schema: {
            tags: ['Auth'],
            description: 'Authenticate with Firebase token',
            headers: {
                type: 'object',
                properties: {
                    authorization: { type: 'string' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    username: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                user: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        email: { type: 'string' },
                                        username: { type: 'string' },
                                        role: { type: 'string' },
                                        verified: { type: 'boolean' }
                                    }
                                },
                                token: { type: 'string' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request: FastifyRequest<{ Body: FirebaseAuthBody }>, reply: FastifyReply) => {
        try {
            // Get Firebase token from Authorization header
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.status(401).send({
                    success: false,
                    error: 'Token de Firebase requerido'
                });
            }

            const firebaseToken = authHeader.split(' ')[1];
            const { username } = request.body || {};

            // Verify Firebase token
            const decodedToken = await verifyFirebaseToken(firebaseToken);
            const firebaseUser = await getFirebaseUser(decodedToken.uid);

            // Find or create user in MySQL
            let user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: firebaseUser.email },
                        { id: decodedToken.uid }
                    ]
                }
            });

            if (!user) {
                // Create new user
                const displayName = firebaseUser.displayName || username || firebaseUser.email?.split('@')[0];

                user = await prisma.user.create({
                    data: {
                        id: decodedToken.uid,
                        email: firebaseUser.email!,
                        username: displayName || `user_${Date.now()}`,
                        password_hash: 'FIREBASE_AUTH',
                        verified: firebaseUser.emailVerified || false,
                        role: 'USER'
                    }
                });

                console.log(`New user created via Firebase: ${user.email}`);
            } else {
                // Update existing user's verified status if needed
                if (firebaseUser.emailVerified && !user.verified) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: { verified: true }
                    });
                }
            }

            // Generate JWT token for backend API calls
            const jwtToken = app.jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    firebaseUid: decodedToken.uid
                },
                { expiresIn: '7d' }
            );

            // Return user data and token
            return {
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        role: user.role,
                        verified: user.verified
                    },
                    token: jwtToken
                }
            };

        } catch (error: any) {
            console.error('Firebase auth error:', error);

            if (error.code === 'auth/id-token-expired') {
                return reply.status(401).send({
                    success: false,
                    error: 'Token expirado'
                });
            }

            if (error.code === 'auth/invalid-id-token') {
                return reply.status(401).send({
                    success: false,
                    error: 'Token inválido'
                });
            }

            return reply.status(500).send({
                success: false,
                error: 'Error de autenticación'
            });
        }
    });

    /**
     * GET /auth/firebase/verify
     * Verify if current Firebase token is valid
     */
    app.get('/auth/firebase/verify', {
        schema: {
            tags: ['Auth'],
            description: 'Verify Firebase token',
            headers: {
                type: 'object',
                properties: {
                    authorization: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        valid: { type: 'boolean' },
                        uid: { type: 'string' },
                        email: { type: 'string' }
                    }
                }
            }
        }
    }, async (request: FastifyRequest) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return {
                    success: false,
                    valid: false
                };
            }

            const firebaseToken = authHeader.split(' ')[1];
            const decodedToken = await verifyFirebaseToken(firebaseToken);

            return {
                success: true,
                valid: true,
                uid: decodedToken.uid,
                email: decodedToken.email
            };

        } catch (error) {
            return {
                success: false,
                valid: false
            };
        }
    });
}

export default firebaseAuthRoutes;
