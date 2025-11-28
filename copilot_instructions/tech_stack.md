# Технологический стек проекта

## Frontend
- **Framework**: React 18 + Vite 5
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Admin Panel**: React Admin
- **Data Layer**: IDatabaseProvider (RestProvider / LocalStorageProvider)

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
