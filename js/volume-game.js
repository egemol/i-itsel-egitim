// Web Audio API context
let audioContext;
let gainNode;
let currentSource = null;

// Game state
let currentVolume;
let score = 0;
let questionCount = 0;
const totalQuestions = 10;

// Volume levels in dB (array from -24 to +24 with steps of 3)
const volumeLevels = Array.from({length: 17}, (_, i) => -24 + i * 3);

// Available audio files
const audioFiles = [
    'flow-211881.aif',
    'movement-200697.aif',
    'perfect-beauty-191271.aif',
    'the-best-jazz-club-in-new-orleans-164472.aif'
];

// Current audio file
let currentAudioFile;

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
}

// Generate random volume level
function generateRandomVolume() {
    return volumeLevels[Math.floor(Math.random() * volumeLevels.length)];
}

// Get three random volume options including the correct one
function getVolumeOptions(correctVolume) {
    let options = [correctVolume];
    
    while (options.length < 3) {
        const randomVolume = volumeLevels[Math.floor(Math.random() * volumeLevels.length)];
        if (!options.includes(randomVolume)) {
            options.push(randomVolume);
        }
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
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
        gainNode.gain.setValueAtTime(1, audioContext.currentTime); // Reference level
        currentSource.start();
        
        // Stop after buffer duration
        setTimeout(() => {
            stopCurrentSound();
        }, audioBuffer.duration * 1000);
    } catch (error) {
        console.error('Error playing original sound:', error);
        playFallbackSound(1);
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
        currentSource.connect(gainNode);
        gainNode.gain.setValueAtTime(dbToGain(currentVolume), audioContext.currentTime);
        currentSource.start();
        
        // Stop after buffer duration
        setTimeout(() => {
            stopCurrentSound();
        }, audioBuffer.duration * 1000);
    } catch (error) {
        console.error('Error playing modified sound:', error);
        playFallbackSound(dbToGain(currentVolume));
    }
}

// Convert dB to linear gain
function dbToGain(db) {
    return Math.pow(10, db / 20);
}

// Fallback sound function
function playFallbackSound(gain) {
    stopCurrentSound();
    
    currentSource = audioContext.createOscillator();
    currentSource.type = 'sine';
    currentSource.frequency.setValueAtTime(1000, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
    
    currentSource.connect(gainNode);
    currentSource.start();
    
    // Stop after 2 seconds
    setTimeout(() => {
        stopCurrentSound();
    }, 2000);
}

// Update volume buttons with new options
function updateVolumeButtons(options) {
    const buttons = document.querySelectorAll('.volume-guess-btn');
    buttons.forEach((button, index) => {
        button.textContent = `${options[index] >= 0 ? '+' : ''}${options[index]} dB`;
        button.dataset.value = options[index];
    });
}

// Start new game round
function startNewRound() {
    initAudio();
    stopCurrentSound();
    currentVolume = generateRandomVolume();
    currentAudioFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
    const options = getVolumeOptions(currentVolume);
    updateVolumeButtons(options);
    enableVolumeButtons();
}

// Check user's volume guess
function checkVolumeGuess(guessedVolume) {
    const isCorrect = guessedVolume === currentVolume;
    
    if (isCorrect) {
        score++;
    }
    
    questionCount++;
    updateScore();
    
    // Disable volume buttons and show next button
    disableVolumeButtons();
    document.getElementById('vol-next-btn').style.display = 'block';
    document.getElementById('play-original').disabled = true;
    document.getElementById('play-modified').disabled = true;
}

// Enable volume guess buttons
function enableVolumeButtons() {
    const buttons = document.querySelectorAll('.volume-guess-btn');
    buttons.forEach(button => {
        button.disabled = false;
        button.classList.remove('btn-success', 'btn-danger');
        button.classList.add('btn-outline-primary');
    });
}

// Disable volume guess buttons
function disableVolumeButtons() {
    const buttons = document.querySelectorAll('.volume-guess-btn');
    buttons.forEach(button => {
        button.disabled = true;
        const buttonValue = parseInt(button.dataset.value);
        if (buttonValue === currentVolume) {
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-success');
        }
    });
}

// Update score display
function updateScore() {
    document.getElementById('volume-score').textContent = score;
    const accuracy = (score / questionCount) * 100;
    document.getElementById('volume-accuracy').textContent = accuracy.toFixed(1);
    
    if (questionCount >= totalQuestions) {
        endGame();
    }
}

// Move to next question
function nextVolumeGame() {
    if (questionCount < totalQuestions) {
        document.getElementById('vol-next-btn').style.display = 'none';
        document.getElementById('play-original').disabled = false;
        document.getElementById('play-modified').disabled = false;
        startNewRound();
    }
}

// End the game
function endGame() {
    // Disable controls
    document.getElementById('play-original').disabled = true;
    document.getElementById('play-modified').disabled = true;
    disableVolumeButtons();
    document.getElementById('vol-next-btn').disabled = true;
    
    // Show final score
    alert(`Oyun bitti!\nSkorunuz: ${score}/${totalQuestions}\nDoğruluk: ${((score/totalQuestions)*100).toFixed(1)}%`);
}

// Event Listeners
document.getElementById('play-original').addEventListener('click', playOriginalSound);
document.getElementById('play-modified').addEventListener('click', playModifiedSound);
document.getElementById('vol-next-btn').addEventListener('click', nextVolumeGame);

// Add click listeners to volume buttons
document.querySelectorAll('.volume-guess-btn').forEach(button => {
    button.addEventListener('click', function() {
        const guessedVolume = parseInt(this.dataset.value);
        checkVolumeGuess(guessedVolume);
    });
});

// Initialize first round
startNewRound();
