// XP ve seviye sistemi
class XPSystem {
    constructor() {
        this.initializeFirebase();
    }

    // Firebase ve Auth durumunu kontrol et
    initializeFirebase() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // Kullanıcı giriş yapmışsa Firebase'den verileri yükle
                this.loadUserDataFromFirebase(user.uid);
            } else {
                // Misafir kullanıcı için geçici veriler
                this.xp = 0;
                this.level = 1;
                this.updateDisplay();
            }
        });
    }

    // Kullanıcı verilerini Firebase'den yükle
    async loadUserDataFromFirebase(userId) {
        try {
            const doc = await firebase.firestore().collection('users').doc(userId).get();
            if (doc.exists) {
                const data = doc.data();
                this.xp = data.xp || 0;
                this.level = data.level || 1;
            } else {
                // Yeni kullanıcı için başlangıç verileri
                this.xp = 0;
                this.level = 1;
                this.saveUserDataToFirebase(userId);
            }
            this.updateDisplay();
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    }

    // Kullanıcı verilerini Firebase'e kaydet
    async saveUserDataToFirebase(userId) {
        try {
            await firebase.firestore().collection('users').doc(userId).set({
                xp: this.xp,
                level: this.level,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error saving user data:", error);
        }
    }

    // XP ekle ve seviye kontrolü yap
    async addXP(amount) {
        this.xp += amount;
        
        // Seviye hesaplama (her seviye için 1000 XP gerekiyor)
        const newLevel = Math.floor(this.xp / 1000) + 1;
        
        // Seviye atladıysa bildirim göster
        if (newLevel > this.level) {
            this.showLevelUpNotification(newLevel);
        }
        
        this.level = newLevel;

        // Giriş yapmış kullanıcı için Firebase'e kaydet
        const user = firebase.auth().currentUser;
        if (user) {
            await this.saveUserDataToFirebase(user.uid);
        }

        this.updateDisplay();
    }

    // XP ve seviye göstergesini güncelle
    updateDisplay() {
        const xpDisplay = document.getElementById('user-xp');
        const levelDisplay = document.getElementById('user-level');
        const xpProgressBar = document.getElementById('xp-progress');
        
        if (xpDisplay && levelDisplay && xpProgressBar) {
            xpDisplay.textContent = this.xp;
            levelDisplay.textContent = this.level;
            
            // Progress bar güncelleme
            const xpInCurrentLevel = this.xp % 1000;
            const progress = (xpInCurrentLevel / 1000) * 100;
            xpProgressBar.style.width = `${progress}%`;
            xpProgressBar.setAttribute('aria-valuenow', progress);
        }
    }

    // Seviye atlama bildirimi göster
    showLevelUpNotification(newLevel) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-content">
                <h3>Seviye Atladın!</h3>
                <p>Yeni Seviye: ${newLevel}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animasyon için setTimeout
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 3 saniye sonra bildirimi kaldır
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Global XP sistemi örneği oluştur
const xpSystem = new XPSystem();

// Global addXP fonksiyonu (oyunlardan çağrılabilir)
function addXP(amount) {
    xpSystem.addXP(amount);
}
