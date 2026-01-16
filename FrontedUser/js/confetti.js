// =====================================================
// Confetti Animation - Victory Effect
// =====================================================

/**
 * Launch confetti celebration effect
 * @param {Object} options - Configuration options
 */
export function launchConfetti(options = {}) {
    const defaults = {
        particleCount: 150,
        spread: 70,
        startVelocity: 30,
        decay: 0.95,
        scalar: 1,
        ticks: 200,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#00d4ff', '#00ff88', '#ff6b35', '#ffb800', '#ff3366', '#9333ea'],
        gravity: 1,
        drift: 0,
        zIndex: 10000
    };

    const config = { ...defaults, ...options };

    // Create canvas if not exists
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'confetti-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: ${config.zIndex};
        `;
        document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];

    // Create particles
    for (let i = 0; i < config.particleCount; i++) {
        const angle = (Math.random() * config.spread - config.spread / 2) * Math.PI / 180;
        const velocity = config.startVelocity * (0.5 + Math.random() * 0.5);

        particles.push({
            x: canvas.width * config.origin.x,
            y: canvas.height * config.origin.y,
            vx: Math.sin(angle) * velocity + config.drift,
            vy: -Math.cos(angle) * velocity,
            color: config.colors[Math.floor(Math.random() * config.colors.length)],
            size: Math.random() * 10 + 5,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5,
            ticks: config.ticks,
            shape: Math.random() > 0.5 ? 'rect' : 'circle',
            scalar: config.scalar * (0.5 + Math.random() * 0.5)
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let stillActive = false;

        particles.forEach(p => {
            if (p.ticks <= 0) return;
            stillActive = true;

            p.x += p.vx;
            p.y += p.vy;
            p.vy += config.gravity * 0.5;
            p.vx *= config.decay;
            p.vy *= config.decay;
            p.rotation += p.rotationSpeed;
            p.ticks--;

            const opacity = p.ticks / config.ticks;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.globalAlpha = opacity;
            ctx.fillStyle = p.color;

            if (p.shape === 'rect') {
                ctx.fillRect(-p.size * p.scalar / 2, -p.size * p.scalar / 4, p.size * p.scalar, p.size * p.scalar / 2);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size * p.scalar / 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });

        if (stillActive) {
            requestAnimationFrame(animate);
        } else {
            canvas.remove();
        }
    }

    animate();
}

/**
 * Launch confetti from left and right sides
 */
export function launchConfettiBurst() {
    // Left side
    launchConfetti({
        origin: { x: 0, y: 0.6 },
        spread: 55,
        startVelocity: 45,
        particleCount: 80
    });

    // Right side (delayed)
    setTimeout(() => {
        launchConfetti({
            origin: { x: 1, y: 0.6 },
            spread: 55,
            startVelocity: 45,
            particleCount: 80
        });
    }, 150);
}

/**
 * Rain effect - confetti falling from top
 */
export function launchConfettiRain() {
    const duration = 3000;
    const interval = 50;
    const end = Date.now() + duration;

    const frame = () => {
        launchConfetti({
            particleCount: 3,
            origin: { x: Math.random(), y: 0 },
            spread: 30,
            startVelocity: 10,
            ticks: 100,
            gravity: 2
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    };

    frame();
}

/**
 * Firework effect
 */
export function launchFirework() {
    const colors = [
        ['#00d4ff', '#00e5ff'],
        ['#00ff88', '#00cc6a'],
        ['#ff6b35', '#ff4500'],
        ['#ffb800', '#ffa000'],
        ['#ff3366', '#ff1744']
    ];

    const selectedColors = colors[Math.floor(Math.random() * colors.length)];

    launchConfetti({
        particleCount: 100,
        spread: 360,
        startVelocity: 40,
        origin: { x: 0.2 + Math.random() * 0.6, y: 0.3 + Math.random() * 0.3 },
        colors: selectedColors,
        gravity: 0.8
    });
}

/**
 * Multiple fireworks
 */
export function launchFireworks(count = 5) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => launchFirework(), i * 300);
    }
}

// Make functions available globally
window.launchConfetti = launchConfetti;
window.launchConfettiBurst = launchConfettiBurst;
window.launchConfettiRain = launchConfettiRain;
window.launchFireworks = launchFireworks;
