'use client';

import { useEffect, useState, useMemo } from 'react';

interface JobListing {
  pozisyon: string;
  ilanMetni: string;
}

interface ParsedSection {
  title: string;
  content: string;
}

// İlan metnini başlıklara göre bölümlere ayır
function parseJobDescription(text: string): ParsedSection[] {
  if (!text) return [];
  
  const sections: ParsedSection[] = [];
  const titleMatches: Array<{ index: number; title: string; length: number }> = [];
  
  // 1. Büyük harfle yazılmış başlıkları bul (GÖREV TANIMI, ARANAN NİTELİKLER)
  const upperCasePattern = /\b([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ\s]{2,30})(?:[:：]|$)/g;
  let upperMatch;
  while ((upperMatch = upperCasePattern.exec(text)) !== null) {
    const title = upperMatch[1].trim();
    // Yaygın başlık kelimelerini içeriyorsa ekle
    if (/(TANIM|NİTELİK|GEREKSİNİM|SORUMLULUK|AVANTAJ|ŞART|KONUM|LOKASYON|HAKKINDA|GÖREV|İŞ)/i.test(title)) {
      titleMatches.push({
        index: upperMatch.index,
        title: title,
        length: upperMatch[0].length,
      });
    }
  }
  
  // 2. Normal başlıkları bul (İş Tanımı:, Aranan Nitelikler:)
  const normalPattern = /\b(Hakkımızda|Hakkında|İş\s+Tanımı|İş\s+Tanimi|Görev\s+Tanımı|Görev\s+Tanimi|Görev|Aranan\s+Nitelikler|Nitelikler|Gereksinimler|Genel\s+Nitelikler|Pozisyon\s+Hakkında|Sorumluluklar|Avantajlar|Çalışma\s+Şartları|Konum|Lokasyon)[:：]?\s*/gi;
  let normalMatch;
  while ((normalMatch = normalPattern.exec(text)) !== null) {
    const title = normalMatch[1];
    const matchIndex = normalMatch.index;
    const matchLength = normalMatch[0].length;
    
    // Büyük harfle yazılmış başlıkla çakışmıyorsa ekle
    const isOverlapping = titleMatches.some(
      (m) => Math.abs(m.index - matchIndex) < 30
    );
    
    if (!isOverlapping) {
      // Başlığı düzgün formatla
      const formattedTitle = title
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      titleMatches.push({
        index: matchIndex,
        title: formattedTitle,
        length: matchLength,
      });
    }
  }
  
  // Başlıkları index'e göre sırala
  titleMatches.sort((a, b) => a.index - b.index);
  
  // İlk bölümü işle (başlık yoksa "Genel Bilgiler")
  let currentTitle = 'Genel Bilgiler';
  let lastIndex = 0;
  
  for (let i = 0; i < titleMatches.length; i++) {
    const match = titleMatches[i];
    const nextMatch = i < titleMatches.length - 1 ? titleMatches[i + 1] : null;
    
    // Önceki bölümü kaydet
    if (match.index > lastIndex) {
      const prevContent = text.substring(lastIndex, match.index).trim();
      if (prevContent) {
        sections.push({
          title: currentTitle,
          content: prevContent,
        });
      }
    }
    
    // Başlık sonrası içeriği al
    const contentStart = match.index + match.length;
    const contentEnd = nextMatch ? nextMatch.index : text.length;
    const content = text.substring(contentStart, contentEnd).trim();
    
    if (content) {
      sections.push({
        title: match.title,
        content: content,
      });
    }
    
    currentTitle = match.title;
    lastIndex = contentEnd;
  }
  
  // Son kalan içeriği ekle
  if (lastIndex < text.length) {
    const lastContent = text.substring(lastIndex).trim();
    if (lastContent && sections.length > 0) {
      // Son bölüme ekle
      sections[sections.length - 1].content += ' ' + lastContent;
    } else if (lastContent) {
      sections.push({
        title: currentTitle,
        content: lastContent,
      });
    }
  }
  
  // Eğer hiç bölüm bulunamadıysa, tüm metni "Genel Bilgiler" olarak döndür
  if (sections.length === 0) {
    sections.push({
      title: 'Genel Bilgiler',
      content: text,
    });
  }
  
  return sections;
}

interface ApiResponse {
  success: boolean;
  data: JobListing[];
  count: number;
  lastUpdated?: string;
  error?: string;
}

export default function Home() {
  const [data, setData] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // CSV verilerini çek
  const fetchData = async () => {
    try {
      const response = await fetch('/api/csv', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error('Veri çekilemedi');
      }
      
      const result: ApiResponse = await response.json();
      
      if (result.success) {
        // Tüm kayıtları set et (filtreleme yok)
        setData(result.data);
        setError(null);
        if (result.lastUpdated) {
          setLastUpdated(new Date(result.lastUpdated));
        }
        // Konsola kayıt sayısını yazdır (debug için)
        if (result.count) {
          console.log(`✅ ${result.count} ilan yüklendi`);
        }
      } else {
        throw new Error(result.error || 'Bilinmeyen hata');
      }
    } catch (err: any) {
      setError(err.message || 'Veri yüklenirken hata oluştu');
      console.error('Fetch hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    fetchData();
  }, []);

  // Otomatik yenileme (her 2 saniyede bir - daha sık güncelleme)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 2000); // 2 saniye - realtime için daha sık

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // ESC tuşu ile modal kapatma ve body scroll kontrolü
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      // Modal açıkken body scroll'unu engelle
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      // Modal kapalıyken body scroll'unu geri aç
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Pozisyon başlığından kategori ve şirket adını ayır
  const parsePosition = (pozisyon: string) => {
    if (!pozisyon) return { title: '-', company: '', category: 'Genel' };
    
    // Satırları ayır ve temizle
    const lines = pozisyon
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && l.length > 0);
    
    // İlk satır pozisyon başlığı
    const title = lines[0] || pozisyon.trim();
    
    // Son satır genelde şirket adı (eğer birden fazla satır varsa)
    const company = lines.length > 1 ? lines[lines.length - 1] : '';
    
    // Kategoriyi pozisyon adından çıkar (ilk 2 kelime)
    const words = title.split(/\s+/).filter(w => w);
    const category = words.length >= 2 
      ? `${words[0]} ${words[1]}` 
      : words[0] || 'Genel';
    
    return { title, company, category };
  };

  // Filtreleme
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const searchLower = searchTerm.toLowerCase().trim();
    return data.filter((job) => {
      const pozisyon = (job.pozisyon || '').toLowerCase();
      const ilanMetni = (job.ilanMetni || '').toLowerCase();
      return pozisyon.includes(searchLower) || ilanMetni.includes(searchLower);
    });
  }, [data, searchTerm]);

  // Modal aç/kapa
  const openModal = (job: JobListing) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                📊 Kariyer.net İlan Viewer
              </h1>
              <p className="text-gray-600">
                Realtime CSV veri görüntüleyici ve filtreleme sistemi
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {lastUpdated && (
                  <div>
                    <span className="font-semibold">Son Güncelleme:</span>{' '}
                    {lastUpdated.toLocaleTimeString('tr-TR')}
                  </div>
                )}
                <div className="mt-1">
                  <span className="font-semibold">Toplam İlan:</span>{' '}
                  <span className="text-blue-600 font-bold">{data.length}</span>
                  {searchTerm && (
                    <span className="ml-2">
                      (Filtrelenmiş: {filteredData.length})
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setAutoRefresh(!autoRefresh);
                  if (!autoRefresh) fetchData();
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  autoRefresh
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {autoRefresh ? '🔄 Otomatik Yenileme: Açık' : '⏸️ Otomatik Yenileme: Kapalı'}
              </button>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                🔄 Yenile
              </button>
            </div>
          </div>
        </div>

        {/* Arama ve Filtreleme */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔍 Arama (Pozisyon veya İlan Metni)
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Arama yapın... (örn: İş Analisti, ERP, Veri Analisti)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                ✕ Temizle
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800">Hata</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Job Cards */}
        {!loading && !error && (
          <div>
            {filteredData.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-500">
                <p className="text-lg">Sonuç bulunamadı</p>
                {searchTerm && (
                  <p className="mt-2 text-sm">
                    "{searchTerm}" için eşleşen ilan bulunamadı
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredData.map((job, index) => {
                  const { title, company, category } = parsePosition(job.pozisyon);
                  return (
                    <div
                      key={index}
                      onClick={() => openModal(job)}
                      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-blue-500 p-6 hover:border-blue-600 transform hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                            {title}
                          </h3>
                          {company && (
                            <p className="text-sm text-gray-600 mb-2">
                              🏢 {company}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          {category || 'Genel'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Detay için tıklayın →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {isModalOpen && selectedJob && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">
                      {parsePosition(selectedJob.pozisyon).title}
                    </h2>
                    {parsePosition(selectedJob.pozisyon).company && (
                      <p className="text-blue-100 text-lg">
                        🏢 {parsePosition(selectedJob.pozisyon).company}
                      </p>
                    )}
                    <span className="inline-block mt-2 px-3 py-1 bg-white bg-opacity-20 text-white text-sm font-semibold rounded-full">
                      {parsePosition(selectedJob.pozisyon).category || 'Genel'}
                    </span>
                  </div>
                  <button
                    onClick={closeModal}
                    className="ml-4 text-white hover:text-gray-200 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                {selectedJob.ilanMetni ? (
                  <div className="space-y-4">
                    {parseJobDescription(selectedJob.ilanMetni).map((section, sectionIndex) => (
                      <div
                        key={sectionIndex}
                        className="border-l-4 border-blue-500 pl-4 py-4 bg-gradient-to-r from-blue-50 to-transparent rounded-r-lg shadow-sm"
                      >
                        <h4 className="font-bold text-blue-800 text-lg mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          {section.title}
                        </h4>
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm pl-4">
                          {section.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">İlan metni bulunamadı.</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-gray-600 text-sm">
          <p>
            Veriler her 2 saniyede bir otomatik olarak güncellenmektedir (Realtime)
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Toplam {data.length} ilan görüntüleniyor
            {searchTerm && ` (${filteredData.length} filtrelenmiş)`}
          </p>
        </div>
      </div>
    </div>
  );
}
