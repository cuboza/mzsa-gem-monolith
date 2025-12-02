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
import { HeroSlidesAdmin } from './resources/heroSlides';
import { StoresAdmin } from './resources/stores';
import { WarehousesAdmin } from './resources/warehouses';
import { Import1CAdmin } from './resources/import1c';
import { ShoppingCart, Package, Wrench, Users, Settings, Database, Image, MapPin, Warehouse, Upload, Shield } from 'lucide-react';
import { UserList, UserEdit, UserCreate } from './resources/users';

// Компоненты иконок для меню
const OrderIcon = () => <ShoppingCart size={20} />;
const TrailerIcon = () => <Package size={20} />;
const AccessoryIcon = () => <Wrench size={20} />;
const CustomerIcon = () => <Users size={20} />;
const UserIcon = () => <Shield size={20} />;
const SettingsIcon = () => <Settings size={20} />;
const BackupIcon = () => <Database size={20} />;
const HeroIcon = () => <Image size={20} />;
const StoreIcon = () => <MapPin size={20} />;
const WarehouseIcon = () => <Warehouse size={20} />;
const Import1CIcon = () => <Upload size={20} />;

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
          name="users" 
          list={UserList} 
          edit={UserEdit}
          create={UserCreate}
          icon={UserIcon}
          options={{ label: 'Пользователи' }} 
        />
      ) : null,
      permissions === 'admin' ? (
        <Resource 
          name="hero-slides" 
          list={HeroSlidesAdmin}
          icon={HeroIcon}
          options={{ label: 'Hero-карусель' }} 
        />
      ) : null,
      permissions === 'admin' ? (
        <Resource 
          name="stores" 
          list={StoresAdmin}
          icon={StoreIcon}
          options={{ label: 'Магазины' }} 
        />
      ) : null,
      permissions === 'admin' ? (
        <Resource 
          name="warehouses" 
          list={WarehousesAdmin}
          icon={WarehouseIcon}
          options={{ label: 'Склады' }} 
        />
      ) : null,
      permissions === 'admin' ? (
        <Resource 
          name="import-1c" 
          list={Import1CAdmin}
          icon={Import1CIcon}
          options={{ label: 'Импорт 1С' }} 
        />
      ) : null,
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

