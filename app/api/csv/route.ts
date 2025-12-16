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
    const records: JobListing[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ';',
      bom: true, // UTF-8 BOM desteği
      trim: false, // Trim yapma, çünkü çok satırlı format bozulabilir
      relax_column_count: true, // Kolon sayısı esnekliği
      relax_quotes: false, // Tırnak kurallarına uy
      quote: '"', // Tırnak karakteri
      escape: '"', // Escape karakteri (çift tırnak)
      ltrim: false,
      rtrim: false,
      cast: false, // Otomatik tip dönüşümü yapma
      skip_records_with_error: false, // Hatalı kayıtları atlama
    });
    
    // Parse edilen verileri temizle ve formatla
    const cleanedRecords: JobListing[] = records.map((record: any) => {
      return {
        pozisyon: (record.Pozisyon || record.pozisyon || '').trim().replace(/\n\s+/g, ' ').replace(/\s+/g, ' '),
        ilanMetni: (record.IlanMetni || record.ilanMetni || '').trim(),
      };
    }).filter((record: JobListing) => record.pozisyon || record.ilanMetni); // Boş kayıtları filtrele
    
    console.log(`CSV parse edildi: ${cleanedRecords.length} kayıt bulundu`);
    
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
