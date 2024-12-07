// Firebase yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyBW2u7YAytD6kMLdrll-iJ81KvvLxxI0d4",
    authDomain: "isitsel-egitim.firebaseapp.com",
    projectId: "isitsel-egitim",
    storageBucket: "isitsel-egitim.firebasestorage.app",
    messagingSenderId: "467496581737",
    appId: "1:467496581737:web:627fac8574c2a7c89a80f8",
    measurementId: "G-HZ3TVZN3P7"
};

// Firebase'i başlat
if (typeof firebase !== 'undefined') {
    // Eğer Firebase zaten başlatılmışsa, tekrar başlatma
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        // Analytics'i başlat
        if (firebase.analytics) {
            firebase.analytics();
        }
    }
    // Auth nesnesini global yap
    window.auth = firebase.auth();
} else {
    console.error('Firebase yüklenemedi! Lütfen internet bağlantınızı kontrol edin.');
}
