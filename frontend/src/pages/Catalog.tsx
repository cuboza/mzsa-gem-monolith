import { useState, useEffect, useMemo } from 'react';
import { Trailer } from '../types';
import { db } from '../services/api';
import { TrailerCard } from '../components/TrailerCard';
import { SkeletonTrailerCard } from '../components/SkeletonTrailerCard';
import { CatalogFilters } from '../components/CatalogFilters';
import { CatalogSearch } from '../components/CatalogSearch';
import { TrailerDetailsModal } from '../components/TrailerDetailsModal';
import { useSearchParams } from 'react-router-dom';
import { ResponsiveSticky } from '../components/layout/ResponsiveSticky';

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
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [axles, setAxles] = useState(searchParams.get('axles') || 'all');
  const [brakes, setBrakes] = useState(searchParams.get('brakes') || 'all');
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'price_asc');

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

  const parseDimensions = (dimStr?: string) => {
    if (!dimStr) return { length: 0, width: 0, height: 0 };
    const match = dimStr.match(/(\d+)[xх](\d+)[xх](\d+)/);
    if (match) {
      return {
        length: parseInt(match[1]),
        width: parseInt(match[2]),
        height: parseInt(match[3])
      };
    }
    return { length: 0, width: 0, height: 0 };
  };

  const parseBoatLength = (dimStr?: string) => {
    if (!dimStr) return 0;
    const match = dimStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
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

  // Client-side filtering and sorting
  const filteredTrailers = useMemo(() => {
    let result = trailers.filter(trailer => {
      // 1. Наличие
      if (onlyInStock && trailer.availability !== 'in_stock') return false;

      // 2. Цена
      if (minPrice && trailer.price < parseInt(minPrice)) return false;
      if (maxPrice && trailer.price > parseInt(maxPrice)) return false;

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

    // Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'availability':
          const availOrder = { 'in_stock': 0, 'days_1_3': 1, 'days_7_14': 2 };
          return (availOrder[a.availability] || 3) - (availOrder[b.availability] || 3);
        case 'axles_asc':
          return (a.specs?.axles || 0) - (b.specs?.axles || 0);
        case 'axles_desc':
          return (b.specs?.axles || 0) - (a.specs?.axles || 0);
        case 'brakes':
           // Sort by weight as proxy for brakes/complexity
           const wA = parseInt((a.specs?.weight || '0').replace(/\D/g, ''));
           const wB = parseInt((b.specs?.weight || '0').replace(/\D/g, ''));
           return wB - wA;
        case 'length_desc':
          return parseDimensions(b.dimensions).length - parseDimensions(a.dimensions).length;
        case 'area_desc':
          const dimA = parseDimensions(a.dimensions);
          const dimB = parseDimensions(b.dimensions);
          return (dimB.length * dimB.width) - (dimA.length * dimA.width);
        case 'volume_desc':
          const volA = parseDimensions(a.dimensions);
          const volB = parseDimensions(b.dimensions);
          return (volB.length * volB.width * volB.height) - (volA.length * volA.width * volA.height);
        case 'boat_length_desc':
          return parseBoatLength(b.bodyDimensions) - parseBoatLength(a.bodyDimensions);
        default:
          return 0;
      }
    });

    return result;
  }, [trailers, onlyInStock, minPrice, maxPrice, axles, brakes, sortOption]);

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

        <ResponsiveSticky className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8 z-30" stickyAt="md" maxHeight="auto" offsetClass="top-20">
          {/* Поиск — над всеми фильтрами */}
          <div className="mb-4">
            <CatalogSearch 
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={handleSearchSubmit}
            />
          </div>
          
          <CatalogFilters 
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            
            minPrice={minPrice}
            onMinPriceChange={(val) => { setMinPrice(val); updateFilters('min_price', val); }}
            maxPrice={maxPrice}
            onMaxPriceChange={(val) => { setMaxPrice(val); updateFilters('max_price', val); }}
            
            onlyInStock={onlyInStock}
            onStockChange={(val) => { setOnlyInStock(val); updateFilters('stock', String(val)); }}
            
            axles={axles}
            onAxlesChange={(val) => { setAxles(val); updateFilters('axles', val); }}
            
            brakes={brakes}
            onBrakesChange={(val) => { setBrakes(val); updateFilters('brakes', val); }}
            
            sortOption={sortOption}
            onSortChange={(val) => { setSortOption(val); updateFilters('sort', val); }}

            totalCount={filteredTrailers.length}
          />
        </ResponsiveSticky>

        {/* Сетка товаров */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonTrailerCard key={i} />
            ))}
          </div>
        ) : filteredTrailers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrailers.map((trailer, index) => (
              <div key={trailer.id} className="stagger-item" style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}>
                <TrailerCard 
                  trailer={trailer} 
                  onClick={setSelectedTrailer}
                />
              </div>
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
                setMinPrice('');
                setMaxPrice('');
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


