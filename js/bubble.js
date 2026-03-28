/**
 * =============================================
 *  CYBER ARCADE — Bubble Matrix Blaster Engine
 * =============================================
 */

const bCanvas = document.getElementById('bubble-canvas');
const bCtx    = bCanvas.getContext('2d');

// Responsive
function resizeBubbleCanvas() {
    const wrapper = bCanvas.parentElement;
    const w = Math.min(580, wrapper.clientWidth - 20);
    bCanvas.style.width  = w + 'px';
    bCanvas.style.height = (w * 640 / 580) + 'px';
}
window.addEventListener('resize', resizeBubbleCanvas);
resizeBubbleCanvas();

// ===== CONSTANTS =====
const COLS        = 10;
const ROWS        = 13;
const BUBBLE_R    = 27;
const GRID_OFFSET_X = 15;
const GRID_OFFSET_Y = 36;
const SHOOTER_X   = 290;
const SHOOTER_Y   = 608;
const DANGER_LINE = 490;

const COLORS = ['#ff007b', '#00e5ff', '#b300ff', '#ffd700', '#00ff41', '#ff6b35', '#e040fb'];
const COLOR_NAMES = ['Crimson', 'Cyan', 'Violet', 'Gold', 'Lime', 'Orange', 'Fuchsia'];

// ===== STATE =====
let bs = {
    running: false,
    grid: [],
    shooter: { angle: -Math.PI / 2 },
    currentBubble: null,
    nextColor: null,
    flyingBubble: null,
    particles: [],
    score: 0,
    level: 1,
    combos: 0,
    totalBubbles: 0,
    animFrame: null,
    gameOver: false,
    bgStars: [],
    shootCooldown: 0,
    rowPushTimer: 0,
    rowPushInterval: 1200
};

// ===== INIT =====
function initBgStarsB() {
    bs.bgStars = [];
    for (let i = 0; i < 50; i++) {
        bs.bgStars.push({
            x: Math.random() * 580, y: Math.random() * 640,
            r: Math.random() * 1.5 + 0.3,
            a: Math.random() * 0.5 + 0.1,
            da: Math.random() > 0.5 ? 0.006 : -0.006
        });
    }
}

function initGrid() {
    bs.grid = [];
    const startRows = 5 + bs.level;
    for (let row = 0; row < startRows; row++) {
        bs.grid.push(createRow(row));
    }
    bs.totalBubbles = countAliveBubbles();
    updateBubbleCount();
}

function createRow(rowIndex) {
    const row = [];
    const isOdd = rowIndex % 2 === 1;
    const cols   = isOdd ? COLS - 1 : COLS;
    const colorCount = Math.min(4 + Math.floor(bs.level / 2), COLORS.length);
    for (let col = 0; col < cols; col++) {
        if (Math.random() < 0.85) {
            row.push({ color: COLORS[Math.floor(Math.random() * colorCount)], alive: true });
        } else {
            row.push(null);
        }
    }
    return row;
}

function pushNewRow() {
    // Shift all rows down
    bs.grid.unshift(createRow(0));
    // Keep max rows
    if (bs.grid.length > ROWS) bs.grid.pop();
    // Check danger
    if (getRowY(bs.grid.length - 1) > DANGER_LINE) {
        endBubbleGame(false);
    }
    bs.totalBubbles = countAliveBubbles();
    updateBubbleCount();
}

function countAliveBubbles() {
    let count = 0;
    bs.grid.forEach(row => row.forEach(cell => { if (cell?.alive) count++; }));
    return count;
}

function pickRandomColor() {
    const colorCount = Math.min(4 + Math.floor(bs.level / 2), COLORS.length);
    return COLORS[Math.floor(Math.random() * colorCount)];
}

function refreshShooter() {
    bs.currentBubble = { color: bs.nextColor || pickRandomColor() };
    bs.nextColor = pickRandomColor();
    updateNextPreview();
}

function updateNextPreview() {
    const prev = document.getElementById('next-bubble-preview');
    const lbl  = document.getElementById('next-bubble-label');
    if (!prev || !bs.nextColor) return;
    prev.style.background = bs.nextColor;
    prev.style.boxShadow  = `0 0 10px ${bs.nextColor}`;
    lbl.textContent = COLOR_NAMES[COLORS.indexOf(bs.nextColor)] || '—';
}

// ===== GRID COORDINATES =====
function getBubbleX(col, row) {
    const isOdd = row % 2 === 1;
    const startX = GRID_OFFSET_X + BUBBLE_R + (isOdd ? BUBBLE_R : 0);
    return startX + col * BUBBLE_R * 2;
}

function getRowY(row) {
    return GRID_OFFSET_Y + BUBBLE_R + row * BUBBLE_R * 1.73;
}

// ===== DRAW BUBBLE =====
function drawBubble(x, y, color, r, alpha = 1) {
    if (alpha <= 0) return;
    bCtx.save();
    bCtx.globalAlpha = alpha;

    // Glow
    bCtx.shadowColor = color;
    bCtx.shadowBlur  = 12;

    // Main fill
    const grad = bCtx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, lightenColor(color, 40));
    grad.addColorStop(0.6, color);
    grad.addColorStop(1, darkenColor(color, 30));
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fillStyle = grad;
    bCtx.fill();

    // Gloss
    bCtx.shadowBlur = 0;
    const gloss = bCtx.createRadialGradient(x - r * 0.2, y - r * 0.3, 0, x - r * 0.2, y - r * 0.3, r * 0.6);
    gloss.addColorStop(0, 'rgba(255,255,255,0.5)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    bCtx.beginPath();
    bCtx.arc(x, y, r, 0, Math.PI * 2);
    bCtx.fillStyle = gloss;
    bCtx.fill();

    // Border
    bCtx.strokeStyle = 'rgba(255,255,255,0.3)';
    bCtx.lineWidth   = 1;
    bCtx.stroke();

    bCtx.restore();
}

// Color helpers
function lightenColor(hex, amt) {
    const c = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (c >> 16) + amt);
    const g = Math.min(255, ((c >> 8) & 0xff) + amt);
    const b = Math.min(255, (c & 0xff) + amt);
    return `rgb(${r},${g},${b})`;
}

function darkenColor(hex, amt) { return lightenColor(hex, -amt); }

// ===== DRAW GRID =====
function drawGrid() {
    bs.grid.forEach((row, ri) => {
        row.forEach((cell, ci) => {
            if (!cell?.alive) return;
            const x = getBubbleX(ci, ri);
            const y = getRowY(ri);
            drawBubble(x, y, cell.color, BUBBLE_R * 0.95);
        });
    });
}

// ===== DRAW SHOOTER =====
function drawShooterCannon() {
    const x = SHOOTER_X, y = SHOOTER_Y;
    const angle = bs.shooter.angle;
    const len = 50;

    bCtx.save();
    bCtx.shadowColor = '#b300ff';
    bCtx.shadowBlur  = 15;

    // Base
    bCtx.fillStyle = 'rgba(179,0,255,0.2)';
    bCtx.strokeStyle = '#b300ff';
    bCtx.lineWidth = 2;
    bCtx.beginPath();
    bCtx.arc(x, y, 22, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.stroke();

    // Cannon barrel
    bCtx.strokeStyle = '#00e5ff';
    bCtx.lineWidth = 8;
    bCtx.lineCap = 'round';
    bCtx.beginPath();
    bCtx.moveTo(x, y);
    bCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    bCtx.stroke();

    // Inner glow
    bCtx.strokeStyle = 'rgba(255,255,255,0.5)';
    bCtx.lineWidth = 2;
    bCtx.stroke();

    // Current bubble in barrel
    if (bs.currentBubble && !bs.flyingBubble) {
        drawBubble(x, y, bs.currentBubble.color, 18);
    }

    bCtx.restore();
}

// ===== DRAW AIM LINE =====
function drawAimLine() {
    if (!bs.running || bs.flyingBubble) return;
    const x = SHOOTER_X, y = SHOOTER_Y;
    const angle = bs.shooter.angle;

    bCtx.save();
    bCtx.setLineDash([8, 14]);
    bCtx.strokeStyle = 'rgba(0,229,255,0.2)';
    bCtx.lineWidth = 1.5;

    let cx = x, cy = y;
    let vx = Math.cos(angle), vy = Math.sin(angle);
    const step = 10;
    const maxBounces = 2;
    let bounces = 0;

    for (let i = 0; i < 60 && bounces <= maxBounces; i++) {
        cx += vx * step;
        cy += vy * step;
        if (cx < BUBBLE_R) { cx = BUBBLE_R; vx = -vx; bounces++; }
        if (cx > 580 - BUBBLE_R) { cx = 580 - BUBBLE_R; vx = -vx; bounces++; }
        if (cy < 0) break;
    }

    cx = x; cy = y; vx = Math.cos(angle); vy = Math.sin(angle);
    bounces = 0;
    bCtx.beginPath();
    bCtx.moveTo(cx, cy);

    for (let i = 0; i < 80 && bounces <= maxBounces; i++) {
        cx += vx * step;
        cy += vy * step;
        if (cx < BUBBLE_R) { cx = BUBBLE_R; vx = -vx; bounces++; }
        if (cx > 580 - BUBBLE_R) { cx = 580 - BUBBLE_R; vx = -vx; bounces++; }
        if (cy < 0) break;
        bCtx.lineTo(cx, cy);
    }
    bCtx.stroke();
    bCtx.setLineDash([]);
    bCtx.restore();
}

// ===== FLYING BUBBLE =====
function shootBubble() {
    if (!bs.running || bs.flyingBubble || bs.shootCooldown > 0 || !bs.currentBubble) return;
    if (bs.shooter.angle > -0.1 || bs.shooter.angle < -Math.PI + 0.1) return; // no shooting sideways

    bs.flyingBubble = {
        x: SHOOTER_X,
        y: SHOOTER_Y,
        vx: Math.cos(bs.shooter.angle) * 12,
        vy: Math.sin(bs.shooter.angle) * 12,
        color: bs.currentBubble.color,
        trail: []
    };
    bs.shootCooldown = 15;
    refreshShooter();
}

function updateFlyingBubble() {
    const fb = bs.flyingBubble;
    if (!fb) return;

    fb.trail.push({ x: fb.x, y: fb.y });
    if (fb.trail.length > 12) fb.trail.shift();

    fb.x += fb.vx;
    fb.y += fb.vy;

    // Wall bounce
    if (fb.x - BUBBLE_R < 0) { fb.x = BUBBLE_R; fb.vx = -fb.vx; }
    if (fb.x + BUBBLE_R > 580) { fb.x = 580 - BUBBLE_R; fb.vx = -fb.vx; }

    // Top
    if (fb.y - BUBBLE_R <= GRID_OFFSET_Y) {
        snapBubbleToGrid(fb.x, fb.y, fb.color);
        bs.flyingBubble = null;
        return;
    }

    // Collision with grid bubbles
    for (let ri = 0; ri < bs.grid.length; ri++) {
        const row = bs.grid[ri];
        const gy  = getRowY(ri);
        if (Math.abs(fb.y - gy) > BUBBLE_R * 2.5) continue;

        for (let ci = 0; ci < row.length; ci++) {
            const cell = row[ci];
            if (!cell?.alive) continue;
            const gx   = getBubbleX(ci, ri);
            const dist = Math.hypot(fb.x - gx, fb.y - gy);
            if (dist < BUBBLE_R * 1.9) {
                snapBubbleToGrid(fb.x, fb.y, fb.color);
                bs.flyingBubble = null;
                return;
            }
        }
    }
}

function drawFlyingBubble() {
    const fb = bs.flyingBubble;
    if (!fb) return;

    fb.trail.forEach((pt, i) => {
        const alpha = (i / fb.trail.length) * 0.4;
        drawBubble(pt.x, pt.y, fb.color, BUBBLE_R * 0.5 * (i / fb.trail.length), alpha);
    });

    drawBubble(fb.x, fb.y, fb.color, BUBBLE_R);
}

function snapBubbleToGrid(bx, by, color) {
    // Find closest grid cell
    let bestRow = 0, bestCol = 0, bestDist = Infinity;
    const rowCount = bs.grid.length + 1;

    for (let ri = 0; ri < rowCount; ri++) {
        const gy  = getRowY(ri);
        if (Math.abs(by - gy) > BUBBLE_R * 2) continue;
        const isOdd = ri % 2 === 1;
        const cols  = isOdd ? COLS - 1 : COLS;

        for (let ci = 0; ci < cols; ci++) {
            const gx   = getBubbleX(ci, ri);
            const dist = Math.hypot(bx - gx, by - gy);
            if (dist < bestDist) {
                bestDist = dist;
                bestRow  = ri;
                bestCol  = ci;
            }
        }
    }

    // Ensure grid has enough rows
    while (bs.grid.length <= bestRow) {
        bs.grid.push(new Array(COLS).fill(null));
    }
    const row = bs.grid[bestRow];
    if (!row[bestCol]) {
        row[bestCol] = { color, alive: true };
    } else {
        // Find adjacent empty
        const isOdd = bestRow % 2 === 1;
        const cols  = isOdd ? COLS - 1 : COLS;
        for (let dc = -1; dc <= 1; dc++) {
            const nc = bestCol + dc;
            if (nc >= 0 && nc < cols && !row[nc]) {
                row[nc] = { color, alive: true };
                bestCol = nc;
                break;
            }
        }
    }

    checkAndBurst(bestRow, bestCol);
    bs.totalBubbles = countAliveBubbles();
    updateBubbleCount();

    // Win condition
    if (bs.totalBubbles === 0) {
        bs.level++;
        bs.score += 500 * bs.level;
        updateHUDB();
        setTimeout(() => {
            initGrid();
            bs.rowPushInterval = Math.max(400, bs.rowPushInterval - 100);
        }, 1000);
    }

    // Push timer
    bs.rowPushTimer = bs.rowPushInterval;
}

// ===== BURST MATCHING =====
function getNeighbors(row, col) {
    const isOdd = row % 2 === 1;
    const dirs  = isOdd
        ? [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]
        : [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]];
    return dirs.map(([dr, dc]) => [row + dr, col + dc])
               .filter(([r, c]) => r >= 0 && r < bs.grid.length && c >= 0 && c < (bs.grid[r]?.length || 0));
}

function findConnected(startRow, startCol, color) {
    const visited = new Set();
    const queue   = [[startRow, startCol]];
    const result  = [];

    while (queue.length > 0) {
        const [r, c] = queue.shift();
        const key = `${r},${c}`;
        if (visited.has(key)) continue;
        visited.add(key);
        const cell = bs.grid[r]?.[c];
        if (!cell?.alive || cell.color !== color) continue;
        result.push([r, c]);
        getNeighbors(r, c).forEach(n => queue.push(n));
    }
    return result;
}

function checkAndBurst(row, col) {
    const cell  = bs.grid[row]?.[col];
    if (!cell?.alive) return;
    const color = cell.color;
    const group = findConnected(row, col, color);

    if (group.length >= 3) {
        bs.combos++;
        const pts = group.length * 10 * bs.level + (bs.combos > 1 ? bs.combos * 5 : 0);
        bs.score += pts;

        group.forEach(([r, c]) => {
            const b = bs.grid[r][c];
            if (b) {
                b.alive = false;
                spawnBubbleParticles(getBubbleX(c, r), getRowY(r), b.color);
            }
        });

        // Remove floating (unconnected to top row)
        removeFloating();
        updateHUDB();
    } else {
        bs.combos = 0;
    }
}

function removeFloating() {
    if (!bs.grid[0]) return;
    const visited = new Set();

    function dfs(r, c) {
        const key = `${r},${c}`;
        if (visited.has(key) || r < 0 || r >= bs.grid.length) return;
        if (!bs.grid[r]?.[c]?.alive) return;
        visited.add(key);
        getNeighbors(r, c).forEach(([nr, nc]) => dfs(nr, nc));
    }

    bs.grid[0].forEach((cell, ci) => { if (cell?.alive) dfs(0, ci); });

    bs.grid.forEach((row, ri) => {
        row.forEach((cell, ci) => {
            if (cell?.alive && !visited.has(`${ri},${ci}`)) {
                cell.alive = false;
                bs.score += 5 * bs.level;
                spawnBubbleParticles(getBubbleX(ci, ri), getRowY(ri), cell.color);
            }
        });
    });
}

// ===== PARTICLES =====
function spawnBubbleParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1;
        bs.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: Math.random() * 8 + 3,
            color,
            life: 1,
            decay: Math.random() * 0.04 + 0.02
        });
    }
}

function updateDrawParticles() {
    bs.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= p.decay;
        drawBubble(p.x, p.y, p.color, p.r * p.life, p.life);
    });
    bs.particles = bs.particles.filter(p => p.life > 0);
}

// ===== BG =====
function drawBgB() {
    bCtx.fillStyle = '#060311';
    bCtx.fillRect(0, 0, 580, 640);

    // Grid lines
    bCtx.strokeStyle = 'rgba(0,229,255,0.04)';
    bCtx.lineWidth = 1;
    for (let x = 0; x < 580; x += 58) {
        bCtx.beginPath(); bCtx.moveTo(x, 0); bCtx.lineTo(x, 640); bCtx.stroke();
    }
    for (let y = 0; y < 640; y += 58) {
        bCtx.beginPath(); bCtx.moveTo(0, y); bCtx.lineTo(580, y); bCtx.stroke();
    }

    // Stars
    bs.bgStars.forEach(s => {
        s.a += s.da;
        if (s.a <= 0.05 || s.a >= 0.7) s.da = -s.da;
        bCtx.beginPath();
        bCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        bCtx.fillStyle = `rgba(255,255,255,${s.a})`;
        bCtx.fill();
    });

    // Danger line
    const dangerAlpha = Math.sin(Date.now() * 0.003) * 0.3 + 0.3;
    bCtx.strokeStyle = `rgba(255,0,123,${dangerAlpha})`;
    bCtx.lineWidth = 1;
    bCtx.setLineDash([8, 8]);
    bCtx.beginPath();
    bCtx.moveTo(0, DANGER_LINE);
    bCtx.lineTo(580, DANGER_LINE);
    bCtx.stroke();
    bCtx.setLineDash([]);
    bCtx.fillStyle = `rgba(255,0,123,${dangerAlpha * 0.7})`;
    bCtx.font = '9px Orbitron';
    bCtx.textAlign = 'right';
    bCtx.fillText('BREACH LINE', 576, DANGER_LINE - 4);
}

// ===== INPUT =====
bCanvas.addEventListener('mousemove', (e) => {
    if (!bs.running) return;
    const rect  = bCanvas.getBoundingClientRect();
    const scaleX = bCanvas.width  / rect.width;
    const scaleY = bCanvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;
    const angle = Math.atan2(my - SHOOTER_Y, mx - SHOOTER_X);
    bs.shooter.angle = Math.max(-Math.PI + 0.1, Math.min(-0.1, angle));
});

bCanvas.addEventListener('click', () => { if (bs.running) shootBubble(); });

bCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!bs.running) return;
    const touch = e.touches[0];
    const rect  = bCanvas.getBoundingClientRect();
    const scaleX = bCanvas.width  / rect.width;
    const scaleY = bCanvas.height / rect.height;
    const mx = (touch.clientX - rect.left) * scaleX;
    const my = (touch.clientY - rect.top)  * scaleY;
    const angle = Math.atan2(my - SHOOTER_Y, mx - SHOOTER_X);
    bs.shooter.angle = Math.max(-Math.PI + 0.1, Math.min(-0.1, angle));
    setTimeout(shootBubble, 50);
}, { passive: false });

// ===== HUD UPDATE =====
function updateHUDB() {
    document.getElementById('b-score').textContent     = bs.score;
    document.getElementById('b-level').textContent     = bs.level;
    document.getElementById('b-combo').textContent     = bs.combos;
}

function updateBubbleCount() {
    document.getElementById('b-remaining').textContent = countAliveBubbles();
}

// ===== GAME LOOP =====
function bubbleLoop() {
    if (!bs.running) return;
    bCtx.clearRect(0, 0, 580, 640);
    drawBgB();
    drawGrid();
    drawAimLine();
    drawFlyingBubble();
    drawShooterCannon();
    updateDrawParticles();

    updateFlyingBubble();
    if (bs.shootCooldown > 0) bs.shootCooldown--;

    // Row push timer
    if (!bs.flyingBubble) {
        bs.rowPushTimer--;
        if (bs.rowPushTimer <= 0) {
            bs.rowPushTimer = bs.rowPushInterval;
            pushNewRow();
        }
    }

    bs.animFrame = requestAnimationFrame(bubbleLoop);
}

// ===== START =====
function startBubbleGame() {
    if (bs.animFrame) cancelAnimationFrame(bs.animFrame);
    document.getElementById('bubble-gameover').classList.remove('show');

    Object.assign(bs, {
        running: true,
        gameOver: false,
        score: 0,
        level: 1,
        combos: 0,
        particles: [],
        flyingBubble: null,
        shootCooldown: 0,
        rowPushTimer: 1200,
        rowPushInterval: 1200
    });

    initBgStarsB();
    initGrid();
    bs.nextColor = pickRandomColor();
    refreshShooter();
    updateHUDB();
    document.getElementById('bubble-start-btn').textContent = '⟳ Restart';
    bubbleLoop();
}

// ===== END =====
function endBubbleGame(win) {
    bs.running  = false;
    bs.gameOver = true;
    if (bs.animFrame) cancelAnimationFrame(bs.animFrame);

    const xpEarned = Math.floor(bs.score * 0.4) + bs.level * 50;

    document.getElementById('bgo-score').textContent = bs.score;
    document.getElementById('bgo-level').textContent = bs.level;
    document.getElementById('bgo-combo').textContent = bs.combos;
    document.getElementById('bgo-xp').textContent    = '+' + xpEarned;

    if (win) {
        document.getElementById('bgo-icon').textContent  = '🏆';
        document.getElementById('bgo-title').textContent = 'MATRIX CLEARED!';
        document.getElementById('bgo-sub').textContent   = 'All bubbles eliminated. Legendary performance!';
    } else {
        document.getElementById('bgo-icon').textContent  = '💥';
        document.getElementById('bgo-title').textContent = 'SYSTEM BREACH';
        document.getElementById('bgo-sub').textContent   = 'The bubble matrix reached your base. Try again!';
    }

    document.getElementById('bubble-gameover').classList.add('show');

    if (typeof awardXP === 'function') {
        awardXP(xpEarned, 'bubble', bs.score);
    }
}

// ===== IDLE =====
(function drawIdleB() {
    initBgStarsB();
    function idleFrame() {
        if (bs.running) return;
        bCtx.clearRect(0, 0, 580, 640);
        drawBgB();

        // Demo bubbles
        const demoColors = ['#ff007b', '#00e5ff', '#b300ff', '#ffd700', '#00ff41'];
        demoColors.forEach((c, i) => {
            drawBubble(
                120 + i * 80,
                200 + Math.sin(Date.now() * 0.002 + i) * 20,
                c, BUBBLE_R
            );
        });

        bCtx.fillStyle = 'rgba(0,229,255,0.7)';
        bCtx.font = 'bold 26px Orbitron';
        bCtx.textAlign = 'center';
        bCtx.textBaseline = 'middle';
        bCtx.shadowColor = '#00e5ff';
        bCtx.shadowBlur  = 15;
        bCtx.fillText('BUBBLE MATRIX BLASTER', 290, 350);
        bCtx.shadowBlur  = 0;
        bCtx.fillStyle = 'rgba(255,255,255,0.4)';
        bCtx.font = '13px Roboto Mono';
        bCtx.fillText('Click "Start Game" to begin', 290, 390);
        bCtx.fillStyle = 'rgba(179,0,255,0.6)';
        bCtx.font = '10px Orbitron';
        bCtx.fillText('[ MOVE MOUSE TO AIM · CLICK TO SHOOT ]', 290, 420);

        requestAnimationFrame(idleFrame);
    }
    idleFrame();
})();
