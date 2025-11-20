import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../services/api';
import { Order } from '../types';
import { Search, CheckCircle, AlertCircle, Truck, Package, User, MapPin } from 'lucide-react';

export const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const foundOrder = await db.getOrderByNumber(query.trim());
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError('Заказ не найден. Проверьте номер и попробуйте снова.');
      }
    } catch (err) {
      setError('Ошибка при поиске заказа.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      handleSearch();
    }
  }, []);

  const formatPrice = (p: number) => new Intl.NumberFormat('ru-RU').format(p);
  const formatDate = (d: string) => new Date(d).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-yellow-100 text-yellow-700';
      case 'shipping': return 'bg-purple-100 text-purple-700';
      case 'ready': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'processing': return 'В работе';
      case 'shipping': return 'В пути';
      case 'ready': return 'Готов к выдаче';
      case 'completed': return 'Выдан';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-center mb-8">Отследить статус заказа</h1>

        {/* Поиск */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Номер заказа (например, ONR-20251119-1234)"
                className="w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-70 transition-colors"
            >
              {loading ? 'Поиск...' : 'Найти'}
            </button>
          </form>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-center mb-8 animate-fadeIn">
            <AlertCircle className="mr-2" />
            {error}
          </div>
        )}

        {/* Результат */}
        {order && (
          <div className="animate-fadeIn space-y-6">
            {/* Основная инфо */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
                <div>
                  <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Заказ №</div>
                  <h2 className="text-2xl font-bold font-mono text-gray-900">{order.orderNumber}</h2>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold text-sm ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </div>
              </div>

              {/* Таймлайн */}
              <div className="p-6">
                <h3 className="text-lg font-bold mb-6">История статусов</h3>
                <div className="relative pl-4 border-l-2 border-gray-200 space-y-8">
                  {order.timeline.map((event, idx) => (
                    <div key={event.id} className="relative pl-6">
                      <div className={`absolute -left-[21px] top-0 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center
                        ${idx === 0 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
                        {idx === 0 ? <CheckCircle size={16} /> : <div className="w-2 h-2 bg-gray-400 rounded-full" />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-600 mb-1">{event.description}</div>
                        <div className="text-xs text-gray-400">{formatDate(event.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Детали заказа */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Состав */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4 text-gray-700">
                  <Truck className="w-5 h-5" />
                  <h3 className="font-bold text-lg">Состав заказа</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b border-dashed">
                    <div className="flex gap-3">
                      <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                        <img 
                          src={order.configuration.trailer.image} 
                          alt={order.configuration.trailer.model}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-bold">{order.configuration.trailer.model}</div>
                        <div className="text-sm text-gray-500">{order.configuration.trailer.name}</div>
                      </div>
                    </div>
                    <div className="font-bold">{formatPrice(order.configuration.trailer.price)} ₽</div>
                  </div>

                  {order.configuration.accessories.map(acc => (
                    <div key={acc.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                          <img 
                            src={acc.image} 
                            alt={acc.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                        <span className="text-gray-600">{acc.name}</span>
                      </div>
                      <span className="font-medium">{formatPrice(acc.price)} ₽</span>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-4 border-t font-bold text-lg">
                    <span>Итого:</span>
                    <span className="text-blue-600">{formatPrice(order.configuration.totalPrice)} ₽</span>
                  </div>
                </div>
              </div>

              {/* Клиент и Доставка */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6 text-gray-700">
                  <User className="w-5 h-5" />
                  <h3 className="font-bold text-lg">Данные получателя</h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Получатель</div>
                    <div className="font-medium">{order.customer.name}</div>
                    <div className="text-gray-600">{order.customer.phone}</div>
                  </div>

                  <div className="pt-4 border-t border-dashed">
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <MapPin className="w-4 h-4" />
                      <h4 className="font-bold">Доставка</h4>
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-2 ${
                        order.delivery.method === 'pickup' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.delivery.method === 'pickup' ? 'Самовывоз' : 'Доставка по адресу'}
                      </span>
                      <div className="text-gray-600">
                        {order.delivery.region}, г. {order.delivery.city}
                      </div>
                      {order.delivery.address && (
                        <div className="text-gray-600 mt-1">{order.delivery.address}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

