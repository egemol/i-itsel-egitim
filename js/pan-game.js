let audioContext = null;
let currentSource = null;
let gainNode = null;
let currentPan = null;
let currentAudioPath = null;
let audioBuffer = null;
let score = 0;
let questionCount = 0;

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
async function loadAudioFile(path) {
    try {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error('Error loading audio file:', error);
    }
}

// Generate random pan value between -1 and 1
function generateRandomPan() {
    return Math.round((Math.random() * 2 - 1) * 100) / 100;
}

// Play original sound
async function playOriginalSound() {
    if (!audioContext) initAudio();
    if (!audioBuffer) return;
    stopCurrentSound();
    
    try {
        currentSource = audioContext.createBufferSource();
        currentSource.buffer = audioBuffer;
        currentSource.connect(gainNode);
        currentSource.start();
        currentSource.onended = stopCurrentSound;
    } catch (error) {
        console.error('Error playing original sound:', error);
    }
}

// Play modified sound
async function playModifiedSound() {
    if (!currentPan) return;
    if (!audioContext) initAudio();
    if (!audioBuffer) return;
    stopCurrentSound();
    
    try {
        currentSource = audioContext.createBufferSource();
        currentSource.buffer = audioBuffer;
        
        const panNode = audioContext.createStereoPanner();
        panNode.pan.value = currentPan;
        
        currentSource.connect(panNode);
        panNode.connect(gainNode);
        
        currentSource.start();
        currentSource.onended = stopCurrentSound;
    } catch (error) {
        console.error('Error playing modified sound:', error);
    }
}

// Check pan guess
function checkPanGuess(guessedPan) {
    if (!currentPan) return;
    
    stopCurrentSound();
    
    const difference = Math.abs(guessedPan - currentPan);
    questionCount++;
    
    if (difference <= 0.1) {
        score += 10;
    }
    
    document.getElementById('pan-score').textContent = score;
    document.getElementById('pan-question-count').textContent = questionCount;
    
    // Doğru cevap göstergesini ekle
    const marker = document.getElementById('pan-correct-marker');
    marker.style.display = 'block';
    marker.style.left = `${((currentPan + 1) / 2) * 100}%`;
    
    document.querySelector('.answer-feedback').style.display = 'block';
    document.getElementById('correct-pan').textContent = currentPan;
    document.getElementById('guessed-pan').textContent = guessedPan;
    
    const feedbackCard = document.querySelector('.feedback-card');
    const feedback = getFeedbackMessage(Math.abs(difference * 100));
    feedbackCard.innerHTML = `
        <h4 class="text-center mb-3">${feedback.icon}</h4>
        <p class="feedback-message mb-3">${feedback.message}</p>
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span>Doğru pan değeri:</span>
            <strong><span id="correct-pan">${currentPan}</span></strong>
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <span>Tahmininiz:</span>
            <strong><span id="guessed-pan">${guessedPan}</span></strong>
        </div>
    `;
    
    document.getElementById('pan-guess-btn').style.display = 'none';
    document.getElementById('pan-next-btn').style.display = 'block';
    document.getElementById('pan-slider').disabled = true;
    document.getElementById('play-original').disabled = true;
    document.getElementById('play-modified').disabled = true;
    
    if (questionCount >= 10) {
        endGame();
    }
}

// Move to next question
async function nextQuestion() {
    stopCurrentSound();
    currentPan = generateRandomPan();
    currentAudioPath = getRandomAudioFile();
    
    // Yeni ses dosyasını yükle
    if (!audioContext) initAudio();
    await loadAudioFile(currentAudioPath);
    
    document.querySelector('.answer-feedback').style.display = 'none';
    document.getElementById('pan-next-btn').style.display = 'none';
    document.getElementById('pan-guess-btn').style.display = 'block';
    document.getElementById('pan-slider').disabled = false;
    document.getElementById('pan-slider').value = 0;
    document.getElementById('pan-correct-marker').style.display = 'none';
    document.getElementById('play-original').disabled = false;
    document.getElementById('play-modified').disabled = false;
}

// Initialize game
async function initGame() {
    score = 0;
    questionCount = 0;
    currentPan = generateRandomPan();
    currentAudioPath = getRandomAudioFile();
    
    // İlk ses dosyasını yükle
    if (!audioContext) initAudio();
    await loadAudioFile(currentAudioPath);
    
    document.querySelector('.answer-feedback').style.display = 'none';
    document.getElementById('pan-next-btn').style.display = 'none';
    document.getElementById('pan-new-game-btn').style.display = 'none';
    document.getElementById('pan-guess-btn').style.display = 'block';
    document.getElementById('pan-slider').disabled = false;
    document.getElementById('pan-slider').value = 0;
    document.getElementById('play-original').disabled = false;
    document.getElementById('play-modified').disabled = false;
    
    document.getElementById('pan-score').textContent = score;
    document.getElementById('pan-question-count').textContent = questionCount;
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

// End game
function endGame() {
    const earnedXP = Math.round(score * 0.5);
    document.getElementById('pan-next-btn').style.display = 'none';
    document.getElementById('pan-guess-btn').style.display = 'none';
    document.getElementById('pan-new-game-btn').style.display = 'block';
    document.getElementById('play-original').disabled = true;
    document.getElementById('play-modified').disabled = true;

    // Son tahmin farkını hesapla
    const lastGuess = parseInt(document.getElementById('guessed-pan').textContent);
    const lastCorrect = parseInt(document.getElementById('correct-pan').textContent);
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
    
    // Play button listeners
    document.getElementById('play-original').addEventListener('click', async function() {
        await playOriginalSound();
    });
    document.getElementById('play-modified').addEventListener('click', async function() {
        await playModifiedSound();
    });
    
    // Guess button listener
    document.getElementById('pan-guess-btn').addEventListener('click', function() {
        const guessedPan = parseFloat(document.getElementById('pan-slider').value);
        checkPanGuess(guessedPan);
    });
    
    // Next button listener
    document.getElementById('pan-next-btn').addEventListener('click', async function() {
        await nextQuestion();
    });
    
    // New game button listener
    document.getElementById('pan-new-game-btn').addEventListener('click', async function() {
        await initGame();
    });
    
    // Pan slider listener
    document.getElementById('pan-slider').addEventListener('input', function(e) {
        document.getElementById('pan-value').textContent = parseFloat(e.target.value).toFixed(2);
    });
});
