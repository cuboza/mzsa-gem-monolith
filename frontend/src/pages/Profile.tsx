import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Package, LogOut, Settings, ChevronRight, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { ResponsiveSticky } from '../components/layout/ResponsiveSticky';
import { db } from '../services/api';
import { Order } from '../types';
import { StatusBadge } from '../components/ui';
import { formatPrice, formatDateShort } from '../utils';

export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (user?.email) {
        try {
          const allOrders = await db.getOrders();
          const userOrders = allOrders.filter(o => o.customer.email === user.email);
          setOrders(userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (error) {
          console.error('Failed to fetch orders', error);
        }
      }
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Используем утилиты из utils/

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-blue-600 px-8 py-6 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-full">
                <User className="text-blue-600" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                <p className="text-blue-100">{user.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-700 text-xs text-white rounded-full uppercase tracking-wider">
                  {user.role === 'admin' ? 'Администратор' : user.role === 'manager' ? 'Менеджер' : 'Пользователь'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {(user.role === 'admin' || user.role === 'manager') && (
                <button
                  onClick={() => navigate('/admin')}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Админ-панель
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span>Выйти</span>
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* История заказов */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xl font-bold text-gray-800">
                    <Package className="text-blue-600" />
                    <h2>История заказов</h2>
                  </div>
                  {orders.length > 0 && (
                    <span className="text-sm text-gray-500">Всего: {orders.length}</span>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">Загрузка...</div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-lg">{order.orderNumber}</span>
                              <StatusBadge status={order.status} size="sm" />
                            </div>
                            <p className="text-sm text-gray-500">
                              от {formatDateShort(order.date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {formatPrice(order.configuration.totalPrice)} ₽
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-4">
                          <img 
                            src={order.configuration.trailer.image} 
                            alt={order.configuration.trailer.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">{order.configuration.trailer.name}</p>
                            <p className="text-sm text-gray-500">{order.configuration.trailer.model}</p>
                          </div>
                        </div>

                        {/* Timeline Preview */}
                        <div className="border-t pt-3 mt-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Clock size={16} />
                              <span>Последнее обновление: {new Date(order.updatedAt).toLocaleString('ru-RU')}</span>
                            </div>
                            <button className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                              Подробнее <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">У вас пока нет активных заказов</p>
                    <p className="mb-4">Самое время выбрать надежный прицеп!</p>
                    <button 
                      onClick={() => navigate('/catalog')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Перейти в каталог
                    </button>
                  </div>
                )}
              </div>

              {/* Настройки */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-xl font-bold text-gray-800">
                  <Settings className="text-blue-600" />
                  <h2>Настройки профиля</h2>
                </div>
                <ResponsiveSticky stickyAt="lg" className="bg-white border rounded-lg p-6 space-y-4" offsetClass="top-24">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Телефон</span>
                    <span className="text-gray-400">Не указан</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Адрес доставки</span>
                    <span className="text-gray-400">Не указан</span>
                  </div>
                  <button className="w-full mt-4 border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 rounded-lg transition-colors">
                    Редактировать данные
                  </button>
                </ResponsiveSticky>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
