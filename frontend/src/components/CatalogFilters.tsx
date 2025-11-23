import { Filter } from 'lucide-react';

interface CatalogFiltersProps {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  minPrice: string;
  onMinPriceChange: (val: string) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  onlyInStock: boolean;
  onStockChange: (inStock: boolean) => void;
  axles: string;
  onAxlesChange: (val: string) => void;
  brakes: string;
  onBrakesChange: (val: string) => void;
  sortOption: string;
  onSortChange: (val: string) => void;
  totalCount: number;
}

export const CatalogFilters = ({
  activeCategory,
  onCategoryChange,
  showFilters,
  onToggleFilters,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  onlyInStock,
  onStockChange,
  axles,
  onAxlesChange,
  brakes,
  onBrakesChange,
  sortOption,
  onSortChange,
  totalCount
}: CatalogFiltersProps) => {
  const categories = [
    { id: 'all', name: 'Все' },
    { id: 'general', name: 'Универсальные' },
    { id: 'water', name: 'Лодочные' },
    { id: 'commercial', name: 'Коммерческие' },
    { id: 'wrecker', name: 'Эвакуаторы' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-8 sticky top-20 z-30">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
        {/* Категории (Desktop) */}
        <div className="hidden md:flex gap-2 overflow-x-auto pb-2 w-full">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
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

        {/* Кнопка фильтров (Mobile) */}
        <button
          onClick={onToggleFilters}
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
            onClick={() => onCategoryChange(cat.id)}
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
          {/* Сортировка */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Сортировка:</span>
            <select 
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="price_asc">Цена (возрастание)</option>
              <option value="price_desc">Цена (убывание)</option>
              <option value="availability">Сначала в наличии</option>
              <option value="axles_asc">Кол-во осей (возрастание)</option>
              <option value="axles_desc">Кол-во осей (убывание)</option>
              <option value="brakes">Сначала с тормозами</option>
              <option value="length_desc">Длина кузова (убывание)</option>
              <option value="area_desc">Площадь кузова (убывание)</option>
              <option value="volume_desc">Объем фургона (убывание)</option>
              <option value="boat_length_desc">Длина судна (убывание)</option>
            </select>
          </div>

          {/* Цена */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Цена:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                placeholder="От"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
                className="w-24 border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="До"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                className="w-24 border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />
            </div>
          </div>

          {/* Оси */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Оси:</span>
            <select 
              value={axles}
              onChange={(e) => onAxlesChange(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">Все</option>
              <option value="1">1 ось</option>
              <option value="2">2 оси</option>
            </select>
          </div>

          {/* Тормоза (вместо прав, так понятнее) */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Тормоза:</span>
            <select 
              value={brakes}
              onChange={(e) => onBrakesChange(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">Все</option>
              <option value="no">Без тормозов (до 750кг)</option>
              <option value="yes">С тормозами (от 750кг)</option>
            </select>
          </div>

          {/* Наличие чекбокс */}
          <label className="flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => onStockChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">В наличии</span>
          </label>

          <div className="flex-grow"></div>
          
          <div className="text-sm text-gray-500">
            Найдено: <span className="font-bold text-gray-900">{totalCount}</span>
          </div>
        </div>
      )}
    </div>
  );
};
