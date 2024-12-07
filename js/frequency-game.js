// Web Audio API context
let audioContext;
let gainNode;
let currentSource = null;
let filterNode = null;

// Game state
let score = 0;
let questionCount = 0;
let currentFrequency = 0;
let currentAudioFile = null;
const MAX_QUESTIONS = 10;

// Frequency levels in Hz
const frequencies = [100, 250, 500, 1000, 2000, 4000, 8000];

// Initialize Firebase Storage
const storage = firebase.storage();
const storageRef = storage.ref();

// Available audio files
const audioFileNames = [
    'flow-211881.wav',
    'movement-200697.wav',
    'perfect-beauty-191271.wav',
    'the-best-jazz-club-in-new-orleans-164472.wav'
];

// Function to get random audio file path
function getRandomAudioFile() {
    if (!currentAudioFile) {
        const randomFile = audioFileNames[Math.floor(Math.random() * audioFileNames.length)];
        currentAudioFile = `/audio/${randomFile}`;
    }
    return currentAudioFile;
}

// Initialize audio context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
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
    if (filterNode) {
        filterNode.disconnect();
        filterNode = null;
    }
}

// Generate random frequency
function generateRandomFrequency() {
    return frequencies[Math.floor(Math.random() * frequencies.length)];
}

// Get three random frequency options including the correct one
function getFrequencyOptions(correctFreq) {
    let options = [correctFreq];
    
    while (options.length < 3) {
        const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
        if (!options.includes(randomFreq)) {
            options.push(randomFreq);
        }
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
}

// Load audio file from Netlify
async function loadAudioFile(frequency) {
    try {
        const audioPath = getRandomAudioFile();
        const response = await fetch(audioPath);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer;
    } catch (error) {
        console.warn('Failed to load audio file:', error);
        return generateSineWave(frequency);
    }
}

async function playSound(frequency, isModified = false) {
    try {
        const audioPath = getRandomAudioFile();
        const response = await fetch(audioPath);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        stopCurrentSound();
        
        currentSource = audioContext.createBufferSource();
        currentSource.buffer = audioBuffer;
        
        if (isModified) {
            // Create bandpass filter for modified sound
            const filter = audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = frequency;
            filter.Q.value = 1;
            
            // Connect nodes: source -> filter -> gain -> destination
            currentSource.connect(filter);
            filter.connect(gainNode);
        } else {
            // Connect nodes for original sound: source -> gain -> destination
            currentSource.connect(gainNode);
        }
        
        gainNode.connect(audioContext.destination);
        gainNode.gain.setValueAtTime(1, audioContext.currentTime);
        currentSource.start();
        
        setTimeout(() => {
            stopCurrentSound();
        }, 2000);
    } catch (error) {
        console.error('Error playing sound:', error);
        playFallbackSound(frequency);
    }
}

// Play original sound
async function playOriginalSound() {
    await playSound(currentFrequency, false);
}

// Play modified sound
async function playModifiedSound() {
    await playSound(currentFrequency, true);
}

// Fallback sound function
function playFallbackSound(frequency) {
    console.warn('Using fallback sine wave sound');
    stopCurrentSound();
    
    currentSource = audioContext.createOscillator();
    currentSource.type = 'sine';
    currentSource.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // Create and configure filter for fallback
    filterNode = audioContext.createBiquadFilter();
    filterNode.type = "peaking";
    filterNode.frequency.value = frequency;
    filterNode.Q.value = 1;
    filterNode.gain.value = 15;
    
    currentSource.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    currentSource.start();
    
    // Stop after 2 seconds
    setTimeout(() => {
        stopCurrentSound();
    }, 2000);
}

// Update frequency buttons with new options
function updateFrequencyButtons(options) {
    const buttons = document.querySelectorAll('.freq-guess-btn');
    buttons.forEach((button, index) => {
        button.textContent = `${options[index]} Hz`;
        button.dataset.value = options[index];
    });
}

// Start new game round
function startNewRound() {
    initAudio();
    stopCurrentSound();
    currentFrequency = generateRandomFrequency();
    currentAudioFile = getRandomAudioFile();
    document.getElementById('frequency-slider').value = Math.log10(1000 / 20) + 1.301; // Reset to 1kHz
    document.getElementById('freq-guess-btn').style.display = 'block';
    document.getElementById('frequency-slider').disabled = false;
    document.querySelector('.answer-feedback').style.display = 'none';
    document.getElementById('frequency-correct-marker').style.display = 'none';
}

// Check user's frequency guess
function checkFrequencyGuess() {
    const slider = document.getElementById('frequency-slider');
    const guessedFreq = Math.round(Math.pow(10, parseFloat(slider.value) - 1.301) * 20);
    
    // Calculate accuracy based on octave difference
    const ratio = Math.max(guessedFreq, currentFrequency) / Math.min(guessedFreq, currentFrequency);
    const octaveDiff = Math.log2(ratio);
    
    // Calculate points (max 100 points)
    let points = 0;
    if (octaveDiff <= 1/6) { // Within 1/6 octave
        points = 100;
    } else if (octaveDiff <= 1/3) { // Within 1/3 octave
        points = 75;
    } else if (octaveDiff <= 1/2) { // Within 1/2 octave
        points = 50;
    } else if (octaveDiff <= 1) { // Within 1 octave
        points = 25;
    }
    
    // Update score with weighted points
    score += points;
    questionCount++;
    
    // Show answer feedback
    document.querySelector('.answer-feedback').style.display = 'block';
    document.getElementById('correct-frequency').textContent = currentFrequency;
    document.getElementById('guessed-frequency').textContent = guessedFreq;
    
    // Show correct answer marker
    const marker = document.getElementById('frequency-correct-marker');
    const sliderWidth = slider.offsetWidth;
    const sliderMin = parseFloat(slider.min);
    const sliderMax = parseFloat(slider.max);
    const correctValue = Math.log10(currentFrequency / 20) + 1.301;
    const position = ((correctValue - sliderMin) / (sliderMax - sliderMin)) * sliderWidth;
    
    marker.style.display = 'block';
    marker.style.left = `${position}px`;
    
    // Update accuracy display
    const accuracy = (score / (questionCount * 100)) * 100;
    document.getElementById('frequency-accuracy').textContent = accuracy.toFixed(1);
    
    // Show next button and disable controls
    document.getElementById('freq-guess-btn').style.display = 'none';
    document.getElementById('freq-next-btn').style.display = 'block';
    document.getElementById('play-original').disabled = true;
    document.getElementById('play-modified').disabled = true;
    document.getElementById('frequency-slider').disabled = true;
    
    updateScore();
}

// Update score display
function updateScore() {
    document.getElementById('frequency-score').textContent = score;
    document.getElementById('frequency-question-count').textContent = questionCount;
}

// Calculate and award XP
function calculateXP() {
    const accuracy = (score / (MAX_QUESTIONS * 100)) * 100;
    let xp = Math.round(accuracy * 10); // 10 XP per accuracy point
    
    // Show XP notification
    const notification = document.getElementById('frequency-xp-notification');
    document.getElementById('frequency-xp-gained').textContent = xp;
    document.getElementById('frequency-final-accuracy').textContent = accuracy.toFixed(1);
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
        document.getElementById('freq-next-btn').style.display = 'none';
        document.getElementById('play-original').disabled = false;
        document.getElementById('play-modified').disabled = false;
        document.getElementById('frequency-slider').disabled = false;
        startNewRound();
    }
}

// Event Listeners
document.getElementById('play-original').addEventListener('click', playOriginalSound);
document.getElementById('play-modified').addEventListener('click', playModifiedSound);
document.getElementById('freq-guess-btn').addEventListener('click', checkFrequencyGuess);
document.getElementById('freq-next-btn').addEventListener('click', nextQuestion);

// Initialize first round
startNewRound();
