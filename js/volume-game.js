let audioContext = null;
let currentSource = null;
let gainNode = null;
let currentVolume = null;
let currentAudioPath = null;
let score = 0;
let questionCount = 0;
let audioBuffer = null; // Ses dosyasını önbelleğe almak için
let volumes = [-6, 0, 6]; // Ses seviyeleri

// Initialize audio context
function initAudio() {
    if (audioContext) return;
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
}

// Stop current sound
function stopCurrentSound() {
    if (currentSource) {
        currentSource.stop();
        currentSource = null;
    }
}

// Get random audio file
function getRandomAudioFile() {
    const audioFiles = [
        'flow-211881.wav',
        'movement-200697.wav',
        'perfect-beauty-191271.wav',
        'the-best-jazz-club-in-new-orleans-164472.wav'
    ];
    return `/audio/${audioFiles[Math.floor(Math.random() * audioFiles.length)]}`;
}

// Load audio file
async function loadAudioFile() {
    try {
        const response = await fetch(getRandomAudioFile());
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error('Error loading audio file:', error);
    }
}

// Convert dB to linear gain
function dbToGain(db) {
    return Math.pow(10, db / 20);
}

// Play original sound
function playOriginalSound() {
    if (!audioContext) initAudio();
    if (!audioBuffer) return;
    stopCurrentSound();
    
    try {
        currentSource = audioContext.createBufferSource();
        currentSource.buffer = audioBuffer;
        
        const originalGainNode = audioContext.createGain();
        originalGainNode.gain.value = 1; // Normal ses seviyesi
        
        currentSource.connect(originalGainNode);
        originalGainNode.connect(audioContext.destination);
        
        currentSource.start();
        currentSource.onended = stopCurrentSound;
    } catch (error) {
        console.error('Error playing original sound:', error);
    }
}

// Play modified sound
function playModifiedSound() {
    if (!currentVolume) return;
    if (!audioContext) initAudio();
    if (!audioBuffer) return;
    stopCurrentSound();
    
    try {
        currentSource = audioContext.createBufferSource();
        currentSource.buffer = audioBuffer;
        
        const modifiedGainNode = audioContext.createGain();
        modifiedGainNode.gain.value = dbToGain(currentVolume);
        
        currentSource.connect(modifiedGainNode);
        modifiedGainNode.connect(audioContext.destination);
        
        currentSource.start();
        currentSource.onended = stopCurrentSound;
    } catch (error) {
        console.error('Error playing modified sound:', error);
    }
}

// Show answer feedback
function showAnswerFeedback(isCorrect, correctVolume, guessedVolume) {
    const feedbackDiv = document.querySelector('.answer-feedback');
    feedbackDiv.style.display = 'block';
    
    const feedbackCard = feedbackDiv.querySelector('.feedback-card');
    const resultText = isCorrect ? 'Doğru! 🎯' : 'Yanlış 😕';
    const cardClass = isCorrect ? 'alert-success' : 'alert-danger';
    
    feedbackCard.className = `alert feedback-card ${cardClass}`;
    feedbackCard.innerHTML = `
        <h4 class="text-center mb-3">${resultText}</h4>
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span>Doğru ses seviyesi:</span>
            <strong><span id="correct-volume">${correctVolume}</span> dB</strong>
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <span>Tahmininiz:</span>
            <strong><span id="guessed-volume">${guessedVolume}</span> dB</strong>
        </div>
    `;
}

// Check answer
function checkAnswer(guessedVolume) {
    const isCorrect = guessedVolume === currentVolume;
    showAnswerFeedback(isCorrect, currentVolume, guessedVolume);
    
    if (isCorrect) {
        score += 10;
    }
    questionCount++;
    
    document.getElementById('volume-score').textContent = score;
    document.getElementById('volume-question-count').textContent = questionCount;
    
    document.getElementById('volume-guess-container').style.display = 'none';
    document.getElementById('volume-next-btn').style.display = 'block';
    document.getElementById('play-original').disabled = true;
    document.getElementById('play-modified').disabled = true;
    
    if (questionCount >= 10) {
        endGame();
    }
}

// Update score
function updateScore() {
    document.getElementById('volume-score').textContent = score;
    document.getElementById('volume-question-count').textContent = questionCount;
}

// Move to next question
async function nextQuestion() {
    stopCurrentSound();
    document.querySelector('.answer-feedback').style.display = 'none';
    document.getElementById('volume-next-btn').style.display = 'none';
    document.getElementById('volume-guess-container').style.display = 'block';
    document.getElementById('play-original').disabled = false;
    document.getElementById('play-modified').disabled = false;
    
    currentVolume = volumes[Math.floor(Math.random() * volumes.length)];
    await loadAudioFile();
}

// Initialize game
async function initGame() {
    score = 0;
    questionCount = 0;
    document.getElementById('volume-score').textContent = score;
    document.getElementById('volume-question-count').textContent = questionCount;
    document.getElementById('volume-next-btn').style.display = 'none';
    document.getElementById('volume-new-game-btn').style.display = 'none';
    document.getElementById('volume-guess-container').style.display = 'block';
    nextQuestion();
}

// End game
function endGame() {
    const earnedXP = Math.round(score * 0.5);
    document.getElementById('volume-next-btn').style.display = 'none';
    document.getElementById('volume-guess-container').style.display = 'none';
    document.getElementById('volume-new-game-btn').style.display = 'block';
    document.getElementById('play-original').disabled = true;
    document.getElementById('play-modified').disabled = true;

    // XP ve skor modalını göster
    const modalHtml = `
        <div class="modal fade" id="gameResultModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Tebrikler!</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div class="result-icon mb-3">🎮</div>
                        <h4 class="mb-3">Oyun Tamamlandı</h4>
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

    // Kullanıcı giriş yapmışsa XP'yi kaydet
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

// Event listeners
document.addEventListener('DOMContentLoaded', async function() {
    await initGame();
    
    // Play button listeners
    document.getElementById('play-original').addEventListener('click', playOriginalSound);
    document.getElementById('play-modified').addEventListener('click', playModifiedSound);
    
    // Volume option buttons
    document.querySelectorAll('.volume-option').forEach(button => {
        button.addEventListener('click', function() {
            const volume = parseFloat(this.dataset.volume);
            checkAnswer(volume);
        });
    });
    
    // Next question button
    document.getElementById('volume-next-btn').addEventListener('click', nextQuestion);
    
    // New game button
    document.getElementById('volume-new-game-btn').addEventListener('click', initGame);
});
