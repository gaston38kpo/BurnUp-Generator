# Changelog

Todos los cambios notables de Burnup Generator se documentan aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(siguiendo [Conventional Commits](https://www.conventionalcommits.org/)).

Soportamos **v1.0.0** (estable) y anteriores.

---

## [1.1.0] — 2026-05-29

### Added

- **DataTable Pagination**: paginación de entradas con 10 items por página, navegación Previous/Next, info "Showing X–Y of Z entries", reseteo al cambiar filtro, y ajuste automático al reducir entradas. Accesible con aria-labels y aria-live.

## [1.0.0] — 2026-05-29

Versión estable inicial. La aplicación está funcional, deployada en GitHub Pages, y lista para uso público.

### Cambios desde v0.6.0

- Bump a 1.0.0: se declara estable la API pública y el estado actual del producto.
- CHANGELOG.md creado con historial completo.
- Ramas `desarrollo` y `master` eliminadas (obsoletas).

## [0.6.0] — 2026-05-29

### Added

- **Velocity Estimate**: nuevo componente y lógica de cálculo de velocidad y forecast
- **Table Filter Bar**: filtrado funcional en DataTable
- **Editable Date Controls**: controles de fecha editables en BurnupChart
- **Date Range Validation**: validación que swapea fechas si start > end

### Changed

- Renombrado `VelocityForecast` → `VelocityEstimate`
- Terminología `Δ Rel` → `± Rel` para consistencia
- Botones con estados mejorados y defaults más claros

### Fixed

- Tests actualizados para Accordion y StatsBar con prop `defaultOpen`

## [0.5.0] — 2026-05-28

### Added

- **Hexagonal Architecture**: migración completa a arquitectura hexagonal (domain, application, adapters)
- **Undo/Redo**: reemplazo de snapshot history por Ctrl+Z/Y
- **URL Sync**: sincronización de estado con URL + keyboard shortcuts
- **Trend Line**: funcionalidad de línea de tendencia en BurnupChart + settings
- **Sprint Offset**: offset de sprint, entry IDs estables, acumulados compartidos
- **Icons**: nuevos iconos copy/delete, ChartCopyButton con CopyIcon
- **Date Range Display**: display de rango de fechas en BurnupChart
- **Computed Chart Data**: refactor para datos de chart computados

### Changed

- Header rediseñado con jerarquía visual clara
- SVGs inline extraídos a estructura organizada de assets
- Skill registry actualizado con meta badges

### Fixed

- Fallback text de date fields a English
- Limpieza de dead code y assets no usados

### Tests

- Tests unitarios para core functionalities + Vite config
- Tests para componentes y chart data handling

### Chores

- Dependencias actualizadas, script OG image obsoleto removido
- Cache de skill registry removido

### Docs

- README actualizado con traducción al español

## [0.4.0] — 2026-05-25

### Fixed

- Ideal line: color theme-aware (gray en light, white en dark)
- Ideal line default a black (#000000) en light mode
- Legacy #FFFFFF idealColor normalizado a empty on load
- Código duplicado de ShareFooter que rompía el build
- Componentes BurnupChart y ShareFooter limpiados

## [0.3.0] — 2026-05-25

### Added

- **Color Pickers**: selectores de color para líneas Scope y Completed
- **Color Reset**: botón de reset de color por línea
- **Ideal Line Color Picker**: color picker para ideal line + defaults bandera argentina
- **Area Fill Toggle**: toggle de área fill por línea en chart settings
- **GitHub Pages Setup**: deploy automático a GitHub Pages
- **Favicon**: favicon del burnup
- **OG Meta Tags**: meta tags para Open Graph
- **Image Export**: exportación de imagen light/dark

### Changed

- Settings con apply/cancel
- Snapshot cleanup y date formatting mejorados

### Fixed

- Usar ComposedChart en vez de LineChart para que Area fills rendericen

### Refactors

- Indentación y formato estandarizado en App

## [0.2.0] — 2026-05-24

### Added

- **Sprint-based Tracking**: DataTable refactorizada para tracking por sprint
- **Header**: título full-width, sprint badge editable con lápiz, date range independiente
- **Confirmation Dialog**: diálogo de confirmación al limpiar datos en ShareFooter

## [0.1.0] — 2026-05-23

### Added

- **UX/UI Overhaul**: design tokens, área chart, stats bar, type tabs, toast feedback
- **Entry Template Form**: formulario con filas coloreadas por tipo
- **New Entry Highlight**: nueva fila destacada hasta que el usuario la edita
- **Auto-sort**: entradas ordenadas por fecha descendente
- **MVP**: generador de burnup chart con estado persistido en URL

## [0.0.0] — 2026-05-22

### Added

- Initial commit: proyecto base con Vite + React

---

[1.0.0]: https://github.com/gaston38kpo/BurnUp-Generator/compare/v0.6.0...v1.0.0
[0.6.0]: https://github.com/gaston38kpo/BurnUp-Generator/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/gaston38kpo/BurnUp-Generator/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/gaston38kpo/BurnUp-Generator/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/gaston38kpo/BurnUp-Generator/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/gaston38kpo/BurnUp-Generator/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/gaston38kpo/BurnUp-Generator/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/gaston38kpo/BurnUp-Generator/releases/tag/v0.0.0
