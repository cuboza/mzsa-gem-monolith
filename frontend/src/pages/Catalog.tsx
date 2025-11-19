import { useState, useEffect, useMemo } from 'react';
import { Trailer } from '../types';
import { db } from '../services/api';
import { TrailerCard } from '../components/TrailerCard';
import { Search, Filter, X } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const Catalog = () => {
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Фильтры
  const activeCategory = searchParams.get('cat') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all');

  useEffect(() => {
    const loadTrailers = async () => {
      try {
        const data = await db.getTrailers();
        setTrailers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadTrailers();
  }, []);

  // Категории
  const categories = [
    { id: 'all', name: 'Все' },
    { id: 'general', name: 'Дачные' },
    { id: 'moto', name: 'Мототехника' },
    { id: 'water', name: 'Лодочные' },
    { id: 'commercial', name: 'Коммерческие' },
    { id: 'wrecker', name: 'Эвакуаторы' }
  ];

  // Фильтрация данных
  const filteredTrailers = useMemo(() => {
    return trailers.filter(trailer => {
      // 1. Категория
      if (activeCategory !== 'all' && trailer.category !== activeCategory) return false;
      
      // 2. Поиск
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const match = 
          trailer.model.toLowerCase().includes(query) || 
          trailer.name.toLowerCase().includes(query);
        if (!match) return false;
      }

      // 3. Наличие
      if (onlyInStock && trailer.availability !== 'in_stock') return false;

      // 4. Цена
      if (priceRange === 'low' && trailer.price > 80000) return false;
      if (priceRange === 'mid' && (trailer.price <= 80000 || trailer.price > 150000)) return false;
      if (priceRange === 'high' && trailer.price <= 150000) return false;

      return true;
    });
  }, [trailers, activeCategory, searchQuery, onlyInStock, priceRange]);

  const handleCategoryChange = (id: string) => {
    setSearchParams(prev => {
      if (id === 'all') {
        prev.delete('cat');
      } else {
        prev.set('cat', id);
      }
      return prev;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-4 pb-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Каталог прицепов МЗСА</h1>

        {/* Фильтры и поиск */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8 sticky top-20 z-30">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            {/* Категории (Desktop) */}
            <div className="hidden md:flex gap-2 overflow-x-auto pb-2 w-full">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                    activeCategory === cat.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Поиск */}
            <div className="relative w-full md:w-64 flex-shrink-0">
              <input
                type="text"
                placeholder="Поиск модели..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

            {/* Кнопка фильтров (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden w-full px-4 py-2 border rounded-lg flex items-center justify-center space-x-2 bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              <span>Фильтры</span>
            </button>
          </div>

          {/* Категории (Mobile Scroll) */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Расширенные фильтры */}
          {(showFilters || window.innerWidth >= 768) && (
            <div className={`md:flex gap-6 items-center pt-4 border-t ${showFilters ? 'block' : 'hidden md:flex'}`}>
              {/* Цена */}
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <span className="text-sm font-semibold text-gray-700">Цена:</span>
                <select 
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value as any)}
                  className="border rounded-md px-2 py-1 text-sm"
                >
                  <option value="all">Любая</option>
                  <option value="low">До 80 000 ₽</option>
                  <option value="mid">80 - 150 000 ₽</option>
                  <option value="high">От 150 000 ₽</option>
                </select>
              </div>

              {/* Наличие чекбокс */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Только в наличии</span>
              </label>

              <div className="flex-grow"></div>
              
              <div className="text-sm text-gray-500">
                Найдено: <span className="font-bold text-gray-900">{filteredTrailers.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Сетка товаров */}
        {filteredTrailers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTrailers.map(trailer => (
              <TrailerCard 
                key={trailer.id} 
                trailer={trailer} 
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
                setOnlyInStock(false);
                setPriceRange('all');
                handleCategoryChange('all');
              }}
              className="mt-4 text-blue-600 hover:underline"
            >
              Сбросить все фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

