// Audio Context ve kaynaklar
let audioContext;
let currentSource;
let currentBuffer = null;
let songs = [
    { path: 'audio/flow-211881.aif' },
    { path: 'audio/movement-200697.aif' },
    { path: 'audio/perfect-beauty-191271.aif' },
    { path: 'audio/the-best-jazz-club-in-new-orleans-164472.aif' }
];

// Oyun durumu
let gameState = {
    currentSong: null,
    frequency: {
        attempts: 10,
        totalAccuracy: 0,
        score: 0,
        currentFrequency: null,
        audioBuffer: null,
        currentGuess: null
    },
    volume: {
        attempts: 10,
        totalAccuracy: 0,
        score: 0,
        correctOption: null,
        gains: null,
        audioBuffer: null,
        dbValues: null
    },
    pan: {
        attempts: 10,
        totalAccuracy: 0,
        score: 0,
        currentPan: null,
        audioBuffer: null,
        currentGuess: null
    }
};

// Ses dosyalarını yükle
async function loadAudio(url) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error('Ses dosyası yüklenirken hata:', error);
        return null;
    }
}

// Audio Context'i başlat
function initAudioContext() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
        
        // iOS ve Safari için ses başlatma
        if (audioContext.state === 'suspended') {
            const resumeAudio = async () => {
                await audioContext.resume();
                document.removeEventListener('click', resumeAudio);
                document.removeEventListener('touchstart', resumeAudio);
            };
            document.addEventListener('click', resumeAudio);
            document.addEventListener('touchstart', resumeAudio);
        }
    } catch (e) {
        console.error('Web Audio API desteklenmiyor:', e);
        alert('Tarayıcınız Web Audio API\'yi desteklemiyor. Lütfen modern bir tarayıcı kullanın.');
    }
}

// Ses çalmayı durdur
function stopCurrentSound() {
    if (currentSource) {
        currentSource.stop();
        currentSource = null;
    }
}

// Ana sayfa ve oyunlar arası geçiş
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    stopCurrentSound();
}

// Oyunu göster
function showGame(gameType) {
    initAudioContext();
    
    document.querySelectorAll('.game-section').forEach(game => {
        game.style.display = 'none';
    });
    
    document.getElementById(`${gameType}-game`).style.display = 'block';
    stopCurrentSound();
}

// Rastgele şarkı seç
function getRandomSong() {
    return songs[Math.floor(Math.random() * songs.length)];
}

// Oyun durumunu sıfırla
function resetGameState() {
    const song = getRandomSong();
    gameState = {
        currentSong: song,
        frequency: {
            attempts: 10,
            totalAccuracy: 0,
            score: 0,
            currentFrequency: null,
            audioBuffer: null,
            currentGuess: null
        },
        volume: {
            attempts: 10,
            totalAccuracy: 0,
            score: 0,
            correctOption: null,
            gains: null,
            audioBuffer: null,
            dbValues: null
        },
        pan: {
            attempts: 10,
            totalAccuracy: 0,
            score: 0,
            currentPan: null,
            audioBuffer: null,
            currentGuess: null
        }
    };
}

// Orijinal sesi çal
async function playOriginalSound() {
    if (!currentBuffer) return;
    
    if (currentSource) {
        currentSource.stop();
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = currentBuffer;
    source.connect(audioContext.destination);
    source.start();
    currentSource = source;
}

// Frekans oyununu başlat
async function playFrequencyGame() {
    // Eğer aktif bir oyun varsa, aynı sesi tekrar çal
    if (gameState.frequency.currentFrequency) {
        if (currentSource) {
            currentSource.stop();
        }
        
        const source = audioContext.createBufferSource();
        const filter1 = audioContext.createBiquadFilter();
        const filter2 = audioContext.createBiquadFilter();
        const filter3 = audioContext.createBiquadFilter();
        const gainNode = audioContext.createGain();
        
        source.buffer = gameState.frequency.audioBuffer;
        
        // Genel ses seviyesini düşür
        gainNode.gain.value = 0.7;
        
        // Ana boost filtresi
        filter1.type = 'peaking';
        filter1.frequency.value = gameState.frequency.currentFrequency;
        filter1.Q.value = 1.5;
        filter1.gain.value = 12; // 20dB'den 12dB'ye düşürüldü
        
        // Yan filtreler (daha yumuşak geçiş için)
        filter2.type = 'peaking';
        filter2.frequency.value = gameState.frequency.currentFrequency * 0.8;
        filter2.Q.value = 2;
        filter2.gain.value = 6; // 10dB'den 6dB'ye düşürüldü
        
        filter3.type = 'peaking';
        filter3.frequency.value = gameState.frequency.currentFrequency * 1.2;
        filter3.Q.value = 2;
        filter3.gain.value = 6; // 10dB'den 6dB'ye düşürüldü
        
        // Filtreleri zincirleme bağla
        source.connect(gainNode);
        gainNode.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(filter3);
        filter3.connect(audioContext.destination);
        
        source.start();
        currentSource = source;
        return;
    }

    // Yeni oyun başlat
    if (!gameState.frequency.audioBuffer) {
        gameState.frequency.audioBuffer = await loadAudio(gameState.currentSong.path);
    }
    
    currentBuffer = gameState.frequency.audioBuffer;
    
    if (currentSource) {
        currentSource.stop();
    }
    
    // Rastgele bir frekans seç (100Hz - 20kHz arası)
    const minFreq = 100;
    const maxFreq = 20000;
    const frequency = Math.exp(Math.random() * (Math.log(maxFreq) - Math.log(minFreq)) + Math.log(minFreq));
    gameState.frequency.currentFrequency = frequency;
    
    // Sesi çal ve frekans boost uygula
    const source = audioContext.createBufferSource();
    const filter1 = audioContext.createBiquadFilter();
    const filter2 = audioContext.createBiquadFilter();
    const filter3 = audioContext.createBiquadFilter();
    const gainNode = audioContext.createGain();
    
    source.buffer = gameState.frequency.audioBuffer;
    
    // Genel ses seviyesini düşür
    gainNode.gain.value = 0.7;
    
    // Ana boost filtresi
    filter1.type = 'peaking';
    filter1.frequency.value = frequency;
    filter1.Q.value = 1.5;
    filter1.gain.value = 12; // 20dB'den 12dB'ye düşürüldü
    
    // Yan filtreler (daha yumuşak geçiş için)
    filter2.type = 'peaking';
    filter2.frequency.value = frequency * 0.8;
    filter2.Q.value = 2;
    filter2.gain.value = 6; // 10dB'den 6dB'ye düşürüldü
    
    filter3.type = 'peaking';
    filter3.frequency.value = frequency * 1.2;
    filter3.Q.value = 2;
    filter3.gain.value = 6; // 10dB'den 6dB'ye düşürüldü
    
    // Filtreleri zincirleme bağla
    source.connect(gainNode);
    gainNode.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(filter3);
    filter3.connect(audioContext.destination);
    
    source.start();
    currentSource = source;
    
    // Cevap çizgisini ve marker'ı sıfırla
    document.querySelector('.frequency-answer').style.display = 'none';
    document.querySelector('.frequency-marker').style.left = '50%';
    document.querySelector('.frequency-slider').value = '2.801';
    
    // Butonları ayarla
    document.getElementById('freq-play-btn').disabled = false;
    document.getElementById('freq-guess-btn').disabled = false;
    document.getElementById('freq-next-btn').style.display = 'none';
}

// Ses şiddeti oyununu başlat
async function playVolumeGame() {
    // Eğer aktif bir oyun varsa, aynı sesi tekrar çal
    if (gameState.volume.correctOption !== null) {
        if (currentSource) {
            currentSource.stop();
        }
        
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        
        source.buffer = gameState.volume.audioBuffer;
        gainNode.gain.value = gameState.volume.gains[gameState.volume.correctOption];
        
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        source.start();
        currentSource = source;
        return;
    }

    // Yeni oyun başlat
    if (!gameState.volume.audioBuffer) {
        gameState.volume.audioBuffer = await loadAudio(gameState.currentSong.path);
    }
    
    currentBuffer = gameState.volume.audioBuffer;
    
    if (currentSource) {
        currentSource.stop();
    }
    
    // Rastgele dB değerleri üret (-24dB ile +24dB arası)
    const baseGain = 1.0;
    const minDb = -24;
    const maxDb = 24;
    
    // Rastgele 3 farklı dB değeri seç
    let dbValues = [];
    while (dbValues.length < 3) {
        const db = Math.round(Math.random() * (maxDb - minDb) + minDb);
        // Eğer bu dB değeri daha önce seçilmediyse ekle
        if (!dbValues.includes(db)) {
            dbValues.push(db);
        }
    }
    
    // dB değerlerini gain değerlerine çevir
    const gains = dbValues.map(db => baseGain * Math.pow(10, db/20));
    gameState.volume.gains = gains;
    gameState.volume.dbValues = dbValues; // dB değerlerini sakla
    
    // Doğru cevabı rastgele seç
    gameState.volume.correctOption = Math.floor(Math.random() * 3);
    
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = gameState.volume.audioBuffer;
    gainNode.gain.value = gains[gameState.volume.correctOption];
    
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    source.start();
    currentSource = source;
    
    // Buton etiketlerini güncelle
    const buttons = document.querySelectorAll('.volume-option');
    buttons.forEach((button, index) => {
        const dbValue = dbValues[index];
        button.textContent = `${dbValue > 0 ? '+' : ''}${dbValue} dB`;
        button.disabled = false;
    });
    
    // Butonları ayarla
    document.getElementById('vol-play-btn').disabled = false;
    document.getElementById('vol-next-btn').style.display = 'none';
}

// Pan oyununu başlat
async function playPanGame() {
    // Eğer aktif bir oyun varsa, aynı sesi tekrar çal
    if (gameState.pan.currentPan !== null) {
        if (currentSource) {
            currentSource.stop();
        }
        
        const source = audioContext.createBufferSource();
        const panner = audioContext.createStereoPanner();
        
        source.buffer = gameState.pan.audioBuffer;
        panner.pan.value = gameState.pan.currentPan;
        
        source.connect(panner);
        panner.connect(audioContext.destination);
        
        source.start();
        currentSource = source;
        return;
    }

    // Yeni oyun başlat
    if (!gameState.pan.audioBuffer) {
        gameState.pan.audioBuffer = await loadAudio(gameState.currentSong.path);
    }
    
    currentBuffer = gameState.pan.audioBuffer;
    
    if (currentSource) {
        currentSource.stop();
    }
    
    // Rastgele bir pan pozisyonu (-1 ile 1 arası)
    // 7 farklı pozisyon: -1, -0.66, -0.33, 0, 0.33, 0.66, 1
    const positions = [-1, -0.66, -0.33, 0, 0.33, 0.66, 1];
    const panIndex = Math.floor(Math.random() * positions.length);
    const pan = positions[panIndex];
    gameState.pan.currentPan = pan;
    
    const source = audioContext.createBufferSource();
    const panner = audioContext.createStereoPanner();
    
    source.buffer = gameState.pan.audioBuffer;
    panner.pan.value = pan;
    
    source.connect(panner);
    panner.connect(audioContext.destination);
    
    source.start();
    currentSource = source;
    
    // Cevap çizgisini ve marker'ı sıfırla
    document.querySelector('.pan-answer').style.display = 'none';
    document.querySelector('.pan-marker').style.left = '50%';
    document.querySelector('.pan-slider').value = '0';
    
    // Butonları ayarla
    document.getElementById('pan-play-btn').disabled = false;
    document.getElementById('pan-guess-btn').disabled = false;
    document.getElementById('pan-next-btn').style.display = 'none';
}

// Sonraki ses şiddeti oyununa geç
function nextVolumeGame() {
    document.getElementById('vol-play-btn').disabled = false;
    document.getElementById('vol-next-btn').style.display = 'none';
    gameState.volume.correctOption = null;
    playVolumeGame();
}

// Ses şiddeti tahminini kontrol et
function checkVolumeGuess(guessIndex) {
    if (gameState.volume.attempts <= 0 || gameState.volume.correctOption === null) return;
    
    const isCorrect = guessIndex === gameState.volume.correctOption;
    const percentage = isCorrect ? 100 : 0;
    
    updateGameStatus('volume', percentage);
    
    // Butonları devre dışı bırak
    const buttons = document.querySelectorAll('.volume-option');
    buttons.forEach(button => button.disabled = true);
    
    if (currentSource) {
        currentSource.stop();
        currentSource = null;
    }
    
    // Devam Et butonunu göster
    document.getElementById('vol-play-btn').disabled = true;
    document.getElementById('vol-next-btn').style.display = 'inline-block';
}

// Sonraki frekans oyununa geç
function nextFrequencyGame() {
    document.getElementById('freq-play-btn').disabled = false;
    document.getElementById('freq-guess-btn').disabled = false;
    document.getElementById('freq-next-btn').style.display = 'none';
    gameState.frequency.currentFrequency = null;
    playFrequencyGame();
}

// Sonraki pan oyununa geç
function nextPanGame() {
    document.getElementById('pan-play-btn').disabled = false;
    document.getElementById('pan-guess-btn').disabled = false;
    document.getElementById('pan-next-btn').style.display = 'none';
    gameState.pan.currentPan = null;
    playPanGame();
}

// Tahminleri kontrol et
function checkFrequencyGuess() {
    if (gameState.frequency.attempts <= 0 || !gameState.frequency.currentFrequency) return;
    
    const slider = document.querySelector('.frequency-slider');
    const guessedFreq = Math.pow(10, parseFloat(slider.value));
    const actualFreq = gameState.frequency.currentFrequency;
    
    // Logaritmik ölçekte hata hesapla
    const error = Math.abs(Math.log10(guessedFreq) - Math.log10(actualFreq));
    const maxError = Math.log10(20000) - Math.log10(20); // Toplam frekans aralığı
    const percentage = Math.max(0, 100 - (error / maxError * 100));
    
    // Cevap çizgisini göster
    const answer = document.querySelector('.frequency-answer');
    answer.style.display = 'block';
    const position = (Math.log10(actualFreq) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * 100;
    answer.style.left = `${position}%`;
    
    // Feedback metnini güncelle
    const feedback = document.getElementById('frequency-feedback');
    feedback.textContent = `Boost edilen frekans: ${Math.round(actualFreq)} Hz (+12 dB)`;
    
    updateGameStatus('frequency', percentage);
    
    // Butonları güncelle
    document.getElementById('freq-play-btn').disabled = true;
    document.getElementById('freq-guess-btn').disabled = true;
    document.getElementById('freq-next-btn').style.display = 'inline-block';
}

// Pan tahminini kontrol et
function checkPanGuess() {
    if (gameState.pan.attempts <= 0 || gameState.pan.currentPan === null) return;
    
    const slider = document.querySelector('.pan-slider');
    const pan = parseFloat(slider.value);
    const actualPan = gameState.pan.currentPan;
    const error = Math.abs(pan - actualPan);
    const percentage = Math.max(0, 100 - (error * 50));
    
    // Cevap çizgisini göster
    const answer = document.querySelector('.pan-answer');
    answer.style.display = 'block';
    answer.style.left = `${((actualPan + 1) / 2) * 100}%`;
    
    updateGameStatus('pan', percentage);
    
    // Butonları güncelle
    document.getElementById('pan-play-btn').disabled = true;
    document.getElementById('pan-guess-btn').disabled = true;
    document.getElementById('pan-next-btn').style.display = 'inline-block';
}

// Oyun durumunu güncelle
function updateGameStatus(gameType, percentage) {
    const scoreElement = document.getElementById(`${gameType}-score`);
    const accuracyElement = document.getElementById(`${gameType}-accuracy`);
    const nextButton = document.getElementById(`${gameType}-next-btn`);
    const guessButton = document.getElementById(`${gameType}-guess-btn`);
    const playButton = document.getElementById(`${gameType}-play-btn`);
    
    gameState[gameType].attempts--;
    gameState[gameType].totalAccuracy += percentage;
    
    const score = Math.floor(gameState[gameType].totalAccuracy / (10 - gameState[gameType].attempts));
    scoreElement.textContent = 10 - gameState[gameType].attempts;
    accuracyElement.textContent = score.toFixed(1);
    
    // XP hesapla
    let xpEarned = 0;
    if (percentage >= 90) {
        xpEarned = Math.floor(80 + Math.random() * 21); // 80-100 XP
    } else if (percentage >= 75) {
        xpEarned = Math.floor(40 + Math.random() * 11); // 40-50 XP
    } else if (percentage >= 50) {
        xpEarned = Math.floor(20 + Math.random() * 6); // 20-25 XP
    } else {
        xpEarned = Math.floor(8 + Math.random() * 3); // 8-10 XP
    }
    
    // Her tahminden sonra XP kazandır
    if (typeof saveGameResult === 'function') {
        saveGameResult(gameType, score, percentage, xpEarned);
    }
    
    // Butonları güncelle
    if (guessButton) guessButton.style.display = 'none';
    if (nextButton) nextButton.style.display = 'block';
    if (playButton) playButton.style.display = 'none';
    
    // Oyun bitti mi kontrol et
    if (gameState[gameType].attempts <= 0) {
        setTimeout(() => {
            alert(`Oyun bitti!\nPuanınız: ${score.toFixed(1)}\nDoğruluk: %${(gameState[gameType].totalAccuracy / 10).toFixed(1)}`);
            resetGameState();
            
            // Butonları sıfırla
            if (nextButton) nextButton.style.display = 'none';
            if (guessButton) guessButton.style.display = 'none';
            if (playButton) playButton.style.display = 'block';
        }, 1000);
    }
}

// Sonraki oyun - Frekans
function nextFrequencyGame() {
    playFrequencyGame();
    const nextButton = document.getElementById('freq-next-btn');
    const guessButton = document.getElementById('freq-guess-btn');
    if (nextButton) nextButton.style.display = 'none';
    if (guessButton) guessButton.style.display = 'block';
}

// Sonraki oyun - Ses Şiddeti
function nextVolumeGame() {
    playVolumeGame();
    const nextButton = document.getElementById('vol-next-btn');
    document.getElementById('vol-next-btn').style.display = 'none';
}

// Sonraki oyun - Pan
function nextPanGame() {
    playPanGame();
    const nextButton = document.getElementById('pan-next-btn');
    const guessButton = document.getElementById('pan-guess-btn');
    if (nextButton) nextButton.style.display = 'none';
    if (guessButton) guessButton.style.display = 'block';
}

// Oyunu başlat/devam et
function startGame(gameType) {
    const playButton = document.getElementById(`${gameType}-play-btn`);
    const guessButton = document.getElementById(`${gameType}-guess-btn`);
    const nextButton = document.getElementById(`${gameType}-next-btn`);
    
    if (playButton) playButton.style.display = 'none';
    if (guessButton) guessButton.style.display = 'block';
    if (nextButton) nextButton.style.display = 'none';
    
    // Ses çal
    switch(gameType) {
        case 'frequency':
            playFrequencyGame();
            break;
        case 'volume':
            playVolumeGame();
            break;
        case 'pan':
            playPanGame();
            break;
    }
}

// Çıkış yap
function logout() {
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Kullanıcı giriş yapmış mı kontrol et
    const userData = localStorage.getItem('userData');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    // Kullanıcı bilgilerini göster
    const user = JSON.parse(userData);
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-level').textContent = `Seviye ${user.level}`;
    
    // Audio context'i başlat
    initAudioContext();
    
    resetGameState();
    showSection('home');
    
    // Frekans slider olaylarını ayarla
    const freqSlider = document.querySelector('.frequency-slider');
    const freqMarker = document.querySelector('.frequency-marker');
    
    freqSlider.addEventListener('input', (e) => {
        const freq = Math.pow(10, e.target.value);
        freqMarker.style.left = `${((e.target.value - 1.301) / (4.301 - 1.301)) * 100}%`;
        gameState.frequency.currentGuess = freq;
    });
    
    // Pan slider olaylarını ayarla
    const panSlider = document.querySelector('.pan-slider');
    const panMarker = document.querySelector('.pan-marker');
    
    panSlider.addEventListener('input', (e) => {
        const pan = parseFloat(e.target.value);
        panMarker.style.left = `${((pan + 1) / 2) * 100}%`;
        gameState.pan.currentGuess = pan;
    });
    
    // Sayfa görünürlüğünü izle
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopCurrentSound();
        }
    });
});
