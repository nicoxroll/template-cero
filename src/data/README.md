# Capa de datos — contrato para agentes

## Regla única

**Los componentes consumen SOLO los singletons de `src/data` (`projectRepo`, `investmentRepo`, `leadRepo`, `newsletterRepo`, `teamRepo`, `serviceRepo`, `configRepo`). NUNCA importan `fixtures.ts` ni `localStorageRepo.ts` directamente.**

```ts
import { projectRepo, type Project } from '../data';

const projects = await projectRepo.list();
```

## Por qué

v1 no tiene backend. Los repos sirven fixtures desde localStorage (seed automático en primer acceso, namespace `puntocero:v2:*`). Cuando llegue la DB real (milestone posterior), se escriben implementaciones nuevas de las interfaces de `repositories.ts` y se cambian los singletons en `index.ts` — **cero cambios en componentes**.

## Comportamiento del mock

- **Latencia simulada 400–700 ms** en toda operación → los skeletons (UX-01) siempre son visibles en dev. No la quiten.
- CRUD de proyectos/inversiones/leads/config persiste en localStorage (el admin funciona de verdad entre recargas).
- `leads` y `newsletter` arrancan vacíos; el resto se seedea de `fixtures.ts`.
- Para resetear datos: borrar las claves `puntocero:v2:*` de localStorage.
- **Namespace bumpeado a `v2`** (era `v1`): al agregar campos requeridos a `DocumentRef`, `Investment` y `PageConfig`, cualquier dato viejo persistido en `v1` habría quedado con `undefined` en esos campos. El bump fuerza un re-seed limpio; los datos `v1` viejos quedan huérfanos en localStorage (inofensivos, se pueden borrar a mano).

## Invariantes de dominio (mantener en admin y fixtures)

- `Project.timeline`: exactamente UNA etapa con `current: true`; orden fijo planificación → diseño → construcción → entrega.
- `Project.isRender`: `true` obliga a etiquetar las imágenes como render/concepto en la UI (PROY-02).
- `Investment.estReturn`: texto siempre "estimado"; la UI debe acompañarlo con disclaimer (INV-03).
- `Investment.integracion`: la suma de `porcentaje` del cronograma de aportes debe dar 100.
- `Investment.hitosDesembolso`: orden cronológico, coherente con `timeline` del `Project` vinculado (`projectSlug`).
- `PageConfig.whatsappNumber`: solo dígitos con código de país (formato `wa.me`).
- Slugs: kebab-case, únicos, estables (son URL pública — SITE-02).

## Documentos (`DocumentRef`)

- `url`: ruta real bajo `/docs/`, con convención **`<slug-de-la-entidad>-<kind>.pdf`** (ej. `torre-libertador-brochure.pdf`, `fideicomiso-torre-libertador-term-sheet.pdf`). Otro agente genera los PDFs en `public/docs/` con estos nombres exactos — si se agrega o renombra un doc en fixtures, hay que avisar para que el PDF correspondiente se genere/renombre.
- `kind`: `'brochure' | 'planos' | 'term-sheet' | 'contrato' | 'memorando' | 'otro'`.
- `sizeLabel`: texto legible ya formateado (ej. `"1,2 MB"`), no un número — se muestra tal cual en la UI.

## Datos legales/societarios (`PageConfig`)

`legalName`, `cuit`, `matricula`, `domicilioLegal` y `disclaimers` ({ `ofertaPublica` (Ley 26.831 / CNV), `datosPersonales` (Ley 25.326) }) están pensados para el bloque legal del footer y la sección de Inversiones. `horarioAtencion` y `zonasCobertura` alimentan Contacto. Son mock verosímil, no datos reales — si el cliente aporta los reales, se reemplazan acá y en ningún otro lado.

## Estructura de fideicomiso (`Investment`)

Cada inversión trae la estructura completa: `fiduciario` (nombre + tipo de registro), `tipoEstructura` (`'Fideicomiso al costo' | 'Fideicomiso a valor fijo'`), `ticketMinimo` + `moneda`, `integracion` (cronograma de aportes por etapa), `hitosDesembolso` (ligados a avance de obra del proyecto vinculado), `salida` (texto de cómo/cuándo se cobra el retorno) y `escribania`. Las 4 inversiones del fixture cubren estados distintos: `edificio-alamos-cierre` es el único caso `cerrada` con ciclo completo (hitos y liquidación ya ocurridos); el resto tiene hitos con fechas futuras acordes al avance real del proyecto.

## Labels

Usar los mapas exportados (`PROJECT_STAGE_LABELS`, `PROJECT_STATUS_LABELS`, `PROJECT_TYPE_LABELS`, `INVESTMENT_STATUS_LABELS`) para mostrar valores de enums — no hardcodear strings de UI.
