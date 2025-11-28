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
- **Supabase** (по умолчанию): `SupabaseProvider` в `frontend/src/services/api/supabaseProvider.ts`
  - URL: `https://pulqvocnuvpwnsnyvlpt.supabase.co`
  - Таблицы: `trailers`, `categories`, `specifications`, `features`, `images`, `options`, `trailer_options`
- **REST API** (устаревший): `RestProvider` для работы с локальным бэкендом на :3001
- **LocalStorage** (автономный): `LocalStorageProvider` для работы без сервера
- Переключение: константа `DATA_SOURCE` в `frontend/src/services/api/index.ts`

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

### Компоненты (`src/components/`)
- `Header.tsx` — шапка с навигацией и умным поиском
- `Footer.tsx` — подвал с контактами
- `TrailerCard.tsx` — карточка прицепа
- `TrailerDetailsModal.tsx` — модальное окно с деталями прицепа
- `CatalogFilters.tsx` — фильтры каталога
- `CatalogSearch.tsx` — строка поиска

### Утилиты (`src/utils/`)
- `format.ts` — форматирование: `formatPrice()`, `formatDateTime()`, `formatDate()`, `formatPhone()`
- `orderStatus.ts` — статусы заказов: `getStatusLabel()`, `getStatusClasses()`
- `searchParser.ts` — парсер умного поиска: `parseSearchQuery()`, `mapVehicleCategoryToTrailerCategory()`

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

## Логотип и брендинг
- Логотип компании: `frontend/public/images/onr-logo.png`
- Используется в Header и на главной странице
