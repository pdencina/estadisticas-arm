-- ============================================================
-- ARM Stats · Migración 003: Nuevo estado "pendiente"
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- Actualizar constraint de estado para incluir "pendiente"
ALTER TABLE public.encuentros DROP CONSTRAINT IF EXISTS encuentros_estado_check;
ALTER TABLE public.encuentros ADD CONSTRAINT encuentros_estado_check
  CHECK (estado IN ('pendiente', 'borrador', 'enviado', 'validado'));

-- Migrar borradores existentes a pendiente
UPDATE public.encuentros SET estado = 'pendiente' WHERE estado = 'borrador';
