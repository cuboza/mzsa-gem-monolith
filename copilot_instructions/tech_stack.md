# Технологический стек проекта

## Frontend
- **Framework**: React 18 + Vite 5
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Admin Panel**: React Admin
- **Data Layer**: IDatabaseProvider (SupabaseProvider / LocalStorageProvider / RestProvider)

### Модульная архитектура

#### Feature-модули (`src/features/`)
Бизнес-логика, сгруппированная по доменам:
- `trailers/` — утилиты, константы и хуки для работы с прицепами

#### UI-компоненты (`src/components/ui/`)
- `Button`, `Input`, `Card`, `StatusBadge` — базовые компоненты
- `Badge`, `NewBadge`, `SaleBadge`, `DiscountBadge`, `PopularBadge` — бейджи
- `Price` — форматирование цен со скидками
- `OptimizedImage` — оптимизированные изображения

#### SEO-компоненты (`src/components/common/`)
- `ProductSchema` — микроданные товара schema.org
- `BreadcrumbSchema` — микроданные хлебных крошек
- `LocalBusinessSchema` — микроданные компании
- `useMetaTags` — хук для мета-тегов

#### Кастомные хуки (`src/hooks/`)
- `useBreakpoint` — адаптивность
- `useHeroSlides` — управление каруселью
- `useStores` — работа с магазинами

## Backend (УСТАРЕВШИЙ — только для локальной разработки)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite
- **ORM**: Sequelize
- **API**: REST API на порту 3001

## Supabase (ОСНОВНОЙ источник данных)
- **Database**: PostgreSQL (облачный)
- **Project URL**: `https://pulqvocnuvpwnsnyvlpt.supabase.co`
- **Auth**: Row Level Security (RLS)
- **Провайдер**: `SupabaseProvider` в `frontend/src/services/api/supabaseProvider.ts`

### Ключевые таблицы Supabase
| Таблица | Описание |
|---------|----------|
| `trailers` | Прицепы (id, model, name, retail_price, status, visible_on_site) |
| `categories` | Категории (general, water, commercial) |
| `specifications` | Характеристики прицепов (key-value) |
| `features` | Особенности моделей |
| `images` | Изображения (item_type, item_id) |
| `options` | Опции/аксессуары |
| `trailer_options` | Связь прицеп-опция |
| `leads` | Заявки (вместо Orders) |
| `lead_items` | Состав заявки |
| `customers` | Клиенты (auth_user_id для связи с Auth) |
| `warehouses` | Склады |
| `trailer_stock`, `option_stock` | Остатки |

### Важные поля в Supabase (отличия от типов)
- `auth_user_id` (не `user_id`) — связь с Auth
- `status = 'active'` + `visible_on_site = true` (не `is_active`)
- `retail_price` (основная цена), `base_price`, `wholesale_price`
- `main_image_url` (не `image`)
- `availability`: `in_stock`, `on_order`, `out_of_stock`

## Scraper
- **Language**: Python 3
- **Libraries**: requests, BeautifulSoup, json
- **Output**: `output/` по категориям прицепов

## Инструменты
- **Package Manager**: npm
- **Linting**: ESLint
- **Build**: Vite (frontend), Node.js (backend)
- **Version Control**: Git

## Переменные окружения
- `VITE_SUPABASE_URL` — URL Supabase проекта
- `VITE_SUPABASE_ANON_KEY` — Публичный ключ Supabase
- `VITE_API_URL` — URL бэкенда (устаревший, default: `http://localhost:3001`)
