// =====================================================
// AI Chatbot Widget - ApexBot
// Floating chatbot component accessible from all pages
// =====================================================

import API from '../api.js';

let chatHistory = [];
let isOpen = false;
let isLoading = false;

export function initChatbot() {
    // Don't init if already exists
    if (document.getElementById('apexbot-widget')) return;

    const widget = document.createElement('div');
    widget.id = 'apexbot-widget';
    widget.innerHTML = `
        <button class="chatbot-fab" id="chatbotToggle" title="Hablar con ApexBot IA">
            <i class="fas fa-robot"></i>
            <span class="chatbot-fab-pulse"></span>
        </button>
        <div class="chatbot-window" id="chatbotWindow">
            <div class="chatbot-header">
                <div class="chatbot-header-info">
                    <div class="chatbot-avatar">
                        <i class="fas fa-robot"></i>
                        <span class="chatbot-status-dot"></span>
                    </div>
                    <div>
                        <h4>ApexBot <span class="ai-badge">IA</span></h4>
                        <span class="chatbot-status">En línea</span>
                    </div>
                </div>
                <div class="chatbot-header-actions">
                    <button class="chatbot-clear-btn" id="chatbotClear" title="Limpiar chat">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="chatbot-close-btn" id="chatbotClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="chatbot-messages" id="chatbotMessages">
                <div class="chatbot-welcome">
                    <div class="welcome-icon">🤖</div>
                    <h3>¡Hola! Soy ApexBot</h3>
                    <p>Tu asistente de IA para torneos. Pregúntame lo que necesites.</p>
                </div>
                <div class="chatbot-suggestions" id="chatbotSuggestions">
                    <button class="suggestion-chip" data-q="¿Qué torneos están abiertos?">🏆 Torneos abiertos</button>
                    <button class="suggestion-chip" data-q="¿Cómo me registro en un torneo?">📝 Cómo registrarme</button>
                    <button class="suggestion-chip" data-q="¿Qué juegos están disponibles?">🎮 Juegos disponibles</button>
                    <button class="suggestion-chip" data-q="¿Qué beneficios tiene Premium?">⭐ Beneficios Premium</button>
                </div>
            </div>
            <div class="chatbot-input-area">
                <form id="chatbotForm">
                    <input type="text" id="chatbotInput" placeholder="Escribe tu pregunta..." autocomplete="off" maxlength="500" />
                    <button type="submit" id="chatbotSend" title="Enviar">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(widget);
    injectChatbotStyles();
    bindChatbotEvents();
}

function bindChatbotEvents() {
    const toggle = document.getElementById('chatbotToggle');
    const close = document.getElementById('chatbotClose');
    const clear = document.getElementById('chatbotClear');
    const form = document.getElementById('chatbotForm');
    const suggestionsContainer = document.getElementById('chatbotSuggestions');

    toggle?.addEventListener('click', () => {
        isOpen = !isOpen;
        document.getElementById('chatbotWindow')?.classList.toggle('open', isOpen);
        toggle.classList.toggle('active', isOpen);
        if (isOpen) document.getElementById('chatbotInput')?.focus();
    });

    close?.addEventListener('click', () => {
        isOpen = false;
        document.getElementById('chatbotWindow')?.classList.remove('open');
        document.getElementById('chatbotToggle')?.classList.remove('active');
    });

    clear?.addEventListener('click', () => {
        chatHistory = [];
        const messages = document.getElementById('chatbotMessages');
        if (messages) {
            messages.innerHTML = `
                <div class="chatbot-welcome">
                    <div class="welcome-icon">🤖</div>
                    <h3>¡Hola! Soy ApexBot</h3>
                    <p>Tu asistente de IA para torneos. Pregúntame lo que necesites.</p>
                </div>
                <div class="chatbot-suggestions" id="chatbotSuggestions">
                    <button class="suggestion-chip" data-q="¿Qué torneos están abiertos?">🏆 Torneos abiertos</button>
                    <button class="suggestion-chip" data-q="¿Cómo me registro en un torneo?">📝 Cómo registrarme</button>
                    <button class="suggestion-chip" data-q="¿Qué juegos están disponibles?">🎮 Juegos disponibles</button>
                    <button class="suggestion-chip" data-q="¿Qué beneficios tiene Premium?">⭐ Beneficios Premium</button>
                </div>
            `;
            rebindSuggestions();
        }
    });

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatbotInput');
        const message = input?.value?.trim();
        if (message && !isLoading) {
            sendMessage(message);
            input.value = '';
        }
    });

    rebindSuggestions();
}

function rebindSuggestions() {
    document.querySelectorAll('.suggestion-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const q = e.currentTarget.dataset.q;
            if (q && !isLoading) sendMessage(q);
        });
    });
}

async function sendMessage(message) {
    if (isLoading) return;

    // Hide suggestions on first message
    const suggestions = document.getElementById('chatbotSuggestions');
    if (suggestions) suggestions.style.display = 'none';

    // Add user message
    appendMessage('user', message);
    chatHistory.push({ role: 'user', content: message });

    // Show typing indicator
    isLoading = true;
    const typingId = appendTypingIndicator();

    try {
        const currentPage = window.location.hash?.replace('#/', '') || 'home';
        const response = await fetch(`${API.baseUrl || 'http://localhost:3000'}/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, pageContext: currentPage })
        });

        const data = await response.json();
        removeTypingIndicator(typingId);

        if (data.success && data.data?.response) {
            appendMessage('bot', data.data.response);
            chatHistory.push({ role: 'bot', content: data.data.response });
        } else {
            appendMessage('bot', '⚠️ No pude procesar tu mensaje. Intenta de nuevo.');
        }
    } catch (error) {
        removeTypingIndicator(typingId);
        appendMessage('bot', '⚠️ Error de conexión. Verifica que el servidor esté activo.');
    }

    isLoading = false;
}

function appendMessage(role, content) {
    const messages = document.getElementById('chatbotMessages');
    if (!messages) return;

    const div = document.createElement('div');
    div.className = `chatbot-message ${role}`;
    div.innerHTML = `
        <div class="message-avatar">
            ${role === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>'}
        </div>
        <div class="message-content">
            <p>${formatBotMessage(content)}</p>
            <span class="message-time">${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function formatBotMessage(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
}

function appendTypingIndicator() {
    const messages = document.getElementById('chatbotMessages');
    if (!messages) return 'none';
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'chatbot-message bot typing';
    div.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content">
            <div class="typing-dots"><span></span><span></span><span></span></div>
        </div>
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    document.getElementById(id)?.remove();
}

function injectChatbotStyles() {
    if (document.getElementById('chatbot-styles')) return;
    const style = document.createElement('style');
    style.id = 'chatbot-styles';
    style.textContent = `
        #apexbot-widget { position: fixed; bottom: 24px; right: 24px; z-index: 10000; font-family: var(--font-body, 'Inter', sans-serif); }

        .chatbot-fab {
            width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;
            background: linear-gradient(135deg, #00d4ff, #667eea, #764ba2);
            color: white; font-size: 24px; position: relative;
            box-shadow: 0 6px 30px rgba(0, 212, 255, 0.4);
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
            display: flex; align-items: center; justify-content: center;
        }
        .chatbot-fab:hover { transform: scale(1.1); box-shadow: 0 8px 40px rgba(0, 212, 255, 0.5); }
        .chatbot-fab.active { transform: scale(0.9); }
        .chatbot-fab-pulse {
            position: absolute; inset: -4px; border-radius: 50%;
            border: 2px solid rgba(0, 212, 255, 0.5);
            animation: chatbot-pulse 2s infinite;
        }
        @keyframes chatbot-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0; } }

        .chatbot-window {
            position: absolute; bottom: 75px; right: 0; width: 380px; height: 520px;
            background: var(--bg-card, #1a1a2e); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 20px; display: flex; flex-direction: column;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5); opacity: 0; visibility: hidden;
            transform: translateY(20px) scale(0.95);
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55); overflow: hidden;
        }
        .chatbot-window.open { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }

        .chatbot-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 20px; background: linear-gradient(135deg, rgba(0,212,255,0.15), rgba(102,126,234,0.15));
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .chatbot-header-info { display: flex; align-items: center; gap: 12px; }
        .chatbot-avatar {
            width: 40px; height: 40px; border-radius: 12px;
            background: linear-gradient(135deg, #00d4ff, #667eea);
            display: flex; align-items: center; justify-content: center;
            font-size: 18px; color: white; position: relative;
        }
        .chatbot-status-dot {
            position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px;
            background: #00ff88; border: 2px solid var(--bg-card, #1a1a2e); border-radius: 50%;
        }
        .chatbot-header h4 { font-size: 15px; font-weight: 700; color: var(--text-primary, #fff); margin: 0; display: flex; align-items: center; gap: 8px; }
        .ai-badge { font-size: 10px; padding: 2px 6px; background: rgba(0,212,255,0.2); color: #00d4ff; border-radius: 4px; font-weight: 700; }
        .chatbot-status { font-size: 12px; color: #00ff88; }
        .chatbot-header-actions { display: flex; gap: 8px; }
        .chatbot-close-btn, .chatbot-clear-btn {
            width: 32px; height: 32px; border-radius: 8px; border: none;
            background: rgba(255,255,255,0.05); color: var(--text-secondary, #aaa);
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: all 0.2s; font-size: 14px;
        }
        .chatbot-close-btn:hover, .chatbot-clear-btn:hover { background: rgba(255,255,255,0.1); color: #ff3366; }

        .chatbot-messages {
            flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;
            scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
        }

        .chatbot-welcome { text-align: center; padding: 20px 0; }
        .welcome-icon { font-size: 48px; margin-bottom: 12px; }
        .chatbot-welcome h3 { font-size: 18px; font-weight: 700; color: var(--text-primary, #fff); margin: 0 0 8px; }
        .chatbot-welcome p { font-size: 13px; color: var(--text-secondary, #aaa); margin: 0; }

        .chatbot-suggestions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 8px; }
        .suggestion-chip {
            padding: 8px 14px; border-radius: 100px; border: 1px solid rgba(0,212,255,0.2);
            background: rgba(0,212,255,0.05); color: var(--text-secondary, #ccc);
            font-size: 12px; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .suggestion-chip:hover { background: rgba(0,212,255,0.15); color: #00d4ff; border-color: rgba(0,212,255,0.4); }

        .chatbot-message { display: flex; gap: 10px; animation: msgFadeIn 0.3s ease; }
        .chatbot-message.user { flex-direction: row-reverse; }
        @keyframes msgFadeIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }

        .message-avatar {
            width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .chatbot-message.bot .message-avatar { background: linear-gradient(135deg, #00d4ff, #667eea); color: white; }
        .chatbot-message.user .message-avatar { background: rgba(0,255,136,0.15); color: #00ff88; }

        .message-content {
            max-width: 75%; padding: 12px 16px; border-radius: 16px; position: relative;
        }
        .chatbot-message.bot .message-content { background: rgba(255,255,255,0.05); border-radius: 16px 16px 16px 4px; }
        .chatbot-message.user .message-content { background: linear-gradient(135deg, rgba(0,212,255,0.15), rgba(102,126,234,0.15)); border-radius: 16px 16px 4px 16px; }
        .message-content p { font-size: 13px; line-height: 1.6; color: var(--text-primary, #eee); margin: 0; word-wrap: break-word; }
        .message-content code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        .message-time { font-size: 10px; color: var(--text-muted, #666); margin-top: 4px; display: block; }
        .chatbot-message.user .message-time { text-align: right; }

        .typing-dots { display: flex; gap: 4px; padding: 4px 0; }
        .typing-dots span {
            width: 8px; height: 8px; background: rgba(0,212,255,0.5); border-radius: 50%;
            animation: typingBounce 1.4s infinite both;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

        .chatbot-input-area {
            padding: 16px; border-top: 1px solid rgba(255,255,255,0.05);
            background: rgba(0,0,0,0.1);
        }
        #chatbotForm {
            display: flex; gap: 10px; align-items: center;
        }
        #chatbotInput {
            flex: 1; padding: 12px 16px; border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.05); color: var(--text-primary, #fff);
            font-size: 14px; outline: none; transition: border-color 0.2s;
        }
        #chatbotInput::placeholder { color: var(--text-muted, #666); }
        #chatbotInput:focus { border-color: rgba(0,212,255,0.4); }

        #chatbotSend {
            width: 42px; height: 42px; border-radius: 12px; border: none;
            background: linear-gradient(135deg, #00d4ff, #667eea);
            color: white; font-size: 16px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s; flex-shrink: 0;
        }
        #chatbotSend:hover { transform: scale(1.05); box-shadow: 0 4px 15px rgba(0,212,255,0.3); }

        @media (max-width: 480px) {
            .chatbot-window { width: calc(100vw - 32px); height: calc(100vh - 120px); bottom: 70px; right: -8px; }
            #apexbot-widget { bottom: 16px; right: 16px; }
        }
    `;
    document.head.appendChild(style);
}
