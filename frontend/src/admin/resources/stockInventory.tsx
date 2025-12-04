/**
 * Панель остатков по складам
 * Отображает товары с количеством по каждому складу
 * Вдохновлено МойСклад (bystore reports) и InvenTree
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, Warehouse as WarehouseIcon, Search, Filter, 
  Download, RefreshCw, AlertTriangle, ChevronDown, ChevronUp,
  ArrowUpDown, Eye, Edit2, Plus, Minus, ArrowRightLeft
} from 'lucide-react';
import { Trailer, Warehouse } from '../../types';
import { db } from '../../services/api';
import { StockSummary } from '../../services/api/interface';
import { formatPrice } from '../../utils/format';

// Локальный тип для отображения (совместим с StockSummary)
interface StockItem {
  productId: string;
  productName: string;
  productArticle?: string;
  productCategory?: string;
  productImage?: string;
  retailPrice?: number;
  warehouses: {
    [warehouseId: string]: {
      quantity: number;
      reserved: number;
      available: number;
      inTransit?: number;
    };
  };
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
}

type SortField = 'name' | 'article' | 'total' | 'available';
type SortDirection = 'asc' | 'desc';

// Преобразование StockSummary из API в локальный StockItem
const mapStockSummaryToItem = (summary: StockSummary): StockItem => {
  const warehouses: StockItem['warehouses'] = {};
  
  if (summary.byWarehouse) {
    for (const [whId, whStock] of Object.entries(summary.byWarehouse)) {
      warehouses[whId] = {
        quantity: whStock.quantity,
        reserved: whStock.reserved,
        available: whStock.available,
        inTransit: whStock.inTransit
      };
    }
  }
  
  return {
    productId: summary.productId,
    productName: summary.productName,
    productArticle: summary.productArticle,
    productCategory: summary.category,
    productImage: summary.productImage,
    retailPrice: summary.retailPrice,
    warehouses,
    totalQuantity: summary.totalQuantity,
    totalReserved: summary.totalReserved,
    totalAvailable: summary.totalAvailable
  };
};

// Fallback: генерация моковых данных для localStorage провайдера
const generateMockStock = (trailers: Trailer[], warehouses: Warehouse[]): StockItem[] => {
  return trailers.map(trailer => {
    const warehouseStock: StockItem['warehouses'] = {};
    let totalQty = 0;
    let totalRes = 0;
    
    warehouses.filter(w => w.isActive).forEach(wh => {
      const qty = Math.floor(Math.random() * 5);
      const res = Math.floor(Math.random() * Math.min(qty, 2));
      warehouseStock[wh.id] = {
        quantity: qty,
        reserved: res,
        available: qty - res,
        inTransit: Math.random() > 0.7 ? Math.floor(Math.random() * 2) : 0
      };
      totalQty += qty;
      totalRes += res;
    });

    return {
      productId: trailer.id,
      productName: trailer.name,
      productArticle: trailer.article,
      productCategory: trailer.category,
      productImage: trailer.image || trailer.images?.[0],
      retailPrice: trailer.price,
      warehouses: warehouseStock,
      totalQuantity: totalQty,
      totalReserved: totalRes,
      totalAvailable: totalQty - totalRes
    };
  });
};

// Компонент ячейки остатка
interface StockCellProps {
  stock: { quantity: number; reserved: number; available: number; inTransit?: number } | undefined;
  onEdit?: () => void;
}

const StockCell = ({ stock, onEdit }: StockCellProps) => {
  if (!stock || stock.quantity === 0) {
    return (
      <div className="text-center text-gray-400 py-2">
        <span className="text-sm">—</span>
      </div>
    );
  }

  const hasReserved = stock.reserved > 0;
  const hasInTransit = (stock.inTransit || 0) > 0;

  return (
    <div 
      className="text-center py-1 px-2 rounded hover:bg-gray-50 cursor-pointer group"
      onClick={onEdit}
    >
      <div className={`text-lg font-semibold ${stock.available > 0 ? 'text-green-600' : 'text-red-500'}`}>
        {stock.available}
      </div>
      {(hasReserved || hasInTransit) && (
        <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
          {hasReserved && <span title="В резерве">🔒{stock.reserved}</span>}
          {hasInTransit && <span title="В пути">🚚{stock.inTransit}</span>}
        </div>
      )}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit2 size={12} className="inline text-blue-500" />
      </div>
    </div>
  );
};

// Модалка быстрого редактирования
interface QuickEditModalProps {
  isOpen: boolean;
  item: StockItem | null;
  warehouse: Warehouse | null;
  onClose: () => void;
  onSave: (productId: string, warehouseId: string, newQuantity: number) => void;
}

const QuickEditModal = ({ isOpen, item, warehouse, onClose, onSave }: QuickEditModalProps) => {
  const [quantity, setQuantity] = useState(0);
  const [operation, setOperation] = useState<'set' | 'add' | 'remove'>('set');
  const [amount, setAmount] = useState(1);

  useEffect(() => {
    if (item && warehouse) {
      const current = item.warehouses[warehouse.id]?.quantity || 0;
      setQuantity(current);
      setAmount(1);
      setOperation('set');
    }
  }, [item, warehouse]);

  if (!isOpen || !item || !warehouse) return null;

  const currentStock = item.warehouses[warehouse.id];
  const currentQty = currentStock?.quantity || 0;

  const handleSave = () => {
    let newQty = quantity;
    if (operation === 'add') newQty = currentQty + amount;
    if (operation === 'remove') newQty = Math.max(0, currentQty - amount);
    onSave(item.productId, warehouse.id, newQty);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Редактирование остатка</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">Товар: <strong>{item.productName}</strong></p>
          <p className="text-sm text-gray-600">Склад: <strong>{warehouse.name}</strong></p>
          <p className="text-sm text-gray-600">Текущий остаток: <strong>{currentQty} шт.</strong></p>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setOperation('set')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 ${
              operation === 'set' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Package size={16} /> Установить
          </button>
          <button
            onClick={() => setOperation('add')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 ${
              operation === 'add' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Plus size={16} /> Приход
          </button>
          <button
            onClick={() => setOperation('remove')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 ${
              operation === 'remove' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Minus size={16} /> Расход
          </button>
        </div>

        {operation === 'set' ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Новое количество</label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full border rounded-lg px-3 py-2 text-lg"
            />
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {operation === 'add' ? 'Количество прихода' : 'Количество расхода'}
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full border rounded-lg px-3 py-2 text-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Итого будет: {operation === 'add' ? currentQty + amount : Math.max(0, currentQty - amount)} шт.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

// Основной компонент
export const StockInventoryAdmin = () => {
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low' | 'out'>('all');
  
  // Сортировка
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Модалка редактирования
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    item: StockItem | null;
    warehouse: Warehouse | null;
  }>({ isOpen: false, item: null, warehouse: null });

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        // Пробуем загрузить из Supabase (если доступен метод)
        if (db.getStockSummary && db.getWarehouses) {
          const [stockSummary, warehousesData] = await Promise.all([
            db.getStockSummary(),
            db.getWarehouses()
          ]);
          
          setWarehouses(warehousesData);
          setStockItems(stockSummary.map(mapStockSummaryToItem));
        } else {
          // Fallback на localStorage провайдер с моковыми данными
          const [trailersData, settings] = await Promise.all([
            db.getAllTrailers ? db.getAllTrailers() : db.getTrailers(),
            db.getSettings()
          ]);
          
          setTrailers(trailersData);
          
          const warehousesData = settings?.warehouses || [];
          setWarehouses(warehousesData);
          
          // Генерируем моковые остатки
          const stock = generateMockStock(trailersData, warehousesData);
          setStockItems(stock);
        }
      } catch (error) {
        console.error('Failed to load stock data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Фильтрация и сортировка
  const filteredItems = useMemo(() => {
    let result = [...stockItems];

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.productName.toLowerCase().includes(query) ||
        item.productArticle?.toLowerCase().includes(query)
      );
    }

    // Фильтр по категории
    if (categoryFilter !== 'all') {
      result = result.filter(item => item.productCategory === categoryFilter);
    }

    // Фильтр по наличию
    switch (stockFilter) {
      case 'in-stock':
        result = result.filter(item => item.totalAvailable > 0);
        break;
      case 'low':
        result = result.filter(item => item.totalQuantity > 0 && item.totalQuantity <= 2);
        break;
      case 'out':
        result = result.filter(item => item.totalQuantity === 0);
        break;
    }

    // Сортировка
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.productName.localeCompare(b.productName);
          break;
        case 'article':
          comparison = (a.productArticle || '').localeCompare(b.productArticle || '');
          break;
        case 'total':
          comparison = a.totalQuantity - b.totalQuantity;
          break;
        case 'available':
          comparison = a.totalAvailable - b.totalAvailable;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [stockItems, searchQuery, categoryFilter, stockFilter, sortField, sortDirection]);

  // Категории для фильтра
  const categories = useMemo(() => {
    const cats = new Set(stockItems.map(item => item.productCategory).filter(Boolean));
    return Array.from(cats) as string[];
  }, [stockItems]);

  // Активные склады
  const activeWarehouses = useMemo(() => 
    warehouses.filter(w => w.isActive).sort((a, b) => a.priority - b.priority),
    [warehouses]
  );

  // Статистика
  const stats = useMemo(() => {
    const totalProducts = stockItems.length;
    const inStock = stockItems.filter(i => i.totalAvailable > 0).length;
    const lowStock = stockItems.filter(i => i.totalQuantity > 0 && i.totalQuantity <= 2).length;
    const outOfStock = stockItems.filter(i => i.totalQuantity === 0).length;
    const totalUnits = stockItems.reduce((sum, i) => sum + i.totalQuantity, 0);
    const totalValue = stockItems.reduce((sum, i) => sum + (i.retailPrice || 0) * i.totalQuantity, 0);
    
    return { totalProducts, inStock, lowStock, outOfStock, totalUnits, totalValue };
  }, [stockItems]);

  // Обработчик сохранения
  const handleSaveStock = useCallback(async (productId: string, warehouseId: string, newQuantity: number) => {
    // Обновляем локальное состояние сразу
    setStockItems(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      
      const currentStock = item.warehouses[warehouseId] || { quantity: 0, reserved: 0, available: 0 };
      const newStock = {
        ...currentStock,
        quantity: newQuantity,
        available: newQuantity - currentStock.reserved
      };
      
      const newWarehouses = { ...item.warehouses, [warehouseId]: newStock };
      const totalQty = Object.values(newWarehouses).reduce((sum, s) => sum + s.quantity, 0);
      const totalRes = Object.values(newWarehouses).reduce((sum, s) => sum + s.reserved, 0);
      
      return {
        ...item,
        warehouses: newWarehouses,
        totalQuantity: totalQty,
        totalReserved: totalRes,
        totalAvailable: totalQty - totalRes
      };
    }));
    
    // Сохраняем в Supabase если метод доступен
    if (db.setStockQuantity) {
      try {
        await db.setStockQuantity(productId, null, warehouseId, newQuantity);
      } catch (error) {
        console.error('Failed to save stock:', error);
      }
    }
  }, []);

  // Переключение сортировки
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Остатки по складам</h1>
          <p className="text-gray-500 mt-1">Учёт товаров на складах компании</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <RefreshCw size={18} />
            Обновить
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <Download size={18} />
            Экспорт
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
          <div className="text-sm text-gray-500">Всего товаров</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
          <div className="text-sm text-gray-500">В наличии</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
          <div className="text-sm text-gray-500">Мало на складе</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
          <div className="text-sm text-gray-500">Нет в наличии</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-blue-600">{stats.totalUnits}</div>
          <div className="text-sm text-gray-500">Всего единиц</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-purple-600">{formatPrice(stats.totalValue)}</div>
          <div className="text-sm text-gray-500">Общая стоимость</div>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Поиск */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию или артикулу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Категория */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все категории</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'general' ? 'Бортовые' : cat === 'water' ? 'Лодочные' : 'Коммерческие'}
              </option>
            ))}
          </select>

          {/* Фильтр по наличию */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { value: 'all', label: 'Все' },
              { value: 'in-stock', label: 'В наличии' },
              { value: 'low', label: 'Мало' },
              { value: 'out', label: 'Нет' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setStockFilter(option.value as typeof stockFilter)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  stockFilter === option.value 
                    ? 'bg-white shadow text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Таблица остатков */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {activeWarehouses.length === 0 ? (
          <div className="text-center py-12">
            <WarehouseIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет активных складов</p>
            <p className="text-sm text-gray-400 mt-1">Добавьте склады в разделе "Склады"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[300px]">
                    <button 
                      className="flex items-center gap-1 hover:text-blue-600"
                      onClick={() => toggleSort('name')}
                    >
                      Товар
                      <ArrowUpDown size={14} className={sortField === 'name' ? 'text-blue-500' : 'text-gray-400'} />
                    </button>
                  </th>
                  {activeWarehouses.map(wh => (
                    <th key={wh.id} className="text-center py-3 px-4 font-medium text-gray-700 min-w-[100px]">
                      <div className="flex flex-col items-center">
                        <span className="text-sm">{wh.city}</span>
                        <span className="text-xs text-gray-400">{wh.name}</span>
                      </div>
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 font-medium text-gray-700 bg-blue-50 min-w-[80px]">
                    <button 
                      className="flex items-center gap-1 hover:text-blue-600 mx-auto"
                      onClick={() => toggleSort('total')}
                    >
                      Всего
                      <ArrowUpDown size={14} className={sortField === 'total' ? 'text-blue-500' : 'text-gray-400'} />
                    </button>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 bg-green-50 min-w-[80px]">
                    <button 
                      className="flex items-center gap-1 hover:text-blue-600 mx-auto"
                      onClick={() => toggleSort('available')}
                    >
                      Доступно
                      <ArrowUpDown size={14} className={sortField === 'available' ? 'text-blue-500' : 'text-gray-400'} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={activeWarehouses.length + 3} className="text-center py-12 text-gray-500">
                      Товары не найдены
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.productId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-3">
                          {item.productImage ? (
                            <img 
                              src={item.productImage} 
                              alt="" 
                              className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package size={20} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 line-clamp-1">{item.productName}</div>
                            <div className="text-sm text-gray-500">
                              {item.productArticle && <span>Арт: {item.productArticle}</span>}
                              {item.retailPrice && (
                                <span className="ml-2">{formatPrice(item.retailPrice)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {activeWarehouses.map(wh => (
                        <td key={wh.id} className="py-1 px-2 border-l">
                          <StockCell 
                            stock={item.warehouses[wh.id]}
                            onEdit={() => setEditModal({ isOpen: true, item, warehouse: wh })}
                          />
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center font-semibold bg-blue-50/50 border-l">
                        {item.totalQuantity}
                      </td>
                      <td className={`py-3 px-4 text-center font-semibold border-l ${
                        item.totalAvailable > 0 ? 'bg-green-50/50 text-green-600' : 'bg-red-50/50 text-red-500'
                      }`}>
                        {item.totalAvailable}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Легенда */}
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="text-green-600 font-semibold">N</span>
          <span>— доступно к продаже</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔒</span>
          <span>— в резерве</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🚚</span>
          <span>— в пути</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">—</span>
          <span>— нет на складе</span>
        </div>
      </div>

      {/* Модалка редактирования */}
      <QuickEditModal
        isOpen={editModal.isOpen}
        item={editModal.item}
        warehouse={editModal.warehouse}
        onClose={() => setEditModal({ isOpen: false, item: null, warehouse: null })}
        onSave={handleSaveStock}
      />
    </div>
  );
};
