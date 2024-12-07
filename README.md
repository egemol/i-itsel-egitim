# İşitsel Eğitim Platformu

İşitsel algı ve müzik teorisi becerilerini geliştirmek için tasarlanmış interaktif bir web platformu.

## Özellikler

- **Frekans Algısı Oyunu**: Belirli bir frekanstaki boost'u tahmin etme
- **Ses Seviyesi Oyunu**: Farklı ses seviyelerini karşılaştırma
- **Ses Konumu Oyunu**: Stereo alandaki ses konumunu belirleme
- **Kullanıcı Profili**: Seviye sistemi ve XP kazanma
- **Liderlik Tablosu**: Global ve arkadaş sıralaması
- **Arkadaş Sistemi**: Arkadaş ekleme ve takip etme

## Teknolojiler

- HTML5
- CSS3
- JavaScript
- Web Audio API

## Proje Yapısı

```
isitsel-egitim/
├── audio/           # Ses dosyaları
├── css/            # Stil dosyaları
│   └── style.css
├── js/             # JavaScript dosyaları
│   ├── auth.js     # Kimlik doğrulama
│   ├── dashboard.js # Kullanıcı paneli
│   ├── leaderboard.js # Sıralama sistemi
│   └── script.js   # Ana oyun mantığı
├── index.html      # Ana sayfa
├── dashboard.html  # Kullanıcı paneli
├── games.html      # Oyunlar sayfası
└── leaderboard.html # Sıralama sayfası
```

## Kurulum

1. Projeyi klonlayın
2. Bir web sunucusu üzerinde çalıştırın (örn. Live Server)
3. Tarayıcıda `index.html` dosyasını açın

## Kullanım

1. Hesap oluşturun veya giriş yapın
2. Oyunlar sayfasından istediğiniz oyunu seçin
3. Oyun talimatlarını okuyun ve başlayın
4. Skorunuzu yükseltin ve arkadaşlarınızla yarışın

## Notlar

- Modern bir web tarayıcı kullanmanız önerilir
- Web Audio API desteği gereklidir
- Kulaklık kullanımı önerilir

## Gelecek Özellikler

- [ ] Sunucu tarafı kimlik doğrulama
- [ ] Daha fazla oyun modu
- [ ] Çoklu oyuncu desteği
- [ ] Sosyal paylaşım özellikleri
- [ ] Gelişmiş ses analizi

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
