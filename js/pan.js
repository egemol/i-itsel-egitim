let audioContext;
let audioBuffer;
let source;
let score = 0;
let round = 1;
let currentPan = 0;
let isPlaying = false;

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

// Rastgele pan değeri oluştur
function generateRandomPan() {
    // -1 (tam sol) ile 1 (tam sağ) arasında
    return Math.random() * 2 - 1;
}

// Pan değerini çal
function playSound() {
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

        const panNode = audioContext.createStereoPanner();
        panNode.pan.value = currentPan;

        source.connect(panNode);
        panNode.connect(audioContext.destination);

        source.start(0);
        isPlaying = true;
        
        // Play butonunu güncelle
        const playButton = document.getElementById('play-sound');
        playButton.textContent = 'Sesi Durdur';
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
        
        // Play butonunu güncelle
        const playButton = document.getElementById('play-sound');
        playButton.textContent = 'Sesi Çal';
        playButton.classList.remove('playing');
    }
}

// Slider değerini pan değerine çevir
function sliderToPan(value) {
    // 0-100 aralığını -1 ile 1 aralığına çevir
    return (value - 50) / 50;
}

// Pan değerini slider değerine çevir
function panToSlider(pan) {
    // -1 ile 1 aralığını 0-100 aralığına çevir
    return (pan + 1) * 50;
}

// Cevabı kontrol et
function checkAnswer() {
    try {
        // Çalan sesi durdur
        stopCurrentSound();

        const slider = document.getElementById('pan-slider');
        const selectedPan = sliderToPan(slider.value);
        
        // Fark yüzdesini hesapla (pan değerleri -1 ile 1 arasında)
        const diff = Math.abs(selectedPan - currentPan);
        
        // Puan hesapla (0-100 arası)
        let points = Math.max(0, Math.round(100 * (1 - diff)));
        
        score += points;

        // Sonucu göster
        const resultText = `
            Seçtiğiniz: ${selectedPan.toFixed(2)}
            Doğru Cevap: ${currentPan.toFixed(2)}
            Kazanılan Puan: ${points}
        `;

        const result = document.getElementById('result');
        result.innerHTML = resultText.split('\n').join('<br>');
        result.style.color = points > 50 ? '#4CAF50' : '#f44336';

        // Slider'ı doğru cevaba getir
        const correctValue = panToSlider(currentPan);
        slider.value = correctValue;

        // Doğru cevabı gösteren yeşil çubuk ekle
        const sliderWidth = slider.offsetWidth;
        const correctPosition = (correctValue / 100) * sliderWidth;
        
        // Varsa eski göstergeyi kaldır
        const oldIndicator = document.querySelector('.correct-pan-indicator');
        if (oldIndicator) oldIndicator.remove();
        
        // Yeni gösterge ekle
        const indicator = document.createElement('div');
        indicator.className = 'correct-pan-indicator';
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
        document.getElementById('pan-slider').disabled = true;

        updateUI();

    } catch (error) {
        console.error('Cevap kontrolünde hata:', error);
        alert('Cevap kontrol edilemedi: ' + error.message);
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
        currentPan = generateRandomPan();
        
        // Yeni ses dosyası yükle
        await loadAudio();
        
        // UI'ı sıfırla
        const slider = document.getElementById('pan-slider');
        slider.value = 50;
        slider.disabled = false;
        slider.style.background = `linear-gradient(to right, 
            rgba(33, 150, 243, 0.5) 0%, 
            rgba(33, 150, 243, 0.5) 50%, 
            rgba(255, 255, 255, 0.1) 50%, 
            rgba(255, 255, 255, 0.1) 100%)`;

        document.getElementById('result').innerHTML = '';
        document.getElementById('check-answer').style.display = 'block';
        document.getElementById('continue').style.display = 'none';
        
        updateUI();

    } catch (error) {
        console.error('Yeni round başlatılırken hata:', error);
        alert('Yeni round başlatılamadı: ' + error.message);
    }
}

// Oyunu bitir
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

// UI'ı güncelle
function updateUI() {
    document.getElementById('current-score').textContent = score;
    document.getElementById('round').textContent = `${round}/10`;
}

// Slider olayları
document.getElementById('pan-slider')?.addEventListener('input', (e) => {
    const pan = sliderToPan(e.target.value);
    document.getElementById('pan-value').textContent = `Pan: ${pan.toFixed(2)}`;
    
    // Slider rengini güncelle
    e.target.style.background = `linear-gradient(to right, 
        rgba(33, 150, 243, 0.5) 0%, 
        rgba(33, 150, 243, 0.5) ${e.target.value}%, 
        rgba(255, 255, 255, 0.1) ${e.target.value}%, 
        rgba(255, 255, 255, 0.1) 100%)`;

    // Pan gösterimini güncelle
    const spans = document.querySelectorAll('.pan-visualization span');
    spans.forEach(span => span.classList.remove('active'));
    
    if (pan < -0.3) spans[0].classList.add('active');
    else if (pan > 0.3) spans[2].classList.add('active');
    else spans[1].classList.add('active');
});

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    try {
        initAudioContext();
        await loadAudio();
        
        // Event listener'ları ekle
        document.getElementById('play-sound').addEventListener('click', playSound);
        document.getElementById('check-answer').addEventListener('click', checkAnswer);
        document.getElementById('continue').addEventListener('click', startNewRound);
        
        // İlk round'u başlat
        startNewRound();
        updateUI();

    } catch (error) {
        console.error('Başlangıç hatası:', error);
        alert('Oyun başlatılamadı: ' + error.message);
    }
});
