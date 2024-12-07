// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Kullanıcı kontrolü
    const userData = localStorage.getItem('userData');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }

    // Kullanıcı bilgilerini göster
    const user = JSON.parse(userData);
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-level').textContent = `Seviye ${user.level}`;

    // Sıralamayı göster
    showLeaderboard('xp');
    
    // Arkadaş listesini göster
    showFriends();
});

// Sıralamayı göster
function showLeaderboard(type) {
    // Tab'ları güncelle
    document.querySelectorAll('.leaderboard-tabs .tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.leaderboard-tabs .tab[onclick*='${type}']`).classList.add('active');

    // Tüm kullanıcıları al
    const users = Object.values(JSON.parse(localStorage.getItem('users') || '{}'));
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;

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

    // Tabloyu temizle
    tbody.innerHTML = '';

    // Kullanıcının arkadaşlarını al
    const currentUser = JSON.parse(localStorage.getItem('userData'));
    const friends = currentUser.friends || [];

    // Tüm kullanıcıları göster
    users.forEach((user, index) => {
        const row = document.createElement('tr');
        const isFriend = friends.includes(user.email);
        const isCurrentUser = user.email === currentUser.email;
        
        // Arkadaşlar ve kullanıcının kendisi vurgulanır
        if (isFriend || isCurrentUser) {
            row.classList.add(isCurrentUser ? 'current-user' : 'friend');
        }

        const lastGame = user.lastGame ? new Date(user.lastGame).toLocaleDateString() : '-';
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${user.name} ${isCurrentUser ? '(Sen)' : (isFriend ? '(Arkadaş)' : '')}</td>
            <td>${user.level || 1}</td>
            <td>${type === 'xp' ? user.xp : (user.stats?.[type]?.highScore || 0)}</td>
            <td>${lastGame}</td>
        `;
        tbody.appendChild(row);
    });
}

// Arkadaşları göster
function showFriends() {
    const currentUser = JSON.parse(localStorage.getItem('userData'));
    const friends = currentUser.friends || [];
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
                    <span>${friend.name}</span>
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
    showLeaderboard('xp');
    
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
    showLeaderboard('xp');
}
