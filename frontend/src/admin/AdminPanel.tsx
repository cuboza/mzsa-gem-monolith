import { Admin, Resource, CustomRoutes } from 'react-admin';
import { Route } from 'react-router-dom';
import { dataProvider } from './dataProvider';
import { authProvider } from './authProvider';
import { Dashboard } from './components/Dashboard';
import { BackupRestore } from './components/BackupRestore';
import { OrderList, OrderEdit } from './resources/orders';
import { TrailerList, TrailerEdit, TrailerCreate } from './resources/trailers';
import { AccessoryList, AccessoryEdit, AccessoryCreate } from './resources/accessories';
import { CustomerList, CustomerEdit, CustomerCreate } from './resources/customers';
import { SettingsEdit } from './resources/settings';
import { ShoppingCart, Package, Wrench, Users, Settings, Database } from 'lucide-react';

// Компоненты иконок для меню
const OrderIcon = () => <ShoppingCart size={20} />;
const TrailerIcon = () => <Package size={20} />;
const AccessoryIcon = () => <Wrench size={20} />;
const CustomerIcon = () => <Users size={20} />;
const SettingsIcon = () => <Settings size={20} />;
const BackupIcon = () => <Database size={20} />;

export const AdminPanel = () => (
  <Admin
    basename="/admin"
    dataProvider={dataProvider}
    authProvider={authProvider}
    dashboard={Dashboard}
    title="O-N-R Admin"
  >
    {(permissions: string) => [
      <Resource 
        name="orders" 
        list={OrderList} 
        edit={OrderEdit} 
        icon={OrderIcon}
        options={{ label: 'Заказы' }} 
      />,
      <Resource 
        name="trailers" 
        list={TrailerList} 
        edit={TrailerEdit}
        create={TrailerCreate}
        icon={TrailerIcon}
        options={{ label: 'Прицепы' }} 
      />,
      <Resource 
        name="accessories" 
        list={AccessoryList} 
        edit={AccessoryEdit}
        create={AccessoryCreate}
        icon={AccessoryIcon}
        options={{ label: 'Аксессуары' }} 
      />,
      <Resource 
        name="customers" 
        list={CustomerList} 
        edit={CustomerEdit}
        create={CustomerCreate}
        icon={CustomerIcon}
        options={{ label: 'Клиенты' }} 
      />,
      permissions === 'admin' ? (
        <Resource 
          name="settings" 
          list={SettingsEdit}
          icon={SettingsIcon}
          options={{ label: 'Настройки' }} 
        />
      ) : null,
      permissions === 'admin' ? (
        <Resource 
          name="backup" 
          list={BackupRestore}
          icon={BackupIcon}
          options={{ label: 'Бэкап' }} 
        />
      ) : null,
    ]}
  </Admin>
);

