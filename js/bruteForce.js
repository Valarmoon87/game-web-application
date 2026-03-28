// js/bruteForce.js
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('pass-input');
    const btnAttack = document.getElementById('btn-attack');
    const crackVisuals = document.getElementById('crack-visuals');
    const progressFill = document.getElementById('progress-fill');
    const entropyScoreEl = document.getElementById('entropy-score');
    const timeToCrackEl = document.getElementById('time-to-crack');
    const attemptCountEl = document.getElementById('attempt-count');
    const terminalLog = document.getElementById('terminal-log');

    let isCracking = false;
    let crackInterval;

    btnAttack.addEventListener('click', startAttack);
    input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') startAttack();
    });

    function calculateEntropy(password) {
        let poolSize = 0;
        if (/[a-z]/.test(password)) poolSize += 26;
        if (/[A-Z]/.test(password)) poolSize += 26;
        if (/[0-9]/.test(password)) poolSize += 10;
        if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

        if (poolSize === 0) return 0;
        
        const entropy = password.length * Math.log2(poolSize);
        return entropy;
    }

    function formatTime(seconds) {
        if(seconds < 1) return "Instant";
        if(seconds < 60) return seconds.toFixed(2) + " seconds";
        if(seconds < 3600) return (seconds/60).toFixed(1) + " minutes";
        if(seconds < 86400) return (seconds/3600).toFixed(1) + " hours";
        if(seconds < 31536000) return (seconds/86400).toFixed(1) + " days";
        
        let years = seconds/31536000;
        if(years > 1e6) return (years/1e6).toFixed(1) + " million years";
        return years.toFixed(1) + " years";
    }

    function startAttack() {
        const password = input.value;
        if(!password || isCracking) return;

        isCracking = true;
        btnAttack.disabled = true;
        btnAttack.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        crackVisuals.style.display = 'block';
        playSound('click');

        const entropy = calculateEntropy(password);
        entropyScoreEl.textContent = entropy.toFixed(2) + " bits";

        // Assume offline attack speed: ~10 billion guesses/sec
        const attemptsPerSec = 1e10; 
        const totalCombinations = Math.pow(2, entropy);
        
        let secondsToCrack = (totalCombinations / attemptsPerSec) / 2; // Average time is half the keyspace
        timeToCrackEl.textContent = formatTime(secondsToCrack);

        // Visual simulation parameters
        // We simulate "cracking" in real-time between 1 and 8 seconds for game purposes.
        let simDuration = 0;
        let rank = "";

        if(secondsToCrack < 1) {
            simDuration = 500; // 0.5s real time
            rank = "WEAK";
        } else if(secondsToCrack < 3600) {
            simDuration = 2000; // 2s
            rank = "FAIR";
        } else if(secondsToCrack < 31536000) {
            simDuration = 4000; // 4s
            rank = "STRONG";
        } else {
            simDuration = 8000; // 8s cap
            rank = "UNTOUCHABLE";
        }

        terminalLog.innerHTML = `> target locked. length: ${password.length}<br>> initiating dictionary bypass...<br>> brute force fallback active...<br>`;

        let progress = 0;
        let attempts = 0;
        let tick = 50; // ms
        let step = (100 / (simDuration / tick));

        playSound('click'); // initiate sound

        crackInterval = setInterval(() => {
            progress += step;
            attempts += attemptsPerSec / (1000/tick);
            
            // Log jitter
            if(Math.random() > 0.5) {
                let rHash = Math.random().toString(36).substring(2, 10).toUpperCase();
                terminalLog.innerHTML += `> testing hash ${rHash}... failed<br>`;
                terminalLog.scrollTop = terminalLog.scrollHeight;
            }

            if(progress >= 100) {
                progress = 100;
                clearInterval(crackInterval);
                finishAttack(password, rank, secondsToCrack, entropy);
            }

            progressFill.style.width = progress + "%";
            attemptCountEl.textContent = attempts.toExponential(2);
        }, tick);
    }

    function finishAttack(password, rank, secondsToCrack, entropy) {
        playSound('error'); // system breached sound
        
        terminalLog.innerHTML += `<br><span class="glitch-text">ACCESS GRANTED</span><br>> PASSWORD FOUND: ${password}`;
        terminalLog.scrollTop = terminalLog.scrollHeight;
        
        isCracking = false;
        btnAttack.disabled = false;
        btnAttack.innerHTML = '<i class="fas fa-hammer"></i> Initialize Attack';

        let score = 0;
        if(rank === "WEAK") score = 50;
        if(rank === "FAIR") score = 150;
        if(rank === "STRONG") score = 250;
        if(rank === "UNTOUCHABLE") score = 350;

        // Custom modal message based on result
        setTimeout(() => {
            awardXP(score, 'brute_force', score);
            showMissionComplete(score, score, "Brute Force Simulator");
            
            // Tweak the modal slightly to reflect the evaluation
            const modalTitle = document.querySelector('.modal-title');
            if(modalTitle) {
                modalTitle.textContent = `${rank} PASSWORD DETECTED`;
                if(rank === "WEAK") modalTitle.style.color = "var(--neon-red)";
            }
        }, 1500);
    }
});
