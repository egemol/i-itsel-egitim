let audioContext;
let currentSound = null;
let currentEQ = null;
let score = 0;
let round = 0;
const MAX_ROUNDS = 10;
let isPlaying = false;
let source;
let audioBuffer;

// Ses dosyaları
const songs = [
    { name: 'Flow', file: './audio/flow-211881.aif' },
    { name: 'Movement', file: './audio/movement-200697.aif' },
    { name: 'Perfect Beauty', file: './audio/perfect-beauty-191271.aif' },
    { name: 'Jazz Club', file: './audio/the-best-jazz-club-in-new-orleans-164472.aif' }
];

// Ses yükleme
async function loadSound(url) {
    try {
        console.log('Ses dosyası yükleniyor:', url);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        console.log('ArrayBuffer alındı, decode ediliyor...');
        return await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error('Ses yüklenirken hata:', error);
        alert('Ses dosyası yüklenemedi: ' + error.message);
        return null;
    }
}

// Önceki sesi durdur
function stopCurrentSound() {
    if (currentSound) {
        try {
            currentSound.stop();
            currentSound.disconnect();
        } catch (error) {
            console.error('Ses durdurulurken hata:', error);
        }
        currentSound = null;
    }
}

// Slider değerini frekansa çevir (logaritmik)
function sliderToFreq(value) {
    // 20 Hz ile 16000 Hz arasında logaritmik ölçek
    return Math.round(Math.pow(10, (Math.log10(16000) - Math.log10(20)) * value / 100 + Math.log10(20)));
}

// Frekansı slider değerine çevir
function freqToSlider(freq) {
    // Frekansı 0-100 arasına çevir
    return Math.round((Math.log10(freq) - Math.log10(20)) / (Math.log10(16000) - Math.log10(20)) * 100);
}

// EQ filtresi oluştur
function createEQFilter(frequency) {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = frequency;
    filter.Q.value = 8.0;  // Daha da keskin Q değeri
    filter.gain.value = 25.0;  // Çok daha yüksek gain değeri
    return filter;
}

// Ses çal
async function playSound(useEQ = false) {
    if (isPlaying) {
        stopCurrentSound();
        return;
    }

    try {
        if (!audioContext) {
            initAudioContext();
        }

        source = audioContext.createBufferSource();
        source.buffer = audioBuffer;

        if (useEQ) {
            // EQ filtresi ekle
            const correctFreq = parseFloat(document.getElementById('freq-slider').dataset.correctFreq);
            const filter = createEQFilter(correctFreq);
            source.connect(filter);
            filter.connect(audioContext.destination);
        } else {
            // Orijinal sesi çal
            source.connect(audioContext.destination);
        }

        source.start(0);
        isPlaying = true;

        // Play butonunu güncelle
        const playButton = document.getElementById(useEQ ? 'play-eq' : 'play-original');
        playButton.textContent = useEQ ? 'EQ Durdur' : 'Orijinal Durdur';
        playButton.classList.add('playing');

    } catch (error) {
        console.error('Ses çalınırken hata:', error);
        alert('Ses çalınamadı!');
    }
}

// Çalan sesi durdur
function stopCurrentSound() {
    if (source && isPlaying) {
        source.stop();
        isPlaying = false;
        
        // Play butonlarını güncelle
        const buttons = ['play-original', 'play-eq'];
        buttons.forEach(id => {
            const button = document.getElementById(id);
            if (button) {
                button.textContent = id === 'play-original' ? 'Orijinal Çal' : 'EQ Çal';
                button.classList.remove('playing');
            }
        });
    }
}

// Yeni round başlat
async function startNewRound() {
    try {
        if (round >= 10) {
            endGame();
            return;
        }

        round++;
        
        // Rastgele frekans seç (20 Hz - 16000 Hz arası)
        const minFreq = 20;
        const maxFreq = 16000;
        const randomFreq = Math.round(Math.exp(Math.random() * (Math.log(maxFreq) - Math.log(minFreq)) + Math.log(minFreq)));
        
        // Doğru frekansı sakla
        document.getElementById('freq-slider').dataset.correctFreq = randomFreq;

        // Yeni ses dosyası yükle
        await loadAudio();
        
        // UI'ı sıfırla
        const slider = document.getElementById('freq-slider');
        slider.value = 50;
        slider.disabled = false;
        slider.style.background = `linear-gradient(to right, 
            rgba(33, 150, 243, 0.5) 0%, 
            rgba(33, 150, 243, 0.5) 50%, 
            rgba(255, 255, 255, 0.1) 50%, 
            rgba(255, 255, 255, 0.1) 100%)`;

        // Varsa eski göstergeyi kaldır
        const oldIndicator = document.querySelector('.correct-freq-indicator');
        if (oldIndicator) oldIndicator.remove();

        document.getElementById('result').innerHTML = '';
        document.getElementById('check-answer').style.display = 'block';
        document.getElementById('continue').style.display = 'none';
        
        // Event listener'ları ekle
        document.getElementById('play-original').onclick = () => playSound(false);
        document.getElementById('play-eq').onclick = () => playSound(true);
        
        updateUI();

    } catch (error) {
        console.error('Yeni round başlatılırken hata:', error);
        alert('Yeni round başlatılamadı: ' + error.message);
    }
}

// UI güncelleme
function updateUI() {
    document.getElementById('current-score').textContent = score;
    document.getElementById('round').textContent = `${round}/${MAX_ROUNDS}`;
}

// Cevap kontrolü
function checkAnswer() {
    try {
        // Çalan sesi durdur
        stopCurrentSound();

        const slider = document.getElementById('freq-slider');
        const selectedFreq = sliderToFreq(slider.value);
        const correctFreq = parseFloat(slider.dataset.correctFreq);

        // Fark yüzdesini hesapla
        const percentDiff = Math.abs(selectedFreq - correctFreq) / correctFreq;
        
        // Puan hesapla (0-100 arası)
        let points = Math.max(0, Math.round(100 * (1 - percentDiff)));
        if (percentDiff > 1) points = 0;

        score += points;

        // Sonucu göster
        const resultText = `
            Seçtiğiniz: ${selectedFreq} Hz
            Doğru Cevap: ${correctFreq} Hz
            Kazanılan Puan: ${points}
        `;

        document.getElementById('result').innerHTML = resultText.split('\n').join('<br>');
        document.getElementById('result').style.color = points > 50 ? '#4CAF50' : '#f44336';

        // Slider'ı doğru cevaba getir ve yeşil yap
        const correctValue = freqToSlider(correctFreq);
        slider.value = correctValue;

        // Doğru cevabı gösteren yeşil çubuk ekle
        const sliderWidth = slider.offsetWidth;
        const correctPosition = (correctValue / 100) * sliderWidth;
        
        // Varsa eski göstergeyi kaldır
        const oldIndicator = document.querySelector('.correct-freq-indicator');
        if (oldIndicator) oldIndicator.remove();
        
        // Yeni gösterge ekle
        const indicator = document.createElement('div');
        indicator.className = 'correct-freq-indicator';
        indicator.style.cssText = `
            position: absolute;
            left: ${correctPosition}px;
            top: -10px;
            width: 4px;
            height: 28px;
            background-color: #4CAF50;
            border-radius: 2px;
            box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
        `;
        
        slider.parentElement.style.position = 'relative';
        slider.parentElement.appendChild(indicator);

        // Butonları güncelle
        document.getElementById('check-answer').style.display = 'none';
        document.getElementById('continue').style.display = 'block';
        document.getElementById('freq-slider').disabled = true;

        updateUI();

    } catch (error) {
        console.error('Cevap kontrolünde hata:', error);
        alert('Cevap kontrol edilemedi: ' + error.message);
    }
}

// Ses dosyaları
const audioFiles = [
    '../audio/flow-211881.aif',
    '../audio/movement-200697.aif',
    '../audio/perfect-beauty-191271.aif',
    '../audio/the-best-jazz-club-in-new-orleans-164472.aif'
];

// Audio context'i başlat
function initAudioContext() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        alert('Web Audio API desteklenmiyor!');
        console.error(e);
    }
}

// Ses dosyasını yükle
async function loadAudio() {
    try {
        const randomFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
        console.log('Yüklenen ses dosyası:', randomFile);
        const response = await fetch(randomFile);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error('Ses yüklenirken hata:', error);
        console.error('Hata detayı:', error.message);
        alert('Ses dosyası yüklenemedi! Lütfen sayfayı yenileyin.');
    }
}

// Slider olayları
document.getElementById('freq-slider')?.addEventListener('input', (e) => {
    const freq = sliderToFreq(e.target.value);
    document.getElementById('freq-value').textContent = `Frekans: ${freq} Hz`;
    
    // Slider rengini güncelle
    e.target.style.background = `linear-gradient(to right, 
        rgba(33, 150, 243, 0.5) 0%, 
        rgba(33, 150, 243, 0.5) ${e.target.value}%, 
        rgba(255, 255, 255, 0.1) ${e.target.value}%, 
        rgba(255, 255, 255, 0.1) 100%)`;
});

// Oyun sonu
function endGame() {
    try {
        const finalScore = score;
        alert(`Oyun bitti! Final skorunuz: ${finalScore}`);
        
        // XP ekle (skor/10 kadar)
        addXP(Math.round(finalScore / 10));
        
        // Ana sayfaya yönlendir
        window.location.href = '../dashboard.html';

    } catch (error) {
        console.error('Oyun bitirme hatası:', error);
        alert('Oyun bitirilemedi: ' + error.message);
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    try {
        // AudioContext'i oluştur
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('AudioContext durumu:', audioContext.state);

        // Continue butonuna event listener ekle
        document.getElementById('continue').addEventListener('click', startNewRound);
        
        // Kontrol et butonuna event listener ekle
        document.getElementById('check-answer').addEventListener('click', checkAnswer);

        // İlk round'u başlat
        startNewRound();

    } catch (error) {
        console.error('Sayfa yüklenirken hata:', error);
        alert('Sayfa yüklenemedi: ' + error.message);
    }
});
