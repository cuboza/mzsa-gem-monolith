# Архитектура проекта

Проект построен на архитектуре **Jamstack** — статический фронтенд с облачной базой данных.
Frontend может работать с разными провайдерами данных через абстракцию `IDatabaseProvider`.

## Стек технологий

### Frontend (основной)
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Admin Interface**: React Admin
- **State Management**: React Context + Hooks
- **Hosting**: Railway (https://spricepom.ru)

### Backend (устаревший, для локальной разработки)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite
- **ORM**: Sequelize
- **API**: REST

### Основной источник данных — Supabase
- **Database**: PostgreSQL (облако)
- **URL**: https://pulqvocnuvpwnsnyvlpt.supabase.co
- **Auth**: Supabase Auth
- **RLS**: Row Level Security для защиты данных

## Архитектурные решения

### 1. Data Layer (Слой данных)
- **Провайдеры данных** (переключаемые через `DATA_SOURCE` в `services/api/index.ts`):
  - `SupabaseProvider` — облачная PostgreSQL база (для продакшена)
  - `LocalStorageProvider` — браузерное хранилище (для автономной работы/демо)
  - `RestProvider` — REST API к локальному бэкенду (устаревший)
- **Текущий провайдер**: `local` (LocalStorage) — см. `services/api/index.ts`

### 2. Database Schema (Схема БД)

#### Supabase (основной)
Таблицы в PostgreSQL:
- **trailers** — прицепы (slug, model, name, retail_price, main_image_url, status, visible_on_site, max_vehicle_length/width/weight)
- **vehicle_models** — справочник техники (лодки, снегоходы и т.д.) с версионированием (`data_version`)
- **categories** — категории прицепов (general, water, commercial)
- **specifications** — характеристики прицепов
- **features** — особенности/фичи
- **images** — галерея изображений
- **options** — опции/аксессуары
- **trailer_options** — связь прицеп-опция
- **leads** — заявки (в TypeScript: Order)
- **lead_items** — состав заявки
- **customers** — клиенты
- **warehouses** — склады
- **user_roles** — роли пользователей (admin, manager)

> **ВАЖНО**: Поля в Supabase отличаются от типов TypeScript!
> - `max_vehicle_length` → `maxVehicleLength`
> - `retail_price` → `price`
> - `main_image_url` → `image`
> См. маппинг в `supabaseProvider.ts` и `docs/DATA_MODELS.md`

#### Backend SQLite (устаревший)
Модели в `backend/models/`:
- **Trailer**, **Order**, **Accessory**, **Customer**, **Settings**

### 3. Project Structure (Структура проекта)

```
root/
├── frontend/           # React приложение (основной)
│   ├── src/
│   │   ├── admin/      # Админ-панель React Admin
│   │   │   └── resources/  # Ресурсы админки
│   │   │       ├── trailers.tsx, orders.tsx, customers.tsx  # Базовые
│   │   │       ├── heroSlides.tsx   # Управление Hero-каруселью
│   │   │       ├── stores.tsx       # Управление магазинами
│   │   │       ├── warehouses.tsx   # Управление складами
│   │   │       └── import1c.tsx     # Импорт из 1С
│   │   ├── components/ # UI компоненты
│   │   │   ├── ui/     # Базовые компоненты (Button, Card, Badge, Price...)
│   │   │   └── common/ # Общие компоненты (SEO, схемы schema.org)
│   │   ├── features/   # Feature-модули (бизнес-логика по доменам)
│   │   │   ├── trailers/  # Работа с прицепами
│   │   │   │   ├── trailerUtils.ts      # Утилиты (getAxlesCount, hasBrakes...)
│   │   │   │   ├── trailerConstants.ts  # Константы
│   │   │   │   └── useTrailerFilters.ts # Хук фильтрации каталога
│   │   │   └── vehicles/  # Справочник техники
│   │   │       ├── vehicleTypes.ts      # Типы
│   │   │       ├── vehicleSearch.ts     # Логика поиска
│   │   │       ├── vehicleValidation.ts # Валидация JSON
│   │   │       └── vehicleSync.ts       # Синхронизация
│   │   ├── hooks/      # Кастомные хуки (useBreakpoint, useHeroSlides, useStores)
│   │   ├── pages/      # Страницы (Home, Catalog, Configurator...)
│   │   ├── services/   # API провайдеры (Supabase, Local, REST)
│   │   ├── types/      # TypeScript типы (авторитетный источник)
│   │   ├── utils/      # Утилиты (format, searchParser, orderStatus)
│   │   └── context/    # React Context
│   └── public/         # Статические файлы
├── backend/            # Node.js сервер (устаревший)
│   ├── models/         # Sequelize модели
│   └── ...
├── scraper/            # Python скрапер mzsa.ru
├── scripts/            # Скрипты импорта данных
├── supabase/           # Миграции и функции Supabase
├── output/             # Результаты скрапера
└── docs/               # Документация
```

## Потоки данных

### Supabase (основной)
1. **Frontend (Публичный сайт/Каталог/Конфигуратор)** вызывает метод `db.getTrailers()` из провайдера — публичный метод, возвращающий только видимые прицепы (isVisible !== false)
2. **Админ-панель** использует `db.getAllTrailers()` — админский метод, возвращающий ВСЕ прицепы, включая скрытые (isVisible = false)
2. **SupabaseProvider** делает запрос к Supabase через `@supabase/supabase-js`
3. **PostgreSQL** выполняет запрос с учётом RLS
4. Данные маппятся из формата Supabase в TypeScript типы
5. **Frontend** получает типизированные данные и обновляет UI

### LocalStorage (демо/автономный режим)
1. **Frontend (Публичный сайт/Каталог/Конфигуратор)** вызывает метод `db.getTrailers()` (фильтрует скрытые)
2. **Админ-панель** вызывает `db.getAllTrailers()` (вернёт все прицепы)
2. **LocalStorageProvider** читает/пишет данные в `localStorage`
3. Данные уже в формате TypeScript типов

### REST API (устаревший)
1. **Frontend (Публичный сайт/Каталог/Конфигуратор)** → HTTP-запрос на `http://localhost:3001/api/...` (публичный запрос — сервер добавляет фильтр видимости)
2. **Админ-панель** → HTTP-запрос на `http://localhost:3001/api/...?admin=true` (запрос с admin=true возвращает все прицепы)
2. **Express Server** → **Sequelize** → **SQLite**
3. **Frontend** получает JSON-ответ

## Развертывание и запуск

### Frontend (основной)
```bash
cd frontend
npm install
npm run dev      # Vite dev server на :5173
npm run build    # Сборка (включает tsc -b для проверки типов)
```

### Backend (устаревший, для локальной разработки)
```bash
cd backend
npm install
npm run seed     # Первичная загрузка данных
npm start        # Express на :3001
```

### Scraper (Python)
```bash
cd scraper
pip install -r requirements.txt
python scraper.py  # Результаты в output/
```

## Переключение провайдера данных

В файле `frontend/src/services/api/index.ts`:
```typescript
const DATA_SOURCE: 'local' | 'rest' | 'supabase' = 'local';
```

- `'supabase'` — продакшен, облачная PostgreSQL
- `'local'` — демо режим, LocalStorage браузера
- `'rest'` — локальный бэкенд на :3001

## Модульная архитектура фронтенда

### Feature-модули (`src/features/`)
Бизнес-логика, сгруппированная по доменам приложения:
- **trailers/** — утилиты для прицепов (`getAxlesCount`, `hasBrakes`, `cleanDimension`), константы, хуки фильтрации
- **vehicles/** — справочник техники:
  - `vehicleTypes.ts` — типы (`VehicleModel`, `VehicleDatabase`)
  - `vehicleSearch.ts` — логика поиска с ранжированием
  - `vehicleValidation.ts` — валидация JSON при импорте
  - `vehicleSync.ts` — синхронизация версий
- **stock/** — управление складскими остатками и доступностью:
  - `stockTypes.ts` — типы (`StockInfo`, `MultiWarehouseStock`, `AvailabilityResult`)
  - `stockConstants.ts` — города, сроки доставки, CSS-классы бейджей
  - `stockUtils.ts` — бизнес-логика (`calculateAvailability`, `reserveStock`, `validateStockState`)
  - **67 unit-тестов, 97% покрытие** — полный workflow заказа с резервированием

### UI-компоненты (`src/components/ui/`)
Переиспользуемые компоненты интерфейса:
- **Badge** — универсальные бейджи (NewBadge, SaleBadge, DiscountBadge, PopularBadge)
- **Price** — форматирование цен со скидками
- **OptimizedImage** — lazy loading изображений
- **AvailabilityBadge** — бейдж доступности с учётом города
- **CitySelector** — селектор города пользователя
- **Button, Input, Card, StatusBadge** — базовые компоненты

### SEO-компоненты (`src/components/common/`)
Микроданные schema.org для поисковых систем:
- **ProductSchema** — данные товара
- **BreadcrumbSchema** — хлебные крошки
- **LocalBusinessSchema** — данные о компании

### Кастомные хуки (`src/hooks/`)
- **useBreakpoint** — определение текущего брейкпоинта
- **useHeroSlides** — управление каруселью на главной
- **useStores** — работа с магазинами
- **useTrailerAvailability**, **useAccessoryAvailability** — расчёт доступности товара с учётом города

## Продакшен
- **Hosting**: Railway
- **URL**: https://spricepom.ru
- **Database**: Supabase PostgreSQL
