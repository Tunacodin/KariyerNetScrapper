import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import { parse } from 'csv-parse/sync';

interface JobListing {
  pozisyon: string;
  ilanMetni: string;
}

class KariyerNetScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private csvWriter: any;
  private outputFile: string;
  private existingJobs: Set<string> = new Set(); // Duplicate kontrolü için

  constructor(outputFileName: string = 'kariyernet_ilanlar.csv') {
    this.outputFile = path.join(__dirname, '..', outputFileName);
    
    // Mevcut CSV dosyasını oku ve duplicate kontrolü için hash set oluştur
    this.loadExistingJobs();
    
    // CSV Writer oluştur (append modu için özel yapılandırma)
    const fileExists = fs.existsSync(this.outputFile);
    this.csvWriter = createObjectCsvWriter({
      path: this.outputFile,
      header: [
        { id: 'pozisyon', title: 'Pozisyon' },
        { id: 'ilanMetni', title: 'IlanMetni' }
      ],
      encoding: 'utf8',
      fieldDelimiter: ';',
      append: fileExists // Dosya varsa append modunda aç
    });
  }

  // Mevcut CSV dosyasındaki ilanları yükle (duplicate kontrolü için)
  private loadExistingJobs(): void {
    try {
      if (fs.existsSync(this.outputFile)) {
        const fileContent = fs.readFileSync(this.outputFile, 'utf-8');
        const records: any[] = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          delimiter: ';',
          bom: true,
          trim: true,
        });

        // Her ilan için hash oluştur (pozisyon + ilanMetni'nin ilk 200 karakteri)
        for (const record of records) {
          const pozisyon = (record.Pozisyon || record.pozisyon || '').trim();
          const ilanMetni = (record.IlanMetni || record.ilanMetni || '').trim();
          if (pozisyon && ilanMetni) {
            // Hash oluştur: pozisyon + ilanMetni'nin ilk 200 karakteri
            const hash = this.createJobHash(pozisyon, ilanMetni);
            this.existingJobs.add(hash);
          }
        }
        console.log(`📋 Mevcut CSV'den ${this.existingJobs.size} ilan yüklendi (duplicate kontrolü için)`);
      } else {
        console.log('📋 Yeni CSV dosyası oluşturulacak');
      }
    } catch (error) {
      console.warn('⚠️  Mevcut CSV dosyası okunamadı, yeni dosya oluşturulacak:', error);
    }
  }

  // İlan için hash oluştur (duplicate kontrolü için)
  private createJobHash(pozisyon: string, ilanMetni: string): string {
    // Pozisyon + ilanMetni'nin ilk 200 karakterini normalize et ve hash oluştur
    const normalizedPozisyon = pozisyon.toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizedIlanMetni = ilanMetni.substring(0, 200).toLowerCase().trim().replace(/\s+/g, ' ');
    return `${normalizedPozisyon}|||${normalizedIlanMetni}`;
  }

  // İlanın daha önce kaydedilip kaydedilmediğini kontrol et
  private isDuplicate(pozisyon: string, ilanMetni: string): boolean {
    const hash = this.createJobHash(pozisyon, ilanMetni);
    return this.existingJobs.has(hash);
  }

  // Yeni ilanı hash set'e ekle
  private addToExistingJobs(pozisyon: string, ilanMetni: string): void {
    const hash = this.createJobHash(pozisyon, ilanMetni);
    this.existingJobs.add(hash);
  }

  async init() {
    console.log('Tarayıcı başlatılıyor...');
    console.log('NOT: Mevcut Chrome profili kullanılacak - Chrome\'da hangi hesap açıksa o kullanılacak');
    
    // Kullanıcının mevcut Chrome profil dizinini bul
    const originalUserDataDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
    
    console.log(`📁 Chrome profil dizini: ${originalUserDataDir}`);
    
    // Önce launchPersistentContext ile deneyelim (Chrome kapalıysa çalışır)
    // Bu, kullanıcının Chrome profilindeki tüm hesapları ve oturumları kullanır
    try {
      console.log('🔄 Chrome profilini kullanarak tarayıcı başlatılıyor...');
      console.log('   (Chrome\'da hangi hesap açıksa o kullanılacak)');
      this.context = await chromium.launchPersistentContext(originalUserDataDir, {
      headless: false, // Tarayıcıyı görünür modda çalıştır
      slowMo: 800, // Her işlem arasında 0.8 saniye bekle (robot algılamasını azaltmak için)
      timeout: 120000, // Tarayıcı başlatma timeout'u 2 dakika
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
      permissions: ['geolocation'],
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-infobars', // "Chrome is being controlled by automated test software" mesajını gizle
        '--disable-notifications', // Bildirimleri kapat
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials'
      ],
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    });
    
    // WebDriver flag'ini gizle - string olarak geçiyoruz
    await this.context.addInitScript(`
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      
      // Chrome objesini ekle
      window.chrome = {
        runtime: {},
      };
      
      // Plugins ekle
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Languages ekle
      Object.defineProperty(navigator, 'languages', {
        get: () => ['tr-TR', 'tr', 'en-US', 'en'],
      });
      
      // WebDriver property'sini gizle
      delete navigator.__proto__.webdriver;
    `);
    
    // Yeni bir sayfa oluştur (veya mevcut sayfayı kullan)
    const pages = this.context.pages();
    if (pages.length > 0) {
      this.page = pages[0];
    } else {
      this.page = await this.context.newPage();
    }
    
    this.page.setDefaultTimeout(60000); // Sayfa işlemleri için 60 saniye timeout
    this.page.setDefaultNavigationTimeout(60000); // Navigasyon için 60 saniye timeout
    
    console.log('✅ Tarayıcı hazır - Chrome profilindeki hesap kullanılıyor!');
    } catch (error: any) {
      // Chrome açıksa, kullanıcıya bilgi ver ve normal launch kullan
      if (error.message && (error.message.includes('Target page, context or browser has been closed') || 
          error.message.includes('User data directory is already in use'))) {
        console.log('\n⚠️  Chrome zaten açık!');
        console.log('📌 Chrome\'u kapatıp tekrar başlatmanız gerekiyor (profil kullanımı için)');
        console.log('   VEYA');
        console.log('📌 Chrome\'u şu komutla başlatın:');
        console.log(`   chrome.exe --remote-debugging-port=9222 --user-data-dir="${originalUserDataDir}"`);
        console.log('   Sonra scraping\'i tekrar başlatın\n');
        
        // Alternatif: Normal launch (profil olmadan)
        console.log('🔄 Alternatif yöntem kullanılıyor (profil olmadan)...');
        console.log('📌 Not: Chrome profilini kullanamıyoruz, ancak anti-bot önlemleri aktif');
        
        this.browser = await chromium.launch({
          headless: false,
          slowMo: 800,
          timeout: 120000,
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials',
            '--disable-infobars',
            '--disable-notifications'
          ]
        });
        
        this.context = await this.browser.newContext({
          viewport: { width: 1920, height: 1080 },
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          locale: 'tr-TR',
          timezoneId: 'Europe/Istanbul',
          permissions: ['geolocation'],
          extraHTTPHeaders: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
          }
        });
        
        await this.context.addInitScript(`
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
          });
          window.chrome = { runtime: {} };
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
          });
          Object.defineProperty(navigator, 'languages', {
            get: () => ['tr-TR', 'tr', 'en-US', 'en'],
          });
          delete navigator.__proto__.webdriver;
        `);
        
        this.page = await this.context.newPage();
        this.page.setDefaultTimeout(60000);
        this.page.setDefaultNavigationTimeout(60000);
        
        console.log('✅ Tarayıcı hazır (alternatif yöntem)');
        console.log('📌 Manuel olarak Chrome\'daki hesabınızla giriş yapabilirsiniz');
      } else {
        throw error;
      }
    }
  }

  async searchJobs(keyword: string): Promise<string[]> {
    if (!this.page) throw new Error('Sayfa başlatılmamış!');

    console.log(`"${keyword}" için arama yapılıyor...`);
    
    // Kariyer.net ana sayfasına git
    try {
      await this.page.goto('https://www.kariyer.net', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000,
        referer: 'https://www.google.com/'
      });
      
      // Sayfanın tam yüklenmesi için bekle
      await this.page.waitForTimeout(5000);
      
      // "Basılı Tut" doğrulama penceresi için bekle
      // Kullanıcı manuel olarak "Basılı Tut" butonuna basılı tutmalı
      console.log('⚠️  "Basılı Tut" doğrulama penceresi görünebilir.');
      console.log('⚠️  Lütfen tarayıcıda "Basılı Tut" butonuna basılı tutun ve doğrulamayı tamamlayın.');
      console.log('⚠️  10 saniye bekleniyor... (Doğrulamayı tamamlayın)');
      await this.page.waitForTimeout(10000);
      
      // Mouse hareketi simüle et (daha gerçekçi görünmek için)
      await this.page.mouse.move(100, 100);
      await this.page.waitForTimeout(500);
      await this.page.mouse.move(200, 200);
      await this.page.waitForTimeout(1000);
      
    } catch (error) {
      console.warn('Ana sayfa yüklenirken hata, tekrar deneniyor...', error);
      await this.page.waitForTimeout(2000);
      await this.page.goto('https://www.kariyer.net', { 
        waitUntil: 'load',
        timeout: 60000,
        referer: 'https://www.google.com/'
      });
      await this.page.waitForTimeout(5000);
    }
    
    // Cookie kabul et (varsa) - daha geniş seçiciler
    try {
      await this.page.waitForTimeout(2000);
      const cookieSelectors = [
        'button:has-text("Kabul Et")',
        'button:has-text("Accept")',
        'button:has-text("Kabul")',
        '[id*="cookie"] button',
        '[class*="cookie"] button',
        '[class*="Cookie"] button',
        '[data-test*="cookie"] button',
        'button[class*="accept"]',
        'button[class*="Accept"]'
      ];
      
      for (const selector of cookieSelectors) {
        try {
          const cookieButton = await this.page.$(selector);
          if (cookieButton) {
            const box = await cookieButton.boundingBox();
            if (box) {
              await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
              await this.page.waitForTimeout(500);
              await cookieButton.click();
              await this.page.waitForTimeout(2000);
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      // Cookie butonu yoksa devam et
      console.log('Cookie butonu bulunamadı veya zaten kabul edilmiş');
    }

    // Arama kutusunu bul ve doldur
    const searchInput = await this.page.$('input[placeholder*="iş"], input[placeholder*="pozisyon"], input[type="search"], input[name*="search"], input[id*="search"]');
    
    if (!searchInput) {
      // Alternatif: Direkt arama URL'sine git
      console.log('Arama kutusu bulunamadı, direkt URL kullanılıyor...');
      const searchUrl = `https://www.kariyer.net/is-ilanlari?kw=${encodeURIComponent(keyword)}`;
      await this.page.goto(searchUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000,
        referer: 'https://www.kariyer.net/'
      });
      await this.page.waitForTimeout(4000);
    } else {
      // Arama kutusuna gerçekçi bir şekilde yaz
      const box = await searchInput.boundingBox();
      if (box) {
        await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await this.page.waitForTimeout(300);
        await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await this.page.waitForTimeout(500);
      }
      
      // Karakter karakter yaz (daha gerçekçi)
      await searchInput.fill('');
      await this.page.waitForTimeout(200);
      await searchInput.type(keyword, { delay: 100 });
      await this.page.waitForTimeout(1000);
      
      // Arama butonuna tıkla veya Enter'a bas
      const searchButton = await this.page.$('button[type="submit"], button:has-text("Ara"), [class*="search-button"], [class*="search"] button');
      if (searchButton) {
        const buttonBox = await searchButton.boundingBox();
        if (buttonBox) {
          await this.page.mouse.move(buttonBox.x + buttonBox.width / 2, buttonBox.y + buttonBox.height / 2);
          await this.page.waitForTimeout(300);
          await searchButton.click();
        } else {
          await searchButton.click();
        }
      } else {
        await this.page.keyboard.press('Enter');
      }
      await this.page.waitForTimeout(2000);
    }

    await this.page.waitForTimeout(3000);
    try {
      await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    } catch (e) {
      console.warn('Sayfa yüklenme durumu kontrol edilemedi, devam ediliyor...');
    }

    // İlan linklerini topla
    const jobLinks: string[] = [];
    
    console.log('🔍 İlan linkleri aranıyor...');
    
    try {
      // Sayfanın yüklenmesini bekle
      await this.page.waitForTimeout(2000);
      
      // Daha spesifik selector'lar kullan - sadece gerçek ilan detay sayfalarını bul
      const selectors = [
        'a[href*="/is-ilani/"]', // İlan detay sayfası linkleri
        'a[href^="/is-ilani/"]', // İlan detay sayfası linkleri (başlangıç)
        '[data-test*="job-card"] a[href*="/is-ilani/"]', // Job card içindeki linkler
        '[class*="job-card"] a[href*="/is-ilani/"]', // Job card class'ı içindeki linkler
        'article a[href*="/is-ilani/"]', // Article içindeki linkler
        'div[class*="job"] a[href*="/is-ilani/"]' // Job div içindeki linkler
      ];
      
      for (const selector of selectors) {
        try {
          const elements = await this.page.$$(selector);
          console.log(`  📌 "${selector}" selector'ı ile ${elements.length} element bulundu`);
          
          for (const element of elements) {
            const href = await element.getAttribute('href');
            if (href && href.includes('/is-ilani/') && !href.includes('/is-ilanlari?') && !jobLinks.includes(href)) {
              // Sadece gerçek ilan detay sayfalarını al (ana sayfa veya liste sayfalarını değil)
              const fullUrl = href.startsWith('http') ? href : `https://www.kariyer.net${href}`;
              if (fullUrl.match(/\/is-ilani\/[^\/]+\d+$/)) { // URL'nin sonunda sayı olmalı (ilan ID)
                jobLinks.push(fullUrl);
                console.log(`    ✓ İlan linki bulundu: ${fullUrl.substring(0, 80)}...`);
              }
            }
          }
          
          if (jobLinks.length > 0) break; // Yeterli link bulunduysa dur
        } catch (e) {
          console.log(`  ⚠️  "${selector}" selector'ı ile hata: ${e}`);
          continue;
        }
      }

      // Eğer hala link bulunamadıysa, sayfa HTML'ini kontrol et
      if (jobLinks.length === 0) {
        console.log('  ⚠️  Spesifik selector\'lar ile link bulunamadı, sayfa HTML\'i kontrol ediliyor...');
        const pageContent = await this.page.content();
        const hrefMatches = pageContent.match(/href="([^"]*\/is-ilani\/[^"]+)"/g);
        if (hrefMatches) {
          for (const match of hrefMatches) {
            const href = match.replace('href="', '').replace('"', '');
            if (href.includes('/is-ilani/') && !href.includes('/is-ilanlari?') && !jobLinks.includes(href)) {
              const fullUrl = href.startsWith('http') ? href : `https://www.kariyer.net${href}`;
              if (fullUrl.match(/\/is-ilani\/[^\/]+\d+$/)) {
                jobLinks.push(fullUrl);
                console.log(`    ✓ HTML\'den ilan linki bulundu: ${fullUrl.substring(0, 80)}...`);
              }
            }
          }
        }
      }

      console.log(`\n✅ Toplam ${jobLinks.length} ilan linki bulundu.`);
      if (jobLinks.length > 0) {
        console.log('📋 İlk 3 ilan linki:');
        jobLinks.slice(0, 3).forEach((link, index) => {
          console.log(`   ${index + 1}. ${link}`);
        });
      }
    } catch (error) {
      console.error('❌ İlan linkleri bulunurken hata:', error);
    }

    return jobLinks;
  }

  async scrapeJobDetail(jobUrl: string): Promise<JobListing | null> {
    if (!this.page) throw new Error('Sayfa başlatılmamış!');

    try {
      console.log(`  🌐 Sayfaya gidiliyor...`);
      await this.page.goto(jobUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000,
        referer: 'https://www.kariyer.net/'
      });
      
      // Gerçekçi scroll ve mouse hareketleri
      await this.page.waitForTimeout(2000);
      await this.page.mouse.move(500, 300);
      await this.page.waitForTimeout(500);
      await this.page.evaluate('window.scrollTo(0, 300)');
      await this.page.waitForTimeout(1000);
      await this.page.evaluate('window.scrollTo(0, 0)');
      await this.page.waitForTimeout(1000);

      // Pozisyon başlığını al
      let pozisyon = '';
      try {
        const titleSelectors = [
          'h1',
          '[class*="job-title"]',
          '[class*="position"]',
          '[data-test*="title"]',
          'h2:first-of-type'
        ];
        
        for (const selector of titleSelectors) {
          const titleElement = await this.page.$(selector);
          if (titleElement) {
            pozisyon = await titleElement.textContent() || '';
            if (pozisyon.trim()) break;
          }
        }
      } catch (e) {
        console.warn('Pozisyon başlığı bulunamadı');
      }

      // İlan metnini al (data-test="qualifications-and-job-description" elementi)
      let ilanMetni = '';
      try {
        const jobDescriptionElement = await this.page.$('div[data-test="qualifications-and-job-description"]');
        
        if (jobDescriptionElement) {
          ilanMetni = await jobDescriptionElement.textContent() || '';
        } else {
          // Alternatif seçiciler
          const alternativeSelectors = [
            '[class*="job-description"]',
            '[class*="job-detail"]',
            '[class*="qualifications"]',
            '[id*="job-description"]',
            'div[class*="detail"]'
          ];
          
          for (const selector of alternativeSelectors) {
            const element = await this.page.$(selector);
            if (element) {
              ilanMetni = await element.textContent() || '';
              if (ilanMetni.trim()) break;
            }
          }
        }
      } catch (e) {
        console.warn('İlan metni bulunamadı:', e);
      }

      if (!pozisyon && !ilanMetni) {
        console.warn('Bu ilan için veri bulunamadı, atlanıyor...');
        return null;
      }

      return {
        pozisyon: pozisyon.trim(),
        ilanMetni: ilanMetni.trim()
      };
    } catch (error) {
      console.error(`İlan detayı çekilirken hata: ${error}`);
      return null;
    }
  }

  async scrapeAllJobs(keywords: string[], minJobsPerKeyword: number = 30) {
    const allJobs: JobListing[] = [];

    for (const keyword of keywords) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔍 ${keyword} için scraping başlıyor...`);
      console.log(`📊 Hedef: En az ${minJobsPerKeyword} ilan`);
      console.log(`${'='.repeat(80)}\n`);
      
      try {
        const jobLinks = await this.searchJobs(keyword);
        
        if (jobLinks.length === 0) {
          console.log(`⚠️  "${keyword}" için hiç ilan bulunamadı, sonraki keyword'e geçiliyor...\n`);
          continue;
        }
        
        console.log(`📋 Toplam ${jobLinks.length} ilan linki bulundu.`);
        const targetCount = Math.min(jobLinks.length, minJobsPerKeyword);
        console.log(`🎯 ${targetCount} ilan işlenecek (${jobLinks.length >= minJobsPerKeyword ? 'Hedef sayıya ulaşıldı' : 'Mevcut ilan sayısı kadar'})\n`);
        
        const linksToScrape = jobLinks.slice(0, targetCount);
        let successCount = 0;

        for (let i = 0; i < linksToScrape.length; i++) {
          const jobUrl = linksToScrape[i];
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`📄 [${i + 1}/${linksToScrape.length}] İlan işleniyor...`);
          console.log(`🔗 URL: ${jobUrl}`);
          
          const jobData = await this.scrapeJobDetail(jobUrl);
          
          if (jobData) {
            // Duplicate kontrolü yap
            if (this.isDuplicate(jobData.pozisyon, jobData.ilanMetni)) {
              console.log(`⏭️  Bu ilan zaten kayıtlı, atlanıyor...`);
              console.log(`📝 Pozisyon: ${jobData.pozisyon.substring(0, 60)}${jobData.pozisyon.length > 60 ? '...' : ''}`);
              continue;
            }
            
            allJobs.push(jobData);
            successCount++;
            console.log(`📝 Pozisyon: ${jobData.pozisyon.substring(0, 60)}${jobData.pozisyon.length > 60 ? '...' : ''}`);
            console.log(`📄 İlan metni uzunluğu: ${jobData.ilanMetni.length} karakter`);
            
            // Her ilan sonrası CSV'ye ekle
            await this.csvWriter.writeRecords([jobData]);
            // Hash set'e ekle (bir sonraki kontrol için)
            this.addToExistingJobs(jobData.pozisyon, jobData.ilanMetni);
            console.log(`✅ İlan başarıyla kaydedildi! (${successCount}/${targetCount})`);
          } else {
            console.log(`⚠️  Bu ilan için veri bulunamadı, atlanıyor...`);
          }

          // Robot algılamasını azaltmak için bekle
          console.log(`⏳ 2 saniye bekleniyor...`);
          await this.page?.waitForTimeout(2000);
        }

        console.log(`\n✅ "${keyword}" için ${successCount} ilan başarıyla kaydedildi.`);
        
        // Her keyword arasında bekle
        console.log(`⏳ 3 saniye bekleniyor, sonraki keyword'e geçiliyor...\n`);
        await this.page?.waitForTimeout(3000);
      } catch (error) {
        console.error(`❌ "${keyword}" için scraping hatası:`, error);
        console.log(`⏭️  Sonraki keyword'e geçiliyor...\n`);
        continue;
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎉 SCRAPING TAMAMLANDI!`);
    console.log(`📊 Toplam ${allJobs.length} ilan kaydedildi`);
    console.log(`${'='.repeat(80)}\n`);
    return allJobs;
  }

  async close() {
    if (this.context) {
      await this.context.close();
      console.log('Tarayıcı kapatıldı.');
    } else if (this.browser) {
      await this.browser.close();
      console.log('Tarayıcı kapatıldı.');
    }
  }
}

// Ana fonksiyon
async function main() {
  const scraper = new KariyerNetScraper('kariyernet_ilanlar.csv');

  // Hedef iş alanları - Sadece Türkçe
  const keywords = [
    'Yönetim Bilişim Sistemleri',
    'İş Analisti',
    'Sistem Analisti',
    'ERP Danışmanı',
    'İş Zekası Uzmanı',
    'Veri Analisti',
    'Veri Bilimcisi',
    'Veri Tabanı Yöneticisi',
    'Yazılım Geliştirici',
    'Ürün Yöneticisi',
    'Proje Yöneticisi',
    'Yazılım Test Uzmanı'
  ];

  try {
    await scraper.init();
    await scraper.scrapeAllJobs(keywords, 30); // Her keyword için en az 30 ilan
  } catch (error) {
    console.error('Scraping hatası:', error);
  } finally {
    await scraper.close();
  }
}

// Script çalıştırılıyorsa main'i çağır
if (require.main === module) {
  main().catch(console.error);
}

export { KariyerNetScraper, JobListing };
