# Архитектура системы разрешений

```mermaid
graph TB
    A[Пользователь] --> B[AuthProvider]
    B --> C[PermissionService]
    C --> D[Role Manager]
    D --> E[Роли]
    E --> F[Viewer]
    E --> G[Manager]
    E --> H[Admin]
    
    F --> I[Просмотр заказов<br/>Просмотр прицепов<br/>Просмотр клиентов]
    
    G --> J[Все права Viewer +<br/>Управление заказами<br/>Управление клиентами<br/>Экспорт данных]
    
    H --> K[Все права Manager +<br/>Управление пользователями<br/>Системные настройки<br/>Резервное копирование<br/>Управление каталогом]
    
    C --> L[Проверка разрешений]
    L --> M[PermissionGuard]
    L --> N[usePermissions Hook]
    
    B --> O[AdminPanel]
    O --> P[Resources Filter]
    P --> Q[Conditional Rendering]
    
    style A fill:#e1f5fe
    style C fill:#f3e5f5
    style D fill:#e8f5e8
    style H fill:#ffebee
```

## Поток проверки разрешений

```mermaid
sequenceDiagram
    participant U as UI Component
    participant H as usePermissions Hook
    participant S as PermissionService
    participant A as AuthProvider
    participant D as Data Provider
    
    U->>H: hasPermission('orders', 'edit')
    H->>S: checkPermission(userId, 'orders', 'edit')
    S->>A: getCurrentUser()
    A->>S: user with role
    S->>S: check role permissions
    S->>H: true/false
    H->>U: permission result
    
    alt if permission granted
        U->>D: perform operation
    else
        U->>U: hide/disable functionality
    end
```

## Структура ролей

```mermaid
graph LR
    A[Viewer] --> A1[orders: view]
    A --> A2[trailers: view]
    A --> A3[customers: view]
    
    B[Manager] --> B1[orders: view,create,edit,export]
    B --> B2[customers: view,create,edit,export]
    B --> B3[trailers: view,export]
    
    C[Admin] --> C1[users: all]
    C --> C2[settings: view,edit]
    C --> C3[backup: view,create,restore]
    C --> C4[catalog: all]
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#ffebee