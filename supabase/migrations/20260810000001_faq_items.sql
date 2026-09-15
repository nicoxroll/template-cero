-- Preguntas frecuentes de inversores (INV-04), editables desde el panel.
--
-- Antes eran ocho objetos escritos a mano dentro de InvestorFaq.tsx. El copy
-- migra idéntico en el seed de abajo; lo que cambia es quién lo puede tocar:
-- las preguntas de un inversor se mueven con cada proyecto y con cada cambio
-- normativo, y hasta ahora corregir una coma pedía un deploy.
--
-- Calca la tabla `services`: mismo id uuid, mismo sort_order + índice, mismo
-- trigger de updated_at, mismas dos policies y los mismos GRANTs. La única
-- diferencia deliberada es que no hay `slug`: una pregunta no tiene URL propia,
-- así que un identificador legible no compraría nada y sí obligaría a inventar
-- (y validar) uno en cada alta.

create table if not exists faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Sin esto, un submit accidental del panel con los campos vacíos deja una
  -- fila fantasma que en el sitio se ve como un acordeón que no abre nada.
  constraint faq_items_question_no_vacia check (length(trim(question)) > 0),
  constraint faq_items_answer_no_vacia check (length(trim(answer)) > 0)
);

create index if not exists faq_items_order_idx on faq_items (sort_order);

create trigger faq_items_set_updated_at
  before update on faq_items
  for each row execute function set_updated_at();

alter table faq_items enable row level security;

create policy "faq_items: lectura pública"
  on faq_items for select
  to anon, authenticated
  using (true);

create policy "faq_items: solo el equipo escribe"
  on faq_items for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Los GRANTs van aparte de RLS y no son opcionales: sin el grant, PostgREST
-- corta con 42501 "permission denied" ANTES de evaluar cualquier policy, y la
-- sección se ve vacía sin ninguna pista de por qué.
grant select on faq_items to anon, authenticated;
grant select, insert, update, delete on faq_items to authenticated;

-- ------------------------------------------------------------------- seed

-- Excepción deliberada a la regla del repo de que el contenido de ejemplo va en
-- supabase/seed.sql y nunca en migrations/ (ver 20260809000002_seed.sql). Esa
-- regla existe para no empujar datos de demostración a producción, y acá no
-- aplica: estas ocho preguntas NO son de relleno, son el copy real de la
-- empresa sobre fideicomisos, riesgo y retorno, redactado para este sitio. Si
-- quedaran solo en el seed local, producción estrenaría la sección vacía.
--
-- `where not exists` y no un insert pelado por dos motivos: la migración tiene
-- que poder correrse dos veces sin duplicar —no hay UNIQUE que la frene, porque
-- no hay slug—, y no debe resucitar las preguntas que el equipo haya borrado a
-- propósito desde el panel después del primer despliegue.
insert into faq_items (question, answer, sort_order)
select * from (values
  (
    '¿Qué es un fideicomiso al costo?',
    'Es una estructura jurídica en la que los inversores aportan capital para desarrollar un proyecto y asumen el costo real de la obra, sin margen de desarrollador incorporado al precio. El fiduciario administra los fondos con un fin exclusivo: ejecutar el proyecto. El patrimonio del fideicomiso queda separado del de la desarrolladora y del de los propios inversores, lo que otorga una protección jurídica relevante.',
    0
  ),
  (
    '¿Qué riesgos tiene invertir en un desarrollo inmobiliario?',
    'Como toda inversión, implica riesgos: variaciones en el costo de construcción, plazos de obra, condiciones del mercado inmobiliario y del contexto macroeconómico. Ninguna cifra de retorno constituye una garantía. Trabajamos para mitigarlos con presupuestos auditados, contratos de obra cerrados, seguimiento técnico permanente e información periódica al inversor, pero el riesgo nunca es cero y así lo comunicamos.',
    1
  ),
  (
    '¿Cómo se calculan los retornos estimados?',
    'Surgen de la diferencia proyectada entre el costo total del desarrollo y el valor de venta estimado de las unidades, neta de gastos, honorarios e impuestos, distribuida en proporción a la participación de cada inversor. Son proyecciones basadas en valores de mercado al momento de la publicación: se actualizan durante la vida del proyecto y pueden variar.',
    2
  ),
  (
    '¿Cómo y cuándo se realizan los retornos?',
    'Depende de la estructura de cada oportunidad. En general, el retorno se materializa con la venta de las unidades al finalizar la obra, o mediante la adjudicación de unidades al inversor, quien puede venderlas o rentarlas. Algunos proyectos de renta distribuyen ingresos periódicos. El detalle de cada esquema figura en la documentación de la oportunidad.',
    3
  ),
  (
    '¿Cuál es el proceso para invertir?',
    'Primero coordinamos una reunión para entender su perfil y objetivos. Luego compartimos la documentación completa del proyecto: memoria técnica, flujo de fondos, contrato de fideicomiso y cronograma. Con la revisión hecha —recomendamos hacerlo con asesoramiento legal y contable propio— se firma la adhesión ante escribano y se integra el aporte según el plan acordado.',
    4
  ),
  (
    '¿Cuál es el monto mínimo y en qué moneda se invierte?',
    'Cada oportunidad define su monto mínimo de participación, que publicamos en la ficha correspondiente. Los proyectos suelen estar nominados en dólares estadounidenses, con esquemas de integración en cuotas ajustadas al avance de obra según el caso.',
    5
  ),
  (
    '¿Qué información recibo durante la vida del proyecto?',
    'Reportes periódicos de avance de obra con registro fotográfico, estado de aplicación de fondos y novedades relevantes del proyecto. Además, el inversor puede coordinar visitas a obra y consultas directas con nuestro equipo en cualquier etapa.',
    6
  ),
  (
    '¿Puedo salir de la inversión antes de la finalización?',
    'Los proyectos inmobiliarios son inversiones de mediano plazo y la permanencia hasta el término es el escenario previsto. No obstante, los contratos suelen contemplar la cesión de la posición fiduciaria a un tercero, sujeta a las condiciones establecidas en cada fideicomiso. Lo analizamos caso por caso.',
    7
  )
) as semilla(question, answer, sort_order)
where not exists (select 1 from faq_items);
