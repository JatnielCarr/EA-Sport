/**
 * Discord OAuth2 Authentication Routes - ApexTournament
 * Maneja autenticación directa con Discord (sin Firebase)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:5173/discord-callback.html';

interface DiscordCallbackBody {
    code: string;
}

export async function discordAuthRoutes(app: FastifyInstance) {

    /**
     * POST /auth/discord/callback
     * Exchange Discord authorization code for user data and JWT
     */
    app.post('/auth/discord/callback', {
        schema: {
            tags: ['Auth'],
            description: 'Exchange Discord OAuth code for JWT token',
            body: {
                type: 'object',
                required: ['code'],
                properties: {
                    code: { type: 'string' }
                }
            }
        }
    }, async (request: FastifyRequest<{ Body: DiscordCallbackBody }>, reply: FastifyReply) => {
        try {
            const { code } = request.body;

            if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
                return reply.status(500).send({
                    success: false,
                    error: 'Discord OAuth no está configurado en el servidor'
                });
            }

            // 1. Exchange code for access token
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: DISCORD_CLIENT_ID,
                    client_secret: DISCORD_CLIENT_SECRET,
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: DISCORD_REDIRECT_URI
                }).toString()
            });

            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.text();
                console.error('Discord token exchange error:', errorData);
                return reply.status(400).send({
                    success: false,
                    error: 'No se pudo verificar el código de Discord'
                });
            }

            const tokenData = await tokenResponse.json() as any;
            const accessToken = tokenData.access_token;

            // 2. Get Discord user info
            const userResponse = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!userResponse.ok) {
                return reply.status(400).send({
                    success: false,
                    error: 'No se pudo obtener información del usuario de Discord'
                });
            }

            const discordUser = await userResponse.json() as any;
            const discordEmail = discordUser.email;
            const discordUsername = discordUser.username;
            const discordId = discordUser.id;

            if (!discordEmail) {
                return reply.status(400).send({
                    success: false,
                    error: 'Tu cuenta de Discord no tiene un email asociado. Asegúrate de tener un email verificado en Discord.'
                });
            }

            // 3. Find or create user in MySQL (match by email)
            let user = await prisma.user.findFirst({
                where: {
                    email: discordEmail.toLowerCase()
                }
            });

            if (!user) {
                // Create new user
                const uniqueUsername = discordUsername + '_' + discordId.slice(-4);
                user = await prisma.user.create({
                    data: {
                        email: discordEmail.toLowerCase(),
                        username: uniqueUsername,
                        password_hash: 'DISCORD_AUTH',
                        verified: true,
                        role: 'USER'
                    }
                });
                console.log(`New user created via Discord: ${user.email}`);
            }

            // 4. Check if user is banned
            if (user.banned) {
                const now = new Date();
                if (user.ban_duration === 'permanent' || (user.banned_until && user.banned_until > now)) {
                    return reply.status(403).send({
                        success: false,
                        error: 'ACCOUNT_BANNED',
                        banned: true,
                        ban_info: {
                            username: user.username,
                            reason: user.ban_reason || 'Violación de las reglas de la comunidad',
                            duration: user.ban_duration,
                            banned_at: user.banned_at,
                            banned_until: user.banned_until
                        }
                    });
                } else {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { banned: false, ban_reason: null, ban_duration: null, banned_at: null, banned_until: null }
                    });
                }
            }

            // 5. Generate JWT token
            const jwtToken = app.jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role
                },
                { expiresIn: '7d' }
            );

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
            console.error('Discord auth error:', error);
            return reply.status(500).send({
                success: false,
                error: 'Error de autenticación con Discord'
            });
        }
    });
}

export default discordAuthRoutes;
