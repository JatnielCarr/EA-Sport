// =====================================================
// BRACKET UTILS - Helper functions for brackets
// =====================================================

// Sound effects for notifications
const sounds = {
    matchStart: null,
    matchEnd: null,
    celebration: null
};

export function initSounds() {
    // Will be initialized when needed
}

export function playSound(type) {
    if (sounds[type]) {
        sounds[type].play().catch(() => { });
    }
}

// Confetti celebration effect
export function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

// Countdown timer formatter
export function formatCountdown(targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    const diff = target - now;

    if (diff <= 0) return 'Ahora';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

// Team initials for avatar fallback
export function getTeamInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
}

// Validate best-of score
export function validateScore(homeScore, awayScore, bestOf) {
    const maxWins = Math.ceil(bestOf / 2);

    if (homeScore === awayScore) {
        return { valid: false, error: 'No puede haber empate' };
    }

    if (homeScore > maxWins || awayScore > maxWins) {
        return { valid: false, error: `Máximo ${maxWins} victorias en Bo${bestOf}` };
    }

    const winner = homeScore > awayScore ? 'home' : 'away';
    const winnerScore = Math.max(homeScore, awayScore);

    if (winnerScore !== maxWins) {
        return { valid: false, error: `El ganador debe tener ${maxWins} victorias` };
    }

    return { valid: true, winner };
}

// Get win streak for a team
export function getWinStreak(teamId, matches) {
    const teamMatches = matches
        .filter(m => (m.home_team_id === teamId || m.away_team_id === teamId) && m.status === 'COMPLETED')
        .sort((a, b) => new Date(b.scheduled_datetime) - new Date(a.scheduled_datetime));

    let streak = 0;
    for (const match of teamMatches) {
        if (match.winner_id === teamId) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}

// Check if match is close (exciting)
export function isCloseMatch(match) {
    if (match.status !== 'COMPLETED') return false;
    const diff = Math.abs((match.home_score || 0) - (match.away_score || 0));
    return diff <= 1;
}

// Export bracket as image
export async function exportBracketAsImage(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        // Using html2canvas if available
        if (typeof html2canvas === 'function') {
            const canvas = await html2canvas(element, {
                backgroundColor: '#0a0e17',
                scale: 2
            });

            const link = document.createElement('a');
            link.download = 'bracket.png';
            link.href = canvas.toDataURL();
            link.click();
        }
    } catch (err) {
        console.error('Export failed:', err);
    }
}

// Fullscreen toggle
export function toggleFullscreen(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (!document.fullscreenElement) {
        element.requestFullscreen().catch(() => { });
    } else {
        document.exitFullscreen();
    }
}
