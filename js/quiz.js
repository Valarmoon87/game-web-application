// js/quiz.js — Multi-Level Interrogation Room (8 questions × 3 levels = 24 total)
document.addEventListener('DOMContentLoaded', () => {
    const startBtn    = document.getElementById('start-btn');
    const nextBtn     = document.getElementById('next-btn');
    const introScreen = document.getElementById('intro-screen');
    const quizScreen  = document.getElementById('quiz-screen');
    const questionText = document.getElementById('question-text');
    const optionsGrid  = document.getElementById('options-grid');
    const qCurr        = document.getElementById('q-curr');
    const qTotal       = document.getElementById('q-total');
    const qScoreEl     = document.getElementById('q-score');
    const timerFill    = document.getElementById('timer-fill');

    const totalTimePerQuestion = 15;
    let currentQ = 0, score = 0, streak = 0, bestStreak = 0;
    let timeRemaining = totalTimePerQuestion;
    let timerInterval;
    let acceptingAnswers = false;
    let currentLevel = 0;

    // ── 24 questions across 3 levels ──────────────────────────────────────
    const LEVELS = [
        {
            name: "Level 1: Beginner — Phishing & Identity",
            color: '#00e5ff',
            icon: '🕵️',
            questions: [
                {
                    question: "What is the primary goal of a Phishing attack?",
                    options: ["Infect PC with a virus", "Trick users into revealing passwords/info", "Crash an overloaded website", "Encrypt files for ransom"],
                    answer: 1
                },
                {
                    question: "Which of the following is a STRONG password?",
                    options: ["P@ssw0rd123", "Admin2026!", "c0rr3ct_h0rs3_b@tt3ry_st@pl3", "12345678"],
                    answer: 2
                },
                {
                    question: "What does '2FA' stand for?",
                    options: ["Two-Factor Authentication", "Two-File Attachment", "Transfer Factor Algorithm", "Token Firewall Audit"],
                    answer: 0
                },
                {
                    question: "Which link looks like a phishing attempt?",
                    options: ["https://paypal.com/login", "https://paypa1.com-login.xyz/secure", "https://www.amazon.com/account", "https://google.com"],
                    answer: 1
                },
                {
                    question: "An email says your Netflix account is locked and you must click NOW. This is most likely:",
                    options: ["A real Netflix warning", "A phishing attack using urgency", "A Netflix security drill", "Normal account maintenance"],
                    answer: 1
                },
                {
                    question: "What is a 'dictionary attack'?",
                    options: ["Hacking using a spelling error", "Using a list of common words to guess passwords", "An attack on dictionary websites", "Exploiting NLP grammar errors"],
                    answer: 1
                },
                {
                    question: "Social Engineering attacks primarily target:",
                    options: ["Computer hardware", "Human psychology and trust", "Software vulnerabilities", "Network infrastructure"],
                    answer: 1
                },
                {
                    question: "Which email address is MOST trustworthy for Microsoft support?",
                    options: ["support@rnicrosoft.com", "helpdesk@microsoft-support.net", "microsoft.support@gmail.com", "support@microsoft.com"],
                    answer: 3
                }
            ]
        },
        {
            name: "Level 2: Intermediate — Network & Attacks",
            color: '#ffd700',
            icon: '🌐',
            questions: [
                {
                    question: "What does SQL Injection primarily exploit?",
                    options: ["Unsecured Wi-Fi", "Weak OS passwords", "Routing protocol flaws", "Unsanitized database input fields"],
                    answer: 3
                },
                {
                    question: "What does 'HTTPS' indicate?",
                    options: ["Site is malware-free", "Traffic between browser and server is encrypted", "Server is government-hosted", "Site uses a premium firewall"],
                    answer: 1
                },
                {
                    question: "A DDoS attack works by:",
                    options: ["Decrypting sensitive files", "Flooding a server with traffic to make it unavailable", "Stealing user credentials via email", "Injecting code into a database"],
                    answer: 1
                },
                {
                    question: "What is a 'Man-in-the-Middle' (MitM) attack?",
                    options: ["Inserting malware mid-download", "Intercepting communications between two parties", "Sending deceptive emails from a middle person", "Installing spyware on a company server"],
                    answer: 1
                },
                {
                    question: "Which protocol is used to securely transfer files?",
                    options: ["FTP", "HTTP", "SFTP", "SMTP"],
                    answer: 2
                },
                {
                    question: "What does a firewall primarily do?",
                    options: ["Encrypts hard drive data", "Backs up files to the cloud", "Controls network traffic based on rules", "Scans files for viruses"],
                    answer: 2
                },
                {
                    question: "A 'zero-day vulnerability' refers to:",
                    options: ["A bug with zero risk", "A flaw unknown to the developer, actively being exploited", "A virus that takes zero days to infect", "A network with zero uptime"],
                    answer: 1
                },
                {
                    question: "What is ARP Spoofing?",
                    options: ["Faking email headers", "Sending fake ARP replies to redirect network traffic", "Flooding a DNS with bad records", "Injecting JS into a web page"],
                    answer: 1
                }
            ]
        },
        {
            name: "Level 3: Expert — Defensive Systems",
            color: '#ff007b',
            icon: '🛡️',
            questions: [
                {
                    question: "What is the BEST defense against brute force login attacks?",
                    options: ["Using VPN", "Account lockout after failed attempts + CAPTCHA", "Hiding your login URL", "Using an alphanumeric password only"],
                    answer: 1
                },
                {
                    question: "What does MFA (Multi-Factor Authentication) protect against?",
                    options: ["DDoS attacks", "Stolen passwords being used alone to log in", "SQL injections", "DNS poisoning"],
                    answer: 1
                },
                {
                    question: "What is 'Principle of Least Privilege'?",
                    options: ["Users get admin access only on Mondays", "Users only receive the minimum permissions needed for their job", "Only executives can use the internet", "Servers are accessible only from inside the office"],
                    answer: 1
                },
                {
                    question: "A penetration test is designed to:",
                    options: ["Install antivirus software", "Simulate cyberattacks to find vulnerabilities before hackers do", "Train employees to use email safely", "Audit financial transactions"],
                    answer: 1
                },
                {
                    question: "What does 'end-to-end encryption' mean?",
                    options: ["Data is encrypted only on the receiving end", "Data is encrypted from sender to receiver and nobody in between can read it", "Encryption applied only to database fields", "Encryption that prevents users from deleting files"],
                    answer: 1
                },
                {
                    question: "Which hashing algorithm is considered INSECURE for passwords?",
                    options: ["bcrypt", "Argon2", "MD5", "scrypt"],
                    answer: 2
                },
                {
                    question: "A honeypot in cybersecurity is:",
                    options: ["A sweetener used to lure employees into policy violations", "A decoy system designed to attract and detect attackers", "A type of ransomware delivery method", "An encrypted cloud storage service"],
                    answer: 1
                },
                {
                    question: "What is 'Defense in Depth'?",
                    options: ["Using only one very strong security tool", "Layering multiple security controls so if one fails, others defend", "Installing antivirus on all machines", "Encrypting only the most critical data"],
                    answer: 1
                }
            ]
        }
    ];

    let questions = [];

    // ── Level intro / transition ──────────────────────────────────────────
    function showLevelIntro(levelIdx, callback) {
        const lvl = LEVELS[levelIdx];
        introScreen.style.display = 'block';
        quizScreen.style.display  = 'none';
        introScreen.innerHTML = `
            <div style="text-align:center;padding:1rem 0;">
                <div style="font-size:3.5rem;margin-bottom:0.8rem">${lvl.icon}</div>
                <h2 style="font-family:var(--font-heading);font-size:1.4rem;color:${lvl.color};letter-spacing:2px;margin-bottom:0.5rem">
                    ${lvl.name.toUpperCase()}
                </h2>
                <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.9rem">
                    ${lvl.questions.length} questions · ${totalTimePerQuestion}s each · Fastest answers earn bonus XP
                </p>
                <div style="display:flex;gap:8px;justify-content:center;margin-bottom:1.5rem;flex-wrap:wrap">
                    ${LEVELS.map((l, i) => `
                        <div style="padding:4px 14px;border-radius:20px;font-family:var(--font-heading);font-size:0.65rem;
                            background:${i === levelIdx ? l.color + '22' : 'rgba(255,255,255,0.04)'};
                            border:1px solid ${i < levelIdx ? 'var(--neon-green)' : i === levelIdx ? l.color : 'rgba(255,255,255,0.1)'};
                            color:${i < levelIdx ? 'var(--neon-green)' : i === levelIdx ? l.color : 'var(--text-muted)'}">
                            ${i < levelIdx ? '✓ ' : ''}Level ${i + 1}
                        </div>
                    `).join('')}
                </div>
                <button id="lvl-start-btn" class="btn-neon" style="font-size:1rem;padding:12px 32px">
                    <i class="fas fa-bolt"></i> ${levelIdx === 0 ? 'Begin Interrogation' : 'Continue to Level ' + (levelIdx + 1)}
                </button>
            </div>
        `;
        document.getElementById('lvl-start-btn').addEventListener('click', callback);
    }

    // ── Start full game ───────────────────────────────────────────────────
    startBtn?.addEventListener('click', () => {
        currentLevel = 0;
        score = 0; streak = 0; bestStreak = 0;
        showLevelIntro(0, startCurrentLevel);
    });

    function startCurrentLevel() {
        questions = LEVELS[currentLevel].questions;
        currentQ = 0;
        qTotal.innerText = questions.length;
        introScreen.style.display = 'none';
        quizScreen.style.display  = 'block';
        loadQuestion();
    }

    nextBtn?.addEventListener('click', () => {
        currentQ++;
        if (currentQ < questions.length) {
            loadQuestion();
        } else {
            // Level complete
            if (currentLevel < LEVELS.length - 1) {
                currentLevel++;
                showLevelComplete(() => showLevelIntro(currentLevel, startCurrentLevel));
            } else {
                endGame();
            }
        }
    });

    function showLevelComplete(callback) {
        introScreen.style.display = 'block';
        quizScreen.style.display  = 'none';
        const lvl = LEVELS[currentLevel - 1];
        introScreen.innerHTML = `
            <div style="text-align:center;padding:1rem">
                <div style="font-size:3rem;margin-bottom:0.8rem">🎯</div>
                <h2 style="font-family:var(--font-heading);color:var(--neon-green);letter-spacing:2px;margin-bottom:0.5rem">LEVEL CLEARED!</h2>
                <p style="color:${lvl.color};font-size:0.9rem;margin-bottom:0.3rem">${lvl.name}</p>
                <p style="color:var(--text-muted);margin-bottom:1.5rem">Score so far: <strong style="color:#ffd700">${score} pts</strong> · Streak: <strong style="color:var(--neon-blue)">${bestStreak}x</strong></p>
                <button id="next-level-btn" class="btn-neon" style="font-size:1rem;padding:12px 28px">
                    <i class="fas fa-arrow-right"></i> Next Level
                </button>
            </div>
        `;
        document.getElementById('next-level-btn').addEventListener('click', callback);
    }

    // ── Question engine ───────────────────────────────────────────────────
    function loadQuestion() {
        clearInterval(timerInterval);
        timeRemaining = totalTimePerQuestion;
        acceptingAnswers = true;

        qCurr.innerText = currentQ + 1;
        const q = questions[currentQ];
        questionText.innerHTML = q.question;

        optionsGrid.innerHTML = '';
        q.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `<i class="fas fa-terminal"></i> ${opt}`;
            btn.dataset.index = i;
            btn.addEventListener('click', verifyAnswer);
            optionsGrid.appendChild(btn);
        });

        nextBtn.style.display = 'none';

        // Streak indicator
        updateStreakDisplay();
        startTimer();
    }

    function updateStreakDisplay() {
        let el = document.getElementById('quiz-streak');
        if (!el) {
            el = document.createElement('div');
            el.id = 'quiz-streak';
            el.style.cssText = 'text-align:right;font-family:var(--font-heading);font-size:0.75rem;color:var(--neon-blue);margin-bottom:6px;';
            quizScreen.insertBefore(el, quizScreen.firstChild);
        }
        el.textContent = streak >= 2 ? `🔥 ${streak}x STREAK BONUS ACTIVE` : '';
    }

    function startTimer() {
        timerFill.style.transition = 'none';
        timerFill.style.width = '100%';
        timerFill.className = 'timer-fill';
        setTimeout(() => {
            timerFill.style.transition = `width ${totalTimePerQuestion}s linear`;
            timerFill.style.width = '0%';
        }, 50);

        timerInterval = setInterval(() => {
            timeRemaining--;
            if (timeRemaining <= 5 && timeRemaining > 2) timerFill.classList.add('warning');
            else if (timeRemaining <= 2) { timerFill.classList.add('danger'); timerFill.classList.remove('warning'); }
            if (timeRemaining <= 0) { clearInterval(timerInterval); timeOut(); }
        }, 1000);
    }

    function verifyAnswer(e) {
        if (!acceptingAnswers) return;
        acceptingAnswers = false;
        clearInterval(timerInterval);

        const selectedBtn = e.target.closest('.option-btn');
        const selectedIdx = parseInt(selectedBtn.dataset.index);
        const q = questions[currentQ];

        Array.from(optionsGrid.children).forEach(btn => {
            if (parseInt(btn.dataset.index) === q.answer) btn.classList.add('correct');
        });

        if (selectedIdx === q.answer) {
            selectedBtn.classList.add('correct');
            playSound('success');
            streak++;
            bestStreak = Math.max(bestStreak, streak);
            const timeBonus  = Math.floor((timeRemaining / totalTimePerQuestion) * 20);
            const streakBonus = streak >= 3 ? streak * 5 : 0;
            const earned = 40 + timeBonus + streakBonus;
            score += earned;
            qScoreEl.innerText = score;
        } else {
            selectedBtn.classList.add('incorrect');
            playSound('error');
            streak = 0;
        }

        updateStreakDisplay();
        timerFill.style.transition = 'none';
        nextBtn.style.display = 'block';
    }

    function timeOut() {
        if (!acceptingAnswers) return;
        acceptingAnswers = false;
        streak = 0;
        const q = questions[currentQ];
        Array.from(optionsGrid.children).forEach(btn => {
            if (parseInt(btn.dataset.index) === q.answer) btn.classList.add('correct');
        });
        playSound('error');
        updateStreakDisplay();
        nextBtn.style.display = 'block';
    }

    function endGame() {
        clearInterval(timerInterval);
        const xpEarned = Math.min(500, Math.max(50, score));
        const totalQ = LEVELS.reduce((a, l) => a + l.questions.length, 0);
        introScreen.style.display = 'block';
        quizScreen.style.display  = 'none';
        introScreen.innerHTML = `
            <div style="text-align:center;padding:1rem">
                <div style="font-size:3.5rem;margin-bottom:0.8rem">🏆</div>
                <h2 style="font-family:var(--font-heading);letter-spacing:3px;color:#fff;margin-bottom:0.5rem">ALL LEVELS COMPLETE</h2>
                <p style="color:var(--text-muted);margin-bottom:1.5rem">You've cleared all 3 interrogation levels!</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:340px;margin:0 auto 1.5rem">
                    <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px">
                        <div style="font-size:0.6rem;color:var(--text-muted);letter-spacing:1px;font-family:var(--font-heading)">FINAL SCORE</div>
                        <div style="font-size:1.4rem;font-weight:700;font-family:var(--font-heading);color:#ffd700">${score}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(0,255,65,0.15);border-radius:10px;padding:12px">
                        <div style="font-size:0.6rem;color:var(--text-muted);letter-spacing:1px;font-family:var(--font-heading)">XP EARNED</div>
                        <div style="font-size:1.4rem;font-weight:700;font-family:var(--font-heading);color:var(--neon-green)">+${xpEarned}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px">
                        <div style="font-size:0.6rem;color:var(--text-muted);letter-spacing:1px;font-family:var(--font-heading)">BEST STREAK</div>
                        <div style="font-size:1.4rem;font-weight:700;font-family:var(--font-heading);color:var(--neon-blue)">${bestStreak}x</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px">
                        <div style="font-size:0.6rem;color:var(--text-muted);letter-spacing:1px;font-family:var(--font-heading)">ACCURACY</div>
                        <div style="font-size:1.4rem;font-weight:700;font-family:var(--font-heading);color:#ff007b">${Math.round((score / (totalQ * 60)) * 100)}%</div>
                    </div>
                </div>
                <div style="display:flex;gap:10px;justify-content:center">
                    <button id="replay-quiz-btn" class="btn-neon"><i class="fas fa-redo"></i> Play Again</button>
                    <a href="index.html" class="btn-neon btn-neon-green"><i class="fas fa-home"></i> Dashboard</a>
                </div>
            </div>
        `;
        document.getElementById('replay-quiz-btn').addEventListener('click', () => {
            currentLevel = 0; score = 0; streak = 0; bestStreak = 0;
            showLevelIntro(0, startCurrentLevel);
        });
        awardXP(xpEarned, 'quiz', score);
    }
});
