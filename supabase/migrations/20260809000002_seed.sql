/*
  # Seed mínimo — solo la fila de configuración

  Proyectos, inversiones, equipo y servicios NO se seedean: los fixtures de
  `src/data/fixtures.ts` son contenido de demostración y la empresa carga los
  reales desde el panel. Sembrarlos acá obligaría a borrarlos a mano antes de
  salir a producción.

  `page_config` sí se siembra porque la app la asume siempre presente (el
  footer, el WhatsApp flotante y la sección Contacto la leen en cada página):
  sin fila, el sitio arranca vacío. Los valores son placeholders explícitos —
  reemplazarlos desde Configuración antes de publicar.
*/

insert into page_config (
  id,
  hero_scrub_enabled,
  contact_email,
  contact_phone,
  whatsapp_number,
  address,
  office_lat,
  office_lng,
  horario_atencion,
  zonas_cobertura,
  metrics_years,
  metrics_m2,
  metrics_projects,
  legal_name,
  cuit,
  matricula,
  domicilio_legal,
  disclaimer_oferta_publica,
  disclaimer_datos_personales
) values (
  1,
  false,
  'contacto@puntocerodesarrollos.com.ar',
  '+54 11 5555-0123',
  '5491155550123',
  'Av. del Libertador 5252, Piso 3, Vicente López, Buenos Aires',
  -34.5271,
  -58.4795,
  'Lunes a viernes de 9 a 18 h',
  array['CABA', 'Zona Norte', 'La Plata'],
  0,
  0,
  0,
  'Punto Cero Desarrollos S.A.',
  '30-71234567-8',
  'Mat. CUCICBA 6042 / CMCPSI 4318',
  'Av. del Libertador 5252, Piso 3, Vicente López, Buenos Aires',
  'Las oportunidades publicadas en este sitio no constituyen oferta pública de valores negociables en los términos de la Ley 26.831. Los retornos indicados son estimaciones y no constituyen garantía de resultado.',
  'Los datos personales recolectados a través de este sitio son tratados conforme a la Ley 25.326 de Protección de los Datos Personales. El titular puede ejercer los derechos de acceso, rectificación y supresión escribiendo a los canales de contacto publicados.'
)
on conflict (id) do nothing;
