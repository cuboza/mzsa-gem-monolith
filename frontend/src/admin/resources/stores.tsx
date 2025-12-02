/**
 * Администрирование магазинов сети
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Save, Trash2, Eye, EyeOff, 
  MapPin, Phone, Clock, ArrowUp, ArrowDown, X, Check,
  Mail, ExternalLink, Star
} from 'lucide-react';
import { Store, Settings } from '../../types';
import { db } from '../../services/api';

// Дефолтные магазины (текущие данные из Contacts.tsx)
const DEFAULT_STORES: Store[] = [
  {
    id: 'store-1',
    city: 'Сургут',
    address: 'пр-т Мира, 55',
    phone: '+7 (3462) 22-33-55',
    phone2: '+7 (3462) 55-04-49',
    hours: '9:00-20:00, без перерывов и выходных',
    mapLink: 'https://yandex.ru/maps/-/CHuZjYBR',
    region: 'ХМАО',
    isMain: true,
    isActive: true,
    order: 0
  },
  {
    id: 'store-2',
    city: 'Нижневартовск',
    address: 'ул. Индустриальная, 11а',
    phone: '+7 (3466) 62-54-20',
    hours: '9:00-19:00, без перерывов и выходных',
    mapLink: 'https://yandex.ru/maps/-/CHuZjLTP',
    region: 'ХМАО',
    isActive: true,
    order: 1
  },
  {
    id: 'store-3',
    city: 'Ноябрьск',
    address: 'ул. Ленина, 22',
    phone: '+7 (3496) 42-46-14',
    hours: '10:00-19:00, без перерывов и выходных',
    mapLink: 'https://yandex.ru/maps/-/CHuZj4y2',
    region: 'ЯНАО',
    isActive: true,
    order: 2
  },
  {
    id: 'store-4',
    city: 'Новый Уренгой',
    address: 'ул. Таёжная, 75',
    phone: '+7 (3494) 22-21-52',
    hours: '10:00-19:00, без перерывов и выходных',
    mapLink: 'https://yandex.ru/maps/-/CHuZjS~I',
    region: 'ЯНАО',
    isActive: true,
    order: 3
  }
];

// Редактор одного магазина
interface StoreEditorProps {
  store: Store;
  index: number;
  totalCount: number;
  onChange: (store: Store) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const StoreEditor = ({ store, index, totalCount, onChange, onDelete, onMoveUp, onMoveDown }: StoreEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateField = <K extends keyof Store>(field: K, value: Store[K]) => {
    onChange({ ...store, [field]: value });
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${store.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
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
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-orange-500" />
            <span className="font-semibold">{store.city || 'Новый магазин'}</span>
            {store.isMain && (
              <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star size={12} /> Главный
              </span>
            )}
            {!store.isActive && (
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">Скрыт</span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{store.address}</p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); updateField('isActive', !store.isActive); }}
          className={`p-2 rounded ${store.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
          title={store.isActive ? 'Скрыть' : 'Показать'}
        >
          {store.isActive ? <Eye size={20} /> : <EyeOff size={20} />}
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
          {/* Город и регион */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
              <input
                type="text"
                value={store.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Сургут"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Регион</label>
              <select
                value={store.region}
                onChange={(e) => updateField('region', e.target.value as 'ХМАО' | 'ЯНАО')}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="ХМАО">ХМАО</option>
                <option value="ЯНАО">ЯНАО</option>
              </select>
            </div>
          </div>

          {/* Адрес */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
            <input
              type="text"
              value={store.address}
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="ул. Примерная, 1"
            />
          </div>

          {/* Телефоны */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone size={14} className="inline mr-1" />
                Основной телефон
              </label>
              <input
                type="text"
                value={store.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="+7 (3462) 22-33-55"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone size={14} className="inline mr-1" />
                Дополнительный телефон
              </label>
              <input
                type="text"
                value={store.phone2 || ''}
                onChange={(e) => updateField('phone2', e.target.value || undefined)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="+7 (3462) 55-04-49"
              />
            </div>
          </div>

          {/* Email и часы работы */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail size={14} className="inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={store.email || ''}
                onChange={(e) => updateField('email', e.target.value || undefined)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="surgut@o-n-r.ru"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock size={14} className="inline mr-1" />
                Часы работы
              </label>
              <input
                type="text"
                value={store.hours}
                onChange={(e) => updateField('hours', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="9:00-20:00, без перерывов"
              />
            </div>
          </div>

          {/* Ссылка на карту */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <ExternalLink size={14} className="inline mr-1" />
              Ссылка на Яндекс.Карты
            </label>
            <input
              type="url"
              value={store.mapLink}
              onChange={(e) => updateField('mapLink', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="https://yandex.ru/maps/-/..."
            />
          </div>

          {/* Координаты */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Широта (lat)</label>
              <input
                type="number"
                step="0.000001"
                value={store.coordinates?.[0] || ''}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value);
                  const lng = store.coordinates?.[1] || 0;
                  updateField('coordinates', isNaN(lat) ? undefined : [lat, lng]);
                }}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="61.254035"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Долгота (lng)</label>
              <input
                type="number"
                step="0.000001"
                value={store.coordinates?.[1] || ''}
                onChange={(e) => {
                  const lat = store.coordinates?.[0] || 0;
                  const lng = parseFloat(e.target.value);
                  updateField('coordinates', isNaN(lng) ? undefined : [lat, lng]);
                }}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="73.396221"
              />
            </div>
          </div>

          {/* Главный магазин */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`main-${store.id}`}
              checked={store.isMain || false}
              onChange={(e) => updateField('isMain', e.target.checked)}
              className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor={`main-${store.id}`} className="text-sm text-gray-700">
              Главный магазин (показывается первым, используется как основной контакт)
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

// Основной компонент
export const StoresAdmin = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Загрузка магазинов из настроек
  useEffect(() => {
    const loadStores = async () => {
      try {
        const settings = await db.getSettings();
        if (settings?.stores && settings.stores.length > 0) {
          setStores(settings.stores.sort((a, b) => a.order - b.order));
        } else {
          setStores(DEFAULT_STORES);
        }
      } catch (error) {
        console.error('Failed to load stores:', error);
        setStores(DEFAULT_STORES);
      } finally {
        setLoading(false);
      }
    };
    loadStores();
  }, []);

  // Сохранение
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const settings = await db.getSettings() || {} as Settings;
      const updatedSettings = {
        ...settings,
        stores: stores.map((s, idx) => ({ ...s, order: idx }))
      };
      await db.saveSettings(updatedSettings);
      setHasChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save stores:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [stores]);

  // Обновление магазина
  const updateStore = (index: number, store: Store) => {
    const newStores = [...stores];
    newStores[index] = store;
    setStores(newStores);
    setHasChanges(true);
  };

  // Добавление магазина
  const addStore = () => {
    const newStore: Store = {
      id: `store-${Date.now()}`,
      city: '',
      address: '',
      phone: '',
      hours: '9:00-18:00',
      mapLink: '',
      region: 'ХМАО',
      isActive: false,
      order: stores.length
    };
    setStores([...stores, newStore]);
    setHasChanges(true);
  };

  // Удаление магазина
  const deleteStore = (index: number) => {
    if (confirm('Удалить магазин?')) {
      const newStores = stores.filter((_, i) => i !== index);
      setStores(newStores);
      setHasChanges(true);
    }
  };

  // Перемещение магазина
  const moveStore = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stores.length) return;
    
    const newStores = [...stores];
    [newStores[index], newStores[newIndex]] = [newStores[newIndex], newStores[index]];
    setStores(newStores);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Магазины</h1>
          <p className="text-gray-500 mt-1">Управление адресами и контактами магазинов сети</p>
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
            onClick={addStore}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Plus size={20} />
            Добавить магазин
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              hasChanges 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save size={20} />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-gray-900">{stores.length}</div>
          <div className="text-sm text-gray-500">Всего магазинов</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-green-600">{stores.filter(s => s.isActive).length}</div>
          <div className="text-sm text-gray-500">Активных</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-orange-600">
            {stores.filter(s => s.region === 'ХМАО').length} / {stores.filter(s => s.region === 'ЯНАО').length}
          </div>
          <div className="text-sm text-gray-500">ХМАО / ЯНАО</div>
        </div>
      </div>

      {/* Список магазинов */}
      <div className="space-y-3">
        {stores.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет магазинов</p>
            <button
              onClick={addStore}
              className="mt-3 text-orange-500 hover:text-orange-600 font-medium"
            >
              Добавить первый магазин
            </button>
          </div>
        ) : (
          stores.map((store, index) => (
            <StoreEditor
              key={store.id}
              store={store}
              index={index}
              totalCount={stores.length}
              onChange={(s) => updateStore(index, s)}
              onDelete={() => deleteStore(index)}
              onMoveUp={() => moveStore(index, 'up')}
              onMoveDown={() => moveStore(index, 'down')}
            />
          ))
        )}
      </div>

      {/* Несохранённые изменения */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <span>Есть несохранённые изменения</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-orange-500 px-3 py-1 rounded font-medium hover:bg-orange-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      )}
    </div>
  );
};
