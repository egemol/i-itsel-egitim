// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    // Kullanıcı kontrolü
    const auth = getAuth();
    const db = getFirestore();
    const currentUser = auth.currentUser;
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Kullanıcı bilgilerini göster
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (!userDoc.exists()) {
        window.location.href = 'index.html';
        return;
    }
    const user = userDoc.data();
    document.getElementById('user-name').textContent = user.username;
    document.getElementById('user-level').textContent = `Seviye ${user.level}`;

    // Liderlik tablosunu güncelle
    updateLeaderboard();
    
    // Arkadaş listesini göster
    showFriends();
});

// Kullanıcı adını getir
async function getUserDisplayName(uid) {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            return userDoc.data().username;
        }
        return null;
    } catch (error) {
        console.error("Error getting username:", error);
        return null;
    }
}

// Arkadaşları göster
async function showFriends() {
    const friendsList = document.getElementById('friends-list');
    if (!friendsList) return;

    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) return;

        const friends = userDoc.data().friends || [];
        
        friendsList.innerHTML = '';
        
        for (const friendId of friends) {
            const friendUsername = await getUserDisplayName(friendId);
            if (friendUsername) {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    <span>${friendUsername}</span>
                    <button class="btn btn-danger btn-sm" onclick="removeFriend('${friendId}')">Çıkar</button>
                `;
                friendsList.appendChild(li);
            }
        }
    } catch (error) {
        console.error("Error showing friends:", error);
        friendsList.innerHTML = '<li class="list-group-item text-danger">Arkadaş listesi yüklenirken bir hata oluştu.</li>';
    }
}

// Arkadaş ekle
async function addFriend(friendEmail) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return false;

        // Arkadaş kullanıcısını bul
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", friendEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert('Kullanıcı bulunamadı');
            return false;
        }

        const friendDoc = querySnapshot.docs[0];
        const friendId = friendDoc.id;

        // Kendini arkadaş olarak eklemeyi engelle
        if (friendId === currentUser.uid) {
            alert('Kendinizi arkadaş olarak ekleyemezsiniz');
            return false;
        }

        // Kullanıcının arkadaş listesini güncelle
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) return false;

        const friends = userDoc.data().friends || [];
        
        if (friends.includes(friendId)) {
            alert('Bu kullanıcı zaten arkadaş listenizde');
            return false;
        }

        await updateDoc(userRef, {
            friends: [...friends, friendId]
        });

        showFriends();
        return true;
    } catch (error) {
        console.error("Error adding friend:", error);
        alert('Arkadaş eklenirken bir hata oluştu');
        return false;
    }
}

// Arkadaş çıkar
async function removeFriend(friendId) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return false;

        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) return false;

        const friends = userDoc.data().friends || [];
        const updatedFriends = friends.filter(id => id !== friendId);

        await updateDoc(userRef, {
            friends: updatedFriends
        });

        showFriends();
        return true;
    } catch (error) {
        console.error("Error removing friend:", error);
        alert('Arkadaş çıkarılırken bir hata oluştu');
        return false;
    }
}

// Liderlik tablosunu güncelle
function updateLeaderboard() {
    const container = document.getElementById('leaderboard-container');
    const template = document.getElementById('user-card-template');
    
    container.innerHTML = ''; // Mevcut kartları temizle
    
    // Firestore'dan kullanıcıları al
    firebase.firestore().collection('users')
        .orderBy('xp', 'desc') // XP'ye göre sırala
        .limit(9) // İlk 9 kullanıcıyı al
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                
                // Template'i klonla
                const card = template.content.cloneNode(true);
                
                // Kart içeriğini güncelle
                card.querySelector('.user-name').textContent = userData.displayName || 'İsimsiz Kullanıcı';
                card.querySelector('.user-xp').textContent = userData.xp || 0;
                card.querySelector('.user-level').textContent = calculateLevel(userData.xp || 0);
                
                // Kartı container'a ekle
                container.appendChild(card);
            });
        })
        .catch((error) => {
            console.error("Error getting leaderboard data: ", error);
        });
}

// XP'den seviye hesapla
function calculateLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}
