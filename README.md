# 🚀 Kariyer.net İş İlanları Scraping Projesi

Bu proje, Kariyer.net sitesinden YBS (Yönetim Bilişim Sistemleri) ve ilgili iş alanlarındaki iş ilanlarını otomatik olarak çekmek için geliştirilmiş bir web scraping uygulamasıdır.

## 📋 İçindekiler

- [Proje Hakkında](#proje-hakkında)
- [Özellikler](#özellikler)
- [Gereksinimler](#gereksinimler)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [Proje Yapısı](#proje-yapısı)
- [Hedef İş Alanları](#hedef-iş-alanları)
- [Çıktı Formatı](#çıktı-formatı)
- [Teknik Detaylar](#teknik-detaylar)
- [Sorun Giderme](#sorun-giderme)
- [Notlar ve Uyarılar](#notlar-ve-uyarılar)

---

## 📖 Proje Hakkında

Bu proje, Kariyer.net platformundan belirli iş alanlarına ait iş ilanlarını otomatik olarak toplamak için tasarlanmıştır. Özellikle Yönetim Bilişim Sistemleri (YBS) mezunlarının ilgilenebileceği pozisyonları hedeflemektedir.

### Proje Amacı

- Kariyer.net'ten belirli keyword'ler için iş ilanlarını otomatik arama
- Her ilanın detay sayfasına gidip pozisyon ve ilan metni bilgilerini çekme
- Verileri CSV formatında yapılandırılmış şekilde kaydetme
- Robot algılamasını minimize ederek güvenli scraping yapma

---

## ✨ Özellikler

- ✅ **Otomatik Arama**: Belirlenen keyword'ler için otomatik arama yapma
- ✅ **Detaylı Veri Çekme**: Her ilanın detay sayfasından tam metin çekme
- ✅ **CSV Export**: Verileri CSV formatında kaydetme
- ✅ **Anti-Bot Önlemleri**: Robot algılamasını azaltmak için çeşitli teknikler
- ✅ **Hata Yönetimi**: Hata durumlarında script'in devam etmesi
- ✅ **İlerleme Takibi**: Detaylı konsol logları ile ilerleme takibi
- ✅ **Yavaşlatılmış İşlemler**: Her işlem arasında bekleme süreleri

---

## 🔧 Gereksinimler

- **Node.js**: v18.0.0 veya üzeri
- **npm**: v9.0.0 veya üzeri
- **TypeScript**: v5.3.0 veya üzeri
- **Playwright**: Tarayıcı otomasyonu için
- **İnternet Bağlantısı**: Kariyer.net'e erişim için

---

## 📦 Kurulum

### 1. Projeyi Klonlayın veya İndirin

```bash
# Eğer git kullanıyorsanız
git clone <repository-url>
cd businessScraping

# Veya proje klasörüne gidin
cd businessScraping
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Playwright Tarayıcılarını Yükleyin

```bash
npx playwright install chromium
```

Bu komut, Playwright'ın Chromium tarayıcısını sisteminize yükleyecektir.

---

## 🚀 Kullanım

### Temel Kullanım

Projeyi çalıştırmak için aşağıdaki komutlardan birini kullanabilirsiniz:

```bash
npm run scrape
```

veya

```bash
npm run dev
```

### Script Parametrelerini Özelleştirme

`src/scraper.ts` dosyasındaki `main()` fonksiyonunda şu parametreleri değiştirebilirsiniz:

#### Keyword Listesi

```typescript
const keywords = [
  'Yönetim Bilişim Sistemleri',
  'İş Analisti',
  // ... diğer keyword'ler
];
```

#### Her Keyword İçin Maksimum İlan Sayısı

```typescript
await scraper.scrapeAllJobs(keywords, 30); // 30 yerine istediğiniz sayıyı yazın
```

#### Çıktı Dosya Adı

```typescript
const scraper = new KariyerNetScraper('kariyernet_ilanlar.csv'); // Dosya adını değiştirebilirsiniz
```

### Çalışma Sırasında Dikkat Edilmesi Gerekenler

1. **"Basılı Tut" Doğrulama**: Script çalıştırıldığında tarayıcı açılacak ve Kariyer.net'te "Basılı Tut" doğrulama penceresi görünebilir. Bu durumda:
   - Tarayıcı penceresine gidin
   - "Basılı Tut" butonuna basılı tutun
   - Doğrulama tamamlanana kadar bekleyin
   - Script otomatik olarak devam edecektir

2. **Tarayıcı Penceresi**: Script, tarayıcıyı görünür modda (headless: false) çalıştırır. Bu, robot algılamasını azaltmak içindir.

3. **Bekleme Süreleri**: Script, her işlem arasında bekleme yapar:
   - Her işlem arasında: 0.8 saniye
   - İlanlar arasında: 2 saniye
   - Keyword'ler arasında: 3 saniye

---

## 📁 Proje Yapısı

```
businessScraping/
├── src/
│   ├── scraper.ts              # Ana scraping sınıfı ve mantığı
│   ├── cursor-scraper.ts       # Cursor browser scraper
│   └── cursor-browser-scraper.ts # Cursor browser scraper alternatifi
├── dist/                       # TypeScript derleme çıktısı (otomatik oluşturulur)
├── kariyernet_ilanlar.csv      # Çekilen ilanların kaydedildiği CSV dosyası
├── package.json                # Proje bağımlılıkları ve script'ler
├── tsconfig.json               # TypeScript yapılandırması
├── .gitignore                  # Git ignore dosyası
├── README.md                   # Bu dosya
└── SCRAPING_DURUM_RAPORU.md   # Scraping durum raporu
```

### Dosya Açıklamaları

- **`src/scraper.ts`**: Ana scraping mantığını içeren dosya. `KariyerNetScraper` sınıfı burada tanımlanmıştır.
- **`kariyernet_ilanlar.csv`**: Çekilen ilanların kaydedildiği CSV dosyası. Her ilan eklendiğinde otomatik olarak güncellenir.
- **`package.json`**: Proje bağımlılıkları, script'ler ve proje bilgileri.

---

## 🎯 Hedef İş Alanları

Script şu iş alanlarını otomatik olarak arar:

### 1. Grup: YBS'nin "Tam İsabet" Olduğu Roller
- Yönetim Bilişim Sistemleri
- İş Analisti (Business Analyst)
- Sistem Analisti (System Analyst)
- UI/UX Designer
- ERP Danışmanı (ERP Consultant)
- İş Zekası Uzmanı (Business Intelligence / BI Specialist)

### 2. Grup: Veri Odaklı Roller
- Veri Analisti (Data Analyst)
- Veri Bilimcisi (Data Scientist)
- Veri Tabanı Yöneticisi (Database Administrator)

### 3. Grup: Yazılım ve Yönetim Rolleri
- Yazılım Geliştirici (Software Developer)
- Ürün Yöneticisi
- Proje Yöneticisi (Project Manager)
- Yazılım Test Uzmanı (Software Test Engineer)

**Not**: Tüm keyword'ler Türkçe olarak kullanılmaktadır.

---

## 📊 Çıktı Formatı

Veriler `kariyernet_ilanlar.csv` dosyasına kaydedilir. Dosya formatı:

| Kolon | Açıklama |
|-------|----------|
| `Pozisyon` | İş pozisyonunun başlığı |
| `IlanMetni` | İlanın tam metni (nitelikler, görevler, sorumluluklar vb.) |

### CSV Format Detayları

- **Ayırıcı**: Noktalı virgül (`;`)
- **Encoding**: UTF-8
- **Başlık Satırı**: İlk satır kolon başlıklarını içerir

### Örnek Çıktı

```csv
Pozisyon;IlanMetni
"İş Analisti";"GENEL NİTELİKLER VE İŞ TANIMI... [ilan metni]"
"Veri Analisti";"Aranan Nitelikler... [ilan metni]"
```

---

## 🔬 Teknik Detaylar

### Kullanılan Teknolojiler

- **TypeScript**: Tip güvenliği için
- **Playwright**: Tarayıcı otomasyonu için
- **csv-writer**: CSV dosyası yazma için
- **Node.js**: Runtime ortamı

### Anti-Bot Önlemleri

Script, robot algılamasını azaltmak için şu teknikleri kullanır:

1. **WebDriver Flag Gizleme**: `navigator.webdriver` özelliğini gizler
2. **Gerçekçi Mouse Hareketleri**: Sayfa üzerinde mouse hareketleri simüle eder
3. **Karakter Karakter Yazma**: Arama kutusuna yazarken karakter karakter yazar
4. **Scroll Simülasyonu**: Sayfa scroll hareketleri simüle eder
5. **Yavaşlatılmış İşlemler**: Her işlem arasında bekleme süreleri
6. **Gerçekçi User-Agent**: Gerçek bir tarayıcı gibi görünmek için
7. **Chrome Profil Simülasyonu**: Gerçek bir Chrome kullanıcısı gibi görünmek için

### İlan Link Bulma Stratejisi

Script, ilan linklerini bulmak için şu stratejileri kullanır:

1. **Spesifik Selector'lar**: `/is-ilani/` içeren linkleri arar
2. **Job Card İçindeki Linkler**: İş kartları içindeki linkleri kontrol eder
3. **HTML İçeriğinden Regex**: Sayfa HTML'inden regex ile link arama
4. **ID Kontrolü**: Sadece gerçek ilan detay sayfalarını alır (URL sonunda sayı olmalı)

### Hata Yönetimi

- İlan linkleri bulunamazsa, bir sonraki keyword'e geçer
- İlan detayı çekilemezse, ilan atlanır ve bir sonraki ilana geçer
- Tarayıcı başlatma hatası durumunda, hata mesajı gösterilir

---

## 🐛 Sorun Giderme

### İlan Linkleri Bulunamıyor

**Sorun**: Script ilan linklerini bulamıyor.

**Olası Nedenler**:
- Kariyer.net'in HTML yapısı değişmiş olabilir
- Sayfa tam yüklenmeden linkler aranıyor olabilir

**Çözüm**:
1. `src/scraper.ts` dosyasındaki selector'ları kontrol edin
2. `searchJobs()` fonksiyonundaki bekleme sürelerini artırın
3. Tarayıcı penceresini açık tutun ve sayfanın yüklenmesini gözlemleyin

### İlan Metni Çekilemiyor

**Sorun**: İlan detay sayfasından metin çekilemiyor.

**Olası Nedenler**:
- `data-test="qualifications-and-job-description"` elementi bulunamıyor
- Sayfa yapısı değişmiş olabilir

**Çözüm**:
1. `src/scraper.ts` dosyasındaki `scrapeJobDetail()` fonksiyonunu kontrol edin
2. Alternatif selector'lar otomatik olarak denenir, ancak gerekirse manuel olarak güncelleyin
3. Tarayıcı penceresinde sayfayı inceleyip doğru selector'ı bulun

### Tarayıcı Başlatılamıyor

**Sorun**: Playwright tarayıcıyı başlatamıyor.

**Olası Nedenler**:
- Port çakışması (9222 portu kullanımda)
- Playwright tarayıcıları yüklenmemiş
- Sistem izinleri yetersiz

**Çözüm**:
1. Mevcut Chrome/Chromium instance'larını kapatın
2. `npx playwright install chromium` komutunu tekrar çalıştırın
3. `src/scraper.ts` dosyasındaki `--remote-debugging-port=9222` parametresini farklı bir port ile değiştirin (örn: `9223`)

### "Basılı Tut" Doğrulama Penceresi

**Sorun**: Script "Basılı Tut" doğrulama penceresinde takılı kalıyor.

**Çözüm**:
1. Tarayıcı penceresine gidin
2. "Basılı Tut" butonuna basılı tutun
3. Doğrulama tamamlanana kadar bekleyin
4. Script otomatik olarak devam edecektir

### CSV Dosyası Boş veya Eksik Veri

**Sorun**: CSV dosyası oluşturuluyor ancak içi boş veya eksik veri var.

**Olası Nedenler**:
- İlan linkleri bulunamıyor
- İlan detay sayfalarından veri çekilemiyor
- Dosya yazma izinleri yetersiz

**Çözüm**:
1. Konsol loglarını kontrol edin
2. `kariyernet_ilanlar.csv` dosyasının yazma izinlerini kontrol edin
3. Script'in başarıyla çalıştığından emin olun

---

## ⚠️ Notlar ve Uyarılar

### Etik ve Yasal Uyarılar

- Bu proje **eğitim ve araştırma amaçlı** geliştirilmiştir
- Kariyer.net'in **Kullanım Şartları**'na uygun kullanın
- **Aşırı istek** yapmaktan kaçının (script zaten yavaşlatılmıştır)
- Çekilen verileri **ticari amaçla kullanmayın** (gerekirse izin alın)
- **Kişisel veriler** içeren bilgileri dikkatli kullanın

### Teknik Notlar

- Script, tarayıcıyı **görünür modda** çalıştırır (headless: false)
- Her işlem arasında **bekleme süreleri** vardır (robot algılamasını azaltmak için)
- CSV dosyası **her ilan eklendiğinde** otomatik olarak güncellenir
- Hata durumunda script **devam eder** ve bir sonraki ilana geçer
- Script çalışırken **tarayıcı penceresini kapatmayın**

### Performans Notları

- Script, her keyword için belirlenen sayıda ilan çeker
- Toplam çalışma süresi, ilan sayısına ve bekleme sürelerine bağlıdır
- 12 keyword × 30 ilan = ~360 ilan için yaklaşık **2-3 saat** sürebilir

### Veri Kalitesi

- Çekilen veriler, Kariyer.net'in sayfa yapısına bağlıdır
- Bazı ilanlarda pozisyon veya ilan metni eksik olabilir
- CSV dosyasını düzenli olarak kontrol edin

---

## 📝 Lisans

ISC

---

## 🤝 Katkıda Bulunma

Bu proje açık kaynaklıdır. Katkılarınızı bekliyoruz!

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

---

## 📞 İletişim ve Destek

Sorularınız veya önerileriniz için:
- GitHub Issues kullanabilirsiniz
- Proje sahibi ile iletişime geçebilirsiniz

---

**Son Güncelleme**: 16 Aralık 2025

**Proje Versiyonu**: 1.0.0


