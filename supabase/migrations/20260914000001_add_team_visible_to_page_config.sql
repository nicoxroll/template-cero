-- Migración para control de visibilidad de la sección de equipo en page_config
-- Permite persistir si la sección 'Nuestro equipo' está visible u oculta en el sitio web.

alter table if exists public.page_config
  add column if not exists team_visible boolean not null default false;

