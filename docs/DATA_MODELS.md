# Модели данных (Data Models)

Описание основных сущностей и типов данных, используемых в проекте.

## Основные сущности

### Trailer (Прицеп)
Основной товар в каталоге.
```typescript
interface Trailer {
  id: string;
  model: string;       // Модель (напр. "МЗСА 817701")
  name: string;        // Маркетинговое название
  price: number;       // Цена в рублях
  category: 'general' | 'water' | 'commercial' | ...;
  capacity: number;    // Грузоподъемность (кг)
  specs?: {            // Технические характеристики
    dimensions: string;
    weight: string;
    axles: number;
  };
  availability: 'in_stock' | 'days_1_3' | ...;
  image: string;       // URL изображения
}
```

### Order (Заказ)
Сущность заказа, связывающая клиента и конфигурацию товара.
```typescript
interface Order {
  id: string;
  orderNumber: string; // Читаемый номер (ONR-2025...)
  date: string;        // ISO дата создания
  status: 'new' | 'processing' | 'shipping' | 'ready' | 'completed' | 'cancelled';
  
  customer: {          // Данные покупателя (snapshot)
    name: string;
    phone: string;
    email: string;
  };
  
  configuration: {     // Состав заказа
    trailer: Trailer;
    accessories: Accessory[];
    totalPrice: number;
  };
  
  timeline: OrderEvent[]; // История изменений статуса
}
```

### UserRole (Роли)
```typescript
type UserRole = 'user' | 'manager' | 'admin';
```

## API Interface (IDatabaseProvider)

Интерфейс для взаимодействия со слоем данных.

```typescript
interface IDatabaseProvider {
  // Инициализация
  initializeData(trailers: Trailer[], accessories: Accessory[], settings: Settings, orders?: Order[]): Promise<void>;

  // Заказы
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: Order): Promise<Order>;
  updateOrder(id: string, data: Partial<Order>): Promise<Order>;
  
  // Товары
  getTrailers(): Promise<Trailer[]>;
  saveTrailer(trailer: Trailer): Promise<Trailer>;
  
  // ... другие методы
}
```
