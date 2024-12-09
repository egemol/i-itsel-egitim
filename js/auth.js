// Firebase Auth state değişikliklerini dinle
firebase.auth().onAuthStateChanged((user) => {
    updateUIForUser(user);
});

// UI'ı kullanıcı durumuna göre güncelle
function updateUIForUser(user) {
    const authRequired = document.querySelectorAll('.auth-required');
    const noAuthRequired = document.querySelectorAll('.no-auth-required');
    const guestNotice = document.getElementById('guest-notice');

    if (user) {
        // Kullanıcı giriş yapmışsa
        authRequired.forEach(element => element.style.display = 'block');
        noAuthRequired.forEach(element => element.style.display = 'none');
        if (guestNotice) guestNotice.style.display = 'none';
    } else {
        // Kullanıcı giriş yapmamışsa
        authRequired.forEach(element => element.style.display = 'none');
        noAuthRequired.forEach(element => element.style.display = 'block');
        if (guestNotice) guestNotice.style.display = 'block';
    }
}

// Eğitime başla butonu kontrolü
document.addEventListener('DOMContentLoaded', () => {
    const startTrainingBtn = document.getElementById('startTrainingBtn');
    if (startTrainingBtn) {
        startTrainingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'games.html';
        });
    }
});

// Login form submit
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            firebase.auth().signInWithEmailAndPassword(email, password)
                .then(() => {
                    // Başarılı giriş
                    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    modal.hide();
                    window.location.href = 'games.html';
                })
                .catch((error) => {
                    alert('Giriş başarısız: ' + error.message);
                });
        });
    }
});

// Register form submit
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const nickname = document.getElementById('registerNickname').value;

            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Kullanıcı adını güncelle
                    return userCredential.user.updateProfile({
                        displayName: nickname
                    });
                })
                .then(() => {
                    // Başarılı kayıt
                    const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                    modal.hide();
                    window.location.href = 'games.html';
                })
                .catch((error) => {
                    alert('Kayıt başarısız: ' + error.message);
                });
        });
    }
});

// Çıkış yap
function logoutUser() {
    firebase.auth().signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            alert('Çıkış başarısız: ' + error.message);
        });
}
