/**
 * =====================================================
 *  CYBER ARCADE — Neural Query Terminal + Roaming Bot
 *  Injects itself into any page automatically
 * =====================================================
 */
(function () {
    'use strict';

    // ── Styles ────────────────────────────────────────────────────────────
    const css = `
        /* ── Roaming Robot ── */
        #cyber-robo {
            position: fixed;
            width: 46px; height: 46px;
            z-index: 8999;
            cursor: pointer;
            user-select: none;
            transition: left 3.2s cubic-bezier(0.25,0.46,0.45,0.94),
                        top  3.2s cubic-bezier(0.25,0.46,0.45,0.94);
            filter: drop-shadow(0 0 8px rgba(0,229,255,0.7));
        }
        #cyber-robo:hover { filter: drop-shadow(0 0 16px rgba(0,255,65,1)); }

        #cyber-robo svg { width: 100%; height: 100%; }

        .robo-pulse {
            animation: roboPulse 0.3s ease !important;
        }
        @keyframes roboPulse {
            0%   { transform: scale(1); }
            50%  { transform: scale(1.4); }
            100% { transform: scale(1); }
        }

        /* Speech bubble */
        #robo-bubble {
            position: fixed;
            background: rgba(0,10,20,0.95);
            border: 1px solid var(--robo-color, #00ff41);
            border-radius: 10px 10px 10px 0;
            padding: 7px 12px;
            font-family: 'Courier New', monospace;
            font-size: 0.72rem;
            color: var(--robo-color, #00ff41);
            z-index: 9000;
            max-width: 180px;
            white-space: normal;
            box-shadow: 0 0 12px rgba(0,255,65,0.2);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s;
            line-height: 1.4;
        }
        #robo-bubble.show { opacity: 1; }

        /* ── Chatbot Panel ── */
        #cyber-chat-panel {
            position: fixed;
            bottom: 20px; left: 20px;
            width: 340px;
            max-height: 500px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            background: rgba(0,6,14,0.97);
            border: 1px solid #00ff41;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 0 40px rgba(0,255,65,0.25), 0 0 80px rgba(0,0,0,0.9);
            font-family: 'Courier New', monospace;
            transform: scale(0) translateY(40px);
            transform-origin: bottom left;
            transition: transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275),
                        opacity 0.35s ease;
            opacity: 0;
            pointer-events: none;
        }
        #cyber-chat-panel.open {
            transform: scale(1) translateY(0);
            opacity: 1;
            pointer-events: auto;
        }

        /* scan-line overlay */
        #cyber-chat-panel::before {
            content: '';
            position: absolute; inset: 0;
            background: repeating-linear-gradient(0deg,
                transparent, transparent 2px,
                rgba(0,255,65,0.015) 2px, rgba(0,255,65,0.015) 4px);
            pointer-events: none; z-index: 1;
        }

        /* Title bar */
        #chat-titlebar {
            display: flex; align-items: center; gap: 8px;
            background: rgba(0,255,65,0.06);
            border-bottom: 1px solid rgba(0,255,65,0.3);
            padding: 9px 12px;
            position: relative; z-index: 2;
        }
        .chat-tb-dots { display: flex; gap: 5px; }
        .chat-tb-dot  { width: 10px; height: 10px; border-radius: 50%; }
        .dot-r { background: #ff5f57; }
        .dot-y { background: #ffbd2e; }
        .dot-g { background: #28c840; }
        #chat-tb-title {
            flex: 1;
            font-size: 0.65rem; color: #00ff41;
            letter-spacing: 2px; text-transform: uppercase;
        }
        #chat-tb-blink {
            width: 7px; height: 12px;
            background: #00ff41;
            animation: termBlink 0.9s step-end infinite;
        }
        @keyframes termBlink { 0%,100% { opacity:1; } 50% { opacity:0; } }

        #chat-close-btn {
            background: none; border: none; color: rgba(0,255,65,0.6);
            cursor: pointer; font-size: 1rem; line-height: 1; padding: 0;
            transition: color 0.2s;
        }
        #chat-close-btn:hover { color: #ff5f57; }

        /* ASCII robot header */
        #chat-ascii {
            background: rgba(0,20,10,0.8);
            border-bottom: 1px solid rgba(0,255,65,0.15);
            padding: 8px 12px;
            font-size: 0.52rem;
            color: rgba(0,255,65,0.7);
            white-space: pre;
            line-height: 1.3;
            position: relative; z-index: 2;
            letter-spacing: 1px;
        }

        /* Messages */
        #chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            position: relative; z-index: 2;
            scrollbar-width: thin;
            scrollbar-color: rgba(0,255,65,0.3) transparent;
        }
        #chat-messages::-webkit-scrollbar { width: 4px; }
        #chat-messages::-webkit-scrollbar-thumb { background: rgba(0,255,65,0.3); border-radius: 4px; }

        .chat-msg {
            display: flex; flex-direction: column; gap: 3px;
            max-width: 92%;
        }
        .chat-msg.bot  { align-self: flex-start; }
        .chat-msg.user { align-self: flex-end; }

        .chat-msg-label {
            font-size: 0.55rem; letter-spacing: 2px;
            text-transform: uppercase;
        }
        .bot .chat-msg-label  { color: rgba(0,255,65,0.5); }
        .user .chat-msg-label { color: rgba(0,229,255,0.5); text-align: right; }

        .chat-msg-text {
            padding: 8px 11px;
            border-radius: 0 10px 10px 10px;
            font-size: 0.75rem;
            line-height: 1.5;
        }
        .bot .chat-msg-text {
            background: rgba(0,30,14,0.9);
            border: 1px solid rgba(0,255,65,0.2);
            color: #00ff41;
            border-radius: 0 10px 10px 10px;
        }
        .user .chat-msg-text {
            background: rgba(0,30,50,0.9);
            border: 1px solid rgba(0,229,255,0.2);
            color: #00e5ff;
            border-radius: 10px 0 10px 10px;
        }

        /* Typing indicator */
        .chat-typing .chat-msg-text {
            background: rgba(0,30,14,0.7);
            border: 1px solid rgba(0,255,65,0.15);
            color: rgba(0,255,65,0.6);
        }
        .typing-dots span {
            display: inline-block;
            width: 6px; height: 6px; border-radius: 50%;
            background: #00ff41;
            margin: 0 2px;
            animation: typingBounce 1s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.15s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes typingBounce {
            0%,80%,100% { transform: translateY(0); opacity:0.5; }
            40%          { transform: translateY(-6px); opacity:1; }
        }

        /* Quick suggestions */
        #chat-suggestions {
            display: flex; flex-wrap: wrap; gap: 6px;
            padding: 8px 12px;
            border-top: 1px solid rgba(0,255,65,0.1);
            position: relative; z-index: 2;
        }
        .chat-suggestion {
            padding: 4px 10px;
            background: rgba(0,255,65,0.06);
            border: 1px solid rgba(0,255,65,0.2);
            border-radius: 20px;
            font-size: 0.62rem;
            color: rgba(0,255,65,0.8);
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Courier New', monospace;
        }
        .chat-suggestion:hover { background: rgba(0,255,65,0.15); color: #00ff41; }

        /* Input row */
        #chat-input-row {
            display: flex; align-items: center; gap: 0;
            border-top: 1px solid rgba(0,255,65,0.3);
            background: rgba(0,20,10,0.8);
            position: relative; z-index: 2;
        }
        #chat-prompt-sym {
            padding: 0 8px 0 12px;
            color: #00ff41;
            font-size: 0.85rem;
            font-family: 'Courier New', monospace;
        }
        #chat-input {
            flex: 1;
            background: none; border: none; outline: none;
            color: #00ff41;
            font-family: 'Courier New', monospace;
            font-size: 0.75rem;
            padding: 10px 0;
            caret-color: #00ff41;
        }
        #chat-input::placeholder { color: rgba(0,255,65,0.3); }
        #chat-send-btn {
            background: none; border: none;
            color: rgba(0,255,65,0.7);
            cursor: pointer; padding: 0 12px;
            font-size: 0.8rem;
            transition: color 0.2s;
        }
        #chat-send-btn:hover { color: #00ff41; }

        /* Open toggle button (only when closed) */
        #cyber-chat-toggle {
            position: fixed;
            bottom: 20px; left: 20px;
            width: 52px; height: 52px;
            border-radius: 50%;
            background: rgba(0,10,5,0.95);
            border: 2px solid #00ff41;
            box-shadow: 0 0 20px rgba(0,255,65,0.4);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 9998;
            transition: all 0.3s;
            font-size: 1.4rem;
        }
        #cyber-chat-toggle:hover {
            box-shadow: 0 0 32px rgba(0,255,65,0.7);
            transform: scale(1.08);
        }
        #cyber-chat-toggle.hidden { display: none; }

        /* Notification dot */
        #chat-notif-dot {
            position: absolute; top: 2px; right: 2px;
            width: 12px; height: 12px; border-radius: 50%;
            background: #ff007b;
            border: 2px solid rgba(0,10,5,0.95);
            animation: notifPulse 1.5s infinite;
        }
        @keyframes notifPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,0,123,0.5); } 70% { box-shadow: 0 0 0 6px rgba(255,0,123,0); } }

        @media (max-width: 400px) {
            #cyber-chat-panel { width: calc(100vw - 20px); left: 10px; }
        }
    `;

    // ── knowledge base ────────────────────────────────────────────────────
    const KB = [
        {
            triggers: ['hello', 'hi', 'hey', 'greetings', 'sup'],
            reply: 'SYSTEM ONLINE. Hello, operative! I am <span style="color:#ffd700">ARIA_v2</span> — your Automated Reconnaissance & Intel Assistant. Type your query or pick a quick command below.'
        },
        {
            triggers: ['xp', 'experience', 'points', 'earn'],
            reply: 'XP is earned by completing missions:\n• Quiz: up to 500 XP\n• Phishing: up to 400 XP\n• Vulnerability: up to 1050 XP\n• Memory: up to 200 XP\n• Archery/Bubble: score-based\n• Match Design: +250 XP\nStreaks add daily XP bonuses!'
        },
        {
            triggers: ['streak', 'daily', 'login', 'gift', 'reward'],
            reply: 'Daily login streaks grant XP on each visit:\n• Day 1–2: +25 XP\n• Day 3–4: +50 XP + badge\n• Day 5–6: +75 XP\n• Day 7: +150 XP + weekly badge 🏆\nMissing a day resets your streak!'
        },
        {
            triggers: ['leaderboard', 'rank', 'ranking', 'top'],
            reply: 'Global rankings update live! Weekly rank gifts:\n• 🥇 Rank #1  → +1000 XP\n• 🥈 Rank #2  → +600 XP\n• 🥉 Rank #3  → +350 XP\n• ⚡ Top 10  → +150 XP\nClaim your weekly gift from the Leaderboard page!'
        },
        {
            triggers: ['badge', 'achievement', 'unlock'],
            reply: 'Badges unlock through missions and milestones:\n• First Login — log in once\n• 1K Club — earn 1000 XP\n• 3-Day/7-Day Streak — daily logins\n• Weekly Champion — rank #1\n• Zero Day Hunter — clear Vulnerability game\nCheck your Profile for full achievement progress!'
        },
        {
            triggers: ['archery', 'neural archer', 'bow', 'arrow'],
            reply: 'NEURAL ARCHER: Aim using your mouse, hold to charge power, release to fire 🎯\n• Red center = 10 pts\n• 2x zones give double points\n• Wind changes every round — adjust your aim!\n• Higher waves = faster targets & stronger wind.'
        },
        {
            triggers: ['bubble', 'shoot', 'bubble shoot'],
            reply: 'BUBBLE MATRIX BLASTER: Match 3+ same-color bubbles to pop them! 💥\n• Aim with mouse, click/space to fire\n• Chain reactions give combo bonuses\n• Clear the board to advance levels\n• Special rainbow bubbles act as wildcards!'
        },
        {
            triggers: ['memory', 'flip', 'card', 'match cards'],
            reply: 'DATA MATRIX MEMORY: Find matching pairs of cyber icons 🧠\n• Click 2 cards to flip them\n• Matches stay revealed — clicks count as moves\n• Combo streaks: 2+ consecutive matches = bonus XP!\n• Faster = more time bonus. Level 3 has 12 pairs!'
        },
        {
            triggers: ['quiz', 'interrogation', 'question'],
            reply: 'INTERROGATION ROOM: 24 cybersecurity questions across 3 levels! 📋\n• Level 1: Phishing & Identity (Beginner)\n• Level 2: Network & Attacks (Intermediate)\n• Level 3: Defensive Systems (Expert)\nAnswer fast for time bonuses. Build streaks for combo XP!'
        },
        {
            triggers: ['phishing', 'threat', 'email', 'detect'],
            reply: 'THREAT HUNTER: Classify 24 scenarios across 3 rounds 🕵️\n• Spot fake domains (rnicrosoft vs microsoft)\n• Look for urgency + suspicious URLs\n• Legitimate emails never demand immediate payment\nTip: check the root domain before any slashes!'
        },
        {
            triggers: ['vulnerability', 'vuln', 'clicker', 'zero day', 'bug'],
            reply: 'ZERO DAY CLICKER: Spot hidden code vulnerabilities in 3 levels! 🔍\n• Level 1: 3 bugs in 25s (hardcoded passwords, SQL injection)\n• Level 2: 4 bugs in 22s (XSS, auth bypass)\n• Level 3: 5 bugs in 20s (command injection, weak JWT)\nClick ONLY the vulnerable lines — wrong clicks lose time!'
        },
        {
            triggers: ['match', 'design', 'color', 'pattern'],
            reply: 'MATCH THE DESIGN: Recreate the target color pattern ✨\n• Select a color from the palette, then click cells to paint\n• Match ALL cells to win & earn XP\n• Hard mode = 6×6 grid with 7 colors\nTip: Work row by row systematically!'
        },
        {
            triggers: ['crypto', 'cipher', 'decode', 'encrypt'],
            reply: 'CRYPTO DECODER: Crack secret cipher messages 🔐\n• Caesar cipher shifts letters by a fixed number\n• Try ROT13 (shift 13) as a first guess\n• Substitution ciphers need frequency analysis\n• Longer texts = easier to crack by patterns!'
        },
        {
            triggers: ['profile', 'account', 'stats', 'progress'],
            reply: 'Your PROFILE page shows:\n• XP progress bar to next level\n• All mission scores as bar chart\n• Achievement badge collection\n• Login streak history\nEdit your operative name or reset progress there!'
        },
        {
            triggers: ['level', 'rank up', 'tier'],
            reply: 'LEVEL SYSTEM: Every 500 XP = 1 level gained!\n• Lv 1–3: Recruit → Operative\n• Lv 4–6: Agent → Specialist\n• Lv 7–10: Commander → Elite\n• Lv 11+: Shadow Operative → Master Hacker\nHigher levels unlock exclusive badge frames!'
        },
        {
            triggers: ['help', 'commands', 'what can you do', 'what do you know'],
            reply: 'ARIA_v2 Query Modules:\n> xp / streak / leaderboard\n> badge / level / profile\n> archery / bubble / memory\n> quiz / phishing / vulnerability\n> crypto / match design\n> tips / hack / cybersecurity\nType any keyword or ask a question!'
        },
        {
            triggers: ['tip', 'tips', 'advice', 'strategy'],
            reply: 'OPERATIVE TIPS:\n• Play daily for streak XP — don\'t miss a day!\n• Quiz streaks give combo bonus — answer fast\n• Vulnerability: hover items before clicking\n• Leaderboard gifts reset every Monday\n• Check Profile for which badges you\'re close to!'
        },
        {
            triggers: ['hack', 'hacking', 'cybersecurity', 'cyber'],
            reply: 'CYBER INTEL:\n• 80% of data breaches involve weak passwords\n• SQL injection is still the #1 web vulnerability\n• Phishing causes 90% of all successful breaches\n• Zero-day exploits sell for millions on dark markets\n• Cyber Arcade teaches real-world defensive skills!'
        },
        {
            triggers: ['brute', 'force', 'brute force', 'password crack'],
            reply: 'BRUTE FORCE SIMULATOR: Crack the password before time runs out! 🔑\n• Each attempt randomly tests a character combo\n• Shorter/simpler passwords crack faster\n• Add complexity (symbols, length) to see the difference\n• Real brute force tools run millions of attempts/sec!'
        },
        {
            triggers: ['how', 'play', 'start', 'begin', 'guide'],
            reply: 'HOW TO START:\n1. Login or sign up → you\'re an Operative\n2. Pick any game from the Dashboard\n3. Hit ❓ on a game card for full instructions\n4. Complete missions to earn XP & badges\n5. Climb the global leaderboard!\nGood luck, operative. Hack the planet! 🌐'
        }
    ];

    const ROBO_SAYINGS = [
        'Scanning for threats...',
        'XP multiplier online!',
        'Ask me anything!',
        'Firewall active ✓',
        'Click me for help!',
        'Stay alert, operative!',
        'New missions await!',
        'Checking leaderboard...',
        'Streak bonus active!',
        'System secure ✓',
        'Neural link established.',
        'Ready to assist!'
    ];

    // ── Robot SVG ─────────────────────────────────────────────────────────
    const ROBO_SVG = `
    <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <!-- Antenna -->
      <line x1="24" y1="2" x2="24" y2="8" stroke="#00ff41" stroke-width="2" stroke-linecap="round"/>
      <circle cx="24" cy="2" r="2.5" fill="#00ff41">
        <animate attributeName="r" values="2.5;4;2.5" dur="1.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite"/>
      </circle>
      <!-- Head -->
      <rect x="11" y="8" width="26" height="18" rx="5" fill="#0a1f0a" stroke="#00ff41" stroke-width="1.5"/>
      <!-- Eyes -->
      <rect x="15" y="13" width="7" height="5" rx="2" fill="#00ff41">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" repeatCount="indefinite"/>
      </rect>
      <rect x="26" y="13" width="7" height="5" rx="2" fill="#00ff41">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" begin="0.9s" repeatCount="indefinite"/>
      </rect>
      <!-- Mouth -->
      <rect x="17" y="21" width="14" height="2.5" rx="1" fill="#00ff41" opacity="0.6"/>
      <!-- Neck -->
      <rect x="21" y="26" width="6" height="4" fill="#0a1f0a" stroke="#00ff41" stroke-width="1"/>
      <!-- Body -->
      <rect x="9" y="30" width="30" height="14" rx="4" fill="#061a06" stroke="#00ff41" stroke-width="1.5"/>
      <!-- Body lights -->
      <circle cx="17" cy="37" r="2.5" fill="#00ff41">
        <animate attributeName="fill" values="#00ff41;#00e5ff;#ff007b;#00ff41" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="24" cy="37" r="2.5" fill="#ffd700">
        <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite"/>
      </circle>
      <circle cx="31" cy="37" r="2.5" fill="#00ff41">
        <animate attributeName="fill" values="#00ff41;#ff007b;#00e5ff;#00ff41" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <!-- Arms -->
      <rect x="2" y="30" width="7" height="3.5" rx="1.5" fill="#0a1f0a" stroke="#00ff41" stroke-width="1">
        <animateTransform attributeName="transform" type="rotate" values="-15 5 31.75;15 5 31.75;-15 5 31.75" dur="1s" repeatCount="indefinite"/>
      </rect>
      <rect x="39" y="30" width="7" height="3.5" rx="1.5" fill="#0a1f0a" stroke="#00ff41" stroke-width="1">
        <animateTransform attributeName="transform" type="rotate" values="15 43 31.75;-15 43 31.75;15 43 31.75" dur="1s" repeatCount="indefinite"/>
      </rect>
      <!-- Legs -->
      <rect x="14" y="44" width="7" height="4" rx="2" fill="#0a1f0a" stroke="#00ff41" stroke-width="1">
        <animateTransform attributeName="transform" type="translate" values="0,0;0,-2;0,0" dur="0.5s" repeatCount="indefinite"/>
      </rect>
      <rect x="27" y="44" width="7" height="4" rx="2" fill="#0a1f0a" stroke="#00ff41" stroke-width="1">
        <animateTransform attributeName="transform" type="translate" values="0,-2;0,0;0,-2" dur="0.5s" repeatCount="indefinite"/>
      </rect>
    </svg>`;

    // ── ASCII art for chatbot header ──────────────────────────────────────
    const ASCII = ` ██████╗██╗   ██╗██████╗ ███████╗██████╗
██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗
██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝
██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗
╚██████╗   ██║   ██████╔╝███████╗██║  ██║
 ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝
 NEURAL QUERY TERMINAL :: ARIA_v2.0`;

    // ── Inject CSS ────────────────────────────────────────────────────────
    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'cyber-chat-styles';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ── Build DOM ─────────────────────────────────────────────────────────
    function buildDOM() {
        // --- Roaming Robot ---
        const robo = document.createElement('div');
        robo.id = 'cyber-robo';
        robo.innerHTML = ROBO_SVG;
        robo.title = 'ARIA Assistant — Click to chat';
        robo.style.left = (window.innerWidth - 80) + 'px';
        robo.style.top  = (window.innerHeight - 100) + 'px';
        document.body.appendChild(robo);

        // Speech bubble
        const bubble = document.createElement('div');
        bubble.id = 'robo-bubble';
        document.body.appendChild(bubble);

        // --- Toggle button ---
        const toggle = document.createElement('div');
        toggle.id = 'cyber-chat-toggle';
        toggle.innerHTML = `🤖<div id="chat-notif-dot"></div>`;
        toggle.title = 'Open ARIA Terminal';
        document.body.appendChild(toggle);

        // --- Chat Panel ---
        const panel = document.createElement('div');
        panel.id = 'cyber-chat-panel';
        panel.innerHTML = `
            <div id="chat-titlebar">
                <div class="chat-tb-dots">
                    <div class="chat-tb-dot dot-r"></div>
                    <div class="chat-tb-dot dot-y"></div>
                    <div class="chat-tb-dot dot-g"></div>
                </div>
                <span id="chat-tb-title">ARIA v2 :: QUERY TERMINAL</span>
                <div id="chat-tb-blink"></div>
                <button id="chat-close-btn" title="Close">✕</button>
            </div>
            <div id="chat-ascii">${ASCII}</div>
            <div id="chat-messages"></div>
            <div id="chat-suggestions">
                <span class="chat-suggestion">help</span>
                <span class="chat-suggestion">xp system</span>
                <span class="chat-suggestion">streaks</span>
                <span class="chat-suggestion">leaderboard</span>
                <span class="chat-suggestion">tips</span>
            </div>
            <div id="chat-input-row">
                <span id="chat-prompt-sym">&gt;_</span>
                <input id="chat-input" type="text" placeholder="Enter query, operative..." autocomplete="off" maxlength="120">
                <button id="chat-send-btn" title="Send">⏎</button>
            </div>
        `;
        document.body.appendChild(panel);
    }

    // ── Chatbot logic ─────────────────────────────────────────────────────
    let chatOpen = false;

    function openChat() {
        chatOpen = true;
        document.getElementById('cyber-chat-panel').classList.add('open');
        document.getElementById('cyber-chat-toggle').classList.add('hidden');
        document.getElementById('chat-notif-dot').style.display = 'none';
        document.getElementById('chat-input').focus();
        if (document.getElementById('chat-messages').children.length === 0) {
            typeMessage('boot', 'ARIA_v2', 'SYSTEM BOOT... Neural link established 🔗\nHello, operative! I\'m <span style="color:#ffd700">ARIA</span> — Automated Reconnaissance & Intel Assistant.\n\nI can help with game guides, XP system, badges, leaderboard rewards, and cybersecurity tips.\n\nType a query or pick a command below! ▼');
        }
    }

    function closeChat() {
        chatOpen = false;
        document.getElementById('cyber-chat-panel').classList.remove('open');
        document.getElementById('cyber-chat-toggle').classList.remove('hidden');
    }

    function typeMessage(type, label, text) {
        const msgs = document.getElementById('chat-messages');
        const div  = document.createElement('div');
        div.className = `chat-msg ${type === 'user' ? 'user' : 'bot'}`;
        div.innerHTML = `
            <div class="chat-msg-label">${type === 'user' ? '[ OPERATIVE ]' : '[ ARIA_v2 ]'}</div>
            <div class="chat-msg-text" style="white-space:pre-wrap"></div>
        `;
        msgs.appendChild(div);

        const textEl = div.querySelector('.chat-msg-text');
        if (type === 'user') {
            textEl.textContent = text;
            msgs.scrollTop = msgs.scrollHeight;
            return;
        }

        // Typing effect for bot
        const typing = document.createElement('div');
        typing.className = 'chat-msg bot chat-typing';
        typing.innerHTML = `
            <div class="chat-msg-label">[ ARIA_v2 ]</div>
            <div class="chat-msg-text">
                <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>
        `;
        msgs.appendChild(typing);
        msgs.scrollTop = msgs.scrollHeight;

        setTimeout(() => {
            typing.remove();
            let i = 0;
            const raw = text;

            function tick() {
                // Handle HTML tags — add char by char but render correctly
                textEl.innerHTML = raw.substring(0, i) + (i < raw.length ? '<span style="opacity:0.7">█</span>' : '');
                if (i < raw.length) {
                    i++;
                    msgs.scrollTop = msgs.scrollHeight;
                    setTimeout(tick, 12);
                }
            }
            tick();
        }, 700);
    }

    function getReply(input) {
        const q = input.toLowerCase().trim();
        for (const entry of KB) {
            if (entry.triggers.some(t => q.includes(t))) {
                return entry.reply;
            }
        }
        // Fallback
        return `Query not in database. Try: "help", "xp", "streak", "leaderboard", "badge", or a game name.\n> Rerouting... <span style="color:#ff007b">ERROR 404: Answer not cached.</span>`;
    }

    function sendQuery(text) {
        if (!text.trim()) return;
        typeMessage('user', 'OPERATIVE', text);
        const reply = getReply(text);
        setTimeout(() => typeMessage('bot', 'ARIA_v2', reply), 200);
        document.getElementById('chat-input').value = '';
    }

    // ── Roaming Robot ─────────────────────────────────────────────────────
    let roboX, roboY;
    let roboTimer, bubbleTimer;

    function moveRobot() {
        const robo  = document.getElementById('cyber-robo');
        if (!robo) return;

        const margin = 60;
        const maxX   = window.innerWidth  - 60 - margin;
        const maxY   = window.innerHeight - 60 - margin;

        roboX = Math.max(margin, Math.floor(Math.random() * maxX));
        roboY = Math.max(margin, Math.floor(Math.random() * maxY));

        robo.style.left = roboX + 'px';
        robo.style.top  = roboY + 'px';
    }

    function showBubble() {
        const robo   = document.getElementById('cyber-robo');
        const bubble = document.getElementById('robo-bubble');
        if (!robo || !bubble) return;

        const rect = robo.getBoundingClientRect();
        const saying = ROBO_SAYINGS[Math.floor(Math.random() * ROBO_SAYINGS.length)];
        bubble.textContent = saying;

        // Position bubble above robot
        let bLeft = rect.left + 52;
        let bTop  = rect.top - 20;
        if (bLeft + 190 > window.innerWidth) bLeft = rect.left - 190;
        if (bTop < 10) bTop = rect.bottom + 8;
        bubble.style.left = bLeft + 'px';
        bubble.style.top  = bTop  + 'px';
        bubble.classList.add('show');

        clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 3000);
    }

    function startRoamingRobot() {
        moveRobot();
        // Move every 4–7 seconds (random)
        function scheduleMove() {
            const delay = 4000 + Math.random() * 3000;
            roboTimer = setTimeout(() => {
                moveRobot();
                // Occasionally show a bubble message
                if (Math.random() > 0.45) {
                    setTimeout(showBubble, 1200);
                }
                scheduleMove();
            }, delay);
        }
        scheduleMove();

        // Show greeting bubble after 2s
        setTimeout(showBubble, 2000);
    }

    // ── Event wiring ──────────────────────────────────────────────────────
    function wireEvents() {
        // Toggle button
        document.getElementById('cyber-chat-toggle').addEventListener('click', openChat);

        // Close button
        document.getElementById('chat-close-btn').addEventListener('click', closeChat);

        // Robot click → open chat + pulse animation
        const robo = document.getElementById('cyber-robo');
        robo.addEventListener('click', () => {
            robo.classList.add('robo-pulse');
            setTimeout(() => robo.classList.remove('robo-pulse'), 350);
            openChat();
        });

        // Send button
        document.getElementById('chat-send-btn').addEventListener('click', () => {
            sendQuery(document.getElementById('chat-input').value);
        });

        // Enter key
        document.getElementById('chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendQuery(document.getElementById('chat-input').value);
        });

        // Quick suggestion chips
        document.getElementById('chat-suggestions').addEventListener('click', (e) => {
            if (e.target.classList.contains('chat-suggestion')) {
                openChat();
                sendQuery(e.target.textContent);
            }
        });

        // Resize → move robot within bounds
        window.addEventListener('resize', moveRobot);
    }

    // ── Init ──────────────────────────────────────────────────────────────
    function init() {
        // Avoid double injection
        if (document.getElementById('cyber-chat-panel')) return;

        injectStyles();
        buildDOM();
        wireEvents();
        startRoamingRobot();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
