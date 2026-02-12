/**
 * ChatBot Widget - ApexTournament Help Assistant
 * Provides interactive help and FAQs for users
 */

import { ApiClient } from '../api.js';

class ChatBot {
    constructor() {
        this.isOpen = false;
        this.chatHistory = [];
        this.api = new ApiClient('http://localhost:3000');
        this.init();
    }

    init() {
        this.createWidget();
        this.bindEvents();
        this.showWelcomeMessage();
    }

    createWidget() {
        // Prevent duplicate widgets
        if (document.getElementById('chatbotWidget')) return;

        const widget = document.createElement('div');
        widget.className = 'chatbot-widget';
        widget.id = 'chatbotWidget';

        widget.innerHTML = `
            <!-- Toggle Button -->
            <div class="chatbot-toggle" id="chatbotToggle">
                <i class="fas fa-headset"></i>
            </div>

            <!-- Chat Window -->
            <div class="chatbot-window" id="chatbotWindow">
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <h3><i class="fas fa-robot"></i> Asistente Apex</h3>
                        <p>¿En qué puedo ayudarte?</p>
                    </div>
                    <button class="chatbot-close" id="chatbotClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="chatbot-body" id="chatbotBody">
                    <!-- Messages will be inserted here -->
                </div>

                <div class="chatbot-footer">
                    <div class="chatbot-input-container">
                        <input type="text" id="chatbotInput" placeholder="Escribe tu pregunta..." autocomplete="off">
                        <button id="chatbotSend" class="chatbot-send-btn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <a href="https://t.me/ApexTournamentBot" target="_blank" class="telegram-link">
                        <i class="fab fa-telegram"></i>
                        Contactar por Telegram
                    </a>
                </div>
            </div>
        `;

        document.body.appendChild(widget);

        // Cache DOM elements
        this.elements = {
            widget: widget,
            toggle: document.getElementById('chatbotToggle'),
            window: document.getElementById('chatbotWindow'),
            close: document.getElementById('chatbotClose'),
            body: document.getElementById('chatbotBody'),
            input: document.getElementById('chatbotInput'),
            send: document.getElementById('chatbotSend')
        };
    }

    bindEvents() {
        // Toggle chat window
        this.elements.toggle.addEventListener('click', (e) => {
            console.log('Chatbot toggle clicked');
            e.stopPropagation();
            this.toggle();
        });
        this.elements.close.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
        });

        // Send message
        this.elements.send.addEventListener('click', () => this.sendUserMessage());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendUserMessage();
            }
        });

        // Event delegation for dynamic option buttons (instant response)
        this.elements.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.chat-option-btn');
            if (btn) {
                const action = btn.dataset.action;
                if (action === 'more') {
                    this.showQuickOptions();
                } else {
                    this.handleQuickOption(action);
                }
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen &&
                !this.elements.widget.contains(e.target)) {
                this.close();
            }
        });

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
        this.elements.window.classList.add('active');
        this.elements.toggle.innerHTML = '<i class="fas fa-times"></i>';
        this.elements.input.focus();
    }

    close() {
        this.isOpen = false;
        this.elements.window.classList.remove('active');
        this.elements.toggle.innerHTML = '<i class="fas fa-headset"></i>';
    }

    addMessage(content, sender, isHtml = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;

        if (isHtml) {
            messageDiv.innerHTML = content;
        } else {
            // Convert markdown-style bold to HTML and preserve line breaks
            const formattedContent = content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            messageDiv.innerHTML = formattedContent;
        }

        this.elements.body.appendChild(messageDiv);
        this.chatHistory.push({ content, sender });

        // Scroll to bottom
        this.elements.body.scrollTop = this.elements.body.scrollHeight;
    }

    showWelcomeMessage() {
        const welcomeMsg = `¡Hola! 👋 Soy el asistente de ApexTournament. 
        
Estoy aquí para ayudarte con cualquier duda sobre torneos, registro, y más.`;

        this.addMessage(welcomeMsg, 'bot');
        this.showQuickOptions();
    }

    showQuickOptions() {
        const options = [
            { text: '🏆 ¿Cómo me registro en un torneo?', action: 'registro' },
            { text: '📋 Reglas de los torneos', action: 'reglas' },
            { text: '👥 ¿Cómo creo un clan?', action: 'clan' },
            { text: '🔴 ¿Cómo veo partidas en vivo?', action: 'live' },
            { text: '💬 Hablar con soporte', action: 'soporte' }
        ];

        const optionsHtml = `
            <div class="chat-options">
                ${options.map(opt => `
                    <button class="chat-option-btn" data-action="${opt.action}">
                        ${opt.text}
                    </button>
                `).join('')}
            </div>
        `;

        this.addMessage(optionsHtml, 'bot', true);
        // Event delegation handles clicks - no setTimeout needed
    }

    handleQuickOption(action) {
        const responses = {
            registro: {
                user: '¿Cómo me registro en un torneo?',
                bot: `Para registrarte en un torneo:

1️⃣ Ve a la sección **Torneos** en el menú principal
2️⃣ Encuentra el torneo que te interesa
3️⃣ Haz clic en **Ver Detalles**
4️⃣ Presiona el botón **Inscribirse**
5️⃣ Completa el formulario con tus datos

⚠️ Asegúrate de cumplir con los requisitos del torneo antes de inscribirte.`
            },
            reglas: {
                user: 'Reglas de los torneos',
                bot: `📜 **Reglas Generales:**

• Todos los participantes deben tener una cuenta verificada
• No se permite el uso de hacks, cheats o modificaciones
• Debes estar presente 15 minutos antes del inicio
• El comportamiento antideportivo resulta en descalificación
• Las decisiones de los árbitros son finales

Cada torneo puede tener reglas específicas adicionales que se detallan en su página.`
            },
            clan: {
                user: '¿Cómo creo un clan?',
                bot: `Para crear tu propio clan:

1️⃣ Inicia sesión en tu cuenta
2️⃣ Ve a la sección **Clanes**
3️⃣ Haz clic en **Crear Clan**
4️⃣ Elige un nombre y personaliza tu clan
5️⃣ ¡Invita a tus amigos!

👥 Como líder, podrás gestionar miembros y representar a tu clan en torneos.`
            },
            live: {
                user: '¿Cómo veo partidas en vivo?',
                bot: `Para ver partidas en vivo:

1️⃣ Ve a **En Vivo** en el menú principal
2️⃣ Verás todas las partidas activas
3️⃣ Haz clic en cualquier partida para ver detalles
4️⃣ Sigue el marcador en tiempo real

🔔 Activa las notificaciones para no perderte ninguna partida importante.`
            },
            soporte: {
                user: 'Hablar con soporte',
                bot: `Puedes contactar a nuestro equipo de soporte de las siguientes formas:

📱 **Telegram:** @ApexTournamentBot
📧 **Email:** soporte@apextournament.com

⏰ Horario de atención: 9:00 AM - 9:00 PM

También puedes usar el botón de Telegram abajo para contactarnos directamente.`
            }
        };

        const response = responses[action];
        if (response) {
            this.addMessage(response.user, 'user');
            // Instant response - no delay needed
            this.addMessage(response.bot, 'bot');
            this.showMoreHelp();
        }
    }

    showMoreHelp() {
        // Show more help option with minimal delay for UX
        const moreHelpHtml = `
            <div class="chat-options">
                <button class="chat-option-btn" data-action="more">
                    🔄 Ver más opciones de ayuda
                </button>
            </div>
        `;
        this.addMessage(moreHelpHtml, 'bot', true);
        // Event delegation handles clicks - no setTimeout needed
    }

    async sendUserMessage() {
        const message = this.elements.input.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.elements.input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Process message and respond
        try {
            const response = await this.processMessage(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
            this.showMoreHelp();
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.', 'bot');
            console.error('Chatbot error:', error);
        }
    }

    async processMessage(message) {
        const lowerMsg = message.toLowerCase();

        // Keyword matching for common questions
        if (lowerMsg.includes('torneo') || lowerMsg.includes('inscri') || lowerMsg.includes('registro')) {
            try {
                const tournaments = await this.api.request('/tournaments', {}, { useCache: false });
                if (tournaments && tournaments.length > 0) {
                    const activeTournaments = tournaments.filter(t => t.status === 'active').slice(0, 3);
                    let response = `Torneos activos disponibles:\n\n`;
                    activeTournaments.forEach(t => {
                        response += `🏆 **${t.name}**\n`;
                        response += `   📅 Fecha: ${new Date(t.startDate).toLocaleDateString()}\n`;
                        response += `   🎮 Juego: ${t.game?.name || 'N/A'}\n`;
                        response += `   👥 Participantes: ${t.participants?.length || 0}/${t.maxParticipants}\n\n`;
                    });
                    response += `Para inscribirte, ve a la sección **Torneos** y selecciona uno.`;
                    return response;
                }
            } catch (error) {
                console.error('Error fetching tournaments:', error);
            }
            return `Para inscribirte en torneos, ve a la sección **Torneos** y busca el evento que te interesa. Cada torneo tiene sus propios requisitos y fechas.

¿Necesitas ayuda con algo más específico?`;
        }

        if (lowerMsg.includes('ranking') || lowerMsg.includes('top') || lowerMsg.includes('lider')) {
            try {
                const users = await this.api.request('/users', {}, { useCache: false });
                if (users && users.length > 0) {
                    const topUsers = users
                        .filter(u => u.stats)
                        .sort((a, b) => (b.stats.totalPoints || 0) - (a.stats.totalPoints || 0))
                        .slice(0, 5);
                    let response = `🏅 **Top 5 Jugadores:**\n\n`;
                    topUsers.forEach((user, index) => {
                        const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index] || '🏅';
                        response += `${medal} ${user.username} - ${user.stats.totalPoints || 0} pts\n`;
                    });
                    return response;
                }
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            }
            return `El ranking de jugadores está disponible en la sección **Leaderboard**. Ahí puedes ver los mejores jugadores según sus puntos totales.`;
        }

        if (lowerMsg.includes('clan') || lowerMsg.includes('equipo') || lowerMsg.includes('grupo')) {
            return `Los clanes te permiten competir junto a tus amigos. Puedes crear uno desde la sección **Clanes** o unirte a uno existente.

¿Te gustaría saber cómo crear un clan?`;
        }

        if (lowerMsg.includes('vivo') || lowerMsg.includes('live') || lowerMsg.includes('partida')) {
            try {
                const matches = await this.api.request('/matches', {}, { useCache: false });
                if (matches && matches.length > 0) {
                    const liveMatches = matches.filter(m => m.status === 'in_progress').slice(0, 3);
                    if (liveMatches.length > 0) {
                        let response = `🔴 **Partidas en Vivo:**\n\n`;
                        liveMatches.forEach(match => {
                            response += `⚽ ${match.team1?.name || 'Equipo 1'} vs ${match.team2?.name || 'Equipo 2'}\n`;
                            response += `   📊 Marcador: ${match.score1 || 0} - ${match.score2 || 0}\n`;
                            response += `   🏆 Torneo: ${match.tournament?.name || 'N/A'}\n\n`;
                        });
                        response += `Ve a la sección **En Vivo** para ver detalles completos.`;
                        return response;
                    }
                }
            } catch (error) {
                console.error('Error fetching live matches:', error);
            }
            return `Las partidas en vivo están disponibles en la sección **En Vivo**. Ahí puedes ver marcadores en tiempo real y seguir la acción.

🔔 ¡Activa las notificaciones para no perderte nada!`;
        }

        if (lowerMsg.includes('regla') || lowerMsg.includes('norma') || lowerMsg.includes('prohibido')) {
            return `Cada torneo tiene sus propias reglas. En general, está prohibido hacer trampa, ser irrespetuoso, o no presentarse a las partidas.

Consulta las reglas específicas en la página de cada torneo.`;
        }

        if (lowerMsg.includes('contac') || lowerMsg.includes('ayuda') || lowerMsg.includes('soporte') || lowerMsg.includes('problema')) {
            return `Nuestro equipo de soporte está disponible por:

📱 Telegram: @ApexTournamentBot
📧 Email: soporte@apextournament.com

¡Estamos aquí para ayudarte!`;
        }

        if (lowerMsg.includes('hola') || lowerMsg.includes('hey') || lowerMsg.includes('buenas')) {
            return `¡Hola! 👋 ¿En qué puedo ayudarte hoy?

Puedo responder preguntas sobre torneos, clanes, partidas en vivo, y más.`;
        }

        if (lowerMsg.includes('gracias') || lowerMsg.includes('genial') || lowerMsg.includes('perfecto')) {
            return `¡De nada! 😊 Estoy aquí para ayudarte.

¿Hay algo más en lo que pueda asistirte?`;
        }

        // Default response
        return `Gracias por tu mensaje. No estoy seguro de entender completamente tu pregunta.

Puedo ayudarte con:
• Información sobre torneos activos
• Ranking de jugadores
• Partidas en vivo
• Reglas y normativas
• Contacto con soporte

¿Podrías reformular tu pregunta o seleccionar una de las opciones de ayuda?`;
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
}

// Export initialization function for app.js
export function initChatbot() {
    if (!window.apexChatbot) {
        window.apexChatbot = new ChatBot();
    }
}
