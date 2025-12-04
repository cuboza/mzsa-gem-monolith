-- Миграция: Создание таблицы admin_users с правами доступа
-- Дата: 2024-12-04

-- Создаём таблицу admin_users если не существует
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255), -- хеш пароля
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager')),
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Комментарии
COMMENT ON TABLE admin_users IS 'Администраторы и менеджеры панели управления';
COMMENT ON COLUMN admin_users.permissions IS 'Индивидуальные права доступа пользователя (переопределяют права роли). Структура: {"resource": ["view", "edit", ...]}';

-- Индексы
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_permissions ON admin_users USING gin (permissions);

-- Триггер обновления updated_at
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_users_updated_at ON admin_users;
CREATE TRIGGER trigger_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- Создаём дефолтного администратора если таблица пустая
INSERT INTO admin_users (username, password, full_name, role, is_active, permissions)
SELECT 'admin', 'admin123', 'Главный администратор', 'admin', true, '{
  "orders": ["view", "create", "edit", "delete", "export"],
  "trailers": ["view", "create", "edit", "delete", "export"],
  "accessories": ["view", "create", "edit", "delete", "export"],
  "customers": ["view", "create", "edit", "delete", "export"],
  "users": ["view", "create", "edit", "delete"],
  "settings": ["view", "edit"],
  "warehouses": ["view", "create", "edit", "delete"],
  "stock": ["view", "create", "edit", "delete", "export"],
  "hero-slides": ["view", "create", "edit", "delete"],
  "stores": ["view", "create", "edit", "delete"],
  "import-1c": ["view", "create"]
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM admin_users LIMIT 1);

-- RLS политики
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать (для входа в систему)
DROP POLICY IF EXISTS admin_users_select_policy ON admin_users;
CREATE POLICY admin_users_select_policy ON admin_users
    FOR SELECT USING (true);

-- Политика: только авторизованные могут изменять
DROP POLICY IF EXISTS admin_users_modify_policy ON admin_users;
CREATE POLICY admin_users_modify_policy ON admin_users
    FOR ALL USING (auth.role() = 'authenticated');
