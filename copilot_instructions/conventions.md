# Правила и соглашения

## Общие
1. **Язык общения**: Всегда отвечать на русском языке.
2. **Подготовка**: Перед началом разработки или внесением изменений обязательно прочитать все инструкции в папке `copilot_instructions` и `.github/copilot-instructions.md`.
3. **Стиль кода**: Следовать конфигурации ESLint и Prettier.
4. **Проверка хардкода**: Перед коммитом проверять файлы на хардкод телефонов, адресов, URL. Использовать данные из `defaultSettings.ts` или переменные окружения.

## Переиспользование кода (ВАЖНО!)

### Утилиты (`src/utils/`)
- **Форматирование**: Используй `formatPrice()`, `formatDateTime()`, `formatDateShort()` из `utils/format.ts`
- **Статусы заказов**: Используй `getStatusLabel()`, `getStatusClasses()` из `utils/orderStatus.ts`
- **НЕ дублируй**: Локальные функции `formatPrice`, `getStatusColor`, `getStatusText` — запрещены!

### UI-компоненты (`src/components/ui/`)
- `<Button variant="primary|secondary|outline|ghost|danger|success" size="sm|md|lg">`
- `<Input icon={<Icon />} label="..." error="...">`
- `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`, `<CardFooter>`
- `<StatusBadge status="new|processing|..." size="sm|md|lg">`
- `<Badge variant="default|success|warning|error|info|gray">` — универсальный бейдж
- `<NewBadge />`, `<SaleBadge />`, `<DiscountBadge percent={15} />`, `<PopularBadge />` — пресеты
- `<Price price={150000} oldPrice={180000} discount={15} />` — цена с форматированием
- `<OptimizedImage src="..." alt="..." loading="lazy" />` — оптимизированное изображение

### SEO-компоненты (`src/components/common/`)
- `<ProductSchema trailer={...} />` — микроданные товара для Google
- `<BreadcrumbSchema items={[...]} />` — микроданные хлебных крошек
- `<LocalBusinessSchema />` — микроданные компании
- `useMetaTags({ title, description, keywords })` — хук для мета-тегов

### Feature-модули (`src/features/`)
Модульная бизнес-логика для конкретных доменов:
- `trailers/`:
  - `getAxlesCount(trailer)` — количество осей
  - `getCapacity(trailer)` — грузоподъёмность
  - `hasBrakes(trailer)` — наличие тормозов
  - `getMainImage(trailer)` — URL главного изображения
  - `getAvailabilityLabel(availability)` — текст наличия
  - `useTrailerFilters(trailers, filters)` — хук фильтрации каталога
  - `TRAILER_CATEGORIES`, `AVAILABILITY_LABELS`, `BODY_TYPES` — константы

### Хуки (`src/hooks/`)
- `useBreakpoint()` — текущий брейкпоинт (xs/sm/md/lg/xl)
- `useHeroSlides()` — управление слайдами карусели
- `useStores()` — получение и фильтрация магазинов

### Правила переиспользования
1. Новые утилиты добавляй в `src/utils/`, экспортируй через `index.ts`
2. Общие UI-компоненты — в `src/components/ui/`, экспортируй через `index.ts`
3. Бизнес-логика для домена — в `src/features/{domain}/`, экспортируй через `index.ts`
4. SEO-компоненты — в `src/components/common/`, экспортируй через `index.ts`
5. При создании новой функции проверь, нет ли похожей в `utils/` или `features/`
6. Импорт утилит: `import { formatPrice, formatDateTime } from '../utils';`
7. Импорт UI: `import { Button, Input, Badge, Price } from '../components/ui';`
8. Импорт features: `import { getAxlesCount, useTrailerFilters } from '../features/trailers';`
9. Импорт SEO: `import { ProductSchema, BreadcrumbSchema } from '../components/common';`

## Frontend
1. **Компоненты**: Функциональные компоненты React.
2. **Стилизация**: Использовать утилитарные классы Tailwind CSS. Избегать CSS-in-JS или отдельных CSS файлов, если это возможно.
3. **Типизация**: Строгая типизация TypeScript. Избегать `any`.
4. **Иконки**: Использовать `lucide-react`.
5. **Адаптивность**: Использовать mobile-first подход. Breakpoints: `sm:`, `md:`, `lg:`, `xl:`.
6. **UI-эффекты**: Для модальных окон и меню использовать `backdrop-blur`, полупрозрачные фоны (`bg-white/80`), тени.

## Backend (УСТАРЕВШИЙ)
> ⚠️ Основной источник данных — **Supabase**. Backend используется только для локальной разработки.

1. **API**: RESTful принципы.
2. **Данные**: Устаревший SQLite через Sequelize. Seed данные в `db.json`.
3. **Порт**: Express на порту 3001.

## Supabase (ОСНОВНОЙ)
1. **Поля статуса**: Используй `status = 'active'` и `visible_on_site = true` (не `is_active`!)
2. **Связь с Auth**: Поле `auth_user_id` в `customers` (не `user_id`!)
3. **Цены**: `retail_price` — розничная, `base_price` — базовая, `wholesale_price` — оптовая
4. **Изображения**: `main_image_url` в trailers, таблица `images` для галереи
5. **Заявки**: Таблица `leads` (не `orders`!), связанные `lead_items`

## Работа с файлами
1. При редактировании файлов всегда использовать `replace_string_in_file` для точности.
2. Избегать удаления существующего кода без необходимости.
3. При множественных правках использовать `multi_replace_string_in_file`.

## Контакты компании (актуальные данные o-n-r.ru)
- Телефон: +7 (3462) 22-33-55
- Email: info@o-n-r.ru
- Главный адрес: Сургут, пр-т Мира, 55
- Режим работы: 9:00-20:00, без выходных
