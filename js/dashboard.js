// Kullanıcı seviye sistemi
const levelSystem = {
    // Her seviye için gereken XP miktarı: seviye => XP
    xpRequirements: {
        1: 0,
        2: 1000,
        3: 2500,
        4: 5000,
        5: 10000,
        6: 17500,
        7: 27500,
        8: 40000,
        9: 55000,
        10: 75000
    },

    // Oyun başına kazanılan XP
    gameXP: {
        frequency: {
            perfect: 100,  // %100 doğruluk
            good: 50,     // %75+ doğruluk
            average: 25,  // %50+ doğruluk
            poor: 10      // %50'den az
        },
        volume: {
            perfect: 80,
            good: 40,
            average: 20,
            poor: 8
        },
        pan: {
            perfect: 80,
            good: 40,
            average: 20,
            poor: 8
        }
    },

    // Başarımlar
    achievements: [
        {
            id: 'freq_master',
            name: 'Frekans Ustası',
            description: 'Frekans oyununda %90+ doğruluk oranı',
            icon: '🎵',
            xp: 500
        },
        {
            id: 'vol_master',
            name: 'Ses Şiddeti Ustası',
            description: 'Ses şiddeti oyununda %90+ doğruluk oranı',
            icon: '🔊',
            xp: 500
        },
        {
            id: 'pan_master',
            name: 'Pan Ustası',
            description: 'Pan pozisyonu oyununda %90+ doğruluk oranı',
            icon: '🎧',
            xp: 500
        },
        {
            id: 'game_addict',
            name: 'Oyun Bağımlısı',
            description: 'Toplam 100 oyun oyna',
            icon: '🎮',
            xp: 1000
        }
    ]
};

// Kullanıcı verilerini localStorage'dan al
let userData = JSON.parse(localStorage.getItem('userData')) || {
    name: 'Kullanıcı',
    xp: 0,
    level: 1,
    achievements: [],
    stats: {
        frequency: { highScore: 0, totalGames: 0, totalAccuracy: 0 },
        volume: { highScore: 0, totalGames: 0, totalAccuracy: 0 },
        pan: { highScore: 0, totalGames: 0, totalAccuracy: 0 }
    }
};

// Kullanıcı verilerini güncelle
function updateUserData() {
    localStorage.setItem('userData', JSON.stringify(userData));
}

// Seviye kontrolü
function checkLevel() {
    let currentLevel = userData.level;
    let nextLevel = currentLevel + 1;
    
    if (levelSystem.xpRequirements[nextLevel] && userData.xp >= levelSystem.xpRequirements[nextLevel]) {
        userData.level = nextLevel;
        updateUserData();
        alert(`Tebrikler! Seviye ${nextLevel}'e ulaştınız!`);
        return true;
    }
    return false;
}

// XP ve seviye göstergelerini güncelle
function updateLevelDisplay() {
    const currentLevel = userData.level;
    const nextLevel = currentLevel + 1;
    const currentXP = userData.xp;
    const nextLevelXP = levelSystem.xpRequirements[nextLevel] || levelSystem.xpRequirements[currentLevel];
    const prevLevelXP = levelSystem.xpRequirements[currentLevel];
    
    // Level progress
    const progress = ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;
    
    document.getElementById('current-level').textContent = currentLevel;
    document.getElementById('current-xp').textContent = currentXP;
    document.getElementById('next-level-xp').textContent = nextLevelXP;
    document.getElementById('level-progress').style.width = `${progress}%`;
    document.getElementById('user-level').textContent = `Seviye ${currentLevel}`;
}

// Başarımları göster
function displayAchievements() {
    const achievementList = document.getElementById('achievements');
    achievementList.innerHTML = '';

    levelSystem.achievements.forEach(achievement => {
        const isUnlocked = userData.achievements.includes(achievement.id);
        const achievementElement = document.createElement('div');
        achievementElement.className = `achievement ${isUnlocked ? 'unlocked' : 'locked'}`;
        achievementElement.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
            </div>
        `;
        achievementList.appendChild(achievementElement);
    });
}

// İstatistikleri göster
function displayStats() {
    const stats = userData.stats;
    
    // Frekans oyunu
    document.getElementById('freq-high-score').textContent = stats.frequency.highScore;
    document.getElementById('freq-total-games').textContent = stats.frequency.totalGames;
    document.getElementById('freq-accuracy').textContent = 
        `${(stats.frequency.totalGames > 0 
            ? (stats.frequency.totalAccuracy / stats.frequency.totalGames).toFixed(1) 
            : 0)}%`;
    
    // Ses şiddeti oyunu
    document.getElementById('vol-high-score').textContent = stats.volume.highScore;
    document.getElementById('vol-total-games').textContent = stats.volume.totalGames;
    document.getElementById('vol-accuracy').textContent = 
        `${(stats.volume.totalGames > 0 
            ? (stats.volume.totalAccuracy / stats.volume.totalGames).toFixed(1) 
            : 0)}%`;
    
    // Pan oyunu
    document.getElementById('pan-high-score').textContent = stats.pan.highScore;
    document.getElementById('pan-total-games').textContent = stats.pan.totalGames;
    document.getElementById('pan-accuracy').textContent = 
        `${(stats.pan.totalGames > 0 
            ? (stats.pan.totalAccuracy / stats.pan.totalGames).toFixed(1) 
            : 0)}%`;
}

// Oyun sonuçlarını kaydet
function saveGameResult(gameType, score, accuracy, xpEarned) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) return;

    // İstatistikleri güncelle
    if (!userData.stats) {
        userData.stats = {
            frequency: { highScore: 0, totalGames: 0, totalAccuracy: 0 },
            volume: { highScore: 0, totalGames: 0, totalAccuracy: 0 },
            pan: { highScore: 0, totalGames: 0, totalAccuracy: 0 }
        };
    }

    const stats = userData.stats[gameType];
    stats.highScore = Math.max(stats.highScore, score);
    stats.totalGames++;
    stats.totalAccuracy = ((stats.totalAccuracy * (stats.totalGames - 1)) + accuracy) / stats.totalGames;

    // XP ve seviye kontrolü
    if (!userData.xp) userData.xp = 0;
    if (!userData.level) userData.level = 1;

    userData.xp += xpEarned;

    // Seviye atlama kontrolü
    const nextLevelXP = calculateNextLevelXP(userData.level);
    if (userData.xp >= nextLevelXP) {
        userData.level++;
        // Seviye atlamayı bildir
        alert(`Tebrikler! Seviye ${userData.level}'e yükseldiniz!`);
        // Kullanıcı arayüzünü güncelle
        if (document.getElementById('user-level')) {
            document.getElementById('user-level').textContent = `Seviye ${userData.level}`;
        }
    }

    // Başarımları kontrol et
    checkAchievements(userData, gameType, accuracy);

    // Değişiklikleri kaydet
    localStorage.setItem('userData', JSON.stringify(userData));
}

// Başarımları kontrol et
function checkAchievements(userData, gameType, accuracy) {
    if (!userData.achievements) userData.achievements = [];

    const stats = userData.stats[gameType];
    const achievements = {
        frequency: {
            name: 'Frekans Ustası',
            condition: () => accuracy >= 90,
            xp: 500
        },
        volume: {
            name: 'Ses Şiddeti Ustası',
            condition: () => accuracy >= 90,
            xp: 500
        },
        pan: {
            name: 'Pan Ustası',
            condition: () => accuracy >= 90,
            xp: 500
        }
    };

    // Oyun sayısı başarımı
    if (stats.totalGames >= 100 && !userData.achievements.includes('Oyun Bağımlısı')) {
        userData.achievements.push('Oyun Bağımlısı');
        userData.xp += 1000;
        alert('Başarım Kazanıldı: Oyun Bağımlısı (+1000 XP)');
    }

    // Oyun türüne özel başarım
    const achievement = achievements[gameType];
    if (achievement && achievement.condition() && !userData.achievements.includes(achievement.name)) {
        userData.achievements.push(achievement.name);
        userData.xp += achievement.xp;
        alert(`Başarım Kazanıldı: ${achievement.name} (+${achievement.xp} XP)`);
    }
}

// Sonraki seviye için gereken XP'yi hesapla
function calculateNextLevelXP(level) {
    const baseXP = 1000;
    const multiplier = 2.5;
    return Math.floor(baseXP * Math.pow(multiplier, level - 1));
}

// Çıkış yap
function logout() {
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    const userData = localStorage.getItem('userData');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }

    const user = JSON.parse(userData);
    updateDashboard(user);
    showLeaderboard('xp');
    showFriendsLeaderboard('xp');
});

// Dashboard'u güncelle
function updateDashboard(user) {
    // Kullanıcı bilgilerini güncelle
    document.getElementById('welcome-name').textContent = user.nickname || user.name;
    document.getElementById('user-name').textContent = user.nickname || user.name;
    document.getElementById('user-level').textContent = `Seviye ${user.level}`;
    document.getElementById('user-level-display').textContent = `Seviye ${user.level}`;

    // XP barını güncelle
    updateXPBar(user);

    // Oyun istatistiklerini güncelle
    document.getElementById('freq-high-score').textContent = user.stats.frequency.highScore || 0;
    document.getElementById('freq-games-played').textContent = user.stats.frequency.gamesPlayed || 0;
    
    document.getElementById('vol-high-score').textContent = user.stats.volume.highScore || 0;
    document.getElementById('vol-games-played').textContent = user.stats.volume.gamesPlayed || 0;
    
    document.getElementById('pan-high-score').textContent = user.stats.pan.highScore || 0;
    document.getElementById('pan-games-played').textContent = user.stats.pan.gamesPlayed || 0;

    // Arkadaş listesini güncelle
    showFriends();
}

// Arkadaş listesini göster
function showFriends() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const friends = userData.friends || [];
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const friendsList = document.getElementById('friends-list');

    friendsList.innerHTML = '';

    if (friends.length === 0) {
        friendsList.innerHTML = '<p>Henüz arkadaşın yok.</p>';
        return;
    }

    friends.forEach(friendEmail => {
        const friend = users[friendEmail];
        if (friend) {
            const div = document.createElement('div');
            div.className = 'friend-item';
            div.innerHTML = `
                <div class="friend-info">
                    <span>${friend.nickname || friend.name}</span>
                    <span>Seviye ${friend.level}</span>
                </div>
                <button onclick="removeFriend('${friendEmail}')" class="remove-friend">Çıkar</button>
            `;
            friendsList.appendChild(div);
        }
    });
}

// Arkadaş ekle
function addFriend() {
    const friendEmail = document.getElementById('friend-email').value;
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const currentUser = JSON.parse(localStorage.getItem('userData'));

    if (!users[friendEmail]) {
        alert('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.');
        return;
    }

    if (friendEmail === currentUser.email) {
        alert('Kendinizi arkadaş olarak ekleyemezsiniz.');
        return;
    }

    if (!currentUser.friends) {
        currentUser.friends = [];
    }

    if (currentUser.friends.includes(friendEmail)) {
        alert('Bu kullanıcı zaten arkadaş listenizde.');
        return;
    }

    // Arkadaş listesine ekle
    currentUser.friends.push(friendEmail);
    localStorage.setItem('userData', JSON.stringify(currentUser));

    // Users veritabanını güncelle
    users[currentUser.email].friends = currentUser.friends;
    localStorage.setItem('users', JSON.stringify(users));

    // Arkadaş listesini yenile
    showFriends();
    showFriendsLeaderboard('xp');
    
    // Input'u temizle
    document.getElementById('friend-email').value = '';
}

// Arkadaş çıkar
function removeFriend(friendEmail) {
    const currentUser = JSON.parse(localStorage.getItem('userData'));
    const users = JSON.parse(localStorage.getItem('users') || '{}');

    // Arkadaş listesinden çıkar
    currentUser.friends = currentUser.friends.filter(email => email !== friendEmail);
    localStorage.setItem('userData', JSON.stringify(currentUser));

    // Users veritabanını güncelle
    users[currentUser.email].friends = currentUser.friends;
    localStorage.setItem('users', JSON.stringify(users));

    // Arkadaş listesini yenile
    showFriends();
    showFriendsLeaderboard('xp');
}

// Global liderlik tablosunu göster
function showLeaderboard(type) {
    // Tab'ları güncelle
    document.querySelectorAll('.leaderboard .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.leaderboard .tab[onclick*='showLeaderboard("${type}")']`).classList.add('active');

    const users = Object.values(JSON.parse(localStorage.getItem('users') || '{}'));
    const tbody = document.getElementById('leaderboard-body');
    
    // Sıralama kriterine göre kullanıcıları sırala
    users.sort((a, b) => {
        switch(type) {
            case 'xp':
                return b.xp - a.xp;
            case 'frequency':
                return (b.stats?.frequency?.highScore || 0) - (a.stats?.frequency?.highScore || 0);
            case 'volume':
                return (b.stats?.volume?.highScore || 0) - (a.stats?.volume?.highScore || 0);
            case 'pan':
                return (b.stats?.pan?.highScore || 0) - (a.stats?.pan?.highScore || 0);
            default:
                return b.xp - a.xp;
        }
    });

    // Tabloyu güncelle
    tbody.innerHTML = '';
    const currentUser = JSON.parse(localStorage.getItem('userData'));

    users.forEach((user, index) => {
        const row = document.createElement('tr');
        if (user.email === currentUser.email) {
            row.classList.add('current-user');
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${user.nickname || user.name}${user.email === currentUser.email ? ' (Sen)' : ''}</td>
            <td>${user.level}</td>
            <td>${type === 'xp' ? user.xp : user.stats[type].highScore || 0}</td>
        `;
        tbody.appendChild(row);
    });
}

// Arkadaş liderlik tablosunu göster
function showFriendsLeaderboard(type) {
    // Tab'ları güncelle
    document.querySelectorAll('.friends-leaderboard .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.friends-leaderboard .tab[onclick*='showFriendsLeaderboard("${type}")']`).classList.add('active');

    const currentUser = JSON.parse(localStorage.getItem('userData'));
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const friends = [...(currentUser.friends || []), currentUser.email];
    const friendUsers = friends.map(email => users[email]).filter(Boolean);

    // Sıralama kriterine göre arkadaşları sırala
    friendUsers.sort((a, b) => {
        switch(type) {
            case 'xp':
                return b.xp - a.xp;
            case 'frequency':
                return (b.stats?.frequency?.highScore || 0) - (a.stats?.frequency?.highScore || 0);
            case 'volume':
                return (b.stats?.volume?.highScore || 0) - (a.stats?.volume?.highScore || 0);
            case 'pan':
                return (b.stats?.pan?.highScore || 0) - (a.stats?.pan?.highScore || 0);
            default:
                return b.xp - a.xp;
        }
    });

    // Tabloyu güncelle
    const tbody = document.getElementById('friends-leaderboard-body');
    tbody.innerHTML = '';

    friendUsers.forEach((user, index) => {
        const row = document.createElement('tr');
        if (user.email === currentUser.email) {
            row.classList.add('current-user');
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${user.nickname || user.name}${user.email === currentUser.email ? ' (Sen)' : ''}</td>
            <td>${user.level}</td>
            <td>${type === 'xp' ? user.xp : user.stats[type].highScore || 0}</td>
        `;
        tbody.appendChild(row);
    });
}
