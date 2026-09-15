/*
  # Seed de DEMOSTRACIÓN — solo entorno local

  Este archivo lo aplica `supabase start` / `supabase db reset` en local, y
  NUNCA `supabase db push` a producción (que solo corre migrations/). Por eso
  el contenido de demo vive acá y no en una migración: la base real la carga la
  empresa desde el panel.

  Sirve para que el sitio corriendo contra Supabase local se vea igual de
  completo que corriendo contra los datos mock — si no, al conectar el backend
  la home queda sin proyectos ni oportunidades y parece rota.

  GENERADO desde src/data/fixtures.ts. No editar a mano: volver a generar.
*/

-- Idempotente: `supabase db reset` ya recrea el schema, pero correr el seed
-- dos veces sobre una base viva no debe duplicar nada.
delete from investments;
delete from projects;
delete from services;
delete from team_members;
delete from faq_items;


-- ------------------------------------------------------------ projects

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'torre-libertador', 'Torre Libertador', 'Torre residencial de 22 pisos sobre Av. del Libertador, con unidades de 2 a 4 ambientes, amenities completos y vistas abiertas al río. Estructura de hormigón visto y carpinterías de doble vidriado hermético.', 'Vicente López, Buenos Aires',
  'residencial', 'en-obra', 'https://images.pexels.com/photos/35282689/pexels-photo-35282689.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/35282689/pexels-photo-35282689.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/30832160/pexels-photo-30832160.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/11968124/pexels-photo-11968124.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/38525110/pexels-photo-38525110.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie total","value":"18.400 m²"},{"label":"Unidades","value":"96"},{"label":"Pisos","value":"22"},{"label":"Cocheras","value":"110"},{"label":"Amenities","value":"Piscina, gym, SUM, coworking"}]'::jsonb, '[{"name":"Brochure comercial (PDF)","url":"/docs/torre-libertador-brochure.pdf","sizeLabel":"2,4 MB","kind":"brochure"},{"name":"Planos de tipologías (PDF)","url":"/docs/torre-libertador-planos.pdf","sizeLabel":"3,1 MB","kind":"planos"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2023-03-01","completedAt":"2023-09-15"},{"stage":"diseno","current":false,"startedAt":"2023-09-15","completedAt":"2024-04-30"},{"stage":"construccion","current":true,"startedAt":"2024-05-02","notes":"Avance de obra 62% — hormigón completo hasta piso 18"},{"stage":"entrega","current":false}]'::jsonb,
  -34.5265, -58.4765, true, false, true, '2024-05-02T12:00:00.000Z'
);

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'edificio-alamos', 'Edificio Álamos', 'Edificio boutique de 8 niveles en el corazón de Palermo Botánico. Unidades premium con balcones aterrazados, parrilla propia y planta baja comercial. Fachada de líneas puras con parasoles de aluminio anodizado.', 'Palermo, CABA',
  'residencial', 'terminado', 'https://images.pexels.com/photos/13197873/pexels-photo-13197873.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/13197873/pexels-photo-13197873.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/2674418/pexels-photo-2674418.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/21418646/pexels-photo-21418646.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/6436782/pexels-photo-6436782.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie total","value":"4.850 m²"},{"label":"Unidades","value":"28"},{"label":"Pisos","value":"8"},{"label":"Locales comerciales","value":"2"}]'::jsonb, '[{"name":"Brochure comercial (PDF)","url":"/docs/edificio-alamos-brochure.pdf","sizeLabel":"1,8 MB","kind":"brochure"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2020-02-01","completedAt":"2020-08-01"},{"stage":"diseno","current":false,"startedAt":"2020-08-01","completedAt":"2021-03-01"},{"stage":"construccion","current":false,"startedAt":"2021-03-15","completedAt":"2023-06-30"},{"stage":"entrega","current":true,"startedAt":"2023-07-01","completedAt":"2023-11-30","notes":"Entregado — posesión completa"}]'::jsonb,
  -34.5828, -58.4177, true, false, true, '2023-11-30T12:00:00.000Z'
);

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'costa-tigre', 'Complejo Costa Tigre', 'Masterplan de usos mixtos frente al río Luján: tres torres residenciales, paseo comercial a cielo abierto y marina privada. Concepto en desarrollo — imágenes correspondientes a renders del anteproyecto.', 'Tigre, Buenos Aires',
  'mixto', 'en-pozo', 'https://images.pexels.com/photos/29791458/pexels-photo-29791458.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/29791458/pexels-photo-29791458.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/28494626/pexels-photo-28494626.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/38289824/pexels-photo-38289824.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/34360423/pexels-photo-34360423.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie del predio","value":"4,2 ha"},{"label":"Superficie construible","value":"52.000 m²"},{"label":"Torres","value":"3 (18 pisos c/u)"},{"label":"Amarras","value":"40"}]'::jsonb, '[{"name":"Masterplan conceptual (PDF)","url":"/docs/costa-tigre-planos.pdf","sizeLabel":"4,6 MB","kind":"planos"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2025-04-01","completedAt":"2025-12-15"},{"stage":"diseno","current":true,"startedAt":"2026-01-10","notes":"Anteproyecto aprobado — desarrollo de documentación ejecutiva"},{"stage":"construccion","current":false},{"stage":"entrega","current":false}]'::jsonb,
  -34.4241, -58.5796, true, true, true, '2026-01-10T12:00:00.000Z'
);

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'oficinas-distrito-norte', 'Oficinas Distrito Norte', 'Edificio corporativo AAA de plantas libres de 850 m², certificación LEED Silver, doble altura en acceso y 4 subsuelos de cocheras. Fachada vidriada de alta eficiencia energética.', 'Olivos, Buenos Aires',
  'comercial', 'terminado', 'https://images.pexels.com/photos/37320179/pexels-photo-37320179.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/37320179/pexels-photo-37320179.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/5230087/pexels-photo-5230087.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/946310/pexels-photo-946310.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/27322345/pexels-photo-27322345.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie total","value":"12.600 m²"},{"label":"Plantas","value":"10 libres de 850 m²"},{"label":"Certificación","value":"LEED Silver"},{"label":"Cocheras","value":"180"}]'::jsonb, '[{"name":"Ficha técnica (PDF)","url":"/docs/oficinas-distrito-norte-otro.pdf","sizeLabel":"1,1 MB","kind":"otro"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2019-05-01","completedAt":"2019-11-01"},{"stage":"diseno","current":false,"startedAt":"2019-11-01","completedAt":"2020-06-01"},{"stage":"construccion","current":false,"startedAt":"2020-07-01","completedAt":"2022-09-30"},{"stage":"entrega","current":true,"startedAt":"2022-10-01","completedAt":"2022-12-20","notes":"Entregado — 100% alquilado"}]'::jsonb,
  -34.5089, -58.4863, true, false, true, '2022-12-20T12:00:00.000Z'
);

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'barrio-los-nogales', 'Barrio Los Nogales', 'Urbanización privada de 120 lotes con club house, canchas y 3 ha de espacios verdes parquizados. Infraestructura subterránea completa. Imágenes correspondientes a renders del proyecto.', 'Pilar, Buenos Aires',
  'residencial', 'en-pozo', 'https://images.pexels.com/photos/31640055/pexels-photo-31640055.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/31640055/pexels-photo-31640055.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/31640048/pexels-photo-31640048.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/32220111/pexels-photo-32220111.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/33515015/pexels-photo-33515015.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie del predio","value":"18 ha"},{"label":"Lotes","value":"120 (600–900 m²)"},{"label":"Espacios verdes","value":"3 ha"},{"label":"Club house","value":"1.200 m²"}]'::jsonb, '[{"name":"Masterplan (PDF)","url":"/docs/barrio-los-nogales-planos.pdf","sizeLabel":"3,8 MB","kind":"planos"}]'::jsonb, '[{"stage":"planificacion","current":true,"startedAt":"2026-02-01","notes":"Factibilidades municipales en trámite"},{"stage":"diseno","current":false},{"stage":"construccion","current":false},{"stage":"entrega","current":false}]'::jsonb,
  -34.4587, -58.9142, false, true, true, '2026-02-01T12:00:00.000Z'
);

insert into projects (
  slug, name, description, location, type, status, cover_image, gallery,
  specs, docs, timeline, lat, lng, featured, is_render, published, created_at
) values (
  'centro-logistico-ruta-8', 'Centro Logístico Ruta 8', 'Parque logístico de 3 naves AAA con altura libre de 12 m, pisos superplanos, 40 docks y playa de maniobras de hormigón. Obra de infraestructura vial de acceso incluida en el desarrollo.', 'Pilar, Buenos Aires',
  'infraestructura', 'en-obra', 'https://images.pexels.com/photos/2804929/pexels-photo-2804929.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', ARRAY['https://images.pexels.com/photos/2804929/pexels-photo-2804929.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/35501715/pexels-photo-35501715.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/18078304/pexels-photo-18078304.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp', 'https://images.pexels.com/photos/33804931/pexels-photo-33804931.jpeg?auto=compress&cs=tinysrgb&w=1200&fm=webp']::text[],
  '[{"label":"Superficie cubierta","value":"36.000 m²"},{"label":"Naves","value":"3"},{"label":"Altura libre","value":"12 m"},{"label":"Docks","value":"40"}]'::jsonb, '[{"name":"Ficha técnica (PDF)","url":"/docs/centro-logistico-ruta-8-otro.pdf","sizeLabel":"1,4 MB","kind":"otro"}]'::jsonb, '[{"stage":"planificacion","current":false,"startedAt":"2024-08-01","completedAt":"2025-01-31"},{"stage":"diseno","current":false,"startedAt":"2025-02-01","completedAt":"2025-07-15"},{"stage":"construccion","current":true,"startedAt":"2025-08-01","notes":"Nave 1 completa, nave 2 en montaje de estructura"},{"stage":"entrega","current":false}]'::jsonb,
  -34.4374, -58.9718, false, false, true, '2025-08-01T12:00:00.000Z'
);


-- --------------------------------------------------------- investments

insert into investments (
  slug, title, description, amount, currency, est_return, term_months, status,
  project_id, cover_image, docs, fiduciario, tipo_estructura, ticket_minimo,
  moneda, integracion, hitos_desembolso, salida, escribania, published, created_at
) values (
  'fideicomiso-torre-libertador', 'Fideicomiso Torre Libertador', 'Participación en fideicomiso al costo sobre unidades de 2 y 3 ambientes en Torre Libertador. Obra en ejecución con avance verificable mensualmente. Salida por venta de unidad terminada o cesión de posición.', 120000, 'USD',
  '14–18% anual estimado en USD', 30, 'activa',
  (select id from projects where slug = 'torre-libertador'), 'https://images.pexels.com/photos/35282689/pexels-photo-35282689.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', '[{"name":"Term sheet (PDF)","url":"/docs/fideicomiso-torre-libertador-term-sheet.pdf","sizeLabel":"620 KB","kind":"term-sheet"},{"name":"Contrato marco de fideicomiso (PDF)","url":"/docs/fideicomiso-torre-libertador-contrato.pdf","sizeLabel":"1,3 MB","kind":"contrato"}]'::jsonb, '{"nombre":"Fiduciaria Andes S.A.","tipo":"Fiduciario financiero registrado en CNV"}'::jsonb,
  'Fideicomiso al costo', 120000, 'USD',
  '[{"etapa":"Adhesión","porcentaje":30,"momento":"A la firma del boleto de fideicomiso"},{"etapa":"Aportes durante obra","porcentaje":50,"momento":"6 cuotas mensuales iguales, atadas al certificado de avance"},{"etapa":"Saldo final","porcentaje":20,"momento":"Contra escritura traslativa de dominio"}]'::jsonb, '[{"hito":"Estructura hasta piso 10","avanceObra":"45%","fecha":"2025-03-01"},{"hito":"Estructura completa (piso 22)","avanceObra":"70%","fecha":"2025-11-01"},{"hito":"Terminaciones y entrega","avanceObra":"100%","fecha":"2026-10-01"}]'::jsonb,
  'Venta de la unidad asignada al inversor una vez escriturada, o cesión de la posición fiduciaria a un tercero con conformidad del fiduciario, en cualquier momento posterior a la adhesión.', 'Escribanía Roca & Asociados', true, '2025-11-15T12:00:00.000Z'
);

insert into investments (
  slug, title, description, amount, currency, est_return, term_months, status,
  project_id, cover_image, docs, fiduciario, tipo_estructura, ticket_minimo,
  moneda, integracion, hitos_desembolso, salida, escribania, published, created_at
) values (
  'costa-tigre-etapa-1', 'Costa Tigre — Etapa 1', 'Inversión temprana en la primera torre del masterplan Costa Tigre, con ticket de ingreso en etapa de diseño y curva de valorización proyectada hasta la entrega. Estructura de fideicomiso al costo con auditoría externa.', 80000, 'USD',
  '20–25% total estimado a término, en USD', 48, 'activa',
  (select id from projects where slug = 'costa-tigre'), 'https://images.pexels.com/photos/29791458/pexels-photo-29791458.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', '[{"name":"Memorando de inversión (PDF)","url":"/docs/costa-tigre-etapa-1-memorando.pdf","sizeLabel":"1,9 MB","kind":"memorando"}]'::jsonb, '{"nombre":"BAP Fiduciaria S.A.","tipo":"Fiduciario financiero registrado en CNV"}'::jsonb,
  'Fideicomiso al costo', 80000, 'USD',
  '[{"etapa":"Reserva","porcentaje":15,"momento":"A la firma de la carta de reserva"},{"etapa":"Adhesión al fideicomiso","porcentaje":25,"momento":"A los 30 días de la reserva, contra firma del boleto"},{"etapa":"Aportes durante obra","porcentaje":45,"momento":"12 cuotas trimestrales, atadas al certificado de avance"},{"etapa":"Saldo final","porcentaje":15,"momento":"Contra escritura traslativa de dominio de la Torre 1"}]'::jsonb, '[{"hito":"Documentación ejecutiva y permisos","avanceObra":"0%","fecha":"2026-09-01"},{"hito":"Inicio de fundaciones Torre 1","avanceObra":"10%","fecha":"2027-02-01"},{"hito":"Estructura completa Torre 1","avanceObra":"55%","fecha":"2028-06-01"},{"hito":"Terminaciones y entrega Torre 1","avanceObra":"100%","fecha":"2029-08-01"}]'::jsonb,
  'Reventa de la posición fiduciaria en el mercado secundario habilitado por el fiduciario, o liquidación conjunta con la entrega de la Torre 1, estimada para agosto de 2029.', 'Escribanía Roca & Asociados', true, '2026-02-20T12:00:00.000Z'
);

insert into investments (
  slug, title, description, amount, currency, est_return, term_months, status,
  project_id, cover_image, docs, fiduciario, tipo_estructura, ticket_minimo,
  moneda, integracion, hitos_desembolso, salida, escribania, published, created_at
) values (
  'nave-3-centro-logistico', 'Nave 3 — Centro Logístico Ruta 8', 'Renta logística: participación sobre la nave 3 con contrato de alquiler corporativo pre-acordado a 5 años, ajuste semestral y salida por venta del activo estabilizado.', 150000, 'USD',
  '9–11% anual estimado en USD (renta) + upside de venta', 60, 'proximamente',
  (select id from projects where slug = 'centro-logistico-ruta-8'), 'https://images.pexels.com/photos/2804929/pexels-photo-2804929.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', '[{"name":"Teaser (PDF)","url":"/docs/nave-3-centro-logistico-otro.pdf","sizeLabel":"540 KB","kind":"otro"}]'::jsonb, '{"nombre":"Global Trust Fiduciaria S.A.","tipo":"Fiduciario financiero registrado en CNV"}'::jsonb,
  'Fideicomiso a valor fijo', 150000, 'USD',
  '[{"etapa":"Adhesión","porcentaje":40,"momento":"A la apertura del fideicomiso, prevista para el inicio de obra de nave 3"},{"etapa":"Aportes durante obra","porcentaje":40,"momento":"4 cuotas trimestrales, atadas al certificado de avance de nave 3"},{"etapa":"Saldo final","porcentaje":20,"momento":"Contra habilitación municipal y firma del contrato de alquiler"}]'::jsonb, '[{"hito":"Apertura del fideicomiso e inicio de obra nave 3","avanceObra":"0%","fecha":"2026-11-01"},{"hito":"Estructura y piso industrial de nave 3","avanceObra":"60%","fecha":"2027-06-01"},{"hito":"Habilitación y puesta en renta","avanceObra":"100%","fecha":"2027-11-01"}]'::jsonb,
  'Distribución de renta semestral durante el plazo del contrato de alquiler y venta del activo estabilizado al término de los 60 meses, con reparto proporcional a la posición fiduciaria.', 'Escribanía Núñez & Fresco', true, '2026-05-05T12:00:00.000Z'
);

insert into investments (
  slug, title, description, amount, currency, est_return, term_months, status,
  project_id, cover_image, docs, fiduciario, tipo_estructura, ticket_minimo,
  moneda, integracion, hitos_desembolso, salida, escribania, published, created_at
) values (
  'edificio-alamos-cierre', 'Edificio Álamos — Ciclo completo', 'Fideicomiso cerrado y liquidado. Caso testigo del ciclo completo de inversión Punto Cero: ingreso en pozo, obra en 27 meses y liquidación total dentro del plazo proyectado.', 60000, 'USD',
  '16,4% anual efectivo en USD (resultado final del ciclo)', 36, 'cerrada',
  (select id from projects where slug = 'edificio-alamos'), 'https://images.pexels.com/photos/13197873/pexels-photo-13197873.jpeg?auto=compress&cs=tinysrgb&w=1600&fm=webp', '[{"name":"Informe de cierre (PDF)","url":"/docs/edificio-alamos-cierre-otro.pdf","sizeLabel":"980 KB","kind":"otro"}]'::jsonb, '{"nombre":"Fiduciaria Andes S.A.","tipo":"Fiduciario financiero registrado en CNV"}'::jsonb,
  'Fideicomiso al costo', 60000, 'USD',
  '[{"etapa":"Adhesión","porcentaje":30,"momento":"A la firma del boleto de fideicomiso (febrero 2020)"},{"etapa":"Aportes durante obra","porcentaje":50,"momento":"8 cuotas trimestrales, integradas entre 2021 y 2023"},{"etapa":"Saldo final","porcentaje":20,"momento":"Contra escritura traslativa de dominio (noviembre 2023)"}]'::jsonb, '[{"hito":"Inicio de obra","avanceObra":"0%","fecha":"2021-03-15"},{"hito":"Estructura completa","avanceObra":"55%","fecha":"2022-05-01"},{"hito":"Terminaciones y entrega","avanceObra":"100%","fecha":"2023-11-30"},{"hito":"Liquidación del fideicomiso","avanceObra":"100%","fecha":"2024-01-31"}]'::jsonb,
  'Liquidado — el fiduciario distribuyó el resultado final del ciclo a los inversores en enero de 2024, tras la venta de la totalidad de las unidades asignadas al fideicomiso.', 'Escribanía Roca & Asociados', true, '2023-12-15T12:00:00.000Z'
);


-- ------------------------------------------------------------ services

insert into services (slug, title, description, image, sort_order) values ('desarrollo-inmobiliario', 'Desarrollo inmobiliario', 'Originamos y lideramos proyectos de principio a fin: detección de oportunidades, estructuración del negocio, gestión integral y comercialización.', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/482e7b6a-168c-4d0d-b35d-0e2ff4014577_1600w.webp', 0);
insert into services (slug, title, description, image, sort_order) values ('arquitectura-y-diseno', 'Arquitectura y diseño', 'Proyectos con identidad: anteproyecto, documentación ejecutiva y dirección de diseño con foco en el valor de largo plazo.', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/0dccab47-16b0-4716-9e1a-b97f124e3031_1600w.webp', 1);
insert into services (slug, title, description, image, sort_order) values ('construccion-y-obra', 'Construcción y dirección de obra', 'Ejecución con equipos propios y contratistas calificados, dirección técnica, control de avance e infraestructura completa.', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/952269bf-60f5-48dc-afce-13953bead1eb_1600w.webp', 2);
insert into services (slug, title, description, image, sort_order) values ('financiamiento-e-inversiones', 'Financiamiento e inversiones', 'Estructuración financiera y oportunidades de inversión: fideicomisos al costo, esquemas de aportes y seguimiento de cada etapa.', 'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/aa5ed4de-1a7e-4bb7-b0ea-1a4c511663df_1600w.webp', 3);


-- -------------------------------------------------------- team_members

insert into team_members (name, role, photo, bio, sort_order) values ('Arq. Mariano Recalde', 'Socio fundador — Dirección de proyectos', 'https://images.pexels.com/photos/37605831/pexels-photo-37605831.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp', 'Arquitecto UBA con más de 20 años liderando desarrollos residenciales y corporativos en Buenos Aires.', 0);
insert into team_members (name, role, photo, bio, sort_order) values ('Ing. Carolina Bruzzone', 'Socia — Dirección de obra', 'https://images.pexels.com/photos/7937658/pexels-photo-7937658.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp', 'Ingeniera civil UTN, especialista en gestión de obra y estructuras de hormigón. Dirigió más de 150.000 m² construidos.', 1);
insert into team_members (name, role, photo, bio, sort_order) values ('Lic. Federico Anzorena', 'Director de inversiones', 'https://images.pexels.com/photos/7580766/pexels-photo-7580766.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp', 'Licenciado en finanzas, estructuró fideicomisos inmobiliarios por más de USD 40 millones en los últimos 10 años.', 2);
insert into team_members (name, role, photo, bio, sort_order) values ('Arq. Julieta Sansone', 'Directora de diseño', 'https://images.pexels.com/photos/36646353/pexels-photo-36646353.jpeg?auto=compress&cs=tinysrgb&w=800&fm=webp', 'Arquitecta UTDT. Lidera el estudio de diseño de Punto Cero con foco en arquitectura de líneas puras y eficiencia.', 3);

-- ------------------------------------------------------------ faq_items

insert into faq_items (question, answer, sort_order) values ('¿Qué es un fideicomiso al costo?', 'Es una estructura jurídica en la que los inversores aportan capital para desarrollar un proyecto y asumen el costo real de la obra, sin margen de desarrollador incorporado al precio. El fiduciario administra los fondos con un fin exclusivo: ejecutar el proyecto. El patrimonio del fideicomiso queda separado del de la desarrolladora y del de los propios inversores, lo que otorga una protección jurídica relevante.', 0);
insert into faq_items (question, answer, sort_order) values ('¿Qué riesgos tiene invertir en un desarrollo inmobiliario?', 'Como toda inversión, implica riesgos: variaciones en el costo de construcción, plazos de obra, condiciones del mercado inmobiliario y del contexto macroeconómico. Ninguna cifra de retorno constituye una garantía. Trabajamos para mitigarlos con presupuestos auditados, contratos de obra cerrados, seguimiento técnico permanente e información periódica al inversor, pero el riesgo nunca es cero y así lo comunicamos.', 1);
insert into faq_items (question, answer, sort_order) values ('¿Cómo se calculan los retornos estimados?', 'Surgen de la diferencia proyectada entre el costo total del desarrollo y el valor de venta estimado de las unidades, neta de gastos, honorarios e impuestos, distribuida en proporción a la participación de cada inversor. Son proyecciones basadas en valores de mercado al momento de la publicación: se actualizan durante la vida del proyecto y pueden variar.', 2);
insert into faq_items (question, answer, sort_order) values ('¿Cómo y cuándo se realizan los retornos?', 'Depende de la estructura de cada oportunidad. En general, el retorno se materializa con la venta de las unidades al finalizar la obra, o mediante la adjudicación de unidades al inversor, quien puede venderlas o rentarlas. Algunos proyectos de renta distribuyen ingresos periódicos. El detalle de cada esquema figura en la documentación de la oportunidad.', 3);
insert into faq_items (question, answer, sort_order) values ('¿Cuál es el proceso para invertir?', 'Primero coordinamos una reunión para entender su perfil y objetivos. Luego compartimos la documentación completa del proyecto: memoria técnica, flujo de fondos, contrato de fideicomiso y cronograma. Con la revisión hecha —recomendamos hacerlo con asesoramiento legal y contable propio— se firma la adhesión ante escribano y se integra el aporte según el plan acordado.', 4);
insert into faq_items (question, answer, sort_order) values ('¿Cuál es el monto mínimo y en qué moneda se invierte?', 'Cada oportunidad define su monto mínimo de participación, que publicamos en la ficha correspondiente. Los proyectos suelen estar nominados en dólares estadounidenses, con esquemas de integración en cuotas ajustadas al avance de obra según el caso.', 5);
insert into faq_items (question, answer, sort_order) values ('¿Qué información recibo durante la vida del proyecto?', 'Reportes periódicos de avance de obra con registro fotográfico, estado de aplicación de fondos y novedades relevantes del proyecto. Además, el inversor puede coordinar visitas a obra y consultas directas con nuestro equipo en cualquier etapa.', 6);
insert into faq_items (question, answer, sort_order) values ('¿Puedo salir de la inversión antes de la finalización?', 'Los proyectos inmobiliarios son inversiones de mediano plazo y la permanencia hasta el término es el escenario previsto. No obstante, los contratos suelen contemplar la cesión de la posición fiduciaria a un tercero, sujeta a las condiciones establecidas en cada fideicomiso. Lo analizamos caso por caso.', 7);
