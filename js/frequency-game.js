// Game state
let score = 0;
let questionCount = 0;
let currentFrequency = null;
let currentSource = null;
let filterNode = null;
let gainNode = null;
let audioContext = null;
let currentAudioFile = null;

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
        currentAudioFile = `audio/${randomFile}`;
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

// Convert slider value to frequency (logarithmic scale)
function sliderToFrequency(value) {
    const minFreq = Math.log10(20);
    const maxFreq = Math.log10(20000);
    const scale = (value / 1000) * (maxFreq - minFreq) + minFreq;
    return Math.round(Math.pow(10, scale));
}

// Generate random frequency
function generateRandomFrequency() {
    const minFreq = Math.log10(20);
    const maxFreq = Math.log10(20000);
    const randomLog = Math.random() * (maxFreq - minFreq) + minFreq;
    return Math.round(Math.pow(10, randomLog));
}

// Play original sound
async function playOriginalSound() {
    if (!audioContext) initAudio();
    stopCurrentSound();
    
    try {
        const audioPath = getRandomAudioFile();
        const response = await fetch(audioPath);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        currentSource = audioContext.createBufferSource();
        currentSource.buffer = audioBuffer;
        
        currentSource.connect(gainNode);
        gainNode.gain.setValueAtTime(1, audioContext.currentTime);
        
        currentSource.start();
        currentSource.onended = stopCurrentSound;
    } catch (error) {
        console.error('Error playing original sound:', error);
    }
}

// Play modified sound
async function playModifiedSound() {
    if (!currentFrequency) return;
    if (!audioContext) initAudio();
    stopCurrentSound();
    
    try {
        const audioPath = getRandomAudioFile();
        const response = await fetch(audioPath);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        currentSource = audioContext.createBufferSource();
        currentSource.buffer = audioBuffer;
        
        // Create bandpass filter
        filterNode = audioContext.createBiquadFilter();
        filterNode.type = 'bandpass';
        filterNode.frequency.value = currentFrequency;
        filterNode.Q.value = 5;
        
        const gainNode2 = audioContext.createGain();
        gainNode2.gain.value = 15; // Ses seviyesini artırdık
        
        currentSource.connect(filterNode);
        filterNode.connect(gainNode2);
        gainNode2.connect(gainNode);
        
        currentSource.start();
        currentSource.onended = stopCurrentSound;
    } catch (error) {
        console.error('Error playing modified sound:', error);
    }
}

// Stop current sound
function stopCurrentSound() {
    if (currentSource) {
        try {
            currentSource.stop();
        } catch (e) {
            // Ignore errors if sound is already stopped
        }
        currentSource.disconnect();
        currentSource = null;
    }
    if (filterNode) {
        filterNode.disconnect();
        filterNode = null;
    }
}

// Initialize game
async function initGame() {
    score = 0;
    questionCount = 0;
    
    document.querySelector('.answer-feedback').style.display = 'none';
    document.getElementById('freq-next-btn').style.display = 'none';
    document.getElementById('freq-new-game-btn').style.display = 'none';
    document.getElementById('submitGuess').style.display = 'block';
    document.getElementById('frequency-slider').disabled = false;
    document.getElementById('frequency-slider').value = 20;
    document.getElementById('play-original').disabled = false;
    document.getElementById('play-modified').disabled = false;
    
    document.getElementById('freq-score').textContent = score;
    document.getElementById('freq-question-count').textContent = questionCount;
    
    currentFrequency = generateRandomFrequency();
    await loadAudioFile();
}

function getFeedbackMessage(difference) {
    if (difference === 0) {
        return { message: "Mükemmel! Tam isabet!", icon: "🎯" };
    } else if (difference <= 10) {
        return { message: "Çok iyi! Neredeyse tam tutturdun!", icon: "🌟" };
    } else if (difference <= 20) {
        return { message: "İyi! Doğru yoldasın.", icon: "👍" };
    } else if (difference <= 30) {
        return { message: "Fena değil, biraz daha pratik yapmalısın.", icon: "💪" };
    } else {
        return { message: "Daha çok çalışmalısın. Tekrar dene!", icon: "💫" };
    }
}

function checkFrequencyGuess(guessedFreq) {
    if (!currentFrequency) return;
    
    const difference = Math.abs(guessedFreq - currentFrequency);
    questionCount++;
    
    if (difference <= 10) {
        score += 10;
    }
    
    document.getElementById('freq-score').textContent = score;
    document.getElementById('freq-question-count').textContent = questionCount;
    
    // Doğru cevap göstergesini ekle
    const marker = document.getElementById('frequency-correct-marker');
    marker.style.display = 'block';
    const sliderRange = Math.log10(20000) - Math.log10(20);
    const targetPosition = ((Math.log10(currentFrequency) - Math.log10(20)) / sliderRange) * 100;
    marker.style.left = `${targetPosition}%`;
    
    const feedback = getFeedbackMessage(difference);
    const feedbackDiv = document.querySelector('.answer-feedback');
    feedbackDiv.style.display = 'block';
    
    const feedbackCard = feedbackDiv.querySelector('.feedback-card');
    feedbackCard.className = `alert feedback-card ${difference <= 10 ? 'alert-success' : 'alert-danger'}`;
    feedbackCard.innerHTML = `
        <h4 class="text-center mb-3">${feedback.icon}</h4>
        <p class="feedback-message mb-3">${feedback.message}</p>
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span>Doğru frekans:</span>
            <strong><span id="correct-freq">${currentFrequency}</span> Hz</strong>
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <span>Tahmininiz:</span>
            <strong><span id="guessed-freq">${guessedFreq}</span> Hz</strong>
        </div>
    `;
    
    document.getElementById('submitGuess').style.display = 'none';
    document.getElementById('freq-next-btn').style.display = 'block';
    document.getElementById('frequency-slider').disabled = true;
    document.getElementById('play-original').disabled = true;
    document.getElementById('play-modified').disabled = true;
    
    if (questionCount >= 10) {
        endGame();
    }
}

// Move to next question
async function nextQuestion() {
    document.querySelector('.answer-feedback').style.display = 'none';
    document.getElementById('freq-next-btn').style.display = 'none';
    document.getElementById('submitGuess').style.display = 'block';
    document.getElementById('frequency-slider').disabled = false;
    document.getElementById('frequency-slider').value = 20;
    document.getElementById('frequency-correct-marker').style.display = 'none';
    document.getElementById('play-original').disabled = false;
    document.getElementById('play-modified').disabled = false;
    
    currentFrequency = generateRandomFrequency();
    await loadAudioFile();
}

// End game
function endGame() {
    const earnedXP = Math.round(score * 0.5);
    document.getElementById('freq-next-btn').style.display = 'none';
    document.getElementById('submitGuess').style.display = 'none';
    document.getElementById('freq-new-game-btn').style.display = 'block';
    document.getElementById('play-original').disabled = true;
    document.getElementById('play-modified').disabled = true;

    // Son tahmin farkını hesapla
    const lastGuess = parseInt(document.getElementById('guessed-freq').textContent);
    const lastCorrect = parseInt(document.getElementById('correct-freq').textContent);
    const difference = Math.abs(lastGuess - lastCorrect);
    const feedback = getFeedbackMessage(difference);

    const modalHtml = `
        <div class="modal fade" id="gameResultModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Tebrikler!</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="result-icon mb-3">${feedback.icon}</div>
                        <h4 class="mb-3">Oyun Tamamlandı</h4>
                        <p class="feedback-message mb-3">${feedback.message}</p>
                        <div class="score-info mb-3">
                            <p class="mb-2">Skorunuz: <strong>${score}/100</strong></p>
                            <p class="mb-0">Kazanılan XP: <strong>${earnedXP}</strong></p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Tamam</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('gameResultModal'));
    modal.show();

    document.getElementById('gameResultModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });

    const user = firebase.auth().currentUser;
    if (user) {
        const userRef = firebase.firestore().collection('users').doc(user.uid);
        userRef.get().then((doc) => {
            if (doc.exists) {
                const currentXP = doc.data().xp || 0;
                userRef.update({
                    xp: currentXP + earnedXP
                });
            }
        });
    }
}

// Initialize game on page load
document.addEventListener('DOMContentLoaded', async function() {
    await initGame();
    
    // Event listeners for play buttons
    document.getElementById('play-original').addEventListener('click', async function() {
        await playOriginalSound();
    });
    document.getElementById('play-modified').addEventListener('click', async function() {
        await playModifiedSound();
    });
    
    // Event listener for submit button
    document.getElementById('submitGuess').addEventListener('click', function() {
        const guessedFreq = parseInt(document.getElementById('frequency-slider').value);
        checkFrequencyGuess(guessedFreq);
    });
    
    // Event listener for next button
    document.getElementById('freq-next-btn').addEventListener('click', async function() {
        await nextQuestion();
    });
    
    // Event listener for slider
    document.getElementById('frequency-slider').addEventListener('input', function(e) {
        const freq = sliderToFrequency(e.target.value);
        document.getElementById('current-frequency-display').textContent = `${freq} Hz`;
    });
});

// Update display
function updateDisplay() {
    document.getElementById('freq-score').textContent = score;
    document.getElementById('freq-question-count').textContent = questionCount;
}
