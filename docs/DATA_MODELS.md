# Модели данных (Data Models)

Описание основных сущностей и типов данных, используемых в проекте.

> ⚠️ **ВАЖНО**: Основной источник данных — **Supabase**. Поля в базе отличаются от типов TypeScript!
> Маппинг происходит в `supabaseProvider.ts`.

## Supabase vs TypeScript

| Supabase (БД) | TypeScript (фронт) | Описание |
|---------------|-------------------|----------|
| `auth_user_id` | `userId` | Связь с Auth |
| `status = 'active'` | `isActive` | Статус записи |
| `visible_on_site` | — | Видимость на сайте |
| `retail_price` | `price` | Розничная цена |
| `main_image_url` | `image` | Главное изображение |
| `max_vehicle_length` | `maxVehicleLength` | Макс. длина техники, мм |
| `max_vehicle_width` | `maxVehicleWidth` | Макс. ширина техники, мм |
| `max_vehicle_weight` | `maxVehicleWeight` | Макс. вес техники, кг |
| `leads` | `orders` | Заявки/заказы |

## Основные сущности

### Trailer (Прицеп)
Основной товар в каталоге.

**Supabase таблица `trailers`:**
```sql
id UUID PRIMARY KEY
guid_1c UUID                    -- ID в 1С
model VARCHAR(100)              -- "МЗСА 817701"
name VARCHAR(255)               -- Маркетинговое имя
category_id UUID                -- FK → categories
retail_price DECIMAL(10,2)      -- Розничная цена
base_price DECIMAL(10,2)        -- Базовая цена
main_image_url TEXT             -- Главное изображение
status VARCHAR(20)              -- 'active' | 'inactive' | 'archived'
visible_on_site BOOLEAN         -- Показывать на сайте
is_published BOOLEAN            -- Опубликован
availability VARCHAR(20)        -- 'in_stock' | 'on_order' | 'out_of_stock'
badges TEXT[]                   -- ['popular', 'new', 'sale']
slug VARCHAR(255)               -- URL-friendly ID
max_vehicle_length INTEGER      -- Макс. длина техники, мм
max_vehicle_width INTEGER       -- Макс. ширина техники, мм
max_vehicle_weight INTEGER      -- Макс. вес техники, кг
```

**TypeScript тип (фронтенд):**
```typescript
type TrailerCategory = 'general' | 'water' | 'commercial';
type Availability = 'in_stock' | 'days_1_3' | 'days_7_14';

interface Trailer {
  id: string;               // slug из Supabase
  model: string;            // «МЗСА 817701»
  name: string;             // Маркетинговое имя
  category: TrailerCategory;
  price: number;            // retail_price из Supabase
  oldPrice?: number;        // Старая цена (для скидки)
  description?: string;
  
  // --- Медиа ---
  image: string;            // main_image_url из Supabase
  images?: string[];        // Из таблицы images

  // --- Характеристики (из таблицы specifications) ---
  capacity: number;              // Грузоподъёмность, кг
  dimensions?: string;           // Размеры кузова "ДxШxВ"
  bodyDimensions?: string;       // Для лодочных: макс. длина судна
  gabarity?: string;             // Габаритные размеры
  boardHeight?: number;          // Высота борта, мм
  
  // --- Для конфигуратора (max_vehicle_* из Supabase) ---
  maxVehicleLength?: number;     // Макс. длина техники, мм
  maxVehicleWidth?: number;      // Макс. ширина техники, мм
  maxVehicleWeight?: number;     // Макс. вес техники, кг
  maxVehicleVolume?: number;     // Объём кузова, м³
  
  // --- Особенности (из таблицы features) ---
  features: string[];

  // --- Совместимость (вычисляется по category) ---
  compatibility?: ('snowmobile' | 'boat' | 'atv' | 'motorcycle' | 'car' | 'cargo')[];
  
  // --- Флаги (из badges[]) ---
  availability: Availability;
  stock?: number;            // Количество на складе
  isPopular?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  isPriceReduced?: boolean;
  
  // --- Детализированные specs (из таблицы specifications) ---
  specs?: {
    dimensions: string;
    capacity: string;
    weight: string;
    axles: number;
    boardHeight?: number;
    [key: string]: any;  // Динамические поля из скрапера
  };
  
  suspension?: string;
  brakes?: string;
  stock?: number;            // Количество на складе
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

### Accessory / Option (Опция/аксессуар)

**Supabase таблица `options`:**
```sql
id UUID PRIMARY KEY
guid_1c UUID
name VARCHAR(255)
description TEXT
option_category VARCHAR(50)     -- 'loading', 'support', 'spare', ...
retail_price DECIMAL(10,2)
base_price DECIMAL(10,2)
main_image_url TEXT
status VARCHAR(20)              -- 'active' | 'inactive'
visible_on_site BOOLEAN
```

**TypeScript тип:**
```typescript
type AccessoryCategory = 'loading' | 'support' | 'spare' | 'cover' | 'safety' | 'guides' | 'boat_support';

interface Accessory {
  id: string;
  name: string;
  price: number;               // retail_price
  description: string;
  category: AccessoryCategory;
  image: string;               // main_image_url
  compatibility?: string[];    // Через таблицу trailer_options
  required?: boolean;
  stock?: string;              // Количество на складе
}
```

### Lead / Order (Заявка/Заказ)

> ⚠️ В Supabase используется термин **Lead** (заявка), на фронтенде — **Order** (заказ).

**Supabase таблица `leads`:**
```sql
id UUID PRIMARY KEY
lead_number VARCHAR(50)         -- "ONR-20250128-0001"
customer_id UUID                -- FK → customers
customer_name VARCHAR(255)      -- Snapshot
customer_phone VARCHAR(20)
customer_email VARCHAR(255)
customer_city VARCHAR(100)
source VARCHAR(50)              -- 'site', 'phone', 'configurator'
status VARCHAR(20)              -- 'new', 'processing', 'contacted', ...
total_amount DECIMAL(12,2)
comment TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Связанные таблицы:**
- `lead_items` — состав заявки (trailer_id, option_id, quantity, price)
- `lead_status_history` — история изменений статуса

**TypeScript тип:**
```typescript
interface Order {
  id: string;
  orderNumber: string;         // lead_number
  date: string;
  status: 'new' | 'processing' | 'shipping' | 'ready' | 'completed' | 'cancelled';
  
  customer: {
    name: string;
    phone: string;
    email?: string;
    region: 'ХМАО' | 'ЯНАО';
    city: string;
  };
  
  configuration: {
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
  
  timeline: OrderEvent[];
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
