import { useEffect, useState } from 'react';
import { Title } from 'react-admin';
import { 
  ShoppingCart, Package, Users, TrendingUp, 
  AlertTriangle, Clock, CheckCircle, DollarSign 
} from 'lucide-react';
import { db } from '../../services/api';
import { Order, Trailer } from '../../types';

interface DashboardStats {
  totalOrders: number;
  newOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthRevenue: number;
  unpaidOrders: number;
  lowStockTrailers: number;
  totalCustomers: number;
  totalTrailers: number;
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: string;
  subtitle?: string;
}) => (
  <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('border-l-', 'bg-')}`}>
        <Icon size={24} className={color.replace('border-l-', 'text-')} />
      </div>
    </div>
  </div>
);

const RecentOrdersTable = ({ orders }: { orders: Order[] }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">№ Заказа</th>
          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Клиент</th>
          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Сумма</th>
          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Статус</th>
          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Дата</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => {
          const statusColors: Record<string, string> = {
            new: 'bg-blue-100 text-blue-800',
            processing: 'bg-yellow-100 text-yellow-800',
            shipping: 'bg-purple-100 text-purple-800',
            ready: 'bg-green-100 text-green-800',
            completed: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800'
          };
          const statusLabels: Record<string, string> = {
            new: 'Новый',
            processing: 'В работе',
            shipping: 'В пути',
            ready: 'Готов',
            completed: 'Завершен',
            cancelled: 'Отменен'
          };
          return (
            <tr key={order.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium">{order.orderNumber}</td>
              <td className="px-4 py-3 text-sm">{order.customer?.name || '-'}</td>
              <td className="px-4 py-3 text-sm">
                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 })
                  .format(order.configuration?.totalPrice || 0)}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {new Date(order.date).toLocaleDateString('ru-RU')}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const LowStockAlert = ({ trailers }: { trailers: Trailer[] }) => {
  const lowStock = trailers.filter(t => (t.stock || 0) <= 2 && (t.stock || 0) >= 0);
  
  if (lowStock.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle size={48} className="mx-auto mb-2 text-green-500" />
        <p>Все позиции в достаточном количестве</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lowStock.slice(0, 5).map((trailer) => (
        <div key={trailer.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
          <div>
            <p className="font-medium text-sm">{trailer.model}</p>
            <p className="text-xs text-gray-500">{trailer.name}</p>
          </div>
          <div className="text-right">
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              (trailer.stock || 0) === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {trailer.stock || 0} шт.
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orders, allTrailers, customers] = await Promise.all([
          db.getOrders(),
          db.getAllTrailers(),
          db.getCustomers()
        ]);

        // Расчёт статистики
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalRevenue = orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum, o) => sum + (o.configuration?.totalPrice || 0), 0);

        const monthRevenue = orders
          .filter(o => o.status !== 'cancelled' && new Date(o.date) >= monthStart)
          .reduce((sum, o) => sum + (o.configuration?.totalPrice || 0), 0);

        const lowStockTrailers = allTrailers.filter(t => (t.stock || 0) <= 2).length;

        setStats({
          totalOrders: orders.length,
          newOrders: orders.filter(o => o.status === 'new').length,
          processingOrders: orders.filter(o => o.status === 'processing' || o.status === 'shipping').length,
          completedOrders: orders.filter(o => o.status === 'completed').length,
          totalRevenue,
          monthRevenue,
          unpaidOrders: orders.filter(o => o.paymentStatus !== 'paid' && o.status !== 'cancelled').length,
          lowStockTrailers,
          totalCustomers: customers.length,
          totalTrailers: allTrailers.length
        });

        // Последние заказы (сортируем по дате)
        const sorted = [...orders].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setRecentOrders(sorted.slice(0, 5));
        setTrailers(allTrailers);

      } catch (error) {
        console.error('Ошибка загрузки данных для Dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(value);

  return (
    <div className="p-4">
      <Title title="Панель управления" />
      
      {/* Карточки статистики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Всего заказов" 
          value={stats?.totalOrders || 0} 
          icon={ShoppingCart}
          color="border-l-blue-500"
          subtitle={`${stats?.newOrders || 0} новых`}
        />
        <StatCard 
          title="В работе" 
          value={stats?.processingOrders || 0} 
          icon={Clock}
          color="border-l-orange-500"
        />
        <StatCard 
          title="Выручка за месяц" 
          value={formatCurrency(stats?.monthRevenue || 0)} 
          icon={TrendingUp}
          color="border-l-green-500"
        />
        <StatCard 
          title="Ожидают оплаты" 
          value={stats?.unpaidOrders || 0} 
          icon={DollarSign}
          color="border-l-red-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Прицепов" 
          value={stats?.totalTrailers || 0} 
          icon={Package}
          color="border-l-indigo-500"
        />
        <StatCard 
          title="Клиентов" 
          value={stats?.totalCustomers || 0} 
          icon={Users}
          color="border-l-cyan-500"
        />
        <StatCard 
          title="Завершено заказов" 
          value={stats?.completedOrders || 0} 
          icon={CheckCircle}
          color="border-l-emerald-500"
        />
        <StatCard 
          title="Мало на складе" 
          value={stats?.lowStockTrailers || 0} 
          icon={AlertTriangle}
          color="border-l-amber-500"
        />
      </div>

      {/* Два блока: последние заказы и низкие остатки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Последние заказы</h3>
          </div>
          <div className="p-4">
            {recentOrders.length > 0 ? (
              <RecentOrdersTable orders={recentOrders} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart size={48} className="mx-auto mb-2 text-gray-300" />
                <p>Заказов пока нет</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Низкие остатки</h3>
          </div>
          <div className="p-4">
            <LowStockAlert trailers={trailers} />
          </div>
        </div>
      </div>

      {/* Общая выручка */}
      <div className="mt-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Общая выручка (все время)</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </p>
              </div>
              <TrendingUp size={48} className="text-green-500 opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
