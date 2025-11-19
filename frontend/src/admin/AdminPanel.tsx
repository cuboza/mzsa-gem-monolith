import { Admin, Resource } from 'react-admin';
import { dataProvider } from './dataProvider';
import { authProvider } from './authProvider';
import { OrderList, OrderEdit } from './resources/orders';
import { TrailerList, TrailerEdit } from './resources/trailers';
import { ShoppingCart, Package } from 'lucide-react';

// Компоненты иконок для меню
const OrderIcon = () => <ShoppingCart size={20} />;
const TrailerIcon = () => <Package size={20} />;

export const AdminPanel = () => (
  <Admin
    basename="/admin"
    dataProvider={dataProvider}
    authProvider={authProvider}
    title="O-N-R Admin"
  >
    <Resource 
      name="orders" 
      list={OrderList} 
      edit={OrderEdit} 
      icon={OrderIcon}
      options={{ label: 'Заказы' }} 
    />
    <Resource 
      name="trailers" 
      list={TrailerList} 
      edit={TrailerEdit} 
      icon={TrailerIcon}
      options={{ label: 'Каталог' }} 
    />
  </Admin>
);

