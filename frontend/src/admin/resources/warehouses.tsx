/**
 * Администрирование складов
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Save, Trash2, Eye, EyeOff, 
  Warehouse as WarehouseIcon, Phone, ArrowUp, ArrowDown, X, Check,
  MapPin, Building2, Package
} from 'lucide-react';
import { Warehouse, Settings } from '../../types';
import { db } from '../../services/api';

// Дефолтные склады
const DEFAULT_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-1',
    name: 'Главный склад Сургут',
    city: 'Сургут',
    address: 'пр-т Мира, 55 (территория магазина)',
    phone: '+7 (3462) 22-33-55',
    region: 'ХМАО',
    type: 'main',
    priceList: 'retail',
    priority: 1,
    isActive: true,
    order: 0
  },
  {
    id: 'wh-2',
    name: 'Склад Нижневартовск',
    city: 'Нижневартовск',
    address: 'ул. Индустриальная, 11а',
    phone: '+7 (3466) 62-54-20',
    region: 'ХМАО',
    type: 'regional',
    priceList: 'retail',
    priority: 2,
    isActive: true,
    order: 1
  }
];

const PRICE_LISTS = {
  retail: { label: 'Розничные цены', color: 'bg-green-100 text-green-700' },
  wholesale: { label: 'Оптовые цены', color: 'bg-blue-100 text-blue-700' },
  dealer: { label: 'Дилерские цены', color: 'bg-purple-100 text-purple-700' },
  special: { label: 'Специальные цены', color: 'bg-orange-100 text-orange-700' }
};

const WAREHOUSE_TYPES = {
  main: { label: 'Главный', color: 'bg-orange-100 text-orange-700' },
  regional: { label: 'Региональный', color: 'bg-blue-100 text-blue-700' },
  partner: { label: 'Партнёрский', color: 'bg-gray-100 text-gray-700' }
};

// Редактор одного склада
interface WarehouseEditorProps {
  warehouse: Warehouse;
  index: number;
  totalCount: number;
  isNew?: boolean;
  onChange: (warehouse: Warehouse) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const WarehouseEditor = ({ warehouse, index, totalCount, isNew, onChange, onDelete, onMoveUp, onMoveDown }: WarehouseEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(isNew || false);

  const updateField = <K extends keyof Warehouse>(field: K, value: Warehouse[K]) => {
    onChange({ ...warehouse, [field]: value });
  };

  const typeInfo = WAREHOUSE_TYPES[warehouse.type];
  const priceInfo = PRICE_LISTS[warehouse.priceList || 'retail'];

  return (
    <div className={`border rounded-lg overflow-hidden ${warehouse.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
      {/* Заголовок */}
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={index === 0}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={index === totalCount - 1}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
          >
            <ArrowDown size={14} />
          </button>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Building2 size={18} className="text-blue-500" />
            <span className="font-semibold">{warehouse.name || 'Новый склад'}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
              {typeInfo.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${priceInfo.color}`}>
              {priceInfo.label}
            </span>
            {!warehouse.isActive && (
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">Скрыт</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {warehouse.city} • {warehouse.address}
            {warehouse.priority && <span className="ml-2 text-xs text-gray-400">Приоритет: {warehouse.priority}</span>}
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); updateField('isActive', !warehouse.isActive); }}
          className={`p-2 rounded ${warehouse.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
          title={warehouse.isActive ? 'Скрыть' : 'Показать'}
        >
          {warehouse.isActive ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 text-red-500 hover:bg-red-50 rounded"
          title="Удалить"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Развёрнутый редактор */}
      {isExpanded && (
        <div className="border-t p-4 space-y-4 bg-gray-50">
          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название склада</label>
            <input
              type="text"
              value={warehouse.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Главный склад Сургут"
            />
          </div>

          {/* Тип и регион */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип склада</label>
              <select
                value={warehouse.type}
                onChange={(e) => updateField('type', e.target.value as Warehouse['type'])}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="main">Главный</option>
                <option value="regional">Региональный</option>
                <option value="partner">Партнёрский</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Регион</label>
              <select
                value={warehouse.region}
                onChange={(e) => updateField('region', e.target.value as 'ХМАО' | 'ЯНАО')}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ХМАО">ХМАО</option>
                <option value="ЯНАО">ЯНАО</option>
              </select>
            </div>
          </div>

          {/* Город и адрес */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin size={14} className="inline mr-1" />
                Город
              </label>
              <input
                type="text"
                value={warehouse.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Сургут"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone size={14} className="inline mr-1" />
                Телефон
              </label>
              <input
                type="text"
                value={warehouse.phone || ''}
                onChange={(e) => updateField('phone', e.target.value || undefined)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+7 (3462) 22-33-55"
              />
            </div>
          </div>

          {/* Адрес */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
            <input
              type="text"
              value={warehouse.address}
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ул. Примерная, 1"
            />
          </div>

          {/* Прайс-лист и приоритет */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип цен</label>
              <select
                value={warehouse.priceList || 'retail'}
                onChange={(e) => updateField('priceList', e.target.value as Warehouse['priceList'])}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="retail">Розничные цены</option>
                <option value="wholesale">Оптовые цены</option>
                <option value="dealer">Дилерские цены</option>
                <option value="special">Специальные цены</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
              <input
                type="number"
                min="1"
                value={warehouse.priority || 1}
                onChange={(e) => updateField('priority', parseInt(e.target.value) || 1)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">Меньше = выше приоритет</p>
            </div>
          </div>

          {/* Email и часы работы */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={warehouse.email || ''}
                onChange={(e) => updateField('email', e.target.value || undefined)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="warehouse@o-n-r.ru"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Часы работы</label>
              <input
                type="text"
                value={warehouse.workingHours || ''}
                onChange={(e) => updateField('workingHours', e.target.value || undefined)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="9:00-20:00"
              />
            </div>
          </div>

          {/* Код склада и описание */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Код склада (1С)</label>
              <input
                type="text"
                value={warehouse.code || ''}
                onChange={(e) => updateField('code', e.target.value || undefined)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="СК-001"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id={`canShip-${warehouse.id}`}
                checked={warehouse.canShip ?? true}
                onChange={(e) => updateField('canShip', e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor={`canShip-${warehouse.id}`} className="text-sm text-gray-700">
                Может отгружать товар
              </label>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              value={warehouse.description || ''}
              onChange={(e) => updateField('description', e.target.value || undefined)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Дополнительная информация о складе..."
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Основной компонент
export const WarehousesAdmin = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newWarehouseId, setNewWarehouseId] = useState<string | null>(null);

  // Загрузка складов из настроек
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const settings = await db.getSettings();
        if (settings?.warehouses && settings.warehouses.length > 0) {
          setWarehouses(settings.warehouses.sort((a, b) => a.order - b.order));
        } else {
          setWarehouses(DEFAULT_WAREHOUSES);
        }
      } catch (error) {
        console.error('Failed to load warehouses:', error);
        setWarehouses(DEFAULT_WAREHOUSES);
      } finally {
        setLoading(false);
      }
    };
    loadWarehouses();
  }, []);

  // Сохранение
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const settings = await db.getSettings() || {} as Settings;
      const updatedSettings = {
        ...settings,
        warehouses: warehouses.map((w, idx) => ({ ...w, order: idx }))
      };
      await db.saveSettings(updatedSettings);
      setHasChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save warehouses:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [warehouses]);

  // Обновление склада
  const updateWarehouse = (index: number, warehouse: Warehouse) => {
    const newWarehouses = [...warehouses];
    newWarehouses[index] = warehouse;
    setWarehouses(newWarehouses);
    setHasChanges(true);
  };

  // Добавление склада
  const addWarehouse = () => {
    const newWarehouse: Warehouse = {
      id: `wh-${Date.now()}`,
      name: '',
      city: '',
      address: '',
      region: 'ХМАО',
      type: 'regional',
      priceList: 'retail',
      priority: warehouses.length + 1,
      isActive: false,
      order: warehouses.length
    };
    setWarehouses([...warehouses, newWarehouse]);
    setHasChanges(true);
    setNewWarehouseId(newWarehouse.id);
  };

  // Удаление склада
  const deleteWarehouse = (index: number) => {
    if (confirm('Удалить склад?')) {
      const newWarehouses = warehouses.filter((_, i) => i !== index);
      setWarehouses(newWarehouses);
      setHasChanges(true);
    }
  };

  // Перемещение склада
  const moveWarehouse = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= warehouses.length) return;
    
    const newWarehouses = [...warehouses];
    [newWarehouses[index], newWarehouses[newIndex]] = [newWarehouses[newIndex], newWarehouses[index]];
    setWarehouses(newWarehouses);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const mainCount = warehouses.filter(w => w.type === 'main' && w.isActive).length;
  const regionalCount = warehouses.filter(w => w.type === 'regional' && w.isActive).length;
  const partnerCount = warehouses.filter(w => w.type === 'partner' && w.isActive).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Склады</h1>
          <p className="text-gray-500 mt-1">Управление складами для учёта остатков и логистики</p>
        </div>
        
        <div className="flex items-center gap-3">
          {saveStatus === 'success' && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <Check size={16} /> Сохранено
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-red-600 text-sm">
              <X size={16} /> Ошибка сохранения
            </span>
          )}
          
          <button
            onClick={addWarehouse}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Добавить склад
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              hasChanges 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save size={20} />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-gray-900">{warehouses.length}</div>
          <div className="text-sm text-gray-500">Всего складов</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-orange-600">{mainCount}</div>
          <div className="text-sm text-gray-500">Главных</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-blue-600">{regionalCount}</div>
          <div className="text-sm text-gray-500">Региональных</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-gray-600">{partnerCount}</div>
          <div className="text-sm text-gray-500">Партнёрских</div>
        </div>
      </div>

      {/* Список складов */}
      <div className="space-y-3">
        {warehouses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет складов</p>
            <button
              onClick={addWarehouse}
              className="mt-3 text-blue-500 hover:text-blue-600 font-medium"
            >
              Добавить первый склад
            </button>
          </div>
        ) : (
          warehouses.map((warehouse, index) => (
            <WarehouseEditor
              key={warehouse.id}
              warehouse={warehouse}
              index={index}
              totalCount={warehouses.length}
              isNew={warehouse.id === newWarehouseId}
              onChange={(w) => {
                updateWarehouse(index, w);
                if (warehouse.id === newWarehouseId) setNewWarehouseId(null);
              }}
              onDelete={() => deleteWarehouse(index)}
              onMoveUp={() => moveWarehouse(index, 'up')}
              onMoveDown={() => moveWarehouse(index, 'down')}
            />
          ))
        )}
      </div>

      {/* Несохранённые изменения */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <span>Есть несохранённые изменения</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-blue-500 px-3 py-1 rounded font-medium hover:bg-blue-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      )}
    </div>
  );
};
