/**
 * =============================================
 *  CYBER ARCADE — Memory Flips: Enhanced Engine
 * =============================================
 */
document.addEventListener('DOMContentLoaded', () => {
    const board       = document.getElementById('memory-board');
    const movesEl     = document.getElementById('moves');
    const matchesEl   = document.getElementById('matches');
    const timerEl     = document.getElementById('timer');
    const restartBtn  = document.getElementById('restart-btn');
    const levelSelect = document.getElementById('memory-level');

    const ALL_CARDS = [
        { icon: 'fa-shield-halved',  emoji: '🛡️',  label: 'Shield',      color: '#00e5ff' },
        { icon: 'fa-server',         emoji: '🖥️',  label: 'Server',      color: '#b300ff' },
        { icon: 'fa-network-wired',  emoji: '🌐',  label: 'Network',     color: '#00ff41' },
        { icon: 'fa-lock',           emoji: '🔐',  label: 'Lock',        color: '#ffd700' },
        { icon: 'fa-user-secret',    emoji: '🕵️',  label: 'Hacker',      color: '#ff007b' },
        { icon: 'fa-bug',            emoji: '🐛',  label: 'Bug',         color: '#ff6b35' },
        { icon: 'fa-fingerprint',    emoji: '🔏',  label: 'Auth',        color: '#00e5ff' },
        { icon: 'fa-eye',            emoji: '👁️',  label: 'Monitor',     color: '#7c3aed' },
        { icon: 'fa-database',       emoji: '🗄️',  label: 'Database',    color: '#06b6d4' },
        { icon: 'fa-satellite-dish', emoji: '📡',  label: 'Signal',      color: '#b300ff' },
        { icon: 'fa-microchip',      emoji: '💾',  label: 'Chip',        color: '#00ff41' },
        { icon: 'fa-cloud-meatball', emoji: '☁️',  label: 'Cloud',       color: '#ff007b' },
    ];

    let pool = [];
    let hasFlipped = false;
    let locked     = false;
    let firstCard, secondCard;
    let moves   = 0;
    let matches = 0;
    let totalPairs = 0;
    let combo   = 0;
    let bestCombo = 0;
    let timerInterval;
    let elapsed = 0;
    let timerStarted = false;

    // ===== Init =====
    function initGame() {
        const level = parseInt(levelSelect.value);
        clearInterval(timerInterval);
        moves = 0; matches = 0; combo = 0; bestCombo = 0;
        elapsed = 0; timerStarted = false;
        hasFlipped = false; locked = false;
        firstCard = null; secondCard = null;

        let numPairs, cols;
        if (level === 1)      { numPairs = 8;  cols = 4; }
        else if (level === 2) { numPairs = 10; cols = 4; }
        else                  { numPairs = 12; cols = 4; }

        totalPairs = numPairs;
        pool = ALL_CARDS.slice(0, numPairs);

        // Shuffle pairs
        let deck = [...pool, ...pool];
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        board.style.gridTemplateColumns = `repeat(${cols}, 80px)`;
        board.innerHTML = '';

        deck.forEach((cardData, idx) => {
            const card = document.createElement('div');
            card.classList.add('memory-card');
            card.dataset.icon = cardData.icon;
            card.style.animationDelay = `${idx * 0.04}s`;
            card.style.animation = `cardDeal 0.4s ${idx * 0.04}s cubic-bezier(0.175,0.885,0.32,1.275) both`;

            card.innerHTML = `
                <div class="front-face" style="border-color:${cardData.color};color:${cardData.color};box-shadow:0 0 0 rgba(0,0,0,0)">
                    <i class="fas ${cardData.icon}"></i>
                    <small style="display:block;font-size:0.55rem;font-family:var(--font-heading);letter-spacing:1px;opacity:0.8;margin-top:4px;color:${cardData.color}">${cardData.label}</small>
                </div>
                <div class="back-face">
                    <i class="fas fa-shield-halved" style="font-size:1.2rem;opacity:0.3"></i>
                    <div style="font-size:0.55rem;font-family:var(--font-heading);letter-spacing:2px;opacity:0.35;margin-top:4px">CYBER</div>
                </div>
            `;

            card.addEventListener('click', () => flipCard(card, cardData));
            board.appendChild(card);
        });

        injectDealKeyframe();
        updateStats();
        updateTimerDisplay();
        updateComboDisplay();
    }

    function injectDealKeyframe() {
        if (!document.getElementById('memory-extra-styles')) {
            const s = document.createElement('style');
            s.id = 'memory-extra-styles';
            s.textContent = `
                @keyframes cardDeal {
                    from { opacity: 0; transform: rotateY(90deg) scale(0.8); }
                    to   { opacity: 1; transform: rotateY(0deg) scale(1); }
                }
                @keyframes matchPulse {
                    0%   { box-shadow: 0 0 0px rgba(0,255,65,0); }
                    50%  { box-shadow: 0 0 28px rgba(0,255,65,0.7); }
                    100% { box-shadow: 0 0 14px rgba(0,255,65,0.35); }
                }
                @keyframes wrongShake {
                    0%,100% { transform: rotateY(180deg) translateX(0); }
                    25%     { transform: rotateY(180deg) translateX(-6px); }
                    75%     { transform: rotateY(180deg) translateX(6px); }
                }
                @keyframes comboFloat {
                    0%   { opacity:1; transform:translateY(0) scale(1); }
                    60%  { opacity:1; transform:translateY(-40px) scale(1.3); }
                    100% { opacity:0; transform:translateY(-80px) scale(0.8); }
                }
                .memory-card.matched .front-face {
                    animation: matchPulse 0.6s ease forwards !important;
                }
                .memory-card.wrong-shake {
                    animation: wrongShake 0.4s ease !important;
                }
                .combo-float {
                    position: fixed;
                    font-family: var(--font-heading);
                    font-weight: 900;
                    font-size: 1.4rem;
                    pointer-events: none;
                    z-index: 9999;
                    animation: comboFloat 1s ease-out forwards;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.9);
                }
            `;
            document.head.appendChild(s);
        }
    }

    // ===== Flip Logic =====
    function flipCard(card, cardData) {
        if (locked) return;
        if (card === firstCard) return;
        if (card.classList.contains('matched')) return;
        if (card.classList.contains('flip')) return;

        if (!timerStarted) startTimer();
        if (typeof playSound === 'function') playSound('click');

        card.classList.add('flip');

        if (!hasFlipped) {
            hasFlipped = true;
            firstCard  = card;
            return;
        }

        secondCard = card;
        moves++;
        updateStats();
        checkMatch(cardData);
    }

    function checkMatch(secondData) {
        const isMatch = firstCard.dataset.icon === secondCard.dataset.icon;
        if (isMatch) {
            handleMatch();
        } else {
            handleMismatch();
        }
    }

    function handleMatch() {
        combo++;
        bestCombo = Math.max(bestCombo, combo);

        const fc = firstCard, sc = secondCard;
        const cardData = ALL_CARDS.find(c => c.icon === fc.dataset.icon);
        const color = cardData?.color || '#00e5ff';

        fc.classList.add('matched');
        sc.classList.add('matched');
        fc.removeEventListener('click', () => {});
        sc.removeEventListener('click', () => {});

        // Glow the matched cards
        fc.querySelector('.front-face').style.boxShadow = `0 0 18px ${color}`;
        sc.querySelector('.front-face').style.boxShadow = `0 0 18px ${color}`;

        if (typeof playSound === 'function') playSound('success');

        // Combo popup
        if (combo >= 2) {
            spawnComboFloat(fc, combo, color);
        }

        // Particles
        spawnMatchParticles(fc, color);
        spawnMatchParticles(sc, color);

        matches++;
        updateStats();
        updateComboDisplay();
        resetBoard();

        if (matches === totalPairs) {
            setTimeout(gameWin, 600);
        }
    }

    function handleMismatch() {
        combo = 0;
        updateComboDisplay();
        locked = true;

        // Shake both wrong cards after brief delay
        setTimeout(() => {
            firstCard?.classList.add('wrong-shake');
            secondCard?.classList.add('wrong-shake');
            setTimeout(() => {
                firstCard?.classList.remove('flip', 'wrong-shake');
                secondCard?.classList.remove('flip', 'wrong-shake');
                resetBoard();
            }, 420);
        }, 600);

        if (typeof playSound === 'function') playSound('error');
    }

    function resetBoard() {
        hasFlipped = false; locked = false;
        firstCard = null; secondCard = null;
    }

    // ===== Particles =====
    function spawnMatchParticles(card, color) {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const colors = [color, '#ffffff', '#ffd700'];

        for (let i = 0; i < 12; i++) {
            const p = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 60 + 30;
            const size = Math.random() * 6 + 3;
            p.style.cssText = `
                position:fixed; left:${cx}px; top:${cy}px;
                width:${size}px; height:${size}px; border-radius:50%;
                background:${colors[Math.floor(Math.random() * colors.length)]};
                pointer-events:none; z-index:9999;
                --tx:${Math.cos(angle) * speed}px; --ty:${Math.sin(angle) * speed}px;
                animation: comboFloat 0.8s ease-out forwards;
                transform-origin: center;
            `;
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 900);
        }
    }

    function spawnComboFloat(card, comboCount, color) {
        const rect = card.getBoundingClientRect();
        const div = document.createElement('div');
        div.className = 'combo-float';
        div.style.cssText = `left:${rect.left + rect.width/2}px; top:${rect.top}px; color:${color};`;
        div.textContent = `${comboCount}x COMBO!`;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 1100);
    }

    // ===== Timer =====
    function startTimer() {
        timerStarted = true;
        timerInterval = setInterval(() => {
            elapsed++;
            updateTimerDisplay();
        }, 1000);
    }

    function updateTimerDisplay() {
        const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const s = (elapsed % 60).toString().padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;
        if (elapsed > 90) timerEl.style.color = '#ff007b';
        else timerEl.style.color = '#ffd700';
    }

    function updateStats() {
        movesEl.textContent  = moves;
        matchesEl.textContent = `${matches} / ${totalPairs}`;
    }

    function updateComboDisplay() {
        let comboEl = document.getElementById('combo-display');
        if (!comboEl) return;
        if (combo >= 2) {
            comboEl.textContent = `${combo}x`;
            comboEl.style.opacity = '1';
        } else {
            comboEl.textContent = '0';
            comboEl.style.opacity = '0.3';
        }
    }

    // ===== Win =====
    function gameWin() {
        clearInterval(timerInterval);

        const penalty    = Math.max(0, (moves - totalPairs) * 2);
        const timeBonus  = elapsed < 30 ? 50 : elapsed < 60 ? 25 : 0;
        const comboBonus = bestCombo >= 3 ? bestCombo * 10 : 0;
        let xp = Math.max(50, 150 - penalty + timeBonus + comboBonus);
        const level = parseInt(levelSelect.value);
        xp = Math.round(xp * (1 + (level - 1) * 0.4));

        if (typeof awardXP === 'function') awardXP(xp, 'memory', xp);

        // Show win panel
        showMemoryWin(xp, moves, elapsed, bestCombo);
    }

    function showMemoryWin(xp, moves, elapsed, bestCombo) {
        document.getElementById('mw-xp')?.remove();
        const panel = document.createElement('div');
        panel.id = 'mw-xp';
        panel.innerHTML = `
        <div style="
            position:fixed;inset:0;z-index:8000;
            background:rgba(0,0,0,0.9);backdrop-filter:blur(12px);
            display:flex;align-items:center;justify-content:center;
        ">
            <div style="
                background:linear-gradient(135deg,rgba(15,10,40,0.99),rgba(11,7,26,0.99));
                border:1px solid rgba(0,255,65,0.4);border-radius:24px;
                padding:2.5rem 2rem;max-width:440px;width:94%;text-align:center;
                box-shadow:0 0 60px rgba(0,255,65,0.25);
                animation:mdPopIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both;
            ">
                <div style="font-size:4rem;margin-bottom:0.8rem">🧠</div>
                <h2 style="font-family:var(--font-heading);letter-spacing:3px;color:#fff;margin-bottom:0.4rem">MATRIX DECRYPTED</h2>
                <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1.5rem">All pairs matched — neural sync complete</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.5rem">
                    <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px">
                        <div style="font-size:0.6rem;color:var(--text-muted);letter-spacing:1px;font-family:var(--font-heading);text-transform:uppercase">Moves</div>
                        <div style="font-size:1.3rem;font-weight:700;font-family:var(--font-heading);color:#00e5ff;margin-top:4px">${moves}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px">
                        <div style="font-size:0.6rem;color:var(--text-muted);letter-spacing:1px;font-family:var(--font-heading);text-transform:uppercase">Time</div>
                        <div style="font-size:1.3rem;font-weight:700;font-family:var(--font-heading);color:#ffd700;margin-top:4px">${Math.floor(elapsed/60).toString().padStart(2,'0')}:${(elapsed%60).toString().padStart(2,'0')}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px">
                        <div style="font-size:0.6rem;color:var(--text-muted);letter-spacing:1px;font-family:var(--font-heading);text-transform:uppercase">Best Combo</div>
                        <div style="font-size:1.3rem;font-weight:700;font-family:var(--font-heading);color:var(--neon-blue);margin-top:4px">${bestCombo}x</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(0,255,65,0.15);border-radius:10px;padding:12px">
                        <div style="font-size:0.6rem;color:var(--text-muted);letter-spacing:1px;font-family:var(--font-heading);text-transform:uppercase">XP Earned</div>
                        <div style="font-size:1.3rem;font-weight:700;font-family:var(--font-heading);color:var(--neon-green);margin-top:4px">+${xp}</div>
                    </div>
                </div>
                <div style="display:flex;gap:12px;justify-content:center">
                    <button class="btn-neon" onclick="document.getElementById('mw-xp')?.remove();document.getElementById('restart-btn')?.click()">
                        <i class="fas fa-redo"></i> Play Again
                    </button>
                    <a href="index.html" class="btn-neon btn-neon-green">
                        <i class="fas fa-home"></i> Dashboard
                    </a>
                </div>
            </div>
        </div>`;
        document.body.appendChild(panel);
    }

    // ===== Events =====
    levelSelect.addEventListener('change', initGame);
    restartBtn.addEventListener('click', () => {
        document.getElementById('mw-xp')?.remove();
        initGame();
    });

    initGame();
});
