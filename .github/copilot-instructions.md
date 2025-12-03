# MZSA GEM – Инструкции для Copilot

**ВАЖНО: ВСЕГДА ОТВЕЧАЙ НА РУССКОМ ЯЗЫКЕ.**

## Обзор архитектуры
- Монорепозиторий содержит: `frontend/` (React + Vite + TypeScript), `backend/` (Express + Sequelize + SQLite, устаревший), `scraper/` (Python) с документацией в `docs/`.
- **Основной источник данных: Supabase** (облачная PostgreSQL база). Переключение провайдера в `frontend/src/services/api/index.ts` через `DATA_SOURCE`.
- Фронтенд деплоится на **Railway** (https://mzsa-gem-monolith-production.up.railway.app).
- Админ-панель (`src/admin`) встроена, маршрутизируется через `/admin` и использует тот же провайдер данных.

## Контактные данные компании (актуальные)
Сеть магазинов «Охота на рыбалку» (o-n-r.ru) — официальный дилер МЗСА:
- **Главный телефон**: +7 (3462) 22-33-55
- **Email**: info@o-n-r.ru
- **Филиалы**:
  - Сургут: пр-т Мира, 55 (9:00-20:00)
  - Нижневартовск: ул. Индустриальная, 11а (9:00-19:00)
  - Ноябрьск: ул. Ленина, 22 (10:00-19:00)
  - Новый Уренгой: ул. Таежная, 75 (10:00-19:00)
- Работа без перерывов и выходных

## Рабочие процессы запуска и проверки
- Фронтенд: `cd frontend && npm install && npm run dev` (Vite на :5173). Сборка через `npm run build`; сначала выполняется проверка типов через `tsc -b`.
- Бэкенд (устаревший, для локальной разработки): `cd backend && npm install && npm run seed && npm start` (Express на :3001).
- Скрапер: `cd scraper && pip install -r requirements.txt && python scraper.py`; результаты сохраняются в `output/` по слагам прицепов.

## Источники данных и провайдеры
- **LocalStorage** (текущий `DATA_SOURCE = 'local'`): демо-режим без сервера
- **Supabase** (для продакшена): `SupabaseProvider` в `frontend/src/services/api/supabaseProvider.ts`
  - URL: `https://pulqvocnuvpwnsnyvlpt.supabase.co`
  - Таблицы: `trailers`, `categories`, `specifications`, `features`, `images`, `options`, `trailer_options`, `leads`, `lead_items`, `customers`, `warehouses`, `vehicle_models`
  - **ВАЖНО**: Поля в Supabase отличаются от типов TypeScript:
    - `auth_user_id` (не `user_id`) — связь с Supabase Auth
    - `status = 'active'` + `visible_on_site = true` (не `is_active`)
    - `retail_price` — основная цена (не `price`)
    - `main_image_url` — главное изображение (не `image`)
    - `max_vehicle_length/width/weight` → `maxVehicleLength/Width/Weight`
    - `article` — артикул производителя (МЗСА)
    - `onr_article` — **сквозной артикул ОНР** (внутренний, для всех товаров)
    - Заявки хранятся в `leads` (не `orders`)
    - Справочник техники в `vehicle_models` (синхронизируется с JSON через админку)
- **REST API** (устаревший): `RestProvider` для работы с локальным бэкендом на :3001
- **LocalStorage** (автономный): `LocalStorageProvider` для работы без сервера
- Переключение: константа `DATA_SOURCE` в `frontend/src/services/api/index.ts`

## Видимость прицепов (isVisible)
Поле `isVisible` управляет показом прицепов:
- **На сайте (каталог, конфигуратор)**: показываются только прицепы с `isVisible !== false`
- **В админке**: показываются ВСЕ прицепы с возможностью редактировать флажок

### API методы:
- `getTrailers()` — для публичного сайта, возвращает только видимые (`isVisible !== false`)
- `getAllTrailers()` — для админки, возвращает все прицепы

### Маппинг полей:
- **LocalStorage**: `trailer.isVisible`
- **Supabase**: `visible_on_site` (булево поле в таблице `trailers`)
- **REST/Backend**: `trailer.isVisible` + query param `?admin=true` для админки

## Категории прицепов (Supabase)
В базе данных три категории (таблица `categories`):
- `general` — Универсальные (бортовые) прицепы
- `water` — Лодочные прицепы  
- `commercial` — Коммерческие (фургоны)

## Совместимость с техникой (Trailer.compatibility)
Маппинг категорий прицепов на типы техники:
- `water` → `['boat']` (лодки, катеры, ПВХ, надувные)
- `general` → `['snowmobile', 'atv', 'motorcycle']` (снегоходы, вездеходы, снегоболотоходы, квадроциклы, мотоциклы)
- `commercial` → `['car', 'cargo', 'snowmobile', 'atv']` (автомобили, грузы, вездеходы, снегоболотоходы, квадроциклы)

## Умный поиск (`utils/searchParser.ts`)
Парсер умного поиска поддерживает:
- **Категории техники**: лодка/катер/пвх → boat, снегоход/atv/utv/квадр/вездеход/снегоболотоход → snowmobile, авто → car, груз → cargo
- **Объём**: `10 куб м`, `5 кубов`, `3 м³`
- **Вес**: `3 тонны`, `1500 кг`
- **Длина**: `4м`, `350см`, `3500мм`

## Структура фронтенда
### Страницы (`src/pages/`)
- `Home.tsx` — главная страница с hero-секцией, популярными прицепами, преимуществами и картой магазинов
- `Catalog.tsx` — каталог с фильтрами, поиском и категориями
- `Configurator.tsx` — многошаговый мастер подбора прицепа (6 категорий техники: снегоход, лодка, квадроцикл, мотоцикл, авто, грузы)
- `TrackOrder.tsx` — отслеживание статуса заказа
- `Profile.tsx` — личный кабинет пользователя
- `About.tsx` — о компании
- `Contacts.tsx` — контакты и карта магазинов
- `Delivery.tsx` — информация о доставке
- `Warranty.tsx` — гарантия и сервис
- `Policy.tsx` — политика конфиденциальности
- `Login.tsx` / `Register.tsx` — авторизация

### Компоненты (`src/components/`)
- `Header.tsx` — шапка с навигацией и умным поиском
- `Footer.tsx` — подвал с контактами
- `TrailerCard.tsx` — карточка прицепа (использует Badge, Price из ui/)
- `TrailerDetailsModal.tsx` — модальное окно с деталями прицепа
- `CatalogFilters.tsx` — фильтры каталога
- `CatalogSearch.tsx` — строка поиска с автодополнением по базе техники (vehiclesDatabase.json)

### UI-компоненты (`src/components/ui/`)
- `Button.tsx` — кнопка с вариантами (primary, secondary, outline, ghost, danger, success)
- `Input.tsx` — поле ввода с иконкой и ошибкой
- `Card.tsx` — карточка с CardHeader, CardTitle, CardContent, CardFooter
- `StatusBadge.tsx` — бейдж статуса заказа
- `Badge.tsx` — универсальные бейджи: `Badge`, `NewBadge`, `SaleBadge`, `DiscountBadge`, `PopularBadge`
- `Price.tsx` — компонент цены с форматированием и скидками
- `OptimizedImage.tsx` — оптимизированное изображение с lazy loading

### SEO-компоненты (`src/components/common/`)
- `SEO.tsx` — микроданные schema.org:
  - `ProductSchema` — для карточек товаров
  - `BreadcrumbSchema` — хлебные крошки (используется в Catalog)
  - `LocalBusinessSchema` — данные о компании (используется в Home)
  - `useMetaTags()` — хук для управления мета-тегами

### Feature-модули (`src/features/`)
Модульная бизнес-логика, группирующая связанный код:
- `trailers/` — работа с прицепами:
  - `trailerUtils.ts` — утилиты: `getAxlesCount()`, `getCapacity()`, `hasBrakes()`, `getMainImage()`, `getAvailabilityLabel()`
  - `trailerConstants.ts` — константы: `TRAILER_CATEGORIES`, `AVAILABILITY_LABELS`, `BODY_TYPES`
  - `useTrailerFilters.ts` — хук фильтрации каталога (заменяет useMemo в Catalog)
- `vehicles/` — справочник техники:
  - `vehicleTypes.ts` — типы `VehicleModel`, `VehicleDatabase`
  - `vehicleSearch.ts` — умный поиск с ранжированием
  - `vehicleValidation.ts` — валидация JSON при импорте
  - `vehicleSync.ts` — логика синхронизации версий

### Утилиты (`src/utils/`)
- `format.ts` — форматирование: `formatPrice()`, `formatDateTime()`, `formatDate()`, `formatPhone()`
- `orderStatus.ts` — статусы заказов: `getStatusLabel()`, `getStatusClasses()`
- `searchParser.ts` — парсер умного поиска: `parseSearchQuery()`, `mapVehicleCategoryToTrailerCategory()`

### Хуки (`src/hooks/`)
- `useBreakpoint.ts` — определение текущего брейкпоинта для адаптивности
- `useHeroSlides.ts` — управление слайдами Hero карусели
- `useStores.ts` — работа с магазинами/филиалами

### Админ-панель (`src/admin/resources/`)
- `trailers.tsx`, `orders.tsx`, `accessories.tsx`, `customers.tsx`, `settings.tsx` — базовые ресурсы
- `heroSlides.tsx` — управление Hero-каруселью на главной
- `stores.tsx` — управление магазинами/филиалами
- `warehouses.tsx` — управление складами
- `import1c.tsx` — импорт данных из 1С (stub)

## Переменные окружения
```env
# Supabase (основной источник)
VITE_SUPABASE_URL=https://pulqvocnuvpwnsnyvlpt.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>

# REST API (устаревший, для локальной разработки)
VITE_API_URL=http://localhost:3001
```

## Соглашения фронтенда
- Типы в `src/types/index.ts` — авторитетные, изменения видны при `tsc -b`
- Доступ к данным через `db` из `services/api/index.ts`
- Фильтры каталога зеркалируют параметры URL для deep-linking
- Конфигуратор определяет совместимые прицепы через `trailer.compatibility` и `maxVehicle*`
- **Переиспользование кода**:
  - Утилиты прицепов: `import { getAxlesCount, hasBrakes } from '../features/trailers';`
  - UI-компоненты: `import { Badge, Price, Button } from '../components/ui';`
  - SEO: `import { ProductSchema, BreadcrumbSchema } from '../components/common';`

## Логотип и брендинг
- Логотип компании: `frontend/public/images/onr-logo.png`
- Используется в Header и на главной странице
