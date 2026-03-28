document.addEventListener('DOMContentLoaded', () => {
    // Check if on login/signup pages
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html');
    const user = JSON.parse(localStorage.getItem('cyber_current_user'));

    if (!user && !isAuthPage) {
        window.location.href = 'login.html';
        return;
    }

    if (user && isAuthPage) {
        window.location.href = 'index.html';
        return;
    }

    // Sync localStorage if logged in (preserve streak/login data)
    if (user) {
        const existing = JSON.parse(localStorage.getItem('cyber_user')) || {};
        localStorage.setItem('cyber_user', JSON.stringify({
            username: user.username,
            xp: user.xp || existing.xp || 0,
            gamesPlayed: user.gamesPlayed || existing.gamesPlayed || 0,
            badges: user.badges || existing.badges || [],
            scores: user.scores || existing.scores || {},
            // Preserve streak data — never overwrite from current_user
            lastLoginDate:  existing.lastLoginDate  || null,
            loginStreak:    existing.loginStreak    || 0,
            longestStreak:  existing.longestStreak  || 0
        }));
    }

    initGamification();
    updateUI();
    initStarfield();
    injectLogoutButton();
});

function injectLogoutButton() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.getElementById('logout-btn')) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" id="logout-btn" style="color: var(--neon-red);"><i class="fas fa-sign-out-alt"></i> Logout</a>`;
        navLinks.appendChild(li);
        
        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('cyber_current_user');
            window.location.href = 'login.html';
        });
    }
}

function initStarfield() {
    const canvas = document.createElement('canvas');
    canvas.id = 'ambient-starfield';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let stars = [];

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        initStars();
    }

    function initStars() {
        stars = [];
        const numStars = Math.floor((width * height) / 3000);
        const colors = ['255, 255, 255', '0, 229, 255', '179, 0, 255'];
        
        for(let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 1.2 + 0.3,
                vx: Math.random() * 0.3 - 0.15,
                vy: Math.random() * 0.3 - 0.15,
                alpha: Math.random() * 0.6 + 0.1,
                alphaDir: Math.random() > 0.5 ? 0.005 : -0.005,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        stars.forEach(star => {
            // Movement
            star.x += star.vx;
            star.y += star.vy;

            // Wraparound
            if(star.x < 0) star.x = width;
            if(star.x > width) star.x = 0;
            if(star.y < 0) star.y = height;
            if(star.y > height) star.y = 0;

            // Twinkle effect
            star.alpha += star.alphaDir;
            if(star.alpha <= 0.1 || star.alpha >= 0.8) {
                star.alphaDir = -star.alphaDir;
            }

            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${star.color}, ${star.alpha})`;
            ctx.fill();
        });
        
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
}

// Sound Effects (using simple AudioContext for beep synthesis)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const os = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    os.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'click') {
        os.type = 'sine';
        os.frequency.setValueAtTime(600, audioCtx.currentTime);
        os.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        os.start();
        os.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'success') {
        os.type = 'triangle';
        os.frequency.setValueAtTime(400, audioCtx.currentTime);
        os.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
        os.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        os.start();
        os.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'error') {
        os.type = 'sawtooth';
        os.frequency.setValueAtTime(200, audioCtx.currentTime);
        os.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        os.start();
        os.stop(audioCtx.currentTime + 0.2);
    }
}

// Add click sounds to all buttons
document.addEventListener('click', (e) => {
    if(e.target.tagName === 'BUTTON' || e.target.classList.contains('btn-neon') || e.target.tagName === 'A') {
        playSound('click');
    }
});

// Gamification System
const LEVELS = [
    { name: "Script Kiddie", minXP: 0 },
    { name: "Beginner", minXP: 200 },
    { name: "Intermediate", minXP: 500 },
    { name: "Advanced", minXP: 1000 },
    { name: "Cyber Expert", minXP: 2000 },
    { name: "1337 H4X0R", minXP: 5000 }
];

function initGamification() {
    if (!localStorage.getItem('cyber_user')) {
        let username = "Guest_" + Math.floor(Math.random() * 10000);
        localStorage.setItem('cyber_user', JSON.stringify({
            username: username,
            xp: 0,
            gamesPlayed: 0,
            badges: [],
            scores: {}
        }));
        
        // Setup initial mock leaderboard
        setupMockLeaderboard();
    }
}

function getUserData() {
    return JSON.parse(localStorage.getItem('cyber_user'));
}

function saveUserData(data) {
    localStorage.setItem('cyber_user', JSON.stringify(data));
    updateUI();
}

function getCurrentLevel(xp) {
    let currentLevel = LEVELS[0];
    for(let i = 0; i < LEVELS.length; i++) {
        if(xp >= LEVELS[i].minXP) {
            currentLevel = LEVELS[i];
        }
    }
    return currentLevel.name;
}

function getNextLevel(xp) {
    for(let i = 0; i < LEVELS.length; i++) {
        if(xp < LEVELS[i].minXP) {
            return LEVELS[i];
        }
    }
    return null; // Max level
}

function awardXP(points, gameId, score) {
    let userData = getUserData();
    userData.xp += points;
    userData.gamesPlayed += 1;
    
    if(!userData.scores[gameId] || score > userData.scores[gameId]) {
        userData.scores[gameId] = score;
    }
    
    // Check badges logic
    checkBadges(userData);
    
    saveUserData(userData);
    
    // Update global leaderboard if exists
    updateLeaderboard(userData);
    
    return userData.xp;
}

function checkBadges(userData) {
    const newBadges = [];
    if(userData.gamesPlayed >= 1 && !userData.badges.includes("First Login")) newBadges.push("First Login");
    if(userData.gamesPlayed >= 5 && !userData.badges.includes("Arcade Regular")) newBadges.push("Arcade Regular");
    if(userData.xp >= 1000 && !userData.badges.includes("1K Club")) newBadges.push("1K Club");
    
    if(newBadges.length > 0) {
        userData.badges = [...userData.badges, ...newBadges];
        // Could trigger a badge popup here
    }
}

function updateUI() {
    const userData = getUserData();
    if(!userData) return;
    
    document.querySelectorAll('.user-xp-display').forEach(el => el.textContent = userData.xp + " XP");
    document.querySelectorAll('.user-level-display').forEach(el => el.textContent = getCurrentLevel(userData.xp));
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = userData.username);

    // Global XP Bar update
    const xpBar = document.getElementById('global-xp-bar');
    const xpPercent = document.getElementById('xp-percent');
    if (xpBar && xpPercent) {
        const nextLevel = getNextLevel(userData.xp);
        const currentLevelObj = LEVELS.find(l => l.name === getCurrentLevel(userData.xp));
        
        if (nextLevel) {
            const range = nextLevel.minXP - currentLevelObj.minXP;
            const progress = userData.xp - currentLevelObj.minXP;
            const percentage = Math.min(100, Math.floor((progress / range) * 100));
            xpBar.style.width = percentage + "%";
            xpPercent.textContent = percentage;
        } else {
            xpBar.style.width = "100%";
            xpPercent.textContent = "100";
        }
    }
}

// Modal Logic
function showMissionComplete(score, xpEarned, gameName) {
    playSound('success');
    
    let overlay = document.querySelector('.modal-overlay');
    
    if(!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content">
                <i class="fas fa-trophy modal-icon"></i>
                <h2 class="modal-title">MISSION COMPLETED</h2>
                <p>System successfully compromised... I mean, secured.</p>
                <div class="modal-stats">
                    <div class="stat-item">
                        <span class="stat-label">System Score</span>
                        <span class="stat-value" id="modal-score">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">XP Earned</span>
                        <span class="stat-value xp-val" id="modal-xp">+0</span>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 2rem;">
                    <button class="btn-neon" onclick="location.reload()">Play Again</button>
                    <a href="index.html" class="btn-neon btn-neon-green">Dashboard</a>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    document.getElementById('modal-score').textContent = score;
    document.getElementById('modal-xp').textContent = "+" + xpEarned;
    
    // Animation
    setTimeout(() => {
        overlay.classList.add('active');
    }, 500);
}

// Global leaderboard mock logic
function setupMockLeaderboard() {
    if(!localStorage.getItem('cyber_leaderboard')) {
        const mockData = [
            { username: "ZeroCool", xp: 4500, gamesPlayed: 45 },
            { username: "AcidBurn", xp: 4200, gamesPlayed: 40 },
            { username: "CrashOverride", xp: 3800, gamesPlayed: 35 },
            { username: "PhantomPhreak", xp: 2500, gamesPlayed: 25 },
            { username: "CerealKiller", xp: 1200, gamesPlayed: 15 }
        ];
        localStorage.setItem('cyber_leaderboard', JSON.stringify(mockData));
    }
}

function updateLeaderboard(userData) {
    let lb = JSON.parse(localStorage.getItem('cyber_leaderboard')) || [];
    
    // Remove old entry for user if exists
    lb = lb.filter(u => u.username !== userData.username);
    
    lb.push({
        username: userData.username,
        xp: userData.xp,
        gamesPlayed: userData.gamesPlayed
    });
    
    // Sort descending
    lb.sort((a,b) => b.xp - a.xp);
    
    localStorage.setItem('cyber_leaderboard', JSON.stringify(lb));
}
