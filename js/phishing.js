// js/phishing.js — Threat Hunter: Multi-Round Edition (8 scenarios × 3 rounds)
document.addEventListener('DOMContentLoaded', () => {
    const btnPhish = document.getElementById('btn-phish');
    const btnLegit = document.getElementById('btn-legit');
    const mockUrl = document.getElementById('mock-url');
    const mockContent = document.getElementById('mock-content');
    const feedbackOverlay = document.getElementById('feedback-overlay');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackText = document.getElementById('feedback-text');
    const nextScenarioBtn = document.getElementById('next-scenario-btn');
    const scoreEl = document.getElementById('phish-score');

    let currentScenario = 0;
    let score = 0;
    let currentRound = 0;
    let totalCorrect = 0;
    let totalSeen = 0;
    let streak = 0;

    // ── 24 total scenarios in 3 rounds ────────────────────────────────────
    const ROUNDS = [
        {
            name: "Round 1: Basic Threats",
            color: '#00e5ff',
            scenarios: [
                {
                    isPhishing: true,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> secure.rnicrosoft-alerts.com/login',
                    from: 'Security Team &lt;security@rnicrosoft.com&gt;',
                    subject: 'URGENT: Your account will be suspended in 24 hours!',
                    body: `<p>Dear User,</p><p>We detected unusual login activity from Russia. Please verify immediately or your account will be permanently locked.</p><a href="#" class="email-button" style="background:red">Verify Account Now</a>`,
                    explanation: "The domain is 'rnicrosoft.com' — not 'microsoft.com'. This is typo-squatting combined with false urgency. Always hover over links to check the real destination."
                },
                {
                    isPhishing: false,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> github.com/notifications',
                    from: 'GitHub &lt;noreply@github.com&gt;',
                    subject: '[GitHub] A new device signed in to your account',
                    body: `<p>Hey there,</p><p>We noticed a new sign-in from an unrecognized device. If this was you, ignore this email. Otherwise, reset your password in Account Settings.</p><p>Thanks,<br>The GitHub Team</p>`,
                    explanation: "Legitimate. Correct domain (github.com), no panic deadline, and directs you to account settings instead of a suspicious button."
                },
                {
                    isPhishing: true,
                    url: '<i class="fas fa-info-circle" style="color:grey"></i> http://paypal-update-billing.xyz/login',
                    from: 'Service &lt;service@paypal.com&gt;',
                    subject: 'Your Invoice #998231 from GeekSquad',
                    body: `<p>Hello Customer,</p><p>Your subscription to GeekSquad Antivirus has been renewed for $399.99. If you did not authorize this, call <strong>1-800-555-0199</strong> immediately.</p>`,
                    explanation: "The URL is an .xyz domain (not paypal.com). Fake invoices create panic so you call their fraudulent support line — a classic refund scam."
                },
                {
                    isPhishing: true,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> google.com-login-auth.net/secure',
                    body: `<div style="text-align:center;padding:20px;"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" width="100" style="margin-bottom:20px"><h3 style="margin-bottom:20px;font-family:sans-serif">Sign in</h3><input type="email" placeholder="Email or phone" style="width:100%;padding:10px;margin-bottom:15px;border:1px solid #ccc;border-radius:4px"><input type="password" placeholder="Enter your password" style="width:100%;padding:10px;margin-bottom:15px;border:1px solid #ccc;border-radius:4px"><button style="width:100%;padding:10px;background:#1a73e8;color:white;border:none;border-radius:4px">Next</button></div>`,
                    explanation: "'google.com-login-auth.net' is a completely different domain. Attackers can use any logo. Always check the root domain after the last dot before the first slash."
                },
                {
                    isPhishing: false,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> amazon.com/orders',
                    from: 'Amazon &lt;order-update@amazon.com&gt;',
                    subject: 'Your Amazon order has shipped!',
                    body: `<p>Hello,</p><p>Your order #404-123456 has been shipped. Track your package here:</p><a href="#" class="email-button" style="background:#ff9900">Track Package</a><p>Estimated delivery: March 30, 2026</p>`,
                    explanation: "Legitimate Amazon notification. The domain is correct (amazon.com), tone is calm, there's an order number, and there's no unusual urgency."
                },
                {
                    isPhishing: true,
                    url: '<i class="fas fa-info-circle" style="color:grey"></i> http://win-prize-2026.click/claim',
                    from: 'Apple Rewards &lt;rewards@ap-ple.com&gt;',
                    subject: '🎉 Congratulations! You have been selected as our Weekly Winner!',
                    body: `<p>Dear Customer,</p><p>You have been selected as our lucky weekly winner! Claim your free iPhone 15 Pro by clicking below. Limited time — expires in 2 hours!</p><a href="#" class="email-button" style="background:green">Claim Your Prize</a>`,
                    explanation: "Classic prize scam. The domain is 'ap-ple.com' (not apple.com), the URL is a .click domain, and 'you've won' with a 2-hour deadline is a hallmark red flag."
                },
                {
                    isPhishing: false,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> accounts.google.com/security',
                    from: 'Google &lt;no-reply@accounts.google.com&gt;',
                    subject: 'Security alert for your Google Account',
                    body: `<p>Hi,</p><p>We noticed a new sign-in to your Google Account from a Windows device. If this was you, you don't need to do anything. If you didn't sign in, secure your account now by going to <strong>accounts.google.com/security</strong>.</p>`,
                    explanation: "Legitimate Google security alert. The domain is accounts.google.com, they give you the URL to type manually, and the tone is calm without forced urgency."
                },
                {
                    isPhishing: true,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> secure.bankofamerica.com.login.xyz/verify',
                    from: 'Bank of America &lt;alerts@bankofamerica.com&gt;',
                    subject: 'Suspicious Activity Detected — Action Required',
                    body: `<p>Dear Valued Customer,</p><p>We have detected potentially unauthorized activity on your account. Your account access has been temporarily suspended. Please verify your identity within 12 hours to restore access.</p><a href="#" class="email-button" style="background:#dd1f27">Verify Identity Now</a>`,
                    explanation: "The URL is 'bankofamerica.com.login.xyz' — the real domain here is .xyz (not bankofamerica.com). Attackers prefix real brand names to fool you. Always read from the last segment before the path."
                }
            ]
        },
        {
            name: "Round 2: Advanced Threats",
            color: '#ffd700',
            scenarios: [
                {
                    isPhishing: true,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> office365-login.com/auth/verify',
                    from: 'Microsoft 365 &lt;admin@office365-login.com&gt;',
                    subject: 'Action Required: Your Microsoft 365 License Has Expired',
                    body: `<p>Dear Admin,</p><p>Your Microsoft 365 subscription has expired. All accounts in your organization will lose access in 48 hours. Please renew now to avoid service interruption.</p><a href="#" class="email-button" style="background:#0078d4">Renew License</a>`,
                    explanation: "office365-login.com is NOT Microsoft. Real Microsoft emails come from microsoft.com. This targets IT admins who might panic and click without checking the domain."
                },
                {
                    isPhishing: false,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> notifications.dropbox.com/verify_email',
                    from: 'Dropbox &lt;no-reply@dropbox.com&gt;',
                    subject: 'Verify your email address',
                    body: `<p>Hello,</p><p>Thanks for signing up for Dropbox! Please verify your email address to complete your account setup.</p><a href="#" class="email-button" style="background:#0060FF">Verify Email</a><p>If you didn't create a Dropbox account, please ignore this email.</p>`,
                    explanation: "Legitimate verification email from Dropbox. Correct dropbox.com domain, notifications subdomain used appropriately, no urgency language."
                },
                {
                    isPhishing: true,
                    url: '<i class="fas fa-info-circle" style="color:grey"></i> http://fedex-track.info/parcel/rescheduled',
                    from: 'FedEx &lt;tracking@fedex-notifications.co&gt;',
                    subject: 'Action Required: Your Package Could Not Be Delivered',
                    body: `<p>Dear Customer,</p><p>Your FedEx package (Tracking #: FX8392029) could not be delivered due to an incorrect address. Please update your delivery address and pay a $2.99 redelivery fee to reschedule.</p><a href="#" class="email-button" style="background:#4D148C">Reschedule Delivery</a>`,
                    explanation: "The sender domain is 'fedex-notifications.co' (not fedex.com), and the URL is fedex-track.info. Real carriers never ask for a payment to redeliver a package via email."
                },
                {
                    isPhishing: false,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> linkedin.com/in/messages',
                    from: 'LinkedIn &lt;messages-noreply@linkedin.com&gt;',
                    subject: 'You have 3 new messages on LinkedIn',
                    body: `<p>Hi there,</p><p>You have 3 new messages waiting for you. Log in to LinkedIn to read them.</p><a href="#" class="email-button" style="background:#0a66c2">View Messages</a><p>You are receiving this because you have message notifications turned on.</p>`,
                    explanation: "This is a legitimate LinkedIn notification. Correct domain (linkedin.com), no urgency, explains why you received it, and doesn't ask for credentials."
                },
                {
                    isPhishing: true,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> secure.paypa1.com/billing/update',
                    from: 'PayPal &lt;service@paypa1.com&gt;',
                    subject: 'Your billing information needs to be updated',
                    body: `<p>Dear Customer,</p><p>Your payment method on file has expired. Please update your billing information to continue using PayPal without interruption. Failure to update within 72 hours may result in account limitations.</p><a href="#" class="email-button" style="background:#003087">Update Billing</a>`,
                    explanation: "The domain is 'paypa1.com' — with a '1' instead of 'l'. This is character substitution, a subtle typo-squatting technique. Always zoom in on the exact URL."
                },
                {
                    isPhishing: false,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> store.steampowered.com/receipt',
                    from: 'Steam &lt;noreply@steampowered.com&gt;',
                    subject: 'Thank you for your purchase',
                    body: `<p>Thank you for purchasing Portal 2 from the Steam Store.</p><p>Purchase ID: 3847291 | Amount: $9.99</p><p>Your game is now available in your Steam Library.</p>`,
                    explanation: "Legitimate Steam purchase receipt. The domain steampowered.com is correct, there's a real purchase ID, and it simply confirms a transaction without any suspicious links."
                },
                {
                    isPhishing: true,
                    url: '<i class="fas fa-info-circle" style="color:grey"></i> http://crypto-airdrop-2026.io/claim',
                    from: 'Coinbase &lt;support@coinbase-support.co&gt;',
                    subject: '🚀 You have unclaimed Bitcoin worth $4,250!',
                    body: `<p>Dear Coinbase User,</p><p>An anonymous donor has sent you 0.058 BTC ($4,250 USD) to your registered wallet. To claim your crypto, please verify your identity and pay a $45 gas fee to process the transfer.</p><a href="#" class="email-button" style="background:#0052FF">Claim Bitcoin Now</a>`,
                    explanation: "Nobody sends you free Bitcoin. The sender is 'coinbase-support.co' (not coinbase.com), the URL is .io crypto scam, and paying a 'gas fee' to receive money is a classic advance-fee fraud."
                },
                {
                    isPhishing: true,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> update.adobe-services.com/flash-update',
                    from: 'Adobe Systems &lt;updates@adobe-services.com&gt;',
                    subject: 'Critical Flash Player Security Update Required',
                    body: `<p>Dear User,</p><p>A critical security vulnerability has been found in your Adobe Flash Player. Please update immediately to protect your computer from hackers.</p><a href="#" class="email-button" style="background:#FF0000">Download Update Now</a>`,
                    explanation: "Adobe Flash was discontinued in 2020. Any 'Flash update' is malware. The domain 'adobe-services.com' is also not the official adobe.com domain."
                }
            ]
        },
        {
            name: "Round 3: Expert — Social Engineering",
            color: '#ff007b',
            scenarios: [
                {
                    isPhishing: true,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> hr-portal.yourcompany-payroll.com/update',
                    from: 'HR Department &lt;hr@yourcompany-payroll.com&gt;',
                    subject: 'Urgent: Update Your Direct Deposit Information by Friday',
                    body: `<p>Hi Team,</p><p>Due to our payroll system upgrade, all employees must verify and update their banking information by this Friday to ensure timely salary deposits. Log into the HR portal to confirm your account details.</p><a href="#" class="email-button" style="background:#333">Update Banking Info</a>`,
                    explanation: "This is a Business Email Compromise (BEC) attack targeting employees. The domain 'yourcompany-payroll.com' is external and not your company's real domain. HR never asks for banking info via email."
                },
                {
                    isPhishing: false,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> zoom.us/j/123456789',
                    from: 'Zoom &lt;no-reply@zoom.us&gt;',
                    subject: 'Your Zoom meeting starts in 15 minutes',
                    body: `<p>Hi there,</p><p>This is a reminder that your meeting "Team Standup" starts in 15 minutes.</p><p>Join Zoom Meeting: zoom.us/j/123456789</p><p>Meeting ID: 123 456 789</p>`,
                    explanation: "Legitimate Zoom reminder. The domain is zoom.us (Zoom's official domain), the link goes directly to zoom.us, and it's a standard calendar reminder without any credential request."
                },
                {
                    isPhishing: true,
                    url: '<i class="fas fa-info-circle" style="color:grey"></i> http://share-doc-2026.online/view?id=8f7a',
                    from: 'CEO Name &lt;ceo@yourcompany-mail.org&gt;',
                    subject: 'Can you wire $48,000 urgently?',
                    body: `<p>Hi,</p><p>I'm in a confidential board meeting and can't talk. I need you to wire $48,000 to our new legal vendor immediately — this is time sensitive and I'll explain later. Please process this ASAP and confirm by email only.</p><p>Sent from my iPhone</p>`,
                    explanation: "This is a CEO Fraud / Wire Transfer scam. The sender's domain is 'yourcompany-mail.org' (not the real company domain). Legitimate CFOs never request wire transfers via email alone, especially 'secretly'."
                },
                {
                    isPhishing: false,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> appleid.apple.com/account',
                    from: 'Apple &lt;no_reply@email.apple.com&gt;',
                    subject: 'Your Apple ID was used to sign in to iCloud',
                    body: `<p>Your Apple ID was used to sign in to iCloud on an iPad near New York, United States.</p><p>If this wasn't you, your Apple ID may be compromised. Go to appleid.apple.com to review your account.</p>`,
                    explanation: "Legitimate Apple security alert. The sender domain is email.apple.com and the URL they give is appleid.apple.com — real Apple domains. They don't link directly; they tell you to navigate yourself."
                },
                {
                    isPhishing: true,
                    url: '<i class="fas fa-info-circle" style="color:grey"></i> http://it-helpdesk.company-support.net/reset',
                    from: 'IT Support &lt;helpdesk@company-support.net&gt;',
                    subject: 'Your network password expires in 2 hours — TAKE ACTION',
                    body: `<p>Dear Employee,</p><p>Your corporate network password will expire in 2 hours. To avoid losing network access, please reset your password immediately using the IT portal link below.</p><a href="#" class="email-button" style="background:#555">Reset Password</a>`,
                    explanation: "The domain 'company-support.net' is external — not your organization's real IT domain. Real IT systems send password expiry notices from internal systems, not external domains."
                },
                {
                    isPhishing: false,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> mail.google.com',
                    from: 'Google Security &lt;no-reply@accounts.google.com&gt;',
                    subject: 'Review your connected apps & activity',
                    body: `<p>Hi,</p><p>As part of our regular security review, we want to make sure you recognize the apps connected to your Google Account. Review them at your convenience in Google Account settings.</p>`,
                    explanation: "Legitimate Google security reminder. No urgency, correct domain (accounts.google.com), and it simply recommends reviewing settings — no immediate action demanded."
                },
                {
                    isPhishing: true,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> whatsapp.com-verify.support/code',
                    from: 'WhatsApp &lt;verify@whatsapp-secure.net&gt;',
                    subject: 'Your WhatsApp verification code: 847-293',
                    body: `<p>Your WhatsApp verification code is: <strong>847-293</strong></p><p>Do NOT share this code with anyone. If you need help, contact our support team by clicking below and entering this code.</p><a href="#" class="email-button" style="background:#25D366">Contact Support</a>`,
                    explanation: "OTP phishing. WhatsApp NEVER sends verification codes via email and never asks you to click a link with your code. 'whatsapp-secure.net' is not WhatsApp's domain. Sharing this OTP lets attackers hijack your account."
                },
                {
                    isPhishing: false,
                    url: '<i class="fas fa-lock" style="color:#27c93f"></i> account.microsoft.com/billing',
                    from: 'Microsoft &lt;microsoft-noreply@microsoft.com&gt;',
                    subject: 'Your Microsoft 365 subscription renews on April 5',
                    body: `<p>Hi,</p><p>Your Microsoft 365 Personal subscription will automatically renew on April 5, 2026 for $69.99/year. No action is needed. You can manage your subscription at account.microsoft.com/billing.</p>`,
                    explanation: "Legitimate Microsoft renewal reminder. Domain is microsoft.com, the URL given is account.microsoft.com — genuine Microsoft domain. No urgency, no suspicious link, just a routine billing notice."
                }
            ]
        }
    ];

    let roundScenarios = [];

    function showRoundIntro(roundIdx, callback) {
        const r = ROUNDS[roundIdx];
        const gameContainer = document.querySelector('.game-container');
        gameContainer.innerHTML = `
            <div style="text-align:center;padding:2rem 1rem">
                <div style="font-size:3rem;margin-bottom:1rem">${roundIdx === 0 ? '🕵️' : roundIdx === 1 ? '🌐' : '🛡️'}</div>
                <h2 style="font-family:var(--font-heading);font-size:1.3rem;color:${r.color};letter-spacing:2px;margin-bottom:0.5rem">${r.name.toUpperCase()}</h2>
                <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:0.4rem">${r.scenarios.length} scenarios — classify each as Phishing or Legitimate</p>
                <p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:1.5rem">Current score: <strong style="color:#ffd700">${score}</strong></p>
                <div style="display:flex;gap:8px;justify-content:center;margin-bottom:1.5rem;flex-wrap:wrap">
                    ${ROUNDS.map((rd, i) => `<div style="padding:4px 14px;border-radius:20px;font-family:var(--font-heading);font-size:0.65rem;background:${i === roundIdx ? rd.color + '22' : 'rgba(255,255,255,0.04)'};border:1px solid ${i < roundIdx ? 'var(--neon-green)' : i === roundIdx ? rd.color : 'rgba(255,255,255,0.1)'};color:${i < roundIdx ? 'var(--neon-green)' : i === roundIdx ? rd.color : 'var(--text-muted)'}">${i < roundIdx ? '✓ ' : ''}Round ${i + 1}</div>`).join('')}
                </div>
                <button id="round-start-btn" class="btn-neon" style="font-size:1rem;padding:12px 30px">
                    <i class="fas fa-search"></i> ${roundIdx === 0 ? 'Start Investigation' : 'Next Round'}
                </button>
            </div>
        `;
        document.getElementById('round-start-btn').addEventListener('click', callback);
    }

    function startRound(roundIdx) {
        currentRound = roundIdx;
        roundScenarios = ROUNDS[roundIdx].scenarios;
        currentScenario = 0;
        rebuildUI();
        loadScenario();
    }

    function rebuildUI() {
        const gameContainer = document.querySelector('.game-container');
        gameContainer.innerHTML = `
            <div class="game-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                <h2 style="font-size:1rem"><i class="fas fa-fish" style="color:var(--neon-blue)"></i> Threat Hunter</h2>
                <div style="display:flex;gap:16px;align-items:center;font-family:var(--font-heading);font-size:0.75rem">
                    <span>Round <span style="color:${ROUNDS[currentRound].color}">${currentRound + 1}/3</span></span>
                    <span>Score: <span id="phish-score" style="color:var(--neon-green);font-weight:700">${score}</span></span>
                    <span>Q: <span id="phish-q">${currentScenario + 1}/${roundScenarios.length}</span></span>
                </div>
            </div>
            <div class="phish-browser-mock" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden;margin-bottom:1.5rem">
                <div class="browser-bar" style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:rgba(0,0,0,0.4);border-bottom:1px solid rgba(255,255,255,0.06)">
                    <div style="display:flex;gap:5px"><div style="width:10px;height:10px;border-radius:50%;background:#ff5f57"></div><div style="width:10px;height:10px;border-radius:50%;background:#ffbd2e"></div><div style="width:10px;height:10px;border-radius:50%;background:#28c840"></div></div>
                    <div id="mock-url" style="flex:1;background:rgba(255,255,255,0.05);border-radius:6px;padding:4px 12px;font-size:0.78rem;font-family:monospace;color:rgba(255,255,255,0.7)"></div>
                </div>
                <div id="mock-content" style="padding:1.5rem;min-height:180px;color:#333;background:#fff;position:relative"></div>
            </div>
            <div id="feedback-overlay" style="display:none;background:rgba(0,0,0,0.85);border-radius:10px;padding:1rem 1.5rem;margin-bottom:1rem;border:1px solid rgba(255,255,255,0.1)">
                <div id="feedback-icon" style="font-size:2rem;margin-bottom:0.3rem"></div>
                <h3 id="feedback-title" style="font-family:var(--font-heading);margin-bottom:0.5rem"></h3>
                <p id="feedback-text" style="font-size:0.85rem;color:var(--text-muted);line-height:1.6"></p>
            </div>
            <div id="decision-panel" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:1rem">
                <button id="btn-phish" class="btn-neon" style="background:rgba(255,0,123,0.2);border-color:var(--neon-red);color:var(--neon-red);">☠️ PHISHING</button>
                <button id="btn-legit" class="btn-neon btn-neon-green">✅ LEGITIMATE</button>
            </div>
            <div style="text-align:center">
                <button id="next-scenario-btn" class="btn-neon" style="display:none;margin-top:0.5rem"><i class="fas fa-arrow-right"></i> Next Scenario</button>
            </div>
        `;

        // Re-bind buttons after rebuild
        document.getElementById('btn-phish').addEventListener('click', () => makeDecision(true));
        document.getElementById('btn-legit').addEventListener('click', () => makeDecision(false));
        document.getElementById('next-scenario-btn').addEventListener('click', advanceScenario);
    }

    function loadScenario() {
        const data = roundScenarios[currentScenario];
        document.getElementById('mock-url').innerHTML = data.url;

        let html = '';
        if (data.from) {
            html = `
                <div style="background:#f5f5f5;padding:12px;border-bottom:1px solid #ddd;font-family:sans-serif">
                    <div style="font-size:0.8rem;margin-bottom:3px"><strong>From:</strong> ${data.from}</div>
                    ${data.subject ? `<div style="font-size:0.85rem;font-weight:bold">${data.subject}</div>` : ''}
                </div>
                <div style="padding:1rem;font-family:sans-serif;font-size:0.9rem;color:#222">${data.body}</div>
            `;
        } else {
            html = `<div style="font-family:sans-serif">${data.body}</div>`;
        }
        document.getElementById('mock-content').innerHTML = html;

        document.getElementById('feedback-overlay').style.display = 'none';
        const dp = document.getElementById('decision-panel');
        dp.style.opacity = '1'; dp.style.pointerEvents = 'auto';
        document.getElementById('next-scenario-btn').style.display = 'none';
        document.getElementById('phish-q').textContent = `${currentScenario + 1}/${roundScenarios.length}`;
    }

    function makeDecision(selectedPhishing) {
        const data = roundScenarios[currentScenario];
        const isCorrect = selectedPhishing === data.isPhishing;
        totalSeen++;

        const fo = document.getElementById('feedback-overlay');
        const fi = document.getElementById('feedback-icon');
        const ft = document.getElementById('feedback-title');
        const ftx = document.getElementById('feedback-text');

        if (isCorrect) {
            score++;
            totalCorrect++;
            streak++;
            const scoreEl = document.getElementById('phish-score');
            if (scoreEl) scoreEl.innerText = score;
            fi.innerHTML = '<i class="fas fa-check-circle" style="color:var(--neon-green)"></i>';
            ft.innerText = streak >= 3 ? `Correct! 🔥 ${streak}x Streak!` : 'Correct Analysis!';
            ft.style.color = 'var(--neon-green)';
            playSound('success');
        } else {
            streak = 0;
            fi.innerHTML = '<i class="fas fa-times-circle" style="color:var(--neon-red)"></i>';
            ft.innerText = 'Threat Bypassed!';
            ft.style.color = 'var(--neon-red)';
            playSound('error');
        }

        ftx.innerText = data.explanation;
        fo.style.display = 'block';
        const dp = document.getElementById('decision-panel');
        dp.style.opacity = '0.4'; dp.style.pointerEvents = 'none';

        const nsb = document.getElementById('next-scenario-btn');
        nsb.style.display = 'block';
        nsb.textContent = currentScenario === roundScenarios.length - 1
            ? (currentRound === ROUNDS.length - 1 ? '⚡ Complete Mission' : '📋 Next Round')
            : 'Next Scenario →';
    }

    function advanceScenario() {
        currentScenario++;
        if (currentScenario < roundScenarios.length) {
            loadScenario();
        } else if (currentRound < ROUNDS.length - 1) {
            showRoundIntro(currentRound + 1, () => startRound(currentRound + 1));
        } else {
            endGame();
        }
    }

    function endGame() {
        const xpEarned = totalCorrect * 32 + 50;
        const accuracy = Math.round((totalCorrect / totalSeen) * 100);
        document.querySelector('.game-container').innerHTML = `
            <div style="text-align:center;padding:2rem 1rem">
                <div style="font-size:3.5rem;margin-bottom:0.8rem">${accuracy >= 90 ? '🏆' : accuracy >= 70 ? '🥇' : '🎯'}</div>
                <h2 style="font-family:var(--font-heading);letter-spacing:3px;color:#fff;margin-bottom:0.4rem">THREAT ASSESSMENT COMPLETE</h2>
                <p style="color:var(--text-muted);margin-bottom:1.5rem">All 3 rounds cleared</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:340px;margin:0 auto 1.5rem">
                    <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px">
                        <div style="font-size:0.6rem;color:var(--text-muted);font-family:var(--font-heading)">IDENTIFIED</div>
                        <div style="font-size:1.4rem;font-weight:700;font-family:var(--font-heading);color:#ffd700">${totalCorrect}/${totalSeen}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px">
                        <div style="font-size:0.6rem;color:var(--text-muted);font-family:var(--font-heading)">ACCURACY</div>
                        <div style="font-size:1.4rem;font-weight:700;font-family:var(--font-heading);color:var(--neon-green)">${accuracy}%</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(0,255,65,0.15);border-radius:10px;padding:12px">
                        <div style="font-size:0.6rem;color:var(--text-muted);font-family:var(--font-heading)">XP EARNED</div>
                        <div style="font-size:1.4rem;font-weight:700;font-family:var(--font-heading);color:#00e5ff">+${xpEarned}</div>
                    </div>
                    <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px">
                        <div style="font-size:0.6rem;color:var(--text-muted);font-family:var(--font-heading)">RANK</div>
                        <div style="font-size:1.4rem;font-weight:700;font-family:var(--font-heading);color:#ff007b">${accuracy >= 90 ? 'EXPERT' : accuracy >= 70 ? 'ANALYST' : 'CADET'}</div>
                    </div>
                </div>
                <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
                    <button id="replay-phish-btn" class="btn-neon"><i class="fas fa-redo"></i> Play Again</button>
                    <a href="index.html" class="btn-neon btn-neon-green"><i class="fas fa-home"></i> Dashboard</a>
                    <a href="leaderboard.html" class="btn-neon" style="border-color:#ffd700;color:#ffd700"><i class="fas fa-trophy"></i> Leaderboard</a>
                </div>
            </div>
        `;
        document.getElementById('replay-phish-btn').addEventListener('click', () => {
            score = 0; totalCorrect = 0; totalSeen = 0; streak = 0;
            showRoundIntro(0, () => startRound(0));
        });
        awardXP(xpEarned, 'phishing', totalCorrect);
        showMissionComplete(totalCorrect, xpEarned, 'Threat Hunter');
    }

    // Start game
    score = 0; totalCorrect = 0; totalSeen = 0; streak = 0;
    showRoundIntro(0, () => startRound(0));
});
