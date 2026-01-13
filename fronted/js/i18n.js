// =====================================================
// I18N - Internationalization Support
// =====================================================

const translations = {
    es: {
        // Headers
        'brackets.title': 'Brackets de Torneos',
        'brackets.subtitle': 'Visualiza los enfrentamientos y resultados',
        'brackets.selectTournament': 'Seleccionar torneo...',

        // Filters
        'filter.all': 'Todos',
        'filter.live': 'En Vivo',
        'filter.upcoming': 'Próximos',
        'filter.completed': 'Completados',

        // Stats
        'stats.matchesPlayed': 'Partidas Jugadas',
        'stats.live': 'En Vivo',
        'stats.upcoming': 'Próximas',
        'stats.leader': 'Líder',

        // Match
        'match.scheduled': 'Programado',
        'match.live': 'En Vivo',
        'match.completed': 'Finalizado',
        'match.disputed': 'Disputado',
        'match.cancelled': 'Cancelado',
        'match.tbd': 'Por definir',

        // Actions
        'action.generateBracket': 'Generar Bracket Automáticamente',
        'action.saveResult': 'Guardar Resultado',
        'action.share': 'Compartir',
        'action.export': 'Exportar',
        'action.fullscreen': 'Pantalla Completa',

        // Predictions
        'predictions.title': 'Haz tu predicción',
        'predictions.saved': 'Predicción guardada',
        'predictions.leaderboard': 'Leaderboard de Predicciones',

        // Messages
        'msg.noTeams': 'No hay torneos con equipos',
        'msg.selectTournament': 'Selecciona un torneo',
        'msg.bracketGenerated': 'Bracket generado correctamente',
        'msg.resultSaved': 'Resultado guardado',
        'msg.noTie': 'No puede haber empate',
        'msg.linkCopied': 'Link copiado',

        // Rounds
        'round.final': 'FINAL',
        'round.semiFinals': 'SEMI-FINALS',
        'round.quarterFinals': 'QUARTER-FINALS',
        'round.grandFinal': 'GRAND FINAL',
        'round.bracketReset': 'BRACKET RESET',
        'round.upperBracket': 'UPPER BRACKET',
        'round.lowerBracket': 'LOWER BRACKET'
    },
    en: {
        'brackets.title': 'Tournament Brackets',
        'brackets.subtitle': 'View matchups and results',
        'brackets.selectTournament': 'Select tournament...',

        'filter.all': 'All',
        'filter.live': 'Live',
        'filter.upcoming': 'Upcoming',
        'filter.completed': 'Completed',

        'stats.matchesPlayed': 'Matches Played',
        'stats.live': 'Live',
        'stats.upcoming': 'Upcoming',
        'stats.leader': 'Leader',

        'match.scheduled': 'Scheduled',
        'match.live': 'Live',
        'match.completed': 'Completed',
        'match.disputed': 'Disputed',
        'match.cancelled': 'Cancelled',
        'match.tbd': 'TBD',

        'action.generateBracket': 'Generate Bracket Automatically',
        'action.saveResult': 'Save Result',
        'action.share': 'Share',
        'action.export': 'Export',
        'action.fullscreen': 'Fullscreen',

        'predictions.title': 'Make your prediction',
        'predictions.saved': 'Prediction saved',
        'predictions.leaderboard': 'Predictions Leaderboard',

        'msg.noTeams': 'No tournaments with teams',
        'msg.selectTournament': 'Select a tournament',
        'msg.bracketGenerated': 'Bracket generated successfully',
        'msg.resultSaved': 'Result saved',
        'msg.noTie': 'Ties are not allowed',
        'msg.linkCopied': 'Link copied',

        'round.final': 'FINAL',
        'round.semiFinals': 'SEMI-FINALS',
        'round.quarterFinals': 'QUARTER-FINALS',
        'round.grandFinal': 'GRAND FINAL',
        'round.bracketReset': 'BRACKET RESET',
        'round.upperBracket': 'UPPER BRACKET',
        'round.lowerBracket': 'LOWER BRACKET'
    },
    pt: {
        'brackets.title': 'Chaves do Torneio',
        'brackets.subtitle': 'Visualize os confrontos e resultados',
        'brackets.selectTournament': 'Selecionar torneio...',

        'filter.all': 'Todos',
        'filter.live': 'Ao Vivo',
        'filter.upcoming': 'Próximos',
        'filter.completed': 'Concluídos',

        'stats.matchesPlayed': 'Partidas Jogadas',
        'stats.live': 'Ao Vivo',
        'stats.upcoming': 'Próximas',
        'stats.leader': 'Líder',

        'match.scheduled': 'Agendado',
        'match.live': 'Ao Vivo',
        'match.completed': 'Concluído',
        'match.disputed': 'Disputado',
        'match.cancelled': 'Cancelado',
        'match.tbd': 'A definir',

        'action.generateBracket': 'Gerar Chave Automaticamente',
        'action.saveResult': 'Salvar Resultado',
        'action.share': 'Compartilhar',
        'action.export': 'Exportar',
        'action.fullscreen': 'Tela Cheia',

        'predictions.title': 'Faça sua previsão',
        'predictions.saved': 'Previsão salva',
        'predictions.leaderboard': 'Ranking de Previsões',

        'msg.noTeams': 'Não há torneios com equipes',
        'msg.selectTournament': 'Selecione um torneio',
        'msg.bracketGenerated': 'Chave gerada com sucesso',
        'msg.resultSaved': 'Resultado salvo',
        'msg.noTie': 'Empates não são permitidos',
        'msg.linkCopied': 'Link copiado',

        'round.final': 'FINAL',
        'round.semiFinals': 'SEMI-FINAIS',
        'round.quarterFinals': 'QUARTAS DE FINAL',
        'round.grandFinal': 'GRANDE FINAL',
        'round.bracketReset': 'REPESCAGEM',
        'round.upperBracket': 'CHAVE SUPERIOR',
        'round.lowerBracket': 'CHAVE INFERIOR'
    }
};

let currentLanguage = 'es';

// Detect browser language
export function detectLanguage() {
    const browserLang = navigator.language.split('-')[0];
    if (translations[browserLang]) {
        currentLanguage = browserLang;
    }
    return currentLanguage;
}

// Set language
export function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        localStorage.setItem('bracket_lang', lang);
        return true;
    }
    return false;
}

// Get current language
export function getLanguage() {
    const stored = localStorage.getItem('bracket_lang');
    if (stored && translations[stored]) {
        currentLanguage = stored;
    }
    return currentLanguage;
}

// Translate a key
export function t(key) {
    return translations[currentLanguage]?.[key] || translations['es']?.[key] || key;
}

// Get all available languages
export function getAvailableLanguages() {
    return [
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'pt', name: 'Português', flag: '🇧🇷' }
    ];
}

// Render language selector
export function renderLanguageSelector() {
    const languages = getAvailableLanguages();
    const current = getLanguage();

    return `
    <div class="language-selector">
      <select id="languageSelect" class="form-control" style="width: auto;">
        ${languages.map(lang => `
          <option value="${lang.code}" ${lang.code === current ? 'selected' : ''}>
            ${lang.flag} ${lang.name}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}
