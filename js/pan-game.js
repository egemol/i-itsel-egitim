// Web Audio API context
let audioContext;
let gainNode;
let panNode;
let currentSource = null;

// Game state
let score = 0;
let questionCount = 0;
let currentPan = 0;
let currentAudioFile = '';
const MAX_QUESTIONS = 10;

// Available audio files
const audioFiles = [
    'flow-211881.aif',
    'movement-200697.aif',
    'perfect-beauty-191271.aif',
    'the-best-jazz-club-in-new-orleans-164472.aif'
];

// Initialize audio context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        panNode = audioContext.createStereoPanner();
        panNode.connect(gainNode);
        gainNode.connect(audioContext.destination);
    }
}

// Stop current sound if playing
function stopCurrentSound() {
    if (currentSource) {
        try {
            currentSource.stop();
        } catch (e) {
            // Ignore errors if sound is already stopped
        }
        currentSource = null;
    }
}

// Generate random pan value between -1 and 1
function generateRandomPan() {
    // Generate pan values at -1, -0.5, 0, 0.5, or 1
    const panValues = [-1, -0.5, 0, 0.5, 1];
    return panValues[Math.floor(Math.random() * panValues.length)];
}

// Play original sound
async function playOriginalSound() {
    try {
        stopCurrentSound();
        
        const response = await fetch(`audio/${currentAudioFile}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        currentSource = audioContext.createBufferSource();
        currentSource.buffer = audioBuffer;
        currentSource.connect(gainNode);
        gainNode.gain.setValueAtTime(1, audioContext.currentTime);
        currentSource.start();
        
        // Stop after buffer duration
        setTimeout(() => {
            stopCurrentSound();
        }, audioBuffer.duration * 1000);
    } catch (error) {
        console.error('Error playing original sound:', error);
        playFallbackSound(0);
    }
}

// Play modified sound
async function playModifiedSound() {
    try {
        stopCurrentSound();
        
        const response = await fetch(`audio/${currentAudioFile}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        currentSource = audioContext.createBufferSource();
        currentSource.buffer = audioBuffer;
        currentSource.connect(panNode);
        panNode.pan.setValueAtTime(currentPan, audioContext.currentTime);
        gainNode.gain.setValueAtTime(1, audioContext.currentTime);
        currentSource.start();
        
        // Stop after buffer duration
        setTimeout(() => {
            stopCurrentSound();
        }, audioBuffer.duration * 1000);
    } catch (error) {
        console.error('Error playing modified sound:', error);
        playFallbackSound(currentPan);
    }
}

// Fallback sound function
function playFallbackSound(pan) {
    stopCurrentSound();
    
    currentSource = audioContext.createOscillator();
    currentSource.type = 'sine';
    currentSource.frequency.setValueAtTime(440, audioContext.currentTime);
    
    currentSource.connect(panNode);
    panNode.pan.setValueAtTime(pan, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    
    currentSource.start();
    
    // Stop after 2 seconds
    setTimeout(() => {
        stopCurrentSound();
    }, 2000);
}

// Start new game round
function startNewRound() {
    initAudio();
    stopCurrentSound();
    currentPan = generateRandomPan();
    currentAudioFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
    document.getElementById('pan-slider').value = 0; // Reset to center
    document.getElementById('pan-value').textContent = '0';
    document.getElementById('pan-guess-btn').style.display = 'block';
    document.getElementById('pan-slider').disabled = false;
    document.querySelector('.answer-feedback').style.display = 'none';
    document.getElementById('pan-correct-marker').style.display = 'none';
}

// Check user's pan guess
function checkPanGuess() {
    const slider = document.getElementById('pan-slider');
    const guessedPan = parseFloat(slider.value);
    
    // Calculate accuracy based on distance
    const distance = Math.abs(currentPan - guessedPan);
    
    // Calculate points (max 100 points)
    let points = 0;
    if (distance <= 0.25) { // Within 0.25
        points = 100;
    } else if (distance <= 0.5) { // Within 0.5
        points = 75;
    } else if (distance <= 0.75) { // Within 0.75
        points = 50;
    } else if (distance <= 1) { // Within 1
        points = 25;
    }
    
    // Update score with weighted points
    score += points;
    questionCount++;
    
    // Show answer feedback
    document.querySelector('.answer-feedback').style.display = 'block';
    document.getElementById('correct-pan').textContent = currentPan.toFixed(2);
    document.getElementById('guessed-pan').textContent = guessedPan.toFixed(2);
    
    // Show correct answer marker
    const marker = document.getElementById('pan-correct-marker');
    const sliderWidth = slider.offsetWidth;
    const sliderMin = parseFloat(slider.min);
    const sliderMax = parseFloat(slider.max);
    const position = ((currentPan - sliderMin) / (sliderMax - sliderMin)) * sliderWidth;
    
    marker.style.display = 'block';
    marker.style.left = `${position}px`;
    
    // Update accuracy display
    const accuracy = (score / (questionCount * 100)) * 100;
    document.getElementById('pan-accuracy').textContent = accuracy.toFixed(1);
    
    // Show next button and disable controls
    document.getElementById('pan-guess-btn').style.display = 'none';
    document.getElementById('pan-next-btn').style.display = 'block';
    document.getElementById('play-original').disabled = true;
    document.getElementById('play-modified').disabled = true;
    document.getElementById('pan-slider').disabled = true;
    
    updateScore();
}

// Convert pan value to text description
function getPanText(pan) {
    if (pan === -1) return "Tamamen Sol (-1)";
    if (pan === -0.5) return "Yarı Sol (-0.5)";
    if (pan === 0) return "Orta (0)";
    if (pan === 0.5) return "Yarı Sağ (0.5)";
    if (pan === 1) return "Tamamen Sağ (1)";
    return `${pan.toFixed(2)}`;
}

// Update score display
function updateScore() {
    document.getElementById('pan-score').textContent = score;
    document.getElementById('pan-question-count').textContent = questionCount;
}

// Calculate and award XP
function calculateXP() {
    const accuracy = (score / (MAX_QUESTIONS * 100)) * 100;
    let xp = Math.round(accuracy * 10); // 10 XP per accuracy point
    
    // Show XP notification
    const notification = document.getElementById('pan-xp-notification');
    document.getElementById('pan-xp-gained').textContent = xp;
    document.getElementById('pan-final-accuracy').textContent = accuracy.toFixed(1);
    notification.style.display = 'block';
    
    // Add XP to user's total (assuming there's a function to do this)
    if (typeof addXP === 'function') {
        addXP(xp);
    }
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
        // Reset game
        score = 0;
        questionCount = 0;
        updateScore();
        startNewRound();
    }, 3000);
}

// Check if game is complete
function checkGameComplete() {
    if (questionCount >= MAX_QUESTIONS) {
        calculateXP();
        return true;
    }
    return false;
}

// Continue to next question
function nextQuestion() {
    if (!checkGameComplete()) {
        document.getElementById('pan-next-btn').style.display = 'none';
        document.getElementById('play-original').disabled = false;
        document.getElementById('play-modified').disabled = false;
        document.getElementById('pan-slider').disabled = false;
        startNewRound();
    }
}

// Update pan value display when slider moves
document.getElementById('pan-slider').addEventListener('input', function() {
    document.getElementById('pan-value').textContent = this.value;
});

// Event Listeners
document.getElementById('play-original').addEventListener('click', playOriginalSound);
document.getElementById('play-modified').addEventListener('click', playModifiedSound);
document.getElementById('pan-guess-btn').addEventListener('click', checkPanGuess);
document.getElementById('pan-next-btn').addEventListener('click', nextQuestion);

// Initialize first round
startNewRound();
