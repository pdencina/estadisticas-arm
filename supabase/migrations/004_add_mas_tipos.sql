-- Ampliar el check constraint de tipos para incluir viernes, prayer_room y otro
ALTER TABLE encuentros DROP CONSTRAINT IF EXISTS encuentros_tipo_check;

ALTER TABLE encuentros ADD CONSTRAINT encuentros_tipo_check 
  CHECK (tipo IN (
    'domingo', 
    'miercoles', 
    'jueves', 
    'viernes',
    'sabado', 
    'prayer_room', 
    'encuentro_mujeres', 
    'encuentro_jovenes', 
    'encuentro_hombres', 
    'otro'
  ));
