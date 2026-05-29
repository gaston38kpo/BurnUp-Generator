
# BurnUp-Generator

Generador de gráficos burnup basado en sprints. Visualiza el alcance, el trabajo completado y la línea ideal de referencia a lo largo de los sprints.

## Características

- Gráfico burnup interactivo con las líneas Scope, Completed e Ideal
- Personalización por línea: tipo de línea (linear/step), relleno de área y color
- Los ajustes se aplican mediante confirmación explícita (modo borrador)
- Estado persistente en la URL — comparte gráficos mediante enlace
- Historial de instantáneas (solo sesión)
- Tema claro/oscuro con detección de preferencia del sistema
- Preparado para desplegar en GitHub Pages

## Uso en línea (versión desplegada)

Si no quieres instalar la aplicación localmente, puedes usar la versión desplegada en:

https://gaston38kpo.github.io/BurnUp-Generator/

Abre ese enlace en tu navegador y sigue la sección "Guía de uso" más abajo. La URL puede incluir el estado compartido (parámetro `?data=...`), por lo que al pegarla otra persona verá exactamente la misma configuración.

## Instalación local

Requisitos: tener instalado Node.js y `pnpm`.

```bash
pnpm install
pnpm dev
```

Abre la app en tu navegador en http://localhost:5173 (por defecto).

## Guía de uso

Esta guía rápida explica las acciones básicas para que un usuario nuevo empiece a crear, personalizar y compartir un burnup.

- **Abrir la app**: Ejecuta `pnpm dev` y abre la app en tu navegador (por defecto http://localhost:5173).

- **Título del gráfico**: Haz clic en la caja del título en el encabezado para poner un nombre descriptivo al gráfico.

- **Configurar sprints**: Haz clic en la insignia de sprints (por ejemplo `3 sprints`) en el encabezado para editar el número de sprints adicionales (mínimo 1). Usa la insignia de offset (`+N`) para desplazar la numeración si lo necesitas.

- **Fechas**: Haz clic en las fechas en el encabezado para establecer la fecha de inicio y fin del rango mostrado.

- **Añadir datos (Entradas de datos / `Data Entries`)**:
  - Abre el acordeón `Data Entries` para ver la tabla y el formulario de entrada (mini-form).
  - En el formulario selecciona `Scope` o `Completed` y el sprint al que pertenece la entrada.
  - Elige el modo: `± Rel` (valor relativo / delta) o `= Abs` (valor absoluto / total acumulado).
  - Introduce los `Points` y pulsa `Add` (o presiona Enter) para añadir la entrada.
  - En la tabla puedes cambiar el sprint, alternar el tipo (si está permitido), cambiar modo, editar el valor (se guarda al salir del campo) o eliminar la fila con la X.
  - Nota: cada sprint puede tener como máximo una entrada `Scope` y una `Completed`; si intentas duplicar, el toggle quedará desactivado.

- **Ajustes de la gráfica (`Chart settings`)**:
  - Haz clic en el icono de engranaje (arriba a la derecha de la gráfica) para abrir la ventana de ajustes.
  - Los cambios se guardan en borrador: usa `Apply` para confirmar y actualizar la gráfica, o `Cancel` para descartarlos.
  - Puedes elegir el tipo de línea (`Linear` o `Step`), activar/desactivar el relleno de área y cambiar colores por línea.

- **Copiar/Exportar imagen**:
  - Pulsa el icono de copiar (junto al engranaje) para exportar la gráfica como PNG y copiarla al portapapeles.
  - Durante la exportación la UI oculta controles para obtener una imagen limpia; se mostrará un mensaje (toast) al terminar.

- **Compartir por URL**:
  - La URL contiene el estado comprimido de la app (`?data=...`). Copia el enlace desde la caja del footer usando el botón de copiar para compartir la configuración exacta.
  - `Clear all` en el footer reinicia los datos de la sesión.

- **Atajos y deshacer/rehacer**:
  - Usa los botones de `Undo` / `Redo` en el encabezado o los atajos: `Ctrl/Cmd + Z` (deshacer) y `Ctrl+Y` o `Cmd+Shift+Z` (rehacer).

- **Consejos rápidos**:
  - Añade primero las entradas `Scope` para definir el alcance total y luego las `Completed` para ver el progreso.
  - Si la copia de imagen o el acceso al portapapeles falla, revisa el soporte del navegador (Clipboard API / ClipboardItem) y que la página esté en contexto seguro (https/local).

## Despliegue a GitHub Pages

```bash
pnpm deploy
```

Esto construye el proyecto y envía la carpeta `dist/` a la rama `gh-pages`.

## Stack tecnológico

- React 19 + Vite
- Recharts
- pako (compresión de URL)
- html-to-image (exportación de la gráfica)

## Arquitectura

El proyecto sigue **Arquitectura Hexagonal (Ports & Adapters)** con tres capas:

- **`src/domain/`** — Lógica de negocio pura (cálculos burnup, reducer de estado, colores). Sin dependencias de React ni del framework.
- **`src/application/`** — Hooks de React que orquestan la interacción entre el dominio y la UI.
- **`src/adapters/`** — Adaptadores de infraestructura (`UrlStateAdapter`) y componentes de presentación (`components/`).

Regla de dependencia: `domain/` no importa nada externo, `application/` importa de `domain/`, `adapters/` importa de ambas capas internas.
