import * as path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

interface JobListing {
  pozisyon: string;
  ilanMetni: string;
}

/**
 * Cursor IDE Browser MCP araçlarını kullanan scraper
 * 
 * NOT: Bu scraper Cursor'un browser MCP araçlarını kullanır.
 * Cursor browser MCP araçları doğrudan TypeScript kodundan çağrılamaz,
 * bu yüzden bu dosya bir rehber ve helper fonksiyonlar içerir.
 * 
 * Gerçek scraping için:
 * 1. Cursor IDE'de browser'ı açın (zaten açık)
 * 2. Her keyword için arama URL'sine gidin
 * 3. İlan linklerini manuel olarak toplayın veya
 * 4. Bu script'i Cursor'un MCP browser araçları ile entegre edin
 */
class CursorBrowserScraper {
  private csvWriter: any;
  private outputFile: string;

  constructor(outputFileName: string = 'kariyernet_ilanlar_cursor.csv') {
    this.outputFile = path.join(__dirname, '..', outputFileName);
    
    // CSV Writer oluştur
    this.csvWriter = createObjectCsvWriter({
      path: this.outputFile,
      header: [
        { id: 'pozisyon', title: 'Pozisyon' },
        { id: 'ilanMetni', title: 'IlanMetni' }
      ],
      encoding: 'utf8',
      fieldDelimiter: ';'
    });
  }

  /**
   * İlan verilerini CSV'ye kaydet
   */
  async saveJob(job: JobListing): Promise<void> {
    await this.csvWriter.writeRecords([job]);
    console.log(`✓ İlan kaydedildi: ${job.pozisyon.substring(0, 50)}...`);
  }

  /**
   * Toplu ilan kaydet
   */
  async saveJobs(jobs: JobListing[]): Promise<void> {
    if (jobs.length > 0) {
      await this.csvWriter.writeRecords(jobs);
      console.log(`✓ Toplam ${jobs.length} ilan kaydedildi.`);
    }
  }

  /**
   * Arama URL'si oluştur
   */
  getSearchUrl(keyword: string): string {
    return `https://www.kariyer.net/is-ilanlari?kw=${encodeURIComponent(keyword)}`;
  }

  /**
   * Keyword listesi
   */
  getKeywords(): string[] {
    return [
      'Yönetim Bilişim Sistemleri',
      'İş Analisti',
      'Business Analyst',
      'Sistem Analisti',
      'System Analyst',
      'UI/UX Designer',
      'ERP Danışmanı',
      'ERP Consultant',
      'İş Zekası Uzmanı',
      'Business Intelligence',
      'BI Specialist',
      'Veri Analisti',
      'Data Analyst',
      'Veri Bilimcisi',
      'Data Scientist',
      'Veri Tabanı Yöneticisi',
      'Database Administrator',
      'Yazılım Geliştirici',
      'Software Developer',
      'Ürün Yöneticisi',
      'Proje Yöneticisi',
      'Project Manager',
      'Yazılım Test Uzmanı',
      'Software Test Engineer'
    ];
  }
}

// Ana fonksiyon - Cursor browser MCP araçları ile kullanım için rehber
async function main() {
  const scraper = new CursorBrowserScraper('kariyernet_ilanlar_cursor.csv');
  const keywords = scraper.getKeywords();

  console.log('=== Cursor Browser Scraper ===\n');
  console.log('Bu scraper Cursor IDE tarayıcısını kullanır.');
  console.log('Aşağıdaki adımları izleyin:\n');
  
  console.log('1. Cursor IDE tarayıcısında aşağıdaki URL\'lere gidin:');
  keywords.forEach((keyword, index) => {
    console.log(`   ${index + 1}. ${scraper.getSearchUrl(keyword)}`);
  });
  
  console.log('\n2. Her sayfada ilan linklerini bulun');
  console.log('3. İlan detay sayfalarına gidin');
  console.log('4. Pozisyon ve ilan metnini kopyalayın');
  console.log('5. scraper.saveJob() fonksiyonunu kullanarak kaydedin\n');
  
  console.log('Örnek kullanım:');
  console.log('const job: JobListing = {');
  console.log('  pozisyon: "İş Analisti",');
  console.log('  ilanMetni: "İlan metni buraya..."');
  console.log('};');
  console.log('await scraper.saveJob(job);\n');
}

// Script çalıştırılıyorsa main'i çağır
if (require.main === module) {
  main().catch(console.error);
}

export { CursorBrowserScraper, JobListing };



