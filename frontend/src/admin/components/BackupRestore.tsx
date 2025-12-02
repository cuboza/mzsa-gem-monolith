import { useState, useRef } from 'react';
import { useNotify, Title } from 'react-admin';
import { 
  Download, Upload, AlertTriangle, CheckCircle, 
  Database, FileJson, Calendar, HardDrive 
} from 'lucide-react';
import { db } from '../../services/api';

interface BackupData {
  version: string;
  createdAt: string;
  data: {
    trailers: any[];
    accessories: any[];
    orders: any[];
    customers: any[];
    settings: any;
  };
}

export const BackupRestore = () => {
  const notify = useNotify();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [backupInfo, setBackupInfo] = useState<BackupData | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<BackupData | null>(null);

  // Создание бэкапа
  const handleBackup = async () => {
    setLoading(true);
    try {
      const [trailers, accessories, orders, customers, settings] = await Promise.all([
        // Backup should include all trailers (visible and hidden)
        db.getAllTrailers(),
        db.getAccessories(),
        db.getOrders(),
        db.getCustomers(),
        db.getSettings()
      ]);

      const backupData: BackupData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        data: {
          trailers,
          accessories,
          orders,
          customers,
          settings
        }
      };

      // Создаем и скачиваем файл
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onr-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notify('Бэкап успешно создан и скачан', { type: 'success' });
    } catch (error) {
      console.error('Ошибка создания бэкапа:', error);
      notify('Ошибка при создании бэкапа', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Выбор файла для восстановления
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        
        // Валидация структуры
        if (!data.version || !data.data || !data.createdAt) {
          throw new Error('Неверный формат файла бэкапа');
        }

        setBackupInfo(data);
        setPendingRestore(data);
        setShowConfirm(true);
      } catch (error) {
        console.error('Ошибка чтения файла:', error);
        notify('Неверный формат файла бэкапа', { type: 'error' });
      }
    };
    reader.readAsText(file);
    
    // Сброс input для возможности повторного выбора того же файла
    event.target.value = '';
  };

  // Восстановление из бэкапа
  const handleRestore = async () => {
    if (!pendingRestore) return;

    setLoading(true);
    setShowConfirm(false);

    try {
      const { trailers, accessories, orders, customers, settings } = pendingRestore.data;

      // Восстанавливаем данные
      // Сначала очищаем, потом добавляем (через LocalStorage Provider)
      
      // Прицепы
      for (const trailer of trailers) {
        await db.saveTrailer(trailer);
      }

      // Аксессуары
      for (const accessory of accessories) {
        await db.saveAccessory(accessory);
      }

      // Заказы
      for (const order of orders) {
        try {
          // Пробуем обновить существующий
          await db.updateOrder(order.id, order);
        } catch {
          // Если не существует, создаем новый
          await db.createOrder(order);
        }
      }

      // Клиенты
      for (const customer of customers) {
        await db.saveCustomer(customer);
      }

      // Настройки
      if (settings) {
        await db.saveSettings(settings);
      }

      notify('Данные успешно восстановлены! Обновите страницу для применения изменений.', { type: 'success' });
      setBackupInfo(null);
      setPendingRestore(null);

      // Перезагружаем страницу через 2 секунды
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Ошибка восстановления:', error);
      notify('Ошибка при восстановлении данных', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <Title title="Резервное копирование" />
      
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Database size={32} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">Резервное копирование и восстановление</h2>
              <p className="text-gray-500">Экспорт и импорт всех данных системы</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Создание бэкапа */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Download size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Создать бэкап</h3>
                <p className="text-sm text-gray-500">Скачать все данные в JSON</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <FileJson size={16} className="text-gray-400" />
                <span>Прицепы, аксессуары, заказы</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-gray-400" />
                <span>Клиенты и настройки</span>
              </div>
            </div>

            <button
              onClick={handleBackup}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Download size={20} />
                  Скачать бэкап
                </>
              )}
            </button>
          </div>

          {/* Восстановление */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Upload size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Восстановить</h3>
                <p className="text-sm text-gray-500">Загрузить данные из файла</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Восстановление перезапишет существующие данные с совпадающими ID
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload size={20} />
              Выбрать файл бэкапа
            </button>
          </div>
        </div>

        {/* Модальное окно подтверждения */}
        {showConfirm && backupInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-yellow-500" />
                Подтверждение восстановления
              </h3>
              
              <div className="bg-gray-50 rounded p-4 mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-gray-400" />
                  <span>Дата бэкапа: {formatDate(backupInfo.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Database size={16} className="text-gray-400" />
                  <span>Версия: {backupInfo.version}</span>
                </div>
                <div className="pt-2 border-t text-sm text-gray-600">
                  <p>• Прицепов: {backupInfo.data.trailers?.length || 0}</p>
                  <p>• Аксессуаров: {backupInfo.data.accessories?.length || 0}</p>
                  <p>• Заказов: {backupInfo.data.orders?.length || 0}</p>
                  <p>• Клиентов: {backupInfo.data.customers?.length || 0}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Вы уверены, что хотите восстановить данные из этого бэкапа? 
                Существующие записи с теми же ID будут перезаписаны.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    setPendingRestore(null);
                    setBackupInfo(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleRestore}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Восстановить
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
