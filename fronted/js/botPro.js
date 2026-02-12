/**
 * BotPro - Advanced Admin Assistant
 * Provides administrative tools and data analysis for ApexTournament admins
 */

import { ApiClient } from './api.js';

class BotPro {
    constructor() {
        this.isOpen = false;
        this.chatHistory = [];
        this.api = new ApiClient('http://localhost:3000');
        this.currentView = 'dashboard';
        this.init();
    }

    init() {
        this.createWidget();
        this.bindEvents();
        this.showWelcomeMessage();
    }

    createWidget() {
        // Prevent duplicate widgets
        if (document.getElementById('botProWidget')) return;

        const widget = document.createElement('div');
        widget.className = 'botpro-widget';
        widget.id = 'botProWidget';

        widget.innerHTML = `
            <!-- Floating Welcome Bubble -->
            <div class="botpro-bubble" id="botProBubble" style="position: fixed; bottom: 100px; right: 30px; max-width: 260px; background: linear-gradient(135deg, #1a1f2e 0%, #131722 100%); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 16px 16px 4px 16px; padding: 15px 18px; box-shadow: 0 10px 40px rgba(0, 212, 255, 0.2); z-index: 9998; animation: bubbleIn 0.5s ease-out, bubbleFloat 3s ease-in-out infinite 0.5s; cursor: pointer;">
                <button class="botpro-bubble-close" id="botProBubbleClose" style="position: absolute; top: 6px; right: 8px; background: none; border: none; color: #64748b; cursor: pointer; font-size: 12px; padding: 4px; line-height: 1;">✕</button>
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <div style="font-size: 28px; animation: wave 1.5s ease-in-out infinite;">👋</div>
                    <div>
                        <p style="margin: 0 0 6px 0; color: #fff; font-size: 14px; font-weight: 600; line-height: 1.4;">¿Necesitas ayuda?</p>
                        <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">¡Dame click! Te haré un <span style="color: #00ff88; font-weight: 600;">campeón competitivo</span> 🏆</p>
                    </div>
                </div>
                <div style="position: absolute; bottom: -8px; right: 20px; width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid #131722;"></div>
            </div>

            <!-- Toggle Button (Floating Action Button) -->
            <div class="botpro-toggle" id="botProToggle" style="position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #00d4ff 0%, #00ff88 100%); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 20px rgba(0, 212, 255, 0.5); z-index: 9999; transition: transform 0.3s ease; animation: pulse 2s ease-in-out infinite;">
                <i class="fas fa-robot" style="font-size: 24px; color: #fff;"></i>
                <span class="botpro-badge" style="position: absolute; top: -2px; right: -2px; background: linear-gradient(135deg, #ff3366, #ff6b35); color: #fff; font-size: 9px; font-weight: 700; padding: 3px 6px; border-radius: 10px; box-shadow: 0 2px 8px rgba(255, 51, 102, 0.4);">PRO</span>
            </div>

            <!-- Chat Window -->
            <div class="botpro-window" id="botProWindow" style="position: fixed; bottom: 100px; right: 30px; width: 350px; height: 500px; background: #1a1f2e; border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 15px; display: none; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 9999;">
                <div class="botpro-header" style="padding: 15px; background: rgba(0, 212, 255, 0.1); border-bottom: 1px solid rgba(0, 212, 255, 0.1); display: flex; justify-content: space-between; align-items: center;">
                    <div class="botpro-title" style="display: flex; align-items: center; gap: 10px;">
                        <h3 style="margin: 0; font-size: 16px; color: #00d4ff;"><i class="fas fa-crown"></i> BotPro Admin</h3>
                    </div>
                    <button class="botpro-close" id="botProClose" style="background: none; border: none; color: #64748b; cursor: pointer; font-size: 16px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="botpro-body" id="botProBody" style="flex: 1; padding: 15px; overflow-y: auto;">
                    <!-- Messages will be inserted here -->
                </div>

                <div class="botpro-footer" style="padding: 15px; border-top: 1px solid rgba(255, 255, 255, 0.05); background: #131722;">
                    <div class="botpro-input-container" style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <input type="text" id="botProInput" placeholder="Escribe un mensaje o comando..." autocomplete="off" style="flex: 1; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; padding: 8px 12px; border-radius: 8px;">
                        <button id="botProSend" class="botpro-send-btn" style="background: #00d4ff; border: none; color: #fff; width: 36px; border-radius: 8px; cursor: pointer;">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="botpro-commands" style="display: flex; gap: 5px; flex-wrap: wrap;">
                        <button class="cmd-btn" data-cmd="/stats" style="font-size: 11px; padding: 4px 8px; background: rgba(255, 255, 255, 0.05); border: none; color: #94a3b8; border-radius: 4px; cursor: pointer;">📊 Stats</button>
                        <button class="cmd-btn" data-cmd="/users" style="font-size: 11px; padding: 4px 8px; background: rgba(255, 255, 255, 0.05); border: none; color: #94a3b8; border-radius: 4px; cursor: pointer;">👥 Users</button>
                        <button class="cmd-btn" data-cmd="/tournaments" style="font-size: 11px; padding: 4px 8px; background: rgba(255, 255, 255, 0.05); border: none; color: #94a3b8; border-radius: 4px; cursor: pointer;">🏆 Tournaments</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(widget);

        // Add animations CSS
        this.addAnimationStyles();

        // Cache DOM elements
        this.elements = {
            widget: widget,
            toggle: document.getElementById('botProToggle'),
            window: document.getElementById('botProWindow'),
            close: document.getElementById('botProClose'),
            body: document.getElementById('botProBody'),
            input: document.getElementById('botProInput'),
            send: document.getElementById('botProSend'),
            bubble: document.getElementById('botProBubble'),
            bubbleClose: document.getElementById('botProBubbleClose')
        };

        // Auto-hide bubble after 15 seconds if not interacted
        this.bubbleTimeout = setTimeout(() => {
            this.hideBubble();
        }, 15000);
    }

    addAnimationStyles() {
        if (document.getElementById('botProStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'botProStyles';
        style.textContent = `
            @keyframes bubbleIn {
                0% { opacity: 0; transform: scale(0.8) translateY(20px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes bubbleFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            @keyframes wave {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(20deg); }
                75% { transform: rotate(-15deg); }
            }
            @keyframes pulse {
                0%, 100% { box-shadow: 0 4px 20px rgba(0, 212, 255, 0.5); }
                50% { box-shadow: 0 4px 30px rgba(0, 212, 255, 0.8), 0 0 60px rgba(0, 255, 136, 0.3); }
            }
            .botpro-bubble:hover {
                transform: translateY(-3px) scale(1.02) !important;
                box-shadow: 0 15px 50px rgba(0, 212, 255, 0.3) !important;
            }
            .botpro-toggle:hover {
                transform: scale(1.1) !important;
            }
            .botpro-bubble-close:hover {
                color: #ff4444 !important;
            }
        `;
        document.head.appendChild(style);
    }

    hideBubble() {
        if (this.elements.bubble) {
            this.elements.bubble.style.animation = 'none';
            this.elements.bubble.style.opacity = '0';
            this.elements.bubble.style.transform = 'scale(0.8) translateY(20px)';
            this.elements.bubble.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (this.elements.bubble) {
                    this.elements.bubble.style.display = 'none';
                }
            }, 300);
        }
    }

    bindEvents() {
        // Toggle chat window
        this.elements.toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        this.elements.close.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
        });

        // Bubble click opens bot and hides bubble
        if (this.elements.bubble) {
            this.elements.bubble.addEventListener('click', (e) => {
                if (e.target === this.elements.bubbleClose || e.target.closest('.botpro-bubble-close')) {
                    e.stopPropagation();
                    this.hideBubble();
                    return;
                }
                e.stopPropagation();
                clearTimeout(this.bubbleTimeout);
                this.hideBubble();
                this.open();
            });
        }

        // Bubble close button
        if (this.elements.bubbleClose) {
            this.elements.bubbleClose.addEventListener('click', (e) => {
                e.stopPropagation();
                clearTimeout(this.bubbleTimeout);
                this.hideBubble();
            });
        }

        // Prevent closing when clicking inside the window
        this.elements.window.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Send message
        this.elements.send.addEventListener('click', () => this.sendUserMessage());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendUserMessage();
            }
        });

        // Command buttons - need to wait a tick for them to be in DOM
        setTimeout(() => {
            document.querySelectorAll('.cmd-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const cmd = btn.dataset.cmd;
                    this.elements.input.value = cmd;
                    this.sendUserMessage();
                });
            });
        }, 100);

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        // Hide bubble when opening chat
        clearTimeout(this.bubbleTimeout);
        this.hideBubble();
        this.elements.window.style.display = 'flex';
        this.elements.toggle.innerHTML = '<i class="fas fa-times" style="font-size: 24px; color: #fff;"></i>';
        this.elements.toggle.style.animation = 'none';
        this.elements.input.focus();
    }

    close() {
        this.isOpen = false;
        this.elements.window.style.display = 'none';
        this.elements.toggle.innerHTML = '<i class="fas fa-robot" style="font-size: 24px; color: #fff;"></i><span class="botpro-badge" style="position: absolute; top: -2px; right: -2px; background: linear-gradient(135deg, #ff3366, #ff6b35); color: #fff; font-size: 9px; font-weight: 700; padding: 3px 6px; border-radius: 10px; box-shadow: 0 2px 8px rgba(255, 51, 102, 0.4);">PRO</span>';
        this.elements.toggle.style.animation = 'pulse 2s ease-in-out infinite';
    }

    showWelcomeMessage() {
        const welcomeMsg = `🤖 **BotPro Admin Activado**

Soy tu asistente administrativo. Puedo ayudarte con estadísticas y gestión.

💬 **¿Quieres más opciones?**
Habla conmigo en Telegram para recibir notificaciones y gestionar desde tu móvil.
<a href="https://t.me/TuBotTelegram" target="_blank" style="color: #00d4ff; text-decoration: underline;">👉 Abrir en Telegram</a>

O usa los comandos aquí mismo:`;

        this.addMessage(welcomeMsg, 'bot');
    }

    async sendUserMessage() {
        const message = this.elements.input.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.elements.input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Process command and respond
        try {
            const response = await this.processCommand(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('❌ Error al procesar el comando. Verifica la sintaxis e intenta de nuevo.', 'bot');
            console.error('BotPro error:', error);
        }
    }

    async processCommand(command) {
        const cmd = command.toLowerCase().trim();

        if (cmd === '/help' || cmd === 'help') {
            return this.getHelpText();
        }

        if (cmd === '/stats' || cmd.startsWith('/stats')) {
            return await this.getSystemStats();
        }

        if (cmd === '/users' || cmd.startsWith('/users')) {
            return await this.getUsersStats();
        }

        if (cmd === '/tournaments' || cmd.startsWith('/tournaments')) {
            return await this.getTournamentsStats();
        }

        if (cmd.startsWith('/user ')) {
            const userId = cmd.split(' ')[1];
            return await this.getUserDetails(userId);
        }

        if (cmd.startsWith('/tournament ')) {
            const tournamentId = cmd.split(' ')[1];
            return await this.getTournamentDetails(tournamentId);
        }

        if (cmd === '/clear' || cmd === 'clear') {
            this.chatHistory = [];
            this.elements.body.innerHTML = '';
            return '🧹 Historial limpiado.';
        }

        return `❓ Comando no reconocido. Escribe "/help" para ver los comandos disponibles.`;
    }

    getHelpText() {
        return `📋 **Comandos Disponibles:**

**Estadísticas:**
• \`/stats\` - Estadísticas generales del sistema
• \`/users\` - Resumen de usuarios
• \`/tournaments\` - Resumen de torneos

**Detalles:**
• \`/user [ID]\` - Detalles de un usuario específico
• \`/tournament [ID]\` - Detalles de un torneo específico

**Utilidades:**
• \`/clear\` - Limpiar historial de chat
• \`/help\` - Mostrar esta ayuda

**Ejemplos:**
• \`/user 123\` - Ver detalles del usuario con ID 123
• \`/tournament abc\` - Ver detalles del torneo con ID abc`;
    }

    async getSystemStats() {
        try {
            const [users, tournaments, matches] = await Promise.all([
                this.api.request('/users'),
                this.api.request('/tournaments'),
                this.api.request('/matches')
            ]);

            const totalUsers = users?.length || 0;
            const totalTournaments = tournaments?.length || 0;
            const totalMatches = matches?.length || 0;
            const activeTournaments = tournaments?.filter(t => t.status === 'active').length || 0;
            const liveMatches = matches?.filter(m => m.status === 'in_progress').length || 0;

            return `📊 **Estadísticas del Sistema:**

👥 **Usuarios:** ${totalUsers}
🏆 **Torneos Totales:** ${totalTournaments}
🏆 **Torneos Activos:** ${activeTournaments}
⚽ **Partidas Totales:** ${totalMatches}
🔴 **Partidas en Vivo:** ${liveMatches}

📈 **Actividad Reciente:**
• Torneos activos: ${((activeTournaments / totalTournaments) * 100).toFixed(1)}%
• Partidas en vivo: ${liveMatches}`;
        } catch (error) {
            console.error('Error fetching system stats:', error);
            return '❌ Error al obtener estadísticas del sistema.';
        }
    }

    async getUsersStats() {
        try {
            const users = await this.api.request('/users');
            if (!users || users.length === 0) {
                return '📭 No hay usuarios registrados.';
            }

            const totalUsers = users.length;
            const verifiedUsers = users.filter(u => u.emailVerified).length;
            const usersWithStats = users.filter(u => u.stats).length;

            // Top players
            const topPlayers = users
                .filter(u => u.stats)
                .sort((a, b) => (b.stats.totalPoints || 0) - (a.stats.totalPoints || 0))
                .slice(0, 3);

            let response = `👥 **Resumen de Usuarios:**

📊 **Total:** ${totalUsers}
✅ **Verificados:** ${verifiedUsers} (${((verifiedUsers / totalUsers) * 100).toFixed(1)}%)
📈 **Con Estadísticas:** ${usersWithStats}

🏅 **Top 3 Jugadores:**
`;

            topPlayers.forEach((user, index) => {
                const medal = ['🥇', '🥈', '🥉'][index];
                response += `${medal} ${user.username} - ${user.stats.totalPoints || 0} pts\n`;
            });

            return response;
        } catch (error) {
            console.error('Error fetching users stats:', error);
            return '❌ Error al obtener estadísticas de usuarios.';
        }
    }

    async getTournamentsStats() {
        try {
            const tournaments = await this.api.request('/tournaments');
            if (!tournaments || tournaments.length === 0) {
                return '🏆 No hay torneos registrados.';
            }

            const totalTournaments = tournaments.length;
            const activeTournaments = tournaments.filter(t => t.status === 'active').length;
            const completedTournaments = tournaments.filter(t => t.status === 'completed').length;

            // Group by game
            const gamesCount = {};
            tournaments.forEach(t => {
                const gameName = t.game?.name || 'Sin juego';
                gamesCount[gameName] = (gamesCount[gameName] || 0) + 1;
            });

            let response = `🏆 **Resumen de Torneos:**

📊 **Total:** ${totalTournaments}
🟢 **Activos:** ${activeTournaments}
✅ **Completados:** ${completedTournaments}
⏳ **Pendientes:** ${totalTournaments - activeTournaments - completedTournaments}

🎮 **Por Juego:**
`;

            Object.entries(gamesCount).forEach(([game, count]) => {
                response += `• ${game}: ${count}\n`;
            });

            return response;
        } catch (error) {
            console.error('Error fetching tournaments stats:', error);
            return '❌ Error al obtener estadísticas de torneos.';
        }
    }

    async getUserDetails(userId) {
        try {
            const user = await this.api.request(`/users/${userId}`);
            if (!user) {
                return `❌ Usuario con ID "${userId}" no encontrado.`;
            }

            let response = `👤 **Detalles del Usuario:**

🆔 **ID:** ${user.id}
👤 **Username:** ${user.username}
📧 **Email:** ${user.email}
✅ **Verificado:** ${user.emailVerified ? 'Sí' : 'No'}
📅 **Creado:** ${new Date(user.createdAt).toLocaleDateString()}

📊 **Estadísticas:**
`;

            if (user.stats) {
                response += `🏆 **Puntos Totales:** ${user.stats.totalPoints || 0}\n`;
                response += `🎯 **Victorias:** ${user.stats.wins || 0}\n`;
                response += `❌ **Derrotas:** ${user.stats.losses || 0}\n`;
                response += `📈 **Win Rate:** ${user.stats.wins && user.stats.losses ?
                    ((user.stats.wins / (user.stats.wins + user.stats.losses)) * 100).toFixed(1) + '%' : 'N/A'}\n`;
            } else {
                response += '📭 Sin estadísticas disponibles\n';
            }

            if (user.clan) {
                response += `\n👥 **Clan:** ${user.clan.name}\n`;
                response += `🎖️ **Rol:** ${user.clanRole || 'Miembro'}\n`;
            }

            return response;
        } catch (error) {
            console.error('Error fetching user details:', error);
            return `❌ Error al obtener detalles del usuario "${userId}".`;
        }
    }

    async getTournamentDetails(tournamentId) {
        try {
            const tournament = await this.api.request(`/tournaments/${tournamentId}`);
            if (!tournament) {
                return `❌ Torneo con ID "${tournamentId}" no encontrado.`;
            }

            let response = `🏆 **Detalles del Torneo:**

🆔 **ID:** ${tournament.id}
🏷️ **Nombre:** ${tournament.name}
🎮 **Juego:** ${tournament.game?.name || 'N/A'}
📊 **Estado:** ${this.getStatusText(tournament.status)}
👥 **Participantes:** ${tournament.participants?.length || 0}/${tournament.maxParticipants}

📅 **Fechas:**
• **Inicio:** ${new Date(tournament.startDate).toLocaleDateString()}
• **Fin:** ${new Date(tournament.endDate).toLocaleDateString()}

💰 **Premios:**
`;

            if (tournament.prizes && tournament.prizes.length > 0) {
                tournament.prizes.forEach((prize, index) => {
                    const medal = ['🥇', '🥈', '🥉'][index] || `🏅 ${index + 1}º`;
                    response += `${medal} ${prize}\n`;
                });
            } else {
                response += '🏆 Premios no especificados\n';
            }

            return response;
        } catch (error) {
            console.error('Error fetching tournament details:', error);
            return `❌ Error al obtener detalles del torneo "${tournamentId}".`;
        }
    }

    getStatusText(status) {
        const statusMap = {
            'pending': '⏳ Pendiente',
            'active': '🟢 Activo',
            'completed': '✅ Completado',
            'cancelled': '❌ Cancelado'
        };
        return statusMap[status] || status;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot typing';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        this.elements.body.appendChild(typingDiv);
        this.elements.body.scrollTop = this.elements.body.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = this.elements.body.querySelector('.typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    addMessage(content, type, isHtml = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;

        if (isHtml) {
            messageDiv.innerHTML = content;
        } else {
            // Convert markdown-like formatting
            const formatted = content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            messageDiv.innerHTML = formatted;
        }

        this.elements.body.appendChild(messageDiv);

        // Scroll to bottom
        this.elements.body.scrollTop = this.elements.body.scrollHeight;

        // Save to history
        this.chatHistory.push({ type, content });
    }
}

// Export initialization function for app.js
export function initBotPro() {
    if (!window.apexBotPro) {
        window.apexBotPro = new BotPro();
    }
}