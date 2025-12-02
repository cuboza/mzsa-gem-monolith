# Система управления ролями и разрешениями

## Текущее состояние

### Что уже есть:
- Роли: 'user' | 'manager' | 'admin'
- Базовая авторизация в админ-панели
- Простое показ/скрытие разделов по роли

### Нужно улучшить:
- Детализация прав доступа по операциям
- Гибкая система разрешений
- UI для управления разрешениями

## Новая архитектура

### Типы разрешений
```typescript
type Resource = 'orders' | 'trailers' | 'accessories' | 'customers' | 'users' | 'settings' | 'backup' | 'hero-slides' | 'stores' | 'warehouses' | 'import-1c';
type Operation = 'view' | 'create' | 'edit' | 'delete' | 'export';

interface Permission {
  resource: Resource;
  operations: Operation[];
}

interface Role {
  name: string;
  displayName: string;
  permissions: Permission[];
}
```

### Матрица разрешений
| Ресурс | Viewer | Manager | Admin |
|--------|--------|---------|-------|
| Заказы | view | view,create,edit,export | all |
| Прицепы | view | view,export | all |
| Клиенты | view | view,create,edit,export | all |
| Пользователи | - | - | view,create,edit,delete |
| Настройки | - | - | view,edit |
| Бэкап | - | - | view,create,restore |

## План работы
1. Обновить типы данных
2. Создать PermissionService
3. Обновить authProvider
4. Модифицировать AdminPanel
5. Добавить UI управления
6. Тестирование

Планируемые изменения позволяют создать гибкую систему прав доступа с детальным контролем операций для каждого ресурса.

## Дополнительные улучшения заказов

### Причина отмены заказа
Добавить обязательное поле при отмене заказа:

```typescript
interface CancellationReason {
  reason: string;           // причина отмены
  details?: string;         // дополнительные детали
  userId: string;           // кто отменил
  timestamp: string;        // когда отменил
}

// Обновить Order интерфейс:
interface Order {
  // ... существующие поля
  cancellationReason?: CancellationReason; // только при status === 'cancelled'
}
```

**Стандартные причины отмены:**
- Клиент отказался
- Товар недоступен
- Неверные контактные данные
- Дублированный заказ
- Техническая ошибка
- Другое (с полем для описания)