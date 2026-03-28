/**
 * =============================================
 *  CYBER ARCADE — Neural Archer Game Engine
 * =============================================
 */

const canvas = document.getElementById('archery-canvas');
const ctx = canvas.getContext('2d');

// Responsive canvas
function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const w = Math.min(860, wrapper.clientWidth);
    canvas.style.width = w + 'px';
    canvas.style.height = (w * 500 / 860) + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ===== GAME STATE =====
let state = {
    running: false,
    score: 0,
    arrows: 10,
    maxArrows: 10,
    shots: 0,
    hits: 0,
    streak: 0,
    bestStreak: 0,
    level: 1,
    difficulty: 'easy',
    wind: { speed: 3, direction: 1 }, // direction: 1=right, -1=left
    targets: [],
    particles: [],
    arrow: null, // flying arrow
    arrowTrail: [],
    aimPos: { x: 0, y: 0 },
    power: 0,
    isPowerCharging: false,
    powerDir: 1,
    gameOver: false,
    animFrame: null,
    bgStars: [],
    milestones: [3, 5, 8] // new target waves
};

const DIFFICULTIES = {
    easy:   { speed: 1.2, targetSize: 55, windMax: 3,  specialChance: 0.1, arrowCount: 10 },
    medium: { speed: 2.0, targetSize: 42, windMax: 6,  specialChance: 0.2, arrowCount: 10 },
    hard:   { speed: 3.2, targetSize: 30, windMax: 10, specialChance: 0.35, arrowCount: 8  }
};

const RING_SCORES = [10, 8, 6, 4, 2]; // bulls → outer
const RING_NAMES  = ['BULLSEYE!', 'PERFECT!', 'GREAT!', 'GOOD', 'OK'];
const RING_COLORS = ['#ff007b', '#ffd700', '#00e5ff', '#b300ff', 'rgba(255,255,255,0.3)'];

function initBgStars() {
    state.bgStars = [];
    for (let i = 0; i < 80; i++) {
        state.bgStars.push({
            x: Math.random() * 860,
            y: Math.random() * 500,
            r: Math.random() * 1.2 + 0.3,
            a: Math.random() * 0.6 + 0.1,
            da: Math.random() > 0.5 ? 0.008 : -0.008
        });
    }
}

function setDifficulty(diff) {
    state.difficulty = diff;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('diff-' + diff)?.classList.add('active');
}

function startGame() {
    if (state.animFrame) cancelAnimationFrame(state.animFrame);
    document.getElementById('game-over-screen').classList.remove('show');
    
    const cfg = DIFFICULTIES[state.difficulty];
    Object.assign(state, {
        running: true,
        gameOver: false,
        score: 0,
        arrows: cfg.arrowCount,
        maxArrows: cfg.arrowCount,
        shots: 0,
        hits: 0,
        streak: 0,
        bestStreak: 0,
        level: 1,
        targets: [],
        particles: [],
        arrow: null,
        arrowTrail: [],
        power: 0,
        isPowerCharging: false
    });

    randomizeWind();
    spawnTargetWave();
    initBgStars();
    updateHUD();
    loop();
    document.getElementById('start-btn').textContent = '⟳ Restart';
}

function randomizeWind() {
    const cfg = DIFFICULTIES[state.difficulty];
    state.wind.speed = Math.random() * cfg.windMax;
    state.wind.direction = Math.random() > 0.5 ? 1 : -1;
    updateWindDisplay();
}

function updateWindDisplay() {
    const fill = document.getElementById('wind-fill');
    const dir  = document.getElementById('wind-dir');
    const cfg  = DIFFICULTIES[state.difficulty];
    const pct  = (state.wind.speed / cfg.windMax) * 100;
    fill.style.width = pct + '%';
    dir.textContent  = (state.wind.direction > 0 ? '→' : '←') + ' ' + state.wind.speed.toFixed(1) + 'm/s';
}

// ===== TARGET OBJECT =====
function createTarget(x, y, special) {
    const cfg = DIFFICULTIES[state.difficulty];
    const speed = (cfg.speed + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1);
    return {
        x, y,
        vx: speed,
        vy: (Math.random() - 0.5) * 0.6,
        r: cfg.targetSize,
        special: special || false, // bonus target
        bounceH: true,
        bounceV: true,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        alive: true,
        hit: false,
        hitRing: -1,
        hitAnim: 0, // countdown when hit
        pulse: 0
    };
}

function spawnTargetWave() {
    state.targets = [];
    const cfg = DIFFICULTIES[state.difficulty];
    const count = state.level + 1 + (state.difficulty === 'hard' ? 1 : 0);
    for (let i = 0; i < count; i++) {
        const special = Math.random() < cfg.specialChance;
        const x = 200 + Math.random() * 500;
        const y = 80  + Math.random() * 340;
        state.targets.push(createTarget(x, y, special));
    }
}

// ===== ARROW SHOOTING =====
canvas.addEventListener('mousemove', (e) => {
    if (!state.running || state.arrow) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    state.aimPos.x = (e.clientX - rect.left)  * scaleX;
    state.aimPos.y = (e.clientY - rect.top)   * scaleY;
});

canvas.addEventListener('mousedown', () => {
    if (!state.running || state.arrow || state.arrows <= 0) return;
    state.isPowerCharging = true;
    state.power = 0;
    state.powerDir = 1;
});

canvas.addEventListener('mouseup', () => {
    if (!state.isPowerCharging) return;
    state.isPowerCharging = false;
    shootArrow();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!state.running || state.arrow || state.arrows <= 0) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    state.aimPos.x = (touch.clientX - rect.left) * scaleX;
    state.aimPos.y = (touch.clientY - rect.top)  * scaleY;
    state.isPowerCharging = true;
    state.power = 0;
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!state.isPowerCharging) return;
    state.isPowerCharging = false;
    shootArrow();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!state.running) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    state.aimPos.x = (touch.clientX - rect.left) * scaleX;
    state.aimPos.y = (touch.clientY - rect.top)  * scaleY;
}, { passive: false });

function shootArrow() {
    if (state.arrows <= 0) return;
    state.arrows--;
    state.shots++;

    const speed = 12 + state.power * 0.1;
    const angle = Math.atan2(state.aimPos.y - 460, state.aimPos.x - 60);
    const windDrift = state.wind.speed * state.wind.direction * 0.015;

    state.arrow = {
        x: 60,
        y: 460,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.15,
        windDrift,
        alive: true
    };
    state.arrowTrail = [];
    updateArrowsDisplay();
}

// ===== PARTICLES =====
function spawnHitParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        state.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: Math.random() * 4 + 2,
            color,
            life: 1.0,
            decay: Math.random() * 0.04 + 0.02
        });
    }
}

// ===== DRAW FUNCTIONS =====
function drawBg() {
    // Deep space bg
    ctx.fillStyle = '#060311';
    ctx.fillRect(0, 0, 860, 500);

    // Grid lines
    ctx.strokeStyle = 'rgba(179,0,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 860; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 500); ctx.stroke();
    }
    for (let y = 0; y < 500; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(860, y); ctx.stroke();
    }

    // Stars
    state.bgStars.forEach(s => {
        s.a += s.da;
        if (s.a <= 0.1 || s.a >= 0.8) s.da = -s.da;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.fill();
    });
}

function drawArcher() {
    const x = 55, y = 480;

    // Body
    ctx.save();
    ctx.shadowColor = '#b300ff';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#b300ff';
    ctx.lineWidth = 2;

    // Stand
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y + 15); ctx.stroke();

    // Body
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 30); ctx.stroke();

    // Head
    ctx.beginPath(); ctx.arc(x, y - 38, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#00e5ff'; ctx.shadowColor = '#00e5ff'; ctx.stroke();

    // Arm + bow
    const aimAngle = Math.atan2(state.aimPos.y - (y - 20), state.aimPos.x - x);
    ctx.translate(x, y - 20);
    ctx.rotate(aimAngle);

    // Bow
    ctx.strokeStyle = '#ffd700'; ctx.shadowColor = '#ffd700'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 20, -Math.PI/3, Math.PI/3); ctx.stroke();

    // String
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
    const pullback = state.isPowerCharging ? -state.power * 0.08 : 0;
    ctx.beginPath();
    ctx.moveTo(20 * Math.cos(-Math.PI/3), 20 * Math.sin(-Math.PI/3));
    ctx.lineTo(pullback, 0);
    ctx.lineTo(20 * Math.cos(Math.PI/3), 20 * Math.sin(Math.PI/3));
    ctx.stroke();

    // Arrow on string
    if (!state.arrow) {
        ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(pullback, 0); ctx.lineTo(18, 0); ctx.stroke();
    }

    ctx.restore();
}

function drawTarget(t) {
    if (!t.alive && t.hitAnim <= 0) return;

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.rotation);

    const RINGS = [
        { factor: 1.0, color: t.special ? 'rgba(0,229,255,0.08)' : 'rgba(179,0,255,0.06)' },
        { factor: 0.75, color: t.special ? 'rgba(0,229,255,0.12)' : 'rgba(255,0,123,0.1)' },
        { factor: 0.55, color: t.special ? 'rgba(0,229,255,0.2)' : 'rgba(255,215,0,0.15)' },
        { factor: 0.35, color: t.special ? 'rgba(0,100,255,0.3)' : 'rgba(255,0,123,0.25)' },
        { factor: 0.15, color: t.special ? '#00e5ff' : '#ff007b' }
    ];

    const pulse = 1 + Math.sin(t.pulse) * 0.02;
    t.pulse += 0.06;

    RINGS.forEach((ring, i) => {
        const r = t.r * ring.factor * pulse;
        const borderColor = t.special ? '#00e5ff' : RING_COLORS[i];
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = ring.color;
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = i === RINGS.length - 1 ? 2 : 1;
        ctx.globalAlpha = t.hit ? Math.max(0, t.hitAnim / 30) : 1;
        ctx.stroke();
    });

    // Cross-hairs
    ctx.strokeStyle = t.special ? 'rgba(0,229,255,0.5)' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = t.hit ? Math.max(0, t.hitAnim / 30) : 1;
    ctx.beginPath(); ctx.moveTo(-t.r, 0); ctx.lineTo(t.r, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -t.r); ctx.lineTo(0, t.r); ctx.stroke();

    if (t.special) {
        // Star badge
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${t.r * 0.3}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('2x', 0, 0);
    }

    ctx.restore();
}

function drawArrowFlight() {
    if (!state.arrow) return;
    const a = state.arrow;

    // Trail
    state.arrowTrail.forEach((pt, i) => {
        const alpha = i / state.arrowTrail.length * 0.5;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${alpha})`;
        ctx.fill();
    });

    // Arrow body
    const angle = Math.atan2(a.vy, a.vx);
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(angle);
    ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 8;
    ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(8, 0); ctx.stroke();
    // Arrowhead
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(8, 0); ctx.lineTo(3, -4); ctx.lineTo(3, 4); ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawPowerMeter() {
    if (!state.isPowerCharging) return;
    const w = 140, h = 14;
    const x = 60 - w / 2;
    const y = 450;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.roundRect(x - 4, y - 4, w + 8, h + 8, 8);
    ctx.fill();

    const fillW = (state.power / 100) * w;
    const hue = 120 - state.power * 1.2;
    const gradient = ctx.createLinearGradient(x, y, x + w, y);
    gradient.addColorStop(0, '#00e5ff');
    gradient.addColorStop(0.5, '#b300ff');
    gradient.addColorStop(1, '#ff007b');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, fillW, h, 6);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '10px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('DRAW', x + w / 2, y - 8);
}

function drawAimLine() {
    if (state.arrow || !state.running || state.arrows <= 0) return;
    const sx = 60, sy = 440;

    ctx.save();
    ctx.setLineDash([6, 10]);
    ctx.strokeStyle = 'rgba(0,229,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(state.aimPos.x, state.aimPos.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Crosshair at aim
    ctx.save();
    ctx.translate(state.aimPos.x, state.aimPos.y);
    ctx.strokeStyle = 'rgba(0,229,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
}

function drawParticles() {
    state.particles.forEach(p => {
        p.x  += p.vx; p.y  += p.vy; p.vy += 0.1;
        p.life -= p.decay;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    state.particles = state.particles.filter(p => p.life > 0);
}

function drawHitFlash(t) {
    if (t.hit && t.hitAnim > 0) {
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.globalAlpha = (t.hitAnim / 30) * 0.3;
        ctx.fillStyle = RING_COLORS[t.hitRing] || '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, t.r * (1 + (30 - t.hitAnim) / 30 * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
        t.hitAnim--;
    }
}

function drawNoArrows() {
    if (state.arrows <= 0 && !state.arrow && state.running && !state.gameOver) {
        ctx.fillStyle = 'rgba(255,0,123,0.8)';
        ctx.font = 'bold 18px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NO ARROWS — MISSION COMPLETE', 430, 250);
    }
}

// ===== COLLISION DETECTION =====
function checkArrowCollision() {
    if (!state.arrow) return;
    const a = state.arrow;

    for (let t of state.targets) {
        if (!t.alive) continue;
        const dx = a.x - t.x;
        const dy = a.y - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < t.r) {
            // Determine ring
            let ring = -1;
            const rings = [0.15, 0.35, 0.55, 0.75, 1.0];
            for (let i = 0; i < rings.length; i++) {
                if (dist < t.r * rings[i]) { ring = i; break; }
            }
            if (ring === -1) ring = 4;

            const baseScore = RING_SCORES[ring];
            const multiplier = t.special ? 2 : 1;
            const streakBonus = Math.floor(state.streak * 0.5);
            const earned = (baseScore + streakBonus) * multiplier;

            state.score  += earned;
            state.hits   += 1;
            state.streak += 1;
            state.bestStreak = Math.max(state.bestStreak, state.streak);

            t.alive   = false;
            t.hit     = true;
            t.hitRing = ring;
            t.hitAnim = 30;

            state.arrow = null;
            state.arrowTrail = [];

            spawnHitParticles(a.x, a.y, RING_COLORS[ring], 20);

            // Score popup
            showScorePopup(a.x, a.y, RING_NAMES[ring], earned, RING_COLORS[ring]);

            // Windage change
            if (Math.random() < 0.3) randomizeWind();

            updateHUD();

            // Check wave complete
            if (state.targets.every(t => !t.alive)) {
                state.level++;
                setTimeout(spawnTargetWave, 800);
            }
            return;
        }
    }

    // Miss
    if (a.x < -20 || a.x > 900 || a.y < -20 || a.y > 560) {
        state.arrow = null;
        state.arrowTrail = [];
        state.streak = 0;
        updateHUD();
        checkGameOver();
    }
}

function showScorePopup(x, y, label, points, color) {
    const scaleX = canvas.getBoundingClientRect().width  / canvas.width;
    const scaleY = canvas.getBoundingClientRect().height / canvas.height;
    const canvasRect = canvas.getBoundingClientRect();
    const px = canvasRect.left + x * scaleX;
    const py = canvasRect.top  + y * scaleY;

    const div = document.createElement('div');
    div.className = 'score-popup';
    div.style.cssText = `left:${px}px; top:${py}px; color:${color}; font-size:${points >= 10 ? '1.5rem' : '1rem'};`;
    div.innerHTML = `${label}<br><small>+${points}</small>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1200);
}

function checkGameOver() {
    if (state.arrows <= 0 && !state.arrow) {
        setTimeout(() => endGame(), 500);
    }
}

function endGame() {
    state.running  = false;
    state.gameOver = true;

    const accuracy = state.shots > 0 ? Math.round((state.hits / state.shots) * 100) : 0;
    const xpEarned = Math.round(state.score * 0.5) + (accuracy >= 80 ? 100 : accuracy >= 50 ? 50 : 20);

    document.getElementById('go-score').textContent    = state.score;
    document.getElementById('go-accuracy').textContent = accuracy + '%';
    document.getElementById('go-streak').textContent   = state.bestStreak + 'x';
    document.getElementById('go-xp').textContent       = '+' + xpEarned;

    // Grade
    const grade = accuracy >= 90 ? ['🏆', '#ffd700'] : accuracy >= 70 ? ['🥇', '#00e5ff'] : accuracy >= 50 ? ['🥈', '#b300ff'] : ['🥉', '#ff6b35'];
    const ring = document.getElementById('grade-ring');
    ring.textContent = grade[0];
    ring.style.borderColor = grade[1];
    ring.style.color = grade[1];

    document.getElementById('go-subtitle').textContent =
        accuracy >= 90 ? 'Neural targeting — ELITE performance!' :
        accuracy >= 70 ? 'Strong precision. Keep sharpening that aim.' :
        'Continue training operative — systems adapting.';

    document.getElementById('game-over-screen').classList.add('show');

    // Award XP
    if (typeof awardXP === 'function') {
        awardXP(xpEarned, 'archery', state.score);
    }
}

// ===== UPDATE FUNCTIONS =====
function updateArrow() {
    if (!state.arrow) return;
    const a = state.arrow;
    state.arrowTrail.push({ x: a.x, y: a.y });
    if (state.arrowTrail.length > 20) state.arrowTrail.shift();

    a.x  += a.vx + a.windDrift;
    a.y  += a.vy;
    a.vy += a.gravity;

    checkArrowCollision();
}

function updateTargets() {
    const cfg = DIFFICULTIES[state.difficulty];
    state.targets.forEach(t => {
        if (!t.alive) return;
        t.x += t.vx;
        t.y += t.vy;
        t.rotation += t.rotSpeed;

        // Bounce off walls
        if (t.x - t.r < 100 || t.x + t.r > 840) {
            t.vx = -t.vx;
            t.x  = Math.max(100 + t.r, Math.min(840 - t.r, t.x));
        }
        if (t.y - t.r < 30 || t.y + t.r > 470) {
            t.vy = -t.vy;
            t.y  = Math.max(30 + t.r, Math.min(470 - t.r, t.y));
        }
    });
}

function updatePower() {
    if (!state.isPowerCharging) return;
    state.power += 2 * state.powerDir;
    if (state.power >= 100 || state.power <= 0) {
        state.powerDir = -state.powerDir;
    }
}

function updateHUD() {
    document.getElementById('score-display').textContent    = state.score;
    document.getElementById('accuracy-display').textContent = state.shots > 0 ? Math.round((state.hits / state.shots) * 100) + '%' : '—';
    document.getElementById('streak-display').textContent   = state.streak + 'x';
    document.getElementById('level-display').textContent    = state.level;
    updateArrowsDisplay();
}

function updateArrowsDisplay() {
    const container = document.getElementById('arrows-display');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < state.maxArrows; i++) {
        const dot = document.createElement('div');
        dot.className = 'arrow-dot' + (i >= state.arrows ? ' used' : '');
        container.appendChild(dot);
    }
}

// ===== MAIN LOOP =====
function loop() {
    if (!state.running) return;

    ctx.clearRect(0, 0, 860, 500);

    drawBg();
    drawAimLine();

    state.targets.forEach(t => {
        drawTarget(t);
        drawHitFlash(t);
    });

    drawParticles();
    drawArcher();
    drawArrowFlight();
    drawPowerMeter();
    drawNoArrows();

    updateArrow();
    updateTargets();
    updatePower();

    if (state.arrows <= 0 && !state.arrow && state.running) {
        endGame();
        return;
    }

    state.animFrame = requestAnimationFrame(loop);
}

// Idle screen
(function drawIdle() {
    initBgStars();
    function idleFrame() {
        if (state.running) return;
        ctx.clearRect(0, 0, 860, 500);
        drawBg();

        ctx.fillStyle = 'rgba(179,0,255,0.6)';
        ctx.font = 'bold 28px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#b300ff';
        ctx.shadowBlur = 20;
        ctx.fillText('NEURAL ARCHER', 430, 230);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '14px Roboto Mono';
        ctx.fillText('Press "Launch Protocol" to begin targeting sequence', 430, 270);
        ctx.fillStyle = 'rgba(0,229,255,0.5)';
        ctx.font = '11px Orbitron';
        ctx.fillText('[ MOVE MOUSE TO AIM · HOLD & RELEASE TO SHOOT ]', 430, 300);

        requestAnimationFrame(idleFrame);
    }
    idleFrame();
})();

updateArrowsDisplay();
