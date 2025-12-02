import { useState, useEffect, useCallback, useRef } from 'react';
import { Trailer } from '../types';
import { db } from '../services/api';
import { TrailerCard } from '../components/TrailerCard';
import { SkeletonTrailerCard } from '../components/SkeletonTrailerCard';
import { CatalogFilters } from '../components/CatalogFilters';
import { CatalogSearch } from '../components/CatalogSearch';
import { TrailerDetailsModal } from '../components/TrailerDetailsModal';
import { useSearchParams } from 'react-router-dom';
import { ResponsiveSticky } from '../components/layout/ResponsiveSticky';
import { useTrailerFilters, TRAILER_CATEGORIES } from '../features/trailers';
import { BreadcrumbSchema } from '../components/common';

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
  
  // Debounce timer ref для живого поиска
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state with URL param
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);
  
  // Живое обновление URL при вводе с debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    // Отменяем предыдущий таймер
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Устанавливаем новый debounce (300мс)
    debounceRef.current = setTimeout(() => {
      setSearchParams(prev => {
        if (value.trim()) {
          prev.set('q', value);
        } else {
          prev.delete('q');
        }
        return prev;
      });
    }, 300);
  }, [setSearchParams]);
  
  // Cleanup debounce при размонтировании
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

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

  // Используем хук из features/trailers для фильтрации и сортировки
  const { filteredTrailers } = useTrailerFilters(trailers, {
    searchQuery,
    category: activeCategory,
    onlyInStock,
    minPrice,
    maxPrice,
    axles,
    brakes,
    sortOption,
  });

  // Хлебные крошки для SEO
  const breadcrumbs = [
    { name: 'Главная', url: '/' },
    { name: 'Каталог', url: '/catalog' },
    ...(activeCategory !== 'all' ? [{ 
      name: TRAILER_CATEGORIES.find(c => c.id === activeCategory)?.name || activeCategory 
    }] : [])
  ];

  useEffect(() => {
    const loadTrailers = async () => {
      setLoading(true);
      try {
        // Загружаем прицепы только по категории, поиск будет клиентский
        const data = await db.getTrailers({
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
  }, [activeCategory]); // Загружаем только при смене категории

  // Фильтрация теперь выполняется через useTrailerFilters хук

  const handleCategoryChange = (id: string) => {
    setSearchParams(prev => {
      if (id === 'all') prev.delete('cat');
      else prev.set('cat', id);
      return prev;
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-4 pb-12">
      {/* SEO: Хлебные крошки для поисковых систем */}
      <BreadcrumbSchema items={breadcrumbs} />
      
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Каталог прицепов МЗСА</h1>

        <ResponsiveSticky className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-8 z-30" stickyAt="md" maxHeight="auto" offsetClass="top-20">
          {/* Поиск — над всеми фильтрами */}
          <div className="mb-4">
            <CatalogSearch 
              value={searchQuery}
              onChange={handleSearchChange}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {[...Array(8)].map((_, i) => (
              <SkeletonTrailerCard key={i} />
            ))}
          </div>
        ) : filteredTrailers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
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
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-2">Ничего не найдено</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Попробуйте изменить параметры поиска</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSearchParams({});
                setOnlyInStock(false);
                setMinPrice('');
                setMaxPrice('');
              }}
              className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
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


