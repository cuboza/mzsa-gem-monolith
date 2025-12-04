/**
 * История движения товаров по складам
 * Операции: приход, расход, перемещение, инвентаризация
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, Search, Filter, Download, Plus, Minus, 
  ArrowRightLeft, ClipboardCheck, Calendar, User,
  ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { Trailer, Warehouse } from '../../types';
import { db } from '../../services/api';
import { StockMovement as ApiStockMovement, MovementType as ApiMovementType } from '../../services/api/interface';
import { formatPrice, formatDateTime } from '../../utils/format';

// Локальные типы (совместимы с API)
export type MovementType = ApiMovementType;

export interface StockMovement {
  id: string;
  type: MovementType;
  productId: string;
  productName: string;
  productArticle?: string;
  
  // Откуда-куда
  fromWarehouseId?: string;
  fromWarehouseName?: string;
  toWarehouseId?: string;
  toWarehouseName?: string;
  
  // Количество
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  
  // Метаданные
  reason?: string;
  documentNumber?: string;
  createdAt: string;
  createdBy: string;
  
  // Связанные данные
  orderId?: string;
  supplierId?: string;
}

// Преобразование API движения в локальный тип
const mapApiMovement = (m: ApiStockMovement & { productName?: string; productArticle?: string; fromWarehouseName?: string; toWarehouseName?: string }): StockMovement => ({
  id: m.id,
  type: m.movementType,
  productId: m.trailerId || m.optionId || '',
  productName: m.productName || '',
  productArticle: m.productArticle,
  fromWarehouseId: m.fromWarehouseId,
  fromWarehouseName: m.fromWarehouseName,
  toWarehouseId: m.toWarehouseId,
  toWarehouseName: m.toWarehouseName,
  quantity: m.quantity,
  previousQuantity: m.previousQuantity || 0,
  newQuantity: m.newQuantity || 0,
  reason: m.reason,
  documentNumber: m.documentNumber,
  createdAt: m.createdAt,
  createdBy: m.createdByName || 'Система',
  orderId: m.leadId,
});

// Константы
const MOVEMENT_TYPES: Record<MovementType, { label: string; color: string; icon: React.ElementType }> = {
  receipt: { label: 'Приход', color: 'bg-green-100 text-green-700', icon: Plus },
  shipment: { label: 'Расход', color: 'bg-red-100 text-red-700', icon: Minus },
  transfer: { label: 'Перемещение', color: 'bg-blue-100 text-blue-700', icon: ArrowRightLeft },
  adjustment: { label: 'Корректировка', color: 'bg-yellow-100 text-yellow-700', icon: ClipboardCheck }
};

// Генерация моковых данных
const generateMockMovements = (trailers: Trailer[], warehouses: Warehouse[]): StockMovement[] => {
  const movements: StockMovement[] = [];
  const activeWh = warehouses.filter(w => w.isActive);
  const types: MovementType[] = ['receipt', 'shipment', 'transfer', 'adjustment'];
  const reasons = [
    'Поставка от производителя',
    'Продажа клиенту',
    'Перемещение между складами',
    'Инвентаризация',
    'Возврат товара',
    'Списание брака'
  ];
  
  // Генерируем 50 случайных движений за последний месяц
  for (let i = 0; i < 50; i++) {
    const trailer = trailers[Math.floor(Math.random() * trailers.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const qty = Math.floor(Math.random() * 3) + 1;
    const prevQty = Math.floor(Math.random() * 5);
    
    let fromWh: Warehouse | undefined;
    let toWh: Warehouse | undefined;
    
    if (type === 'receipt' || type === 'adjustment') {
      toWh = activeWh[Math.floor(Math.random() * activeWh.length)];
    } else if (type === 'shipment') {
      fromWh = activeWh[Math.floor(Math.random() * activeWh.length)];
    } else if (type === 'transfer') {
      const shuffled = [...activeWh].sort(() => 0.5 - Math.random());
      fromWh = shuffled[0];
      toWh = shuffled[1] || shuffled[0];
    }
    
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
    
    movements.push({
      id: `mov-${i + 1}`,
      type,
      productId: trailer.id,
      productName: trailer.name,
      productArticle: trailer.article,
      fromWarehouseId: fromWh?.id,
      fromWarehouseName: fromWh?.name,
      toWarehouseId: toWh?.id,
      toWarehouseName: toWh?.name,
      quantity: qty,
      previousQuantity: prevQty,
      newQuantity: type === 'shipment' ? Math.max(0, prevQty - qty) : prevQty + qty,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      documentNumber: `DOC-${2024}${String(daysAgo).padStart(3, '0')}`,
      createdAt: date.toISOString(),
      createdBy: ['Иванов А.С.', 'Петров В.М.', 'Система'][Math.floor(Math.random() * 3)]
    });
  }
  
  // Сортируем по дате (новые сначала)
  return movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Компонент создания движения
interface CreateMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailers: Trailer[];
  warehouses: Warehouse[];
  onSave: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => void;
}

const CreateMovementModal = ({ isOpen, onClose, trailers, warehouses, onSave }: CreateMovementModalProps) => {
  const [type, setType] = useState<MovementType>('receipt');
  const [productId, setProductId] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');

  const activeWh = warehouses.filter(w => w.isActive);
  const selectedTrailer = trailers.find(t => t.id === productId);

  const handleSubmit = () => {
    if (!productId || quantity <= 0) return;
    
    if ((type === 'shipment' || type === 'transfer') && !fromWarehouseId) return;
    if ((type === 'receipt' || type === 'transfer' || type === 'adjustment') && !toWarehouseId) return;
    
    onSave({
      type,
      productId,
      productName: selectedTrailer?.name || '',
      productArticle: selectedTrailer?.article,
      fromWarehouseId: fromWarehouseId || undefined,
      fromWarehouseName: warehouses.find(w => w.id === fromWarehouseId)?.name,
      toWarehouseId: toWarehouseId || undefined,
      toWarehouseName: warehouses.find(w => w.id === toWarehouseId)?.name,
      quantity,
      previousQuantity: 0, // В реальности будет из базы
      newQuantity: quantity,
      reason,
      documentNumber,
      createdBy: 'Текущий пользователь'
    });
    
    // Reset form
    setType('receipt');
    setProductId('');
    setFromWarehouseId('');
    setToWarehouseId('');
    setQuantity(1);
    setReason('');
    setDocumentNumber('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Новое движение товара</h3>

        {/* Тип операции */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Тип операции</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(MOVEMENT_TYPES) as [MovementType, typeof MOVEMENT_TYPES[MovementType]][]).map(([key, info]) => {
              const Icon = info.icon;
              return (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                    type === key 
                      ? `${info.color} border-current` 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium">{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Товар */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Товар</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Выберите товар...</option>
            {trailers.map(t => (
              <option key={t.id} value={t.id}>
                {t.article ? `[${t.article}] ` : ''}{t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Склады */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {(type === 'shipment' || type === 'transfer') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Откуда</label>
              <select
                value={fromWarehouseId}
                onChange={(e) => setFromWarehouseId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите склад...</option>
                {activeWh.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
          {(type === 'receipt' || type === 'transfer' || type === 'adjustment') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === 'transfer' ? 'Куда' : 'Склад'}
              </label>
              <select
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите склад...</option>
                {activeWh.filter(w => w.id !== fromWarehouseId).map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Количество */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Документ и причина */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">№ документа</label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="DOC-001"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Причина</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Поставка от МЗСА"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!productId}
            className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Создать
          </button>
        </div>
      </div>
    </div>
  );
};

// Основной компонент
export const StockMovementsAdmin = () => {
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Фильтры
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MovementType | 'all'>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Пагинация
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  // Модалка создания
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем склады
        let warehousesData: Warehouse[] = [];
        if (db.getWarehouses) {
          warehousesData = await db.getWarehouses();
        } else {
          const settings = await db.getSettings();
          warehousesData = settings?.warehouses || [];
        }
        setWarehouses(warehousesData);
        
        // Пробуем загрузить движения из Supabase
        if (db.getStockMovements) {
          const apiMovements = await db.getStockMovements({
            limit: 100
          });
          setMovements(apiMovements.map(mapApiMovement));
        } else {
          // Fallback на моковые данные
          const trailersData = await (db.getAllTrailers ? db.getAllTrailers() : db.getTrailers());
          setTrailers(trailersData);
          const movs = generateMockMovements(trailersData, warehousesData);
          setMovements(movs);
        }
      } catch (error) {
        console.error('Failed to load movements:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Фильтрация
  const filteredMovements = useMemo(() => {
    let result = [...movements];

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.productName.toLowerCase().includes(query) ||
        m.productArticle?.toLowerCase().includes(query) ||
        m.documentNumber?.toLowerCase().includes(query)
      );
    }

    // Фильтр по типу
    if (typeFilter !== 'all') {
      result = result.filter(m => m.type === typeFilter);
    }

    // Фильтр по складу
    if (warehouseFilter !== 'all') {
      result = result.filter(m => 
        m.fromWarehouseId === warehouseFilter || 
        m.toWarehouseId === warehouseFilter
      );
    }

    // Фильтр по датам
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(m => new Date(m.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      result = result.filter(m => new Date(m.createdAt) <= to);
    }

    return result;
  }, [movements, searchQuery, typeFilter, warehouseFilter, dateFrom, dateTo]);

  // Пагинация
  const paginatedMovements = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMovements.slice(start, start + pageSize);
  }, [filteredMovements, page]);

  const totalPages = Math.ceil(filteredMovements.length / pageSize);

  // Статистика
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMovements = movements.filter(m => new Date(m.createdAt) >= today);
    
    return {
      total: movements.length,
      today: todayMovements.length,
      receipts: movements.filter(m => m.type === 'receipt').length,
      shipments: movements.filter(m => m.type === 'shipment').length,
      transfers: movements.filter(m => m.type === 'transfer').length,
      adjustments: movements.filter(m => m.type === 'adjustment').length
    };
  }, [movements]);

  // Создание движения
  // Создание движения
  const handleCreateMovement = useCallback(async (movement: Omit<StockMovement, 'id' | 'createdAt'>) => {
    // Оптимистичное обновление UI
    const newMovement: StockMovement = {
      ...movement,
      id: `mov-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setMovements(prev => [newMovement, ...prev]);
    
    // Сохраняем в Supabase если метод доступен
    if (db.createStockMovement) {
      try {
        const apiMovement = await db.createStockMovement({
          movementType: movement.type,
          trailerId: movement.productId,
          optionId: undefined,
          fromWarehouseId: movement.fromWarehouseId,
          toWarehouseId: movement.toWarehouseId,
          quantity: movement.quantity,
          previousQuantity: movement.previousQuantity,
          newQuantity: movement.newQuantity,
          documentNumber: movement.documentNumber,
          reason: movement.reason,
          createdByName: movement.createdBy,
        });
        
        // Обновляем ID с сервера
        setMovements(prev => prev.map(m => 
          m.id === newMovement.id ? { ...m, id: apiMovement.id } : m
        ));
      } catch (error) {
        console.error('Failed to create movement:', error);
        // Откатываем при ошибке
        setMovements(prev => prev.filter(m => m.id !== newMovement.id));
      }
    }
  }, []);

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
          <h1 className="text-2xl font-bold text-gray-900">История движений</h1>
          <p className="text-gray-500 mt-1">Журнал операций с товарами на складах</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <Download size={18} />
            Экспорт
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            <Plus size={18} />
            Новое движение
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Всего записей</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
          <div className="text-sm text-gray-500">За сегодня</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-green-600">{stats.receipts}</div>
          <div className="text-sm text-gray-500">Приходов</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-red-600">{stats.shipments}</div>
          <div className="text-sm text-gray-500">Расходов</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-blue-600">{stats.transfers}</div>
          <div className="text-sm text-gray-500">Перемещений</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-yellow-600">{stats.adjustments}</div>
          <div className="text-sm text-gray-500">Корректировок</div>
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
              placeholder="Поиск по товару или документу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Тип операции */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as MovementType | 'all')}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все операции</option>
            <option value="receipt">Приход</option>
            <option value="shipment">Расход</option>
            <option value="transfer">Перемещение</option>
            <option value="adjustment">Корректировка</option>
          </select>

          {/* Склад */}
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все склады</option>
            {warehouses.filter(w => w.isActive).map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          {/* Даты */}
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Дата/время</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Тип</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Товар</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Откуда → Куда</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Кол-во</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Документ</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Автор</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMovements.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  Записи не найдены
                </td>
              </tr>
            ) : (
              paginatedMovements.map(movement => {
                const typeInfo = MOVEMENT_TYPES[movement.type];
                const Icon = typeInfo.icon;
                
                return (
                  <tr key={movement.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {formatDateTime(movement.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        <Icon size={14} />
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 line-clamp-1">{movement.productName}</div>
                      {movement.productArticle && (
                        <div className="text-xs text-gray-500">Арт: {movement.productArticle}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {movement.fromWarehouseName && (
                        <span className="text-red-600">{movement.fromWarehouseName}</span>
                      )}
                      {movement.fromWarehouseName && movement.toWarehouseName && (
                        <span className="mx-1">→</span>
                      )}
                      {movement.toWarehouseName && (
                        <span className="text-green-600">{movement.toWarehouseName}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-semibold ${
                        movement.type === 'shipment' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {movement.type === 'shipment' ? '-' : '+'}{movement.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {movement.documentNumber || '—'}
                      {movement.reason && (
                        <div className="text-xs text-gray-400">{movement.reason}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User size={14} className="text-gray-400" />
                        {movement.createdBy}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-500">
              Показано {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredMovements.length)} из {filteredMovements.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-3 py-1 bg-white border rounded">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Модалка создания */}
      <CreateMovementModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        trailers={trailers}
        warehouses={warehouses}
        onSave={handleCreateMovement}
      />
    </div>
  );
};
