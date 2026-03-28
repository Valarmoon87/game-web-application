/**
 * ==========================================
 *  CYBER ARCADE — Daily Streak & Login Gift
 * ==========================================
 */

const STREAK_GIFTS = [
    { day: 1,  xp: 50,   icon: '🎁', label: 'Welcome Back!',   badge: null },
    { day: 2,  xp: 100,  icon: '⚡', label: 'Hot Start!',      badge: null },
    { day: 3,  xp: 150,  icon: '🔥', label: '3-Day Streak!',   badge: 'Flame Starter' },
    { day: 4,  xp: 200,  icon: '💥', label: 'Force Field!',    badge: null },
    { day: 5,  xp: 350,  icon: '🌟', label: '5-Day Legend!',   badge: '5-Day Warrior' },
    { day: 6,  xp: 400,  icon: '⚔️', label: 'Relentless!',     badge: null },
    { day: 7,  xp: 750,  icon: '🏆', label: '7-Day Champion!', badge: 'Weekly Champion' },
];

function getStreakGift(streakDay) {
    const idx = Math.min(streakDay - 1, STREAK_GIFTS.length - 1);
    return STREAK_GIFTS[idx];
}

function checkDailyLogin() {
    const userData = JSON.parse(localStorage.getItem('cyber_user'));
    if (!userData) return;

    const now = new Date();
    const todayStr = now.toDateString();

    const lastLogin  = userData.lastLoginDate  || null;
    const streak     = userData.loginStreak    || 0;
    const longestStreak = userData.longestStreak || 0;

    // Already claimed today
    if (lastLogin === todayStr) return;

    // Already shown popup this session (e.g. navigated back to home)
    if (sessionStorage.getItem('streak_shown_today') === todayStr) return;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let newStreak = 1;
    if (lastLogin === yesterdayStr) {
        newStreak = streak + 1;
    }

    const gift = getStreakGift(newStreak);

    // Award XP
    userData.xp = (userData.xp || 0) + gift.xp;
    userData.lastLoginDate = todayStr;
    userData.loginStreak = newStreak;
    userData.longestStreak = Math.max(longestStreak, newStreak);

    // Award Badge
    if (gift.badge && !userData.badges.includes(gift.badge)) {
        userData.badges.push(gift.badge);
    }

    // Mark as claimed today in persistent storage
    localStorage.setItem('cyber_user', JSON.stringify(userData));

    // Also update current_user
    const currentUser = JSON.parse(localStorage.getItem('cyber_current_user'));
    if (currentUser) {
        currentUser.xp = userData.xp;
        currentUser.loginStreak = newStreak;
        currentUser.longestStreak = userData.longestStreak;
        if (gift.badge && !currentUser.badges?.includes(gift.badge)) {
            currentUser.badges = currentUser.badges || [];
            currentUser.badges.push(gift.badge);
        }
        localStorage.setItem('cyber_current_user', JSON.stringify(currentUser));
    }

    // Mark popup as shown for this session
    sessionStorage.setItem('streak_shown_today', todayStr);

    // Show popup after a short delay
    setTimeout(() => showStreakPopup(newStreak, gift), 800);
}

function showStreakPopup(streakDay, gift) {
    // Remove any existing
    document.getElementById('streak-popup')?.remove();

    const allGifts = STREAK_GIFTS;
    const daysHTML = allGifts.map((g, i) => {
        const day = i + 1;
        const claimed = day < streakDay;
        const current = day === streakDay;
        const locked  = day > streakDay;
        return `
        <div class="streak-day ${claimed ? 'claimed' : ''} ${current ? 'current' : ''} ${locked ? 'locked' : ''}">
            <div class="streak-day-icon">${g.icon}</div>
            <div class="streak-day-label">Day ${day}</div>
            <div class="streak-day-xp">+${g.xp}</div>
            ${current ? '<div class="streak-day-today">TODAY</div>' : ''}
            ${claimed ? '<div class="streak-check">✓</div>' : ''}
        </div>`;
    }).join('');

    const popup = document.createElement('div');
    popup.id = 'streak-popup';
    popup.innerHTML = `
    <div class="streak-overlay" id="streak-overlay">
        <div class="streak-panel">
            <div class="streak-sparkles" id="streak-sparkles"></div>
            <button class="streak-close" onclick="closeStreakPopup()"><i class="fas fa-times"></i></button>

            <div class="streak-header">
                <div class="streak-icon-ring">${gift.icon}</div>
                <h2 class="streak-title">DAILY LOGIN GIFT</h2>
                <p class="streak-subtitle">${gift.label}</p>
            </div>

            <div class="streak-xp-badge">
                <i class="fas fa-bolt"></i>
                <span>+${gift.xp} XP</span>
                <small>Credited to your account</small>
            </div>

            <div class="streak-fire-label">
                <i class="fas fa-fire"></i>
                <span>${streakDay}-Day Streak Active</span>
            </div>

            <div class="streak-days-row">${daysHTML}</div>

            ${gift.badge ? `<div class="streak-badge-earned"><i class="fas fa-award"></i> New Badge: <strong>${gift.badge}</strong></div>` : ''}

            <button class="streak-claim-btn" onclick="closeStreakPopup()">
                <i class="fas fa-hand-sparkles"></i> Claim Gift
            </button>
        </div>
    </div>
    `;

    // Inject styles
    if (!document.getElementById('streak-styles')) {
        const style = document.createElement('style');
        style.id = 'streak-styles';
        style.textContent = `
        #streak-popup { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; }
        .streak-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.88); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .streak-panel {
            background: linear-gradient(135deg, rgba(15,10,40,0.99) 0%, rgba(11,7,26,0.99) 100%);
            border: 1px solid rgba(179,0,255,0.4);
            border-radius: 24px;
            padding: 2.5rem 2rem 2rem;
            max-width: 480px; width: 94%;
            text-align: center;
            position: relative;
            box-shadow: 0 0 60px rgba(179,0,255,0.35), 0 30px 60px rgba(0,0,0,0.8);
            animation: popInStreak 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both;
            overflow: hidden;
        }
        @keyframes popInStreak { from { opacity:0; transform: scale(0.7) translateY(30px); } to { opacity:1; transform: scale(1) translateY(0); } }
        .streak-sparkles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .sparkle { position: absolute; width: 6px; height: 6px; border-radius: 50%; animation: sparkleFly 1.5s ease-out forwards; }
        @keyframes sparkleFly {
            0% { opacity: 1; transform: translate(0,0) scale(1); }
            100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
        }
        .streak-close { position: absolute; top: 1rem; right: 1rem; width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 0.9rem; }
        .streak-close:hover { background: rgba(255,0,123,0.2); border-color: #ff007b; color: #ff007b; }
        .streak-header { margin-bottom: 1.5rem; }
        .streak-icon-ring { font-size: 4rem; margin-bottom: 0.8rem; display: block; animation: bounceIcon 0.7s 0.3s cubic-bezier(0.175,0.885,0.32,1.275) both; }
        @keyframes bounceIcon { from { transform: scale(0) rotate(-30deg); } to { transform: scale(1) rotate(0); } }
        .streak-title { font-family: 'Orbitron', sans-serif; font-size: 1.5rem; color: #fff; letter-spacing: 3px; margin-bottom: 0.3rem; text-shadow: 0 0 20px rgba(179,0,255,0.8); }
        .streak-subtitle { color: rgba(255,255,255,0.6); font-size: 0.9rem; }
        .streak-xp-badge {
            display: inline-flex; align-items: center; gap: 10px;
            background: linear-gradient(135deg, rgba(0,229,255,0.1), rgba(179,0,255,0.1));
            border: 1px solid rgba(0,229,255,0.4); border-radius: 50px;
            padding: 10px 24px; margin-bottom: 1rem;
            font-family: 'Orbitron', sans-serif; font-size: 1.4rem; font-weight: 900;
            color: #00e5ff; text-shadow: 0 0 15px #00e5ff;
            box-shadow: 0 0 20px rgba(0,229,255,0.2);
            animation: xpPulse 1s 0.5s ease both;
        }
        @keyframes xpPulse { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .streak-xp-badge i { color: #ffd700; }
        .streak-xp-badge small { font-size: 0.65rem; color: rgba(255,255,255,0.5); display: block; font-family: 'Roboto Mono', monospace; }
        .streak-fire-label { display: inline-flex; align-items: center; gap: 8px; color: #ff6b35; font-family: 'Orbitron', sans-serif; font-size: 0.8rem; letter-spacing: 1px; margin-bottom: 1.5rem; background: rgba(255,107,53,0.1); border: 1px solid rgba(255,107,53,0.3); padding: 5px 16px; border-radius: 20px; }
        .streak-days-row { display: flex; gap: 6px; justify-content: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .streak-day {
            width: 54px; border-radius: 12px; padding: 8px 4px;
            border: 1px solid rgba(255,255,255,0.1);
            background: rgba(255,255,255,0.04);
            font-size: 0.7rem; color: rgba(255,255,255,0.4);
            position: relative; transition: all 0.2s;
        }
        .streak-day-icon { font-size: 1.3rem; margin-bottom: 2px; }
        .streak-day-label { font-size: 0.6rem; color: rgba(255,255,255,0.5); margin-bottom: 2px; }
        .streak-day-xp { font-size: 0.65rem; color: #00e5ff; font-family: 'Orbitron', sans-serif; font-weight: 700; }
        .streak-day.claimed { background: rgba(0,255,65,0.08); border-color: rgba(0,255,65,0.3); }
        .streak-day.claimed .streak-day-label { color: rgba(0,255,65,0.7); }
        .streak-day.current {
            background: linear-gradient(135deg, rgba(179,0,255,0.2), rgba(0,229,255,0.1));
            border-color: #b300ff;
            box-shadow: 0 0 15px rgba(179,0,255,0.4);
            transform: scale(1.12);
            color: #fff;
        }
        .streak-day.current .streak-day-label { color: #fff; }
        .streak-day.locked { opacity: 0.35; }
        .streak-day-today { font-size: 0.55rem; color: #b300ff; font-family: 'Orbitron', sans-serif; letter-spacing: 0.5px; margin-top: 3px; font-weight: 700; }
        .streak-check { position: absolute; top: 4px; right: 4px; width: 16px; height: 16px; border-radius: 50%; background: #00ff41; color: #000; font-size: 0.55rem; display: flex; align-items: center; justify-content: center; font-weight: 900; }
        .streak-badge-earned { background: rgba(255,215,0,0.08); border: 1px solid rgba(255,215,0,0.3); border-radius: 10px; padding: 8px 14px; margin-bottom: 1rem; font-size: 0.8rem; color: #ffd700; }
        .streak-claim-btn {
            width: 100%; padding: 14px;
            background: linear-gradient(135deg, #b300ff, #6600cc);
            color: #fff; border: none; border-radius: 12px;
            font-family: 'Orbitron', sans-serif; font-size: 1rem; font-weight: 700;
            letter-spacing: 2px; cursor: pointer; transition: all 0.3s;
            box-shadow: 0 4px 20px rgba(179,0,255,0.5);
            display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .streak-claim-btn:hover { background: linear-gradient(135deg, #cc00ff, #b300ff); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(179,0,255,0.7); }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(popup);
    createSparkles();

    // Auto close after 15s
    setTimeout(closeStreakPopup, 15000);
}

function createSparkles() {
    const container = document.getElementById('streak-sparkles');
    if (!container) return;
    const colors = ['#b300ff', '#00e5ff', '#ff007b', '#ffd700', '#00ff41'];
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const s = document.createElement('div');
            s.className = 'sparkle';
            const size = Math.random() * 8 + 4;
            s.style.cssText = `
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                width: ${size}px; height: ${size}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                --tx: ${(Math.random() - 0.5) * 200}px;
                --ty: ${(Math.random() - 0.5) * 200}px;
                animation-delay: ${Math.random() * 0.5}s;
            `;
            container.appendChild(s);
            setTimeout(() => s.remove(), 2000);
        }, i * 50);
    }
}

function closeStreakPopup() {
    const popup = document.getElementById('streak-popup');
    if (popup) {
        popup.style.animation = 'fadeOut 0.3s ease forwards';
        popup.style.cssText += 'animation: fadeOut 0.3s ease forwards;';
        // add fadeOut keyframe if missing
        const style = document.getElementById('streak-styles');
        if (style && !style.textContent.includes('fadeOut')) {
            style.textContent += '@keyframes fadeOut { to { opacity: 0; } }';
        }
        setTimeout(() => popup.remove(), 300);
    }
    if (typeof updateUI === 'function') updateUI();
}

// Auto-init when DOM is ready
document.addEventListener('DOMContentLoaded', checkDailyLogin);
