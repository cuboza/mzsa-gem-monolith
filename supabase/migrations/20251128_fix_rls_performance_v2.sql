-- Migration: Fix RLS Performance Issues (v2 - based on real schema)
-- Date: 2025-11-28
-- Fixes:
--   1. auth_rls_initplan - wrap auth.uid() in (select auth.uid())
--   2. multiple_permissive_policies - remove duplicate policies
--
-- База использует:
--   - public.is_admin() функцию для проверки админа
--   - auth_user_id вместо user_id в customers
--   - status = 'active' AND visible_on_site = true вместо is_active

BEGIN;

-- ============================================
-- PART 1: Fix multiple_permissive_policies
-- Удаляем дублирующиеся политики (оставляем *_own_or_admin версии)
-- ============================================

-- ============================================
-- Table: customers (имеет дубли: admin_* и *_own_or_admin)
-- ============================================

-- Удаляем дубликаты admin-only политик (они уже покрыты *_own_or_admin)
DROP POLICY IF EXISTS "customers_admin_select" ON public.customers;
DROP POLICY IF EXISTS "customers_admin_insert" ON public.customers;
DROP POLICY IF EXISTS "customers_admin_update" ON public.customers;
DROP POLICY IF EXISTS "customers_admin_delete" ON public.customers;

-- Удаляем старые "Users can..." политики (покрыты *_own_or_admin)
DROP POLICY IF EXISTS "Users can view own profile" ON public.customers;
DROP POLICY IF EXISTS "Users can update own profile" ON public.customers;

-- ============================================
-- Table: leads (имеет дубли)
-- ============================================

DROP POLICY IF EXISTS "leads_admin_select" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_update" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_delete" ON public.leads;

-- Старые "Users can..." и "Anyone can..." политики
DROP POLICY IF EXISTS "Users can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads comment" ON public.leads;
-- "Anyone can create leads" оставляем - это единственная INSERT для anon

-- ============================================
-- Table: lead_items (имеет дубли)
-- ============================================

DROP POLICY IF EXISTS "lead_items_admin_select" ON public.lead_items;
DROP POLICY IF EXISTS "lead_items_admin_insert" ON public.lead_items;
DROP POLICY IF EXISTS "lead_items_admin_update" ON public.lead_items;
DROP POLICY IF EXISTS "lead_items_admin_delete" ON public.lead_items;

-- Старые политики
DROP POLICY IF EXISTS "Users can view own lead items" ON public.lead_items;
-- "Anyone can create lead items" оставляем для anon

-- ============================================
-- Table: lead_status_history (имеет дубли)
-- ============================================

DROP POLICY IF EXISTS "lead_status_history_admin_select" ON public.lead_status_history;
DROP POLICY IF EXISTS "lead_status_history_admin_insert" ON public.lead_status_history;
DROP POLICY IF EXISTS "lead_status_history_admin_update" ON public.lead_status_history;
DROP POLICY IF EXISTS "lead_status_history_admin_delete" ON public.lead_status_history;

DROP POLICY IF EXISTS "Users can view own order history" ON public.lead_status_history;

-- ============================================
-- Table: sync_logs (только admin)
-- ============================================

-- Оставляем только одну политику
DROP POLICY IF EXISTS "sync_logs_admin_select" ON public.sync_logs;
-- "Authenticated users can view sync logs" - проверим, нужна ли оптимизация

-- ============================================
-- Table: categories (public + admin дубли)
-- ============================================

DROP POLICY IF EXISTS "categories_admin_select" ON public.categories;
-- Оставляем "Public read access for active categories" и admin INSERT/UPDATE/DELETE

-- ============================================
-- Table: cities
-- ============================================

DROP POLICY IF EXISTS "cities_admin_select" ON public.cities;

-- ============================================
-- Table: faq
-- ============================================

DROP POLICY IF EXISTS "faq_admin_select" ON public.faq;

-- ============================================
-- Table: features
-- ============================================

DROP POLICY IF EXISTS "features_admin_select" ON public.features;

-- ============================================
-- Table: images
-- ============================================

DROP POLICY IF EXISTS "images_admin_select" ON public.images;

-- ============================================
-- Table: options
-- ============================================

DROP POLICY IF EXISTS "options_admin_select" ON public.options;

-- ============================================
-- Table: option_dependencies
-- ============================================

DROP POLICY IF EXISTS "option_dependencies_admin_select" ON public.option_dependencies;

-- ============================================
-- Table: option_stock
-- ============================================

DROP POLICY IF EXISTS "option_stock_admin_select" ON public.option_stock;

-- ============================================
-- Table: price_types
-- ============================================

DROP POLICY IF EXISTS "price_types_admin_select" ON public.price_types;

-- ============================================
-- Table: specifications
-- ============================================

DROP POLICY IF EXISTS "specifications_admin_select" ON public.specifications;

-- ============================================
-- Table: trailer_options
-- ============================================

DROP POLICY IF EXISTS "trailer_options_admin_select" ON public.trailer_options;

-- ============================================
-- Table: trailer_stock
-- ============================================

DROP POLICY IF EXISTS "trailer_stock_admin_select" ON public.trailer_stock;

-- ============================================
-- Table: trailers
-- ============================================

DROP POLICY IF EXISTS "trailers_admin_select" ON public.trailers;

-- ============================================
-- Table: use_cases
-- ============================================

DROP POLICY IF EXISTS "use_cases_admin_select" ON public.use_cases;

-- ============================================
-- Table: vehicle_models
-- ============================================

DROP POLICY IF EXISTS "vehicle_models_admin_select" ON public.vehicle_models;

-- ============================================
-- Table: vehicle_suggestions
-- ============================================

DROP POLICY IF EXISTS "vehicle_suggestions_admin_insert" ON public.vehicle_suggestions;
-- "Anyone can create suggestions" покрывает INSERT для всех

-- ============================================
-- Table: warehouses
-- ============================================

DROP POLICY IF EXISTS "warehouses_admin_select" ON public.warehouses;

-- ============================================
-- PART 2: Fix auth_rls_initplan - оптимизация существующих политик
-- Политики с auth.uid() уже используют (select auth.uid()) судя по дампу
-- Пропускаем эту часть, так как политики уже оптимизированы
-- ============================================

-- ============================================
-- Done! Duplicate policies removed.
-- ============================================

COMMIT;
