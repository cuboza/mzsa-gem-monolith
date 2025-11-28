# Модели данных (Data Models)

Описание основных сущностей и типов данных, используемых в проекте.

## Основные сущности

### Trailer (Прицеп)
Основной товар в каталоге (все данные зеркалятся между scraper ➜ backend ➜ frontend).
```typescript
type TrailerCategory = 'general' | 'water' | 'commercial';
type Availability = 'in_stock' | 'days_1_3' | 'days_7_14' | 'on_order';

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
  oldPrice?: number;        // Старая цена (для скидки)
  currency: 'RUB';
  description: string;
  
  // --- Медиа ---
  image: string;            // Главное изображение
  images: string[];         // Все локальные пути /images/... (галерея)

  // --- Физические характеристики ---
  capacity?: number;             // Грузоподъёмность, кг
  dimensions?: string;           // «2453×1231×470» — размеры кузова
  bodyDimensions?: string;       // Для лодочных: длина судна
  gabarity?: string;             // Габаритные размеры
  boardHeight?: number;          // Высота борта, мм
  
  // --- Технические характеристики ---
  suspension?: string;           // «Рессорная», «Резино-жгутовая»
  brakes?: string;               // «Нет», «Тормоз наката»
  axles?: number;                // Количество осей (1 или 2)
  
  // Полный объект характеристик из скрапера
  specs?: Record<string, string | number>;

  features: string[];            // Особенности модели
  compatibility?: ('snowmobile' | 'boat' | 'atv' | 'motorcycle')[];
  
  // --- Маркетинговые флаги ---
  availability: Availability;
  badge?: string;                // Кастомный бейдж
  isPopular?: boolean;           // Хит продаж
  isNew?: boolean;               // Новинка
  isOnSale?: boolean;            // Акция
  isPriceReduced?: boolean;      // Снижена цена
  
  // --- Метаданные ---
  createdAt?: string;
  updatedAt?: string;
}
```

> **Именование полей (консистентность):**
> - `image` — главное изображение (единственное)
> - `images` — массив всех изображений (галерея)
> - В db.json используется `heroImage` → seed.js маппит на `image`
> - В db.json используется `images` → seed.js сохраняет как `images`

> **Источник данных:**
> 1. Скрапер формирует описание, фотографии, полные specs.
> 2. Импорт из 1С обновляет цену, availability и `warehouses`.
> 3. Backend (`db.json`) хранит объединённый результат, фронт потребляет через REST.

### Краткая vs. полная карточка
| Поле | TrailerCard (краткая) | TrailerDetailsModal (полная) |
|------|----------------------|------------------------------|
| Размеры кузова / Длина судна | ✅ | ✅ |
| Количество осей | ✅ | ✅ |
| Тормоз (Есть/Нет) | ✅ | ✅ (полная информация) |
| Грузоподъёмность | ✅ | ✅ |
| Подвеска | ❌ | ✅ |
| Габариты | ❌ | ✅ |
| Высота борта | ❌ | ✅ |
| Полная/снаряжённая масса | ❌ | ✅ |
| Все specs из скрапера | ❌ | ✅ |
| Особенности модели | ❌ | ✅ |
| Описание | ❌ | ✅ |
| Галерея изображений | ❌ | ✅ |

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
  warehouses?: WarehouseStock[]; // Остаток (опционально)
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
    email?: string;
    region: 'ХМАО' | 'ЯНАО';
    city: string;
  };
  
  configuration: {     // Состав заказа
    trailer: Trailer;
    accessories: Accessory[];
    totalPrice: number;
  };
  
  delivery: {
    method: 'pickup' | 'delivery';
    region: 'ХМАО' | 'ЯНАО';
    city: string;
    address?: string;
    cost?: number;
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
