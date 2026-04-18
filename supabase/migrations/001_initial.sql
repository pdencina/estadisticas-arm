-- ============================================================
-- ARM Stats · Supabase Migration v2
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── campus ───────────────────────────────────────────────────
create table if not exists public.campus (
  id           uuid primary key default uuid_generate_v4(),
  nombre       text not null,
  ciudad       text not null,
  pais         text not null,
  zona_horaria text not null default 'America/Santiago',
  activo       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ── user_profiles ─────────────────────────────────────────────
create table if not exists public.user_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  nombre     text not null,
  rol        text not null default 'voluntario'
             check (rol in ('admin_global','admin_campus','voluntario')),
  campus_id  uuid references public.campus(id) on delete set null,
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Trigger: crear perfil al registrar usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'rol','voluntario')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── encuentros ────────────────────────────────────────────────
create table if not exists public.encuentros (
  id                      uuid primary key default uuid_generate_v4(),
  campus_id               uuid not null references public.campus(id) on delete restrict,
  fecha                   date not null,
  tipo                    text not null check (tipo in ('domingo','miercoles','jueves','sabado','prayer_room','encuentro_global','otro')),
  horario                 text not null,
  modalidad               text not null default 'presencial' check (modalidad in ('presencial','online','hibrido')),
  predicador              text,
  nombre_mensaje          text,
  total_general           integer not null default 0 check (total_general >= 0),
  acepto_jesus_presencial integer not null default 0 check (acepto_jesus_presencial >= 0),
  asistencia              jsonb not null default '{"auditorio":0,"kids":0,"tweens":0,"sala_bebe":0,"sala_sensorial":0,"cambio":0}'::jsonb,
  voluntarios             jsonb not null default '{"servicio":0,"tecnica":0,"kids":0,"tweens":0,"worship":0,"cocina":0,"rrss":0,"seguridad":0,"sala_bebes":0,"conexion":0,"oracion":0,"merch":0,"amor_por_la_casa":0,"sala_sensorial":0,"punto_siembra":0,"cambios":0}'::jsonb,
  online                  jsonb not null default '{"acepto_jesus":0,"espectadores_max":0}'::jsonb,
  lideres_voluntarios     text,
  admins_campus           text,
  reportado_por           uuid references public.user_profiles(id) on delete set null,
  estado                  text not null default 'borrador' check (estado in ('borrador','enviado','validado')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists encuentros_campus_fecha on public.encuentros(campus_id, fecha desc);
create index if not exists encuentros_fecha        on public.encuentros(fecha desc);
create index if not exists encuentros_estado       on public.encuentros(estado);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists encuentros_updated_at on public.encuentros;
create trigger encuentros_updated_at
  before update on public.encuentros
  for each row execute procedure public.set_updated_at();

-- ── informes_semanales ────────────────────────────────────────
create table if not exists public.informes_semanales (
  id               uuid primary key default uuid_generate_v4(),
  semana_inicio    date not null,
  semana_fin       date not null,
  anio             integer not null,
  semana_numero    integer not null,
  total_general    integer not null default 0,
  total_auditorio  integer not null default 0,
  total_paj        integer not null default 0,
  contador_almas   integer not null default 0,
  datos_por_campus jsonb not null default '[]'::jsonb,
  generado_por     uuid references public.user_profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  unique(semana_inicio)
);

-- ── RLS ───────────────────────────────────────────────────────
alter table public.campus             enable row level security;
alter table public.user_profiles      enable row level security;
alter table public.encuentros         enable row level security;
alter table public.informes_semanales enable row level security;

create or replace function public.mi_rol()
returns text language sql security definer stable as $$
  select rol from public.user_profiles where id = auth.uid();
$$;

create or replace function public.mi_campus()
returns uuid language sql security definer stable as $$
  select campus_id from public.user_profiles where id = auth.uid();
$$;

-- Campus: todos leen, solo admin_global escribe
drop policy if exists "campus_read"   on public.campus;
drop policy if exists "campus_write"  on public.campus;
create policy "campus_read"  on public.campus for select to authenticated using (true);
create policy "campus_write" on public.campus for all    to authenticated
  using (public.mi_rol() = 'admin_global') with check (public.mi_rol() = 'admin_global');

-- Perfiles: propio o admin_global
drop policy if exists "profiles_read"   on public.user_profiles;
drop policy if exists "profiles_write"  on public.user_profiles;
create policy "profiles_read"  on public.user_profiles for select to authenticated
  using (id = auth.uid() or public.mi_rol() = 'admin_global');
create policy "profiles_write" on public.user_profiles for all    to authenticated
  using (public.mi_rol() = 'admin_global') with check (public.mi_rol() = 'admin_global');

-- Encuentros
drop policy if exists "enc_read"   on public.encuentros;
drop policy if exists "enc_insert" on public.encuentros;
drop policy if exists "enc_update" on public.encuentros;
drop policy if exists "enc_delete" on public.encuentros;

create policy "enc_read" on public.encuentros for select to authenticated
  using (public.mi_rol() = 'admin_global' or campus_id = public.mi_campus());

create policy "enc_insert" on public.encuentros for insert to authenticated
  with check (public.mi_rol() = 'admin_global' or campus_id = public.mi_campus());

create policy "enc_update" on public.encuentros for update to authenticated
  using (public.mi_rol() = 'admin_global' or
        (public.mi_rol() = 'admin_campus' and campus_id = public.mi_campus()));

create policy "enc_delete" on public.encuentros for delete to authenticated
  using (public.mi_rol() = 'admin_global');

-- Informes: todos leen, admin_global gestiona
drop policy if exists "inf_read"  on public.informes_semanales;
drop policy if exists "inf_write" on public.informes_semanales;
create policy "inf_read"  on public.informes_semanales for select to authenticated using (true);
create policy "inf_write" on public.informes_semanales for all    to authenticated
  using (public.mi_rol() = 'admin_global') with check (public.mi_rol() = 'admin_global');

-- ── Seed: campus iniciales ────────────────────────────────────
insert into public.campus (nombre, ciudad, pais, zona_horaria) values
  ('Stgo Centro',  'Santiago',     'Chile',     'America/Santiago'),
  ('Puente Alto',  'Puente Alto',  'Chile',     'America/Santiago'),
  ('Punta Arenas', 'Punta Arenas', 'Chile',     'America/Santiago'),
  ('Concepción',   'Concepción',   'Chile',     'America/Santiago'),
  ('Montevideo',   'Montevideo',   'Uruguay',   'America/Montevideo'),
  ('Maracaibo',    'Maracaibo',    'Venezuela', 'America/Caracas'),
  ('Katy Texas',   'Katy',         'EE.UU.',    'America/Chicago'),
  ('La Plata',     'La Plata',     'Argentina', 'America/Argentina/Buenos_Aires')
on conflict do nothing;

-- ============================================================
-- POST-INSTALACIÓN:
--
-- 1. Invita al primer usuario desde:
--    Supabase > Authentication > Users > Invite user
--
-- 2. Asígnale rol admin_global:
--    UPDATE user_profiles
--    SET rol = 'admin_global', nombre = 'Tu Nombre'
--    WHERE email = 'tu@email.com';
--
-- 3. Para cada adm. de campus:
--    UPDATE user_profiles
--    SET rol = 'admin_campus',
--        nombre = 'Nombre',
--        campus_id = (SELECT id FROM campus WHERE nombre = 'Puente Alto')
--    WHERE email = 'usuario@email.com';
-- ============================================================
