-- Миграция: Таблицы для пользовательских данных (избранное, настройки)
-- Создаём таблицы для хранения избранного и настроек пользователя в Supabase

-- 1. Таблица избранного
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trailer_id VARCHAR(255) NOT NULL, -- slug прицепа
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Уникальность: один прицеп - один раз в избранном у пользователя
    UNIQUE(user_id, trailer_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_trailer_id ON public.user_favorites(trailer_id);

-- RLS (Row Level Security)
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Политики: пользователь видит и управляет только своим избранным
CREATE POLICY "Users can view own favorites"
    ON public.user_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
    ON public.user_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
    ON public.user_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Таблица настроек пользователя
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Настройки интерфейса
    preferred_city VARCHAR(100),
    theme VARCHAR(20) DEFAULT 'light', -- 'light' | 'dark' | 'system'
    
    -- Настройки уведомлений
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    
    -- Маркетинговые согласия
    marketing_consent BOOLEAN DEFAULT false,
    marketing_consent_date TIMESTAMPTZ,
    
    -- Метаданные
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Политики: пользователь видит и управляет только своими настройками
CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_timestamp();

-- 3. Триггер для автоматического создания настроек при регистрации
CREATE OR REPLACE FUNCTION public.create_user_settings_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Привязываем триггер к auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_settings_on_signup();

-- Комментарии для документации
COMMENT ON TABLE public.user_favorites IS 'Избранные прицепы пользователей';
COMMENT ON TABLE public.user_settings IS 'Персональные настройки пользователей';
COMMENT ON COLUMN public.user_favorites.trailer_id IS 'Slug прицепа из таблицы trailers';
COMMENT ON COLUMN public.user_settings.preferred_city IS 'Предпочтительный город пользователя для расчёта доставки';
