// Başarımlar listesi
const achievements = [
    {
        id: 'beginner',
        name: 'Başlangıç',
        description: 'İlk oyunu tamamla',
        icon: 'fas fa-star',
        requirement: 'firstGame'
    },
    {
        id: 'level5',
        name: 'Çırak',
        description: '5. seviyeye ulaş',
        icon: 'fas fa-graduation-cap',
        requirement: 'level5'
    },
    {
        id: 'level10',
        name: 'Uzman',
        description: '10. seviyeye ulaş',
        icon: 'fas fa-award',
        requirement: 'level10'
    },
    {
        id: 'perfectScore',
        name: 'Mükemmel',
        description: 'Bir oyunda %100 başarı elde et',
        icon: 'fas fa-crown',
        requirement: 'perfectScore'
    }
];

// Profil sayfası yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Firebase Auth state değişikliklerini dinle
    firebase.auth().onAuthStateChanged(async (user) => {
        const profileSection = document.querySelector('.profile-section');
        const guestNotice = document.querySelector('.alert-warning');

        if (user) {
            // Kullanıcı giriş yapmış
            guestNotice.style.display = 'none';
            profileSection.style.display = 'block';
            
            // Kullanıcı bilgilerini yükle
            await loadUserProfile(user);
            // Başarımları yükle
            await loadAchievements(user);
            // Arkadaş listesini yükle
            await loadFriends(user);
            // Liderlik tablosunu yükle
            await loadLeaderboard();
        } else {
            // Misafir kullanıcı
            guestNotice.style.display = 'block';
            profileSection.style.display = 'none';
        }
    });

    // Arkadaş ekleme butonu için event listener
    const sendFriendRequestBtn = document.getElementById('send-friend-request');
    if (sendFriendRequestBtn) {
        sendFriendRequestBtn.addEventListener('click', sendFriendRequest);
    }
});

// Kullanıcı profilini yükle
async function loadUserProfile(user) {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        if (userData) {
            // Kullanıcı adını güncelle
            document.querySelector('.user-name').textContent = userData.email || user.email;
            
            // Level hesapla
            const level = calculateLevel(userData.xp || 0);
            
            // Seviye bilgilerini güncelle
            document.querySelector('.user-level').textContent = level;
            document.querySelector('.user-xp').textContent = userData.xp || 0;
            
            // XP progress bar'ı güncelle
            const nextLevelXP = calculateNextLevelXP(level);
            document.querySelector('.next-level-xp').textContent = nextLevelXP;
            const progress = ((userData.xp || 0) % nextLevelXP) / nextLevelXP * 100;
            document.querySelector('.progress-bar').style.width = `${progress}%`;

            // Firestore'da level'ı güncelle
            if (userData.level !== level) {
                await firebase.firestore().collection('users').doc(user.uid).update({
                    level: level
                });
            }
        }
    } catch (error) {
        console.error('Profil yüklenirken hata:', error);
    }
}

// Level hesaplama fonksiyonu
function calculateLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Sonraki seviye için gereken XP
function calculateNextLevelXP(currentLevel) {
    return (Math.pow(currentLevel, 2)) * 100;
}

// Başarımları yükle
async function loadAchievements(user) {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        const container = document.getElementById('achievements-container');
        container.innerHTML = '';

        achievements.forEach(achievement => {
            const achieved = checkAchievement(achievement, userData);
            const achievementElement = createAchievementElement(achievement, achieved);
            container.appendChild(achievementElement);
        });
    } catch (error) {
        console.error('Başarımlar yüklenirken hata:', error);
    }
}

// Başarım elementini oluştur
function createAchievementElement(achievement, achieved) {
    const div = document.createElement('div');
    div.className = `achievement ${achieved ? 'achieved' : 'locked'}`;
    div.innerHTML = `
        <i class="${achievement.icon} ${achieved ? 'text-success' : 'text-secondary'}"></i>
        <h5>${achievement.name}</h5>
        <p>${achievement.description}</p>
    `;
    return div;
}

// Başarım kontrolü
function checkAchievement(achievement, userData) {
    if (!userData) return false;

    switch (achievement.requirement) {
        case 'firstGame':
            return userData.gamesPlayed > 0;
        case 'level5':
            return calculateLevel(userData.xp) >= 5;
        case 'level10':
            return calculateLevel(userData.xp) >= 10;
        case 'perfectScore':
            return userData.perfectScores > 0;
        default:
            return false;
    }
}

// Arkadaş listesini yükle
async function loadFriends(user) {
    try {
        const friendsDoc = await firebase.firestore().collection('friends').doc(user.uid).get();
        const friendsData = friendsDoc.data();
        const container = document.getElementById('friends-container');
        container.innerHTML = '';

        if (friendsData && friendsData.friends) {
            for (const friendId of friendsData.friends) {
                const friendDoc = await firebase.firestore().collection('users').doc(friendId).get();
                const friendData = friendDoc.data();
                
                if (friendData) {
                    const friendElement = createFriendElement(friendData);
                    container.appendChild(friendElement);
                }
            }
        } else {
            container.innerHTML = '<p class="text-muted">Henüz arkadaşınız yok.</p>';
        }
    } catch (error) {
        console.error('Arkadaş listesi yüklenirken hata:', error);
    }
}

// Arkadaş elementi oluştur
function createFriendElement(friendData) {
    const div = document.createElement('div');
    div.className = 'friend-item d-flex align-items-center mb-2';
    div.innerHTML = `
        <i class="fas fa-user-circle me-2"></i>
        <div>
            <h6 class="mb-0">${friendData.email}</h6>
            <small class="text-muted">Seviye ${calculateLevel(friendData.xp || 0)}</small>
        </div>
    `;
    return div;
}

// Liderlik tablosunu yükle
async function loadLeaderboard() {
    try {
        const usersSnapshot = await firebase.firestore()
            .collection('users')
            .orderBy('xp', 'desc')
            .limit(3)
            .get();

        const container = document.getElementById('leaderboard-container');
        container.innerHTML = '';

        let rank = 1;
        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            const level = calculateLevel(userData.xp || 0);
            const leaderboardEntry = createLeaderboardEntry(userData, rank, level);
            container.appendChild(leaderboardEntry);
            rank++;
        }

        // Realtime güncellemeler için listener ekle
        const leaderboardListener = firebase.firestore()
            .collection('users')
            .orderBy('xp', 'desc')
            .limit(3)
            .onSnapshot((snapshot) => {
                container.innerHTML = '';
                let rank = 1;
                snapshot.forEach((doc) => {
                    const userData = doc.data();
                    const level = calculateLevel(userData.xp || 0);
                    const leaderboardEntry = createLeaderboardEntry(userData, rank, level);
                    container.appendChild(leaderboardEntry);
                    rank++;
                });
            });

        // Sayfadan ayrılınca listener'ı temizle
        window.addEventListener('unload', () => {
            if (leaderboardListener) {
                leaderboardListener();
            }
        });
    } catch (error) {
        console.error('Liderlik tablosu yüklenirken hata:', error);
    }
}

// Liderlik tablosu girişi oluştur
function createLeaderboardEntry(userData, rank, level) {
    const div = document.createElement('div');
    div.className = 'leaderboard-item d-flex align-items-center mb-2';
    
    // Sıralama rozetini belirle
    let rankIcon = 'fas fa-medal';
    let rankColor = '';
    switch(rank) {
        case 1:
            rankColor = 'text-warning'; // Altın
            break;
        case 2:
            rankColor = 'text-secondary'; // Gümüş
            break;
        case 3:
            rankColor = 'text-bronze'; // Bronz
            break;
        default:
            rankIcon = 'fas fa-hashtag';
            rankColor = 'text-muted';
    }

    div.innerHTML = `
        <div class="rank me-3 ${rankColor}">
            <i class="${rankIcon}"></i>
            <span>${rank}</span>
        </div>
        <i class="fas fa-user-circle me-2"></i>
        <div class="flex-grow-1">
            <h6 class="mb-0">${userData.email}</h6>
            <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">Seviye ${level}</small>
                <small class="text-muted">XP: ${userData.xp || 0}</small>
            </div>
        </div>
    `;
    return div;
}

// Arkadaşlık isteği gönder
async function sendFriendRequest() {
    const friendEmail = document.getElementById('friend-email').value;
    if (!friendEmail) return;

    try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) return;

        // Arkadaş adayını e-posta ile bul
        const usersSnapshot = await firebase.firestore()
            .collection('users')
            .where('email', '==', friendEmail)
            .get();

        if (usersSnapshot.empty) {
            alert('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.');
            return;
        }

        const friendId = usersSnapshot.docs[0].id;
        
        // Kendisini arkadaş olarak eklemeyi engelle
        if (friendId === currentUser.uid) {
            alert('Kendinizi arkadaş olarak ekleyemezsiniz.');
            return;
        }

        // Arkadaşlık isteği gönder
        await firebase.firestore().collection('friendRequests').add({
            from: currentUser.uid,
            to: friendId,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Arkadaşlık isteği gönderildi!');
        document.getElementById('friend-email').value = '';
        $('#addFriendModal').modal('hide');
    } catch (error) {
        console.error('Arkadaşlık isteği gönderilirken hata:', error);
        alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
}

// Function to update leaderboard
function updateLeaderboard() {
    const leaderboardContainer = document.getElementById('leaderboard-container');
    
    // Get top 3 users by XP
    firebase.firestore().collection('users')
        .orderBy('xp', 'desc')
        .limit(3)
        .get()
        .then((querySnapshot) => {
            const leaderboardEntries = leaderboardContainer.children;
            let index = 0;
            
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                if (index < leaderboardEntries.length) {
                    const entry = leaderboardEntries[index];
                    const playerName = entry.querySelector('.player-name');
                    const playerXP = entry.querySelector('.player-xp');
                    
                    playerName.textContent = userData.displayName || 'Anonymous';
                    playerXP.textContent = `XP: ${userData.xp || 0}`;
                }
                index++;
            });
        })
        .catch((error) => {
            console.error("Error getting leaderboard data: ", error);
        });
}
