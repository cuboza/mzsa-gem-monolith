# Архитектура проекта

Проект построен по классической **Client-Server** архитектуре.
Frontend взаимодействует с Backend через REST API.

## Стек технологий

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Admin Interface**: React Admin
- **State Management**: React Context + Hooks

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite
- **ORM**: Sequelize
- **API**: REST

## Архитектурные решения

### 1. Data Layer (Слой данных)
- **Backend**:
  - Используется реляционная база данных **SQLite** для хранения данных.
  - **Sequelize** используется как ORM для описания моделей и миграций.
  - Реализован REST API для основных сущностей (`trailers`, `orders`, `accessories`, `customers`, `settings`).
- **Frontend**:
  - Используется паттерн **Provider** (`RestProvider`), который абстрагирует HTTP-запросы к API.
  - В `src/services/api/index.ts` можно переключаться между `RestProvider` (продакшн/дев с бэкендом) и `LocalStorageProvider` (автономный режим/прототипирование).

### 2. Database Schema (Схема БД)
Основные модели данных описаны в `backend/models/`:
- **Trailer**: Расширенная модель прицепа, включающая:
  - Основную информацию (модель, цена, наличие).
  - Физические характеристики (размеры, вес).
  - Технические характеристики (оси, подвеска, тормоза).
  - Данные для скрейпинга (`sourceUrl`, `externalId`).
  - Медиа (`image`, `images`).
  - Маркетинговые флаги (`isPopular`, `isNew`, `isOnSale`, `isPriceReduced`).
- **Order**: Заказы клиентов.
- **Accessory**: Аксессуары и доп. оборудование.
- **Customer**: База клиентов.
- **Settings**: Глобальные настройки сайта.

### 3. Project Structure (Структура проекта)

```
root/
├── backend/            # Node.js сервер
│   ├── models/         # Sequelize модели
│   ├── database.js     # Подключение к SQLite
│   ├── server.js       # Точка входа и API роуты
│   ├── seed.js         # Скрипт инициализации БД
│   └── db.json         # Исходные данные для сидинга
├── frontend/           # React приложение
│   ├── src/
│   │   ├── admin/      # Админ-панель
│   │   ├── services/   # API клиенты (RestProvider)
│   │   └── ...
└── docs/               # Документация
```

## Потоки данных

1.  **Frontend** отправляет HTTP-запрос (GET/POST/PUT/DELETE) на `http://localhost:3001/api/...`.
2.  **Express Server** принимает запрос, валидирует данные и обращается к БД через **Sequelize**.
3.  **SQLite** выполняет операцию и возвращает результат.
4.  **Frontend** получает JSON-ответ и обновляет UI.

## Развертывание и запуск

1.  **Backend**:
    - `cd backend`
    - `npm install`
    - `npm run seed` (первичная загрузка данных)
    - `npm start` (запуск сервера на порту 3001)
2.  **Frontend**:
    - `cd frontend`
    - `npm install`
    - `npm run dev` (запуск клиента на порту 5173)

## Ограничения и планы
- Текущая реализация использует SQLite, что отлично подходит для разработки и небольших нагрузок. Для масштабирования можно легко переключиться на PostgreSQL/MySQL, изменив диалект Sequelize.
- Аутентификация на бэкенде пока упрощена (или отсутствует), полагается на клиентскую логику. В будущем планируется внедрение JWT.
