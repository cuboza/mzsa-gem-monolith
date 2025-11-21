import { useState, useEffect, useMemo } from 'react';
import { Trailer } from '../types';
import { db } from '../services/api';
import { TrailerCard } from '../components/TrailerCard';
import { SkeletonTrailerCard } from '../components/SkeletonTrailerCard';
import { CatalogFilters } from '../components/CatalogFilters';
import { CatalogSearch } from '../components/CatalogSearch';
import { TrailerDetailsModal } from '../components/TrailerDetailsModal';
import { useSearchParams } from 'react-router-dom';

export const Catalog = () => {
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Фильтры
  const activeCategory = searchParams.get('cat') || 'all';
  const queryParam = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [showFilters, setShowFilters] = useState(false);
  
  // State for filters
  const [onlyInStock, setOnlyInStock] = useState(searchParams.get('stock') === 'true');
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>((searchParams.get('price') as any) || 'all');
  const [axles, setAxles] = useState(searchParams.get('axles') || 'all');
  const [brakes, setBrakes] = useState(searchParams.get('brakes') || 'all');

  // Sync local state with URL param
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  // Update URL when filters change
  const updateFilters = (key: string, value: string) => {
    setSearchParams(prev => {
      if (value === 'all' || value === 'false' || value === '') {
        prev.delete(key);
      } else {
        prev.set(key, value);
      }
      return prev;
    });
  };

  useEffect(() => {
    const loadTrailers = async () => {
      setLoading(true);
      try {
        const data = await db.getTrailers({
          q: queryParam,
          category: activeCategory
        });
        setTrailers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTrailers();
  }, [activeCategory, queryParam]);

  // Client-side filtering
  const filteredTrailers = useMemo(() => {
    return trailers.filter(trailer => {
      // 1. Наличие
      if (onlyInStock && trailer.availability !== 'in_stock') return false;

      // 2. Цена
      if (priceRange === 'low' && trailer.price > 80000) return false;
      if (priceRange === 'mid' && (trailer.price <= 80000 || trailer.price > 150000)) return false;
      if (priceRange === 'high' && trailer.price <= 150000) return false;

      // 3. Оси
      if (axles !== 'all') {
        if (trailer.specs?.axles && trailer.specs.axles !== parseInt(axles)) return false;
      }

      // 4. Тормоза (по полной массе)
      if (brakes !== 'all') {
        // Парсим "750 кг" -> 750
        const weightStr = trailer.specs?.weight || '';
        const weight = parseInt(weightStr.replace(/\D/g, ''));
        
        if (!isNaN(weight)) {
          if (brakes === 'no' && weight > 750) return false;
          if (brakes === 'yes' && weight <= 750) return false;
        }
      }

      return true;
    });
  }, [trailers, onlyInStock, priceRange, axles, brakes]);

  const handleCategoryChange = (id: string) => {
    setSearchParams(prev => {
      if (id === 'all') prev.delete('cat');
      else prev.set('cat', id);
      return prev;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => {
      if (searchQuery) prev.set('q', searchQuery);
      else prev.delete('q');
      return prev;
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-4 pb-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Каталог прицепов МЗСА</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8 sticky top-20 z-30">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <CatalogFilters 
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              
              priceRange={priceRange}
              onPriceRangeChange={(val) => { setPriceRange(val); updateFilters('price', val); }}
              
              onlyInStock={onlyInStock}
              onStockChange={(val) => { setOnlyInStock(val); updateFilters('stock', String(val)); }}
              
              axles={axles}
              onAxlesChange={(val) => { setAxles(val); updateFilters('axles', val); }}
              
              brakes={brakes}
              onBrakesChange={(val) => { setBrakes(val); updateFilters('brakes', val); }}
              
              totalCount={filteredTrailers.length}
            />
            
            <CatalogSearch 
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearchSubmit}
            />
          </div>
        </div>

        {/* Сетка товаров */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonTrailerCard key={i} />
            ))}
          </div>
        ) : filteredTrailers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrailers.map(trailer => (
              <TrailerCard 
                key={trailer.id} 
                trailer={trailer} 
                onClick={setSelectedTrailer}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed">
            <p className="text-xl text-gray-500 mb-2">Ничего не найдено</p>
            <p className="text-sm text-gray-400">Попробуйте изменить параметры поиска</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSearchParams({});
                setOnlyInStock(false);
                setPriceRange('all');
              }}
              className="mt-4 text-blue-600 hover:underline"
            >
              Сбросить все фильтры
            </button>
          </div>
        )}
      </div>

      {selectedTrailer && (
        <TrailerDetailsModal 
          trailer={selectedTrailer} 
          onClose={() => setSelectedTrailer(null)} 
        />
      )}
    </div>
  );
};


