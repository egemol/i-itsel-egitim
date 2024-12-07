// Modal yönetimi
let loginModal, registerModal, forgotPasswordModal;

document.addEventListener('DOMContentLoaded', () => {
    // Firebase'in yüklendiğinden emin ol
    if (typeof firebase === 'undefined') {
        console.error('Firebase yüklenemedi!');
        return;
    }

    // Modal nesnelerini oluştur
    loginModal = new bootstrap.Modal(document.getElementById('loginModal'), {
        backdrop: 'static',
        keyboard: false
    });
    
    registerModal = new bootstrap.Modal(document.getElementById('registerModal'), {
        backdrop: 'static',
        keyboard: false
    });
    
    forgotPasswordModal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'), {
        backdrop: 'static',
        keyboard: false
    });

    // Oturum durumunu dinle
    firebase.auth().onAuthStateChanged((user) => {
        updateUIForAuthState(user);
    });

    // Form dinleyicilerini ekle
    setupFormListeners();

    // Çıkış yap
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            firebase.auth().signOut().catch((error) => {
                console.error('Çıkış hatası:', error);
            });
        });
    }
});

// UI güncelleme fonksiyonu
function updateUIForAuthState(user) {
    // UI elementlerini seç
    const welcomeName = document.getElementById('welcome-name');
    const authLinks = document.getElementById('auth-links');
    const userLinks = document.getElementById('user-links');
    const xpDisplay = document.querySelector('.xp-display');
    const gameButtons = document.querySelectorAll('.game-card button');
    const guestNotices = document.querySelectorAll('.alert-warning');

    if (user) {
        // Kullanıcı giriş yapmış
        if (welcomeName) welcomeName.textContent = user.displayName || user.email;
        if (authLinks) authLinks.style.display = 'none';
        if (userLinks) userLinks.style.display = 'block';
        if (xpDisplay) xpDisplay.style.display = 'block';

        // Tüm misafir uyarılarını gizle
        guestNotices.forEach(notice => {
            if (notice && notice.classList.contains('alert-warning')) {
                notice.style.display = 'none';
            }
        });

        // Oyun butonlarını etkinleştir
        gameButtons.forEach(button => {
            if (button) button.disabled = false;
        });

    } else {
        // Misafir kullanıcı
        if (welcomeName) welcomeName.textContent = 'Misafir';
        if (authLinks) authLinks.style.display = 'block';
        if (userLinks) userLinks.style.display = 'none';
        if (xpDisplay) xpDisplay.style.display = 'none';

        // Tüm misafir uyarılarını göster
        guestNotices.forEach(notice => {
            if (notice && notice.classList.contains('alert-warning')) {
                notice.style.display = 'block';
            }
        });

        // Oyun butonlarını yine de etkinleştir
        gameButtons.forEach(button => {
            if (button) button.disabled = false;
        });
    }
}

// Form dinleyicilerini ayarla
function setupFormListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                await firebase.auth().signInWithEmailAndPassword(email, password);
                hideLoginModal();
                // Sayfayı yenileme veya yönlendirme yapmıyoruz
                // window.location.href = 'games.html';
            } catch (error) {
                console.error('Giriş hatası:', error);
                alert('Giriş yapılamadı: ' + error.message);
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const nickname = document.getElementById('registerNickname').value;
            
            try {
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                await userCredential.user.updateProfile({
                    displayName: nickname
                });
                hideRegisterModal();
                // Sayfayı yenileme veya yönlendirme yapmıyoruz
                // window.location.href = 'games.html';
            } catch (error) {
                console.error('Kayıt hatası:', error);
                alert('Kayıt olunamadı: ' + error.message);
            }
        });
    }

    // Forgot password form
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('resetEmail').value;
            
            // Kullanıcının e-posta adresini kullanarak şifre sıfırlama e-postası gönderir
            firebase.auth().sendPasswordResetEmail(email)
                .then(() => {
                    // Şifre sıfırlama e-postası başarıyla gönderildi
                    console.log("Şifre sıfırlama e-postası gönderildi.");
                    hideForgotPasswordModal();
                    alert('Şifre sıfırlama linki e-posta adresinize gönderildi.\nLütfen spam klasörünü de kontrol edin.');
                })
                .catch((error) => {
                    // Hata oluştu
                    console.error("Hata:", error);
                    alert('Hata: ' + error.message);
                });
        });
    }
}

// Modal gösterme/gizleme fonksiyonları
function showLoginModal() {
    loginModal.show();
}

function hideLoginModal() {
    loginModal.hide();
    document.body.classList.remove('modal-open');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
}

function showRegisterModal() {
    registerModal.show();
}

function hideRegisterModal() {
    registerModal.hide();
    document.body.classList.remove('modal-open');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
}

function showForgotPasswordModal() {
    hideLoginModal();
    setTimeout(() => {
        forgotPasswordModal.show();
    }, 300);
}

function hideForgotPasswordModal() {
    forgotPasswordModal.hide();
    document.body.classList.remove('modal-open');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
}

// Çıkış yap
function logout() {
    firebase.auth().signOut().then(() => {
        // Sayfayı yenileme yerine sadece state'i güncelliyoruz
        // window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Çıkış hatası:', error);
        alert('Çıkış yapılamadı: ' + error.message);
    });
}
