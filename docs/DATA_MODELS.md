# Модели данных (Data Models)

Описание основных сущностей и типов данных, используемых в проекте.

## Основные сущности

### Trailer (Прицеп)
Основной товар в каталоге (все данные зеркалятся между scraper ➜ backend ➜ frontend).
```typescript
type TrailerCategory = 'general' | 'water' | 'commercial' | 'moto' | 'wrecker';
type Availability = 'in_stock' | 'days_1_3' | 'days_7_14';

interface DimensionsMM {
  length: number;
  width: number;
  height?: number;
}

interface WarehouseStock {
  warehouse: 'SG-1' | 'SG-vitrina' | 'Service' | 'SG-3' | 'NB' | 'NV' | 'NU';
  stock: number;            // Количество единиц на складе
  reserved?: number;        // Бронирование под заказы
}

interface Trailer {
  id: string;               // Уникальный ключ (slug)
  model: string;            // «МЗСА 817701»
  version?: string;         // «012», если выделяется отдельно
  name: string;             // Маркетинговое имя
  category: TrailerCategory;
  segment?: string;         // «bortovoy», «lodochniy», …
  price: number;
  currency: 'RUB';
  description: string;
  heroImage: string;        // Главное изображение
  images: string[];         // Все локальные пути /images/... (из скрапера)

  capacity?: number;             // кг
  capacityUnit?: 'kg';
  dimensions?: string;           // «2453×1231×470» для отображения
  dimensionsMM?: DimensionsMM;   // нормализованные значения в мм
  bodyDimensions?: string;       // спец. поле для лодочных
  gabarity?: string;
  suspension?: string;           // «рессорная», «рессорно-балансирная»
  brakes?: 'Нет' | 'Есть' | string;
  specs: Record<string, string | number>; // Полное зеркало сайта

  features: string[];
  compatibility?: ('snowmobile' | 'boat' | 'atv' | 'motorcycle')[];
  options: string[];             // Массив ID аксессуаров
  warehouses: WarehouseStock[];  // Остатки по складам

  availability: Availability;
  badge?: string;
  isPopular?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

> **Источник данных:**
> 1. Скрапер формирует описание, фотографии, полные specs.
> 2. Импорт из 1С обновляет цену, availability и `warehouses`.
> 3. Backend (`db.json`) хранит объединённый результат, фронт потребляет через REST.

### Accessory (Опция/аксессуар)
Единый справочник доп. оборудования, переиспользуемый в разных прицепах.
```typescript
type AccessoryCategory = 'loading' | 'support' | 'spare' | 'cover' | 'safety' | 'guides' | 'boat_support' | 'electrics';

interface Accessory {
  id: string;                // SKU или slug (уникален глобально)
  name: string;
  price: number;
  currency: 'RUB';
  description: string;
  category: AccessoryCategory;
  image: string;             // Локальный путь /images/accessories/...
  compatibleWith: string[];  // ['all'] или конкретные категории/модели
  required: boolean;
  warehouses: WarehouseStock[]; // Остаток тот же, что и у прицепов
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
  initializeData(
    trailers: Trailer[],
    accessories: Accessory[],
    settings: Settings,
    orders?: Order[],
    warehouses?: WarehouseStock[]
  ): Promise<void>;

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
