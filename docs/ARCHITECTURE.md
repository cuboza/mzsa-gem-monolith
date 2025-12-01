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
- **Hosting**: Railway (https://mzsa-gem-monolith-production.up.railway.app)

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
- **trailers** — прицепы (slug, model, name, retail_price, main_image_url, status, visible_on_site)
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

> **ВАЖНО**: Поля в Supabase отличаются от типов TypeScript!
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
│   │   ├── components/ # UI компоненты
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
1. **Frontend** вызывает метод `db.getTrailers()` из провайдера
2. **SupabaseProvider** делает запрос к Supabase через `@supabase/supabase-js`
3. **PostgreSQL** выполняет запрос с учётом RLS
4. Данные маппятся из формата Supabase в TypeScript типы
5. **Frontend** получает типизированные данные и обновляет UI

### LocalStorage (демо/автономный режим)
1. **Frontend** вызывает метод `db.getTrailers()`
2. **LocalStorageProvider** читает/пишет данные в `localStorage`
3. Данные уже в формате TypeScript типов

### REST API (устаревший)
1. **Frontend** → HTTP-запрос на `http://localhost:3001/api/...`
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

## Продакшен
- **Hosting**: Railway
- **URL**: https://mzsa-gem-monolith-production.up.railway.app
- **Database**: Supabase PostgreSQL
