# 📊 Kariyer.net Scraping Durum Raporu

**Son Güncelleme:** 16 Aralık 2025, 14:56

---

## 🎯 Proje Hedefleri

- **Arama Dili:** Sadece Türkçe keyword'ler
- **Hedef İlan Sayısı:** Her keyword için en az 30 ilan
- **Toplam Keyword Sayısı:** 12 adet Türkçe keyword

---

## 📋 Hedef Keyword'ler

1. ✅ Yönetim Bilişim Sistemleri
2. ✅ İş Analisti
3. ✅ Sistem Analisti
4. ✅ ERP Danışmanı
5. ✅ İş Zekası Uzmanı
6. ✅ Veri Analisti
7. ✅ Veri Bilimcisi
8. ✅ Veri Tabanı Yöneticisi
9. ✅ Yazılım Geliştirici
10. ✅ Ürün Yöneticisi
11. ✅ Proje Yöneticisi
12. ✅ Yazılım Test Uzmanı

---

## 📊 Mevcut Durum

### CSV Dosyası İstatistikleri
- **Dosya Adı:** `kariyernet_ilanlar.csv`
- **Toplam Satır Sayısı:** 228 satır (başlık dahil)
- **Toplam İlan Sayısı:** ~227 ilan

### Son Çalıştırma Durumu
- **Durum:** ⚠️ Tarayıcı başlatma hatası
- **Hata:** Timeout - Tarayıcı başlatılamadı (port çakışması olabilir)
- **Tarih:** 16 Aralık 2025, 14:54

---

## 🔍 Son Eklenen İlanlar (Örnek)

CSV dosyasında şu pozisyonlardan ilanlar bulunmaktadır:

1. **Veri Yönetim Uzmanı** - Biruni Üniversitesi
2. **Bilgi Sistemleri İç Denetçisi** - Magician of Meta
3. **Kamera Sistemleri Uzman Yardımcısı** - Özdilek Holding
4. **Risk Yönetim Uzman Yardımcısı** - Birevim
5. **Tesis Yönetim Hizmetleri Elektrik Teknisyeni** - SE CLUB
6. **IT Destek Lideri** - İhsan Doğramacı Bilkent Üniversitesi
7. **Bilgi Teknolojileri Uzmanı** - Çatalağzı Termik Enerji
8. **Bilgi İşlem Uzmanı** - OXXO
9. **BT Destek Uzmanı** - BENO PLASTİK
10. **Bilgi Teknolojileri Destek Elemanı** - Gizli Firma
11. **İş Analisti** - (çeşitli firmalar)

---

## ⚙️ Teknik Detaylar

### Scraper Ayarları
- **Tarayıcı:** Chromium (Playwright)
- **Mod:** Headless: false (görünür mod)
- **Bekleme Süreleri:** 
  - Her işlem arasında: 0.8 saniye
  - İlanlar arasında: 2 saniye
  - Keyword'ler arasında: 3 saniye
- **Anti-Bot Önlemleri:** Aktif
  - WebDriver flag gizleme
  - Gerçekçi mouse hareketleri
  - Karakter karakter yazma
  - Scroll simülasyonu

### İlan Link Bulma Stratejisi
1. Spesifik selector'lar (`/is-ilani/` içeren linkler)
2. Job card içindeki linkler
3. HTML içeriğinden regex ile arama
4. Sadece gerçek ilan detay sayfalarını alma (ID kontrolü)

---

## 🚨 Bilinen Sorunlar

1. **Tarayıcı Başlatma Hatası**
   - **Sebep:** Port çakışması (9222) veya timeout
   - **Çözüm:** Mevcut Chrome instance'larını kapatın veya port'u değiştirin

2. **"Basılı Tut" Doğrulama Penceresi**
   - **Durum:** Manuel müdahale gerekiyor
   - **Çözüm:** Tarayıcı açıldığında "Basılı Tut" butonuna basılı tutun

---

## 📝 Sonraki Adımlar

1. ✅ Tarayıcı başlatma sorununu çöz
2. ✅ Her keyword için 30 ilan hedefine ulaş
3. ✅ CSV dosyasını düzenli olarak kontrol et
4. ✅ İlan kalitesini kontrol et (pozisyon ve ilan metni dolu mu?)

---

## 📈 İlerleme Takibi

| Keyword | Hedef | Mevcut | Durum |
|---------|-------|--------|-------|
| Yönetim Bilişim Sistemleri | 30 | ? | 🔄 |
| İş Analisti | 30 | ? | 🔄 |
| Sistem Analisti | 30 | ? | 🔄 |
| ERP Danışmanı | 30 | ? | ⏳ |
| İş Zekası Uzmanı | 30 | ? | ⏳ |
| Veri Analisti | 30 | ? | ⏳ |
| Veri Bilimcisi | 30 | ? | ⏳ |
| Veri Tabanı Yöneticisi | 30 | ? | ⏳ |
| Yazılım Geliştirici | 30 | ? | ⏳ |
| Ürün Yöneticisi | 30 | ? | ⏳ |
| Proje Yöneticisi | 30 | ? | ⏳ |
| Yazılım Test Uzmanı | 30 | ? | ⏳ |

**Durum İşaretleri:**
- ✅ Tamamlandı
- 🔄 Devam ediyor
- ⏳ Bekliyor
- ❌ Hata

---

## 💡 Notlar

- CSV dosyası her ilan eklendiğinde otomatik olarak güncellenir
- İlanlar `;` (noktalı virgül) ile ayrılmıştır
- UTF-8 encoding kullanılmaktadır
- Pozisyon ve İlan Metni kolonları mevcuttur

---

**Rapor Oluşturulma Tarihi:** 16 Aralık 2025, 14:56
**Son Scraping Denemesi:** 16 Aralık 2025, 14:54
