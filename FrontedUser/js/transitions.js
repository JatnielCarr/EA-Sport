// =====================================================
// Page Transitions System
// =====================================================

let isTransitioning = false;

/**
 * Initialize page transitions
 */
export function initPageTransitions() {
    // Add transition container if not exists
    if (!document.getElementById('page-transition')) {
        const transitionEl = document.createElement('div');
        transitionEl.id = 'page-transition';
        transitionEl.className = 'page-transition';
        transitionEl.innerHTML = `
            <div class="transition-inner">
                <div class="transition-logo">
                    <i class="fas fa-bolt"></i>
                </div>
            </div>
        `;
        document.body.appendChild(transitionEl);
    }

    // Add styles
    addTransitionStyles();

    // Hook into hash changes
    window.addEventListener('hashchange', handleTransition);
}

/**
 * Add CSS styles for transitions
 */
function addTransitionStyles() {
    if (document.getElementById('transition-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'transition-styles';
    styles.textContent = `
        /* Page Transition Overlay */
        .page-transition {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, var(--bg-dark), var(--bg-card));
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .page-transition.active {
            opacity: 1;
            pointer-events: all;
        }

        .transition-inner {
            text-align: center;
        }

        .transition-logo {
            font-size: 48px;
            color: var(--primary);
            animation: pulse-glow 1s infinite;
        }

        @keyframes pulse-glow {
            0%, 100% {
                transform: scale(1);
                filter: drop-shadow(0 0 10px var(--primary));
            }
            50% {
                transform: scale(1.1);
                filter: drop-shadow(0 0 20px var(--primary));
            }
        }

        /* Content Animations */
        .page-enter {
            animation: pageEnter 0.4s ease forwards;
        }

        .page-leave {
            animation: pageLeave 0.3s ease forwards;
        }

        @keyframes pageEnter {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes pageLeave {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }

        /* Staggered children animation */
        .stagger-in > * {
            opacity: 0;
            animation: staggerFadeIn 0.4s ease forwards;
        }

        .stagger-in > *:nth-child(1) { animation-delay: 0.05s; }
        .stagger-in > *:nth-child(2) { animation-delay: 0.1s; }
        .stagger-in > *:nth-child(3) { animation-delay: 0.15s; }
        .stagger-in > *:nth-child(4) { animation-delay: 0.2s; }
        .stagger-in > *:nth-child(5) { animation-delay: 0.25s; }
        .stagger-in > *:nth-child(6) { animation-delay: 0.3s; }
        .stagger-in > *:nth-child(7) { animation-delay: 0.35s; }
        .stagger-in > *:nth-child(8) { animation-delay: 0.4s; }

        @keyframes staggerFadeIn {
            from {
                opacity: 0;
                transform: translateY(15px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Card hover lift */
        .hover-lift {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .hover-lift:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        /* Scale on click */
        .click-scale {
            transition: transform 0.1s ease;
        }

        .click-scale:active {
            transform: scale(0.97);
        }

        /* Fade In Up */
        .fade-in-up {
            animation: fadeInUp 0.5s ease forwards;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Slide In Right */
        .slide-in-right {
            animation: slideInRight 0.4s ease forwards;
        }

        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(50px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        /* Slide In Left */
        .slide-in-left {
            animation: slideInLeft 0.4s ease forwards;
        }

        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-50px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        /* Zoom In */
        .zoom-in {
            animation: zoomIn 0.3s ease forwards;
        }

        @keyframes zoomIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        /* Bounce In */
        .bounce-in {
            animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        @keyframes bounceIn {
            0% {
                opacity: 0;
                transform: scale(0.3);
            }
            50% {
                transform: scale(1.05);
            }
            70% {
                transform: scale(0.95);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(styles);
}

/**
 * Handle page transition
 */
function handleTransition(e) {
    if (isTransitioning) return;
    // Transitions are handled by CSS animations now
}

/**
 * Show full page transition
 */
export function showTransition() {
    const el = document.getElementById('page-transition');
    if (el) {
        isTransitioning = true;
        el.classList.add('active');
    }
}

/**
 * Hide full page transition
 */
export function hideTransition() {
    const el = document.getElementById('page-transition');
    if (el) {
        el.classList.remove('active');
        setTimeout(() => {
            isTransitioning = false;
        }, 300);
    }
}

/**
 * Animate content out
 */
export function animateOut(container) {
    return new Promise(resolve => {
        container.classList.add('page-leave');
        setTimeout(() => {
            container.classList.remove('page-leave');
            resolve();
        }, 300);
    });
}

/**
 * Animate content in
 */
export function animateIn(container) {
    container.classList.add('page-enter');
    setTimeout(() => {
        container.classList.remove('page-enter');
    }, 400);
}

/**
 * Apply stagger animation to children
 */
export function staggerChildren(container) {
    container.classList.add('stagger-in');
    setTimeout(() => {
        container.classList.remove('stagger-in');
    }, 1000);
}

/**
 * Apply animation class to element
 */
export function animateElement(element, animationClass) {
    element.classList.add(animationClass);
    const handleEnd = () => {
        element.classList.remove(animationClass);
        element.removeEventListener('animationend', handleEnd);
    };
    element.addEventListener('animationend', handleEnd);
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    addTransitionStyles();
});

// Make functions available globally
window.animateElement = animateElement;
window.staggerChildren = staggerChildren;
