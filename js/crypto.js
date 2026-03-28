const levels = [
    {
        name: "Base64 Breach",
        message: "SYBER SECURITY IS KEY",
        encoded: "U1lCRVIgU0VDVVJJVFkgSVMgS0VZ",
        hint: "Standard Base64 encoding used in many web protocols."
    },
    {
        name: "Caesar Shift (3)",
        message: "DEFEND THE CORE",
        encoded: "GHIHQG WKH FRUH",
        hint: "A historical shift cipher. The shift value is 3."
    },
    {
        name: "Hex Decoder",
        message: "ACCESS GRANTED",
        encoded: "41 43 43 45 53 53 20 47 52 41 4e 54 45 44",
        hint: "Look into hexadecimal representation of ASCII characters."
    },
    {
        name: "Reverse Logic",
        message: "PASSWORD",
        encoded: "DROWS_SAP",
        hint: "Look closely at the characters. It might be backwards."
    },
    {
        name: "The Final Wall (Rot13)",
        message: "HACK THE PLANET",
        encoded: "UNPX GUR CYNARG",
        hint: "A common cipher often used for spoilers. Rotates by 13."
    }
];

let currentLevel = 0;
let score = 0;
let xpReward = 500;
let timeLeft = 60;
let timerId = null;

const cipherDisplay = document.getElementById('cipher-text');
const decodeInput = document.getElementById('decode-input');
const submitBtn = document.getElementById('submit-btn');
const levelNameDisplay = document.getElementById('level-name');
const currentLevelDisplay = document.getElementById('current-level');
const hintText = document.getElementById('hint-text');
const timerDisplay = document.getElementById('time-left');
const dotContainer = document.getElementById('level-dots');
const modalOverlay = document.getElementById('modal-overlay');

function init() {
    loadLevel();
    startTimer();
    updateUserSnippet();
}

function loadLevel() {
    const level = levels[currentLevel];
    levelNameDisplay.textContent = level.name;
    currentLevelDisplay.textContent = currentLevel + 1;
    cipherDisplay.textContent = level.encoded;
    hintText.textContent = `Instruction: ${level.hint}`;
    decodeInput.value = '';
    decodeInput.focus();
    updateDots();
}

function updateDots() {
    const dots = dotContainer.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.remove('active', 'completed');
        if (index < currentLevel) dot.classList.add('completed');
        if (index === currentLevel) dot.classList.add('active');
    });
}

function startTimer() {
    if (timerId) clearInterval(timerId);
    timeLeft = 60;
    timerDisplay.textContent = timeLeft;
    timerId = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerId);
            alert('Security Timeout! Mission Failed.');
            window.location.reload();
        }
    }, 1000);
}

function checkAnswer() {
    const userAnswer = decodeInput.value.toUpperCase().trim();
    const correctAnswer = levels[currentLevel].message;

    if (userAnswer === correctAnswer) {
        currentLevel++;
        if (currentLevel < levels.length) {
            playSound('success');
            loadLevel();
        } else {
            winMission();
        }
    } else {
        playSound('error');
        decodeInput.classList.add('shake');
        setTimeout(() => decodeInput.classList.remove('shake'), 500);
    }
}

function winMission() {
    clearInterval(timerId);
    const user = JSON.parse(localStorage.getItem('cyberArcadeUser')) || { name: 'Guest', xp: 0 };
    user.xp += xpReward;
    localStorage.setItem('cyberArcadeUser', JSON.stringify(user));
    
    modalOverlay.classList.add('active');
    updateUserSnippet();
}

function playSound(type) {
    // Basic beep sounds or just silent if no files provided
    console.log(`Playing ${type} sound`);
}

submitBtn.addEventListener('click', checkAnswer);
decodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAnswer();
});

init();
