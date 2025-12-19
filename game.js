// Game Configuration
const iconTypes = ['star', 'triangle', 'pentagon', 'heart'];
const iconSvgs = {
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    triangle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21z"/></svg>',
    pentagon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l8.5 6.2-3.2 10.3H6.7L3.5 8.7 12 2.5z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
};

const colors = {
    star: '#FFD700',
    triangle: '#00D2FF',
    pentagon: '#39FF14',
    heart: '#FF1493'
};

// State
let score = 0;
let highScore = 0;
let timeLeft = 30;
let currentTarget = null;
let currentGridIndex = -1;
let gameActive = false;
let timerInterval = null;
let autoJumpInterval = null;

// DOM Elements
const gridCells = document.querySelectorAll('.grid-cell');
const scoreDisplay = document.getElementById('score-value');
const highScoreDisplay = document.getElementById('high-score-value');
const messageArea = document.getElementById('game-message');
const controlBtns = document.querySelectorAll('.icon-btn');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const timerDisplay = document.getElementById('game-timer');
const finalScoreDisplay = document.getElementById('final-score');
const bestScoreDisplay = document.getElementById('best-score');

// Sound Engine
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'success') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    } else if (type === 'error') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, now);
        oscillator.frequency.linearRampToValueAtTime(110, now + 0.3);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    } else {
        // Pop sound for btn clicks
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }
}

// Game Logic
function updateTarget() {
    if (!gameActive) return;

    // Clear previous cell
    if (currentGridIndex !== -1) {
        gridCells[currentGridIndex].innerHTML = '';
    }

    // Pick random icon and random cell
    const randomIcon = iconTypes[Math.floor(Math.random() * iconTypes.length)];
    const randomIndex = Math.floor(Math.random() * gridCells.length);

    currentTarget = randomIcon;
    currentGridIndex = randomIndex;

    // Render icon
    const cell = gridCells[randomIndex];
    cell.innerHTML = iconSvgs[randomIcon];
    cell.style.color = colors[randomIcon];

    // Add pop-in animation restart
    const svg = cell.querySelector('svg');
    svg.style.animation = 'none';
    svg.offsetHeight; // trigger reflow
    svg.style.animation = null;
}

function handleIconClick(type) {
    if (!gameActive) return;

    // Resume audio context if suspended (browser policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    if (type === currentTarget) {
        // Success
        score += 1;
        if (score > highScore) {
            highScore = score;
        }
        playSound('success');
        messageArea.innerText = "Great Job! 🌟";
        messageArea.style.color = "#39FF14";

        scoreDisplay.parentElement.classList.add('score-pop');
        setTimeout(() => scoreDisplay.parentElement.classList.remove('score-pop'), 300);

        // Move icon immediately on match
        updateTarget();
    } else {
        // Failure - RESET SCORE TO ZERO
        score = 0;
        playSound('error');
        messageArea.innerText = "Oops! Reset! 🌈";
        messageArea.style.color = "#FF1493";

        document.querySelector('.iphone-16-frame').classList.add('shake');
        setTimeout(() => document.querySelector('.iphone-16-frame').classList.remove('shake'), 400);
    }

    updateScore();
}

function updateScore() {
    scoreDisplay.innerText = score.toString().padStart(2, '0');
    highScoreDisplay.innerText = highScore.toString().padStart(2, '0');
}

function startTimer() {
    timeLeft = 30;
    timerDisplay.innerText = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;

        const container = timerDisplay.parentElement;
        if (timeLeft <= 10) {
            container.style.borderColor = "#FF1493";
            timerDisplay.style.color = "#FF1493";
        } else {
            container.style.borderColor = "rgba(255, 255, 255, 0.2)";
            timerDisplay.style.color = "#FFD700";
        }

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function startGame() {
    gameActive = true;
    score = 0;
    updateScore();
    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');

    messageArea.innerText = "Game Started! 🚀";
    messageArea.style.color = "white";

    updateTarget();
    startTimer();

    autoJumpInterval = setInterval(() => {
        updateTarget();
    }, 2500);
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    clearInterval(autoJumpInterval);

    // Play end sound
    playSound('error');

    messageArea.innerText = "GAME OVER! ⌛";
    messageArea.style.color = "#FF1493";

    // Clear grid
    if (currentGridIndex !== -1) {
        gridCells[currentGridIndex].innerHTML = '';
        currentGridIndex = -1;
    }

    finalScoreDisplay.innerText = score.toString().padStart(2, '0');
    bestScoreDisplay.innerText = highScore.toString().padStart(2, '0');
    gameOverOverlay.classList.remove('hidden');
}

// Event Listeners
controlBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        handleIconClick(type);
    });
});

// Initialize
function init() {
    startBtn.addEventListener('click', () => {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        startGame();
    });

    restartBtn.addEventListener('click', () => {
        startGame();
    });
}

document.addEventListener('DOMContentLoaded', init);
