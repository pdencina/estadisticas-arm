-- ============================================================
-- ARM Stats · Migración 002: Nuevos tipos de encuentro
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Ampliar constraint de tipo para incluir nuevos valores
ALTER TABLE public.encuentros DROP CONSTRAINT IF EXISTS encuentros_tipo_check;
ALTER TABLE public.encuentros ADD CONSTRAINT encuentros_tipo_check
  CHECK (tipo IN (
    'domingo','miercoles','jueves','sabado',
    'prayer_room','encuentro_global',
    'encuentro_mujeres','encuentro_jovenes','encuentro_hombres',
    'otro'
  ));
