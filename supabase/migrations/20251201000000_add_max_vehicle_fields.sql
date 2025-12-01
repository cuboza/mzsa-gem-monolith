-- Миграция: добавление полей maxVehicle* в таблицу trailers
-- Эти поля используются в конфигураторе для фильтрации прицепов по параметрам техники

-- Максимальная длина техники, которую можно перевозить (мм)
ALTER TABLE public.trailers
ADD COLUMN IF NOT EXISTS max_vehicle_length INTEGER;

-- Максимальная ширина техники (мм)
ALTER TABLE public.trailers
ADD COLUMN IF NOT EXISTS max_vehicle_width INTEGER;

-- Максимальный вес техники (кг)
ALTER TABLE public.trailers
ADD COLUMN IF NOT EXISTS max_vehicle_weight INTEGER;

-- Комментарии к полям
COMMENT ON COLUMN public.trailers.max_vehicle_length IS 'Максимальная длина перевозимой техники в мм';
COMMENT ON COLUMN public.trailers.max_vehicle_width IS 'Максимальная ширина перевозимой техники в мм';
COMMENT ON COLUMN public.trailers.max_vehicle_weight IS 'Максимальный вес перевозимой техники в кг';

-- Индекс для быстрой фильтрации по длине (часто используется в конфигураторе)
CREATE INDEX IF NOT EXISTS idx_trailers_max_vehicle_length 
ON public.trailers(max_vehicle_length) 
WHERE max_vehicle_length IS NOT NULL;
