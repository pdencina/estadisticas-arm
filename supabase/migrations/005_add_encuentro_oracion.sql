-- Agregar tipo 'encuentro_oracion' al constraint de tipo_encuentro
ALTER TABLE encuentros DROP CONSTRAINT IF EXISTS encuentros_tipo_check;
ALTER TABLE encuentros ADD CONSTRAINT encuentros_tipo_check CHECK (
  tipo IN ('domingo','miercoles','jueves','sabado','prayer_room','encuentro_mujeres','encuentro_jovenes','encuentro_hombres','encuentro_global','encuentro_oracion','viernes','otro')
);
