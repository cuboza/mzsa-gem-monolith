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

## Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite
- **ORM**: Sequelize
- **API**: REST API на порту 3001

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
- `VITE_API_URL` — URL бэкенда (default: `http://localhost:3001`)
