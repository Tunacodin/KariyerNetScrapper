import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface JobListing {
  pozisyon: string;
  ilanMetni: string;
}

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'kariyernet_ilanlar.csv');
    
    // CSV dosyasını oku
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    // CSV'yi parse et (semicolon delimiter, çok satırlı ve tırnaklı format desteği)
    // Not: CSV formatı çok satırlı ve tırnaklı olduğu için özel ayarlar gerekli
    let records: any[] = [];
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: false, // Boş satırları da oku (sonra filtreleriz)
        delimiter: ';',
        bom: true, // UTF-8 BOM desteği
        trim: false, // Trim yapma, çünkü çok satırlı format bozulabilir
        relax_column_count: true, // Kolon sayısı esnekliği
        relax_quotes: true, // Tırnak kurallarını esnet
        quote: '"', // Tırnak karakteri
        escape: '"', // Escape karakteri (çift tırnak)
        ltrim: false,
        rtrim: false,
        cast: false, // Otomatik tip dönüşümü yapma
        skip_records_with_error: true, // Hatalı kayıtları atla
      });
    } catch (parseError: any) {
      console.error('CSV parse hatası:', parseError);
      // Hata olsa bile devam et, kısmi veri döndür
    }
    
    console.log(`CSV parse edildi: ${records.length} ham kayıt bulundu`);
    
    // Parse edilen verileri temizle ve formatla
    const cleanedRecords: JobListing[] = records
      .map((record: any) => {
        const pozisyon = (record.Pozisyon || record.pozisyon || '').trim();
        const ilanMetni = (record.IlanMetni || record.ilanMetni || '').trim();
        
        // Pozisyon alanını temizle (fazla boşlukları azalt ama yapıyı koru)
        const cleanedPozisyon = pozisyon
          .replace(/\n\s*\n/g, '\n') // Çift satır sonlarını tek yap
          .replace(/\s{3,}/g, ' ') // 3+ boşluğu tek boşluğa çevir
          .trim();
        
        return {
          pozisyon: cleanedPozisyon,
          ilanMetni: ilanMetni,
        };
      })
      .filter((record: JobListing) => {
        // Sadece gerçekten boş olanları filtrele
        const hasPozisyon = record.pozisyon && record.pozisyon.trim().length > 0;
        const hasIlanMetni = record.ilanMetni && record.ilanMetni.trim().length > 0;
        return hasPozisyon || hasIlanMetni;
      });
    
    console.log(`✅ Temizlenmiş kayıt sayısı: ${cleanedRecords.length}`);
    console.log(`📊 İlk 3 kayıt örneği:`, cleanedRecords.slice(0, 3).map(r => ({
      pozisyon: r.pozisyon.substring(0, 50) + '...',
      ilanMetniLength: r.ilanMetni.length
    })));
    
    if (cleanedRecords.length === 0) {
      console.warn('⚠️  UYARI: Hiç kayıt bulunamadı! CSV dosyası boş olabilir veya parse hatası var.');
    }
    
    return NextResponse.json(
      {
        success: true,
        data: cleanedRecords,
        count: cleanedRecords.length,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error: any) {
    console.error('CSV okuma hatası:', error);
    console.error('Hata detayı:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'CSV dosyası okunamadı',
        data: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
