#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TS="$(date +"%Y-%m-%d_%H-%M-%S")"
TXT="reports/Informe_${TS}.txt"
PDF="reports/Informe_${TS}.pdf"

# Recolectar info básica
APP_PWD="$(pwd)"
APP_GIT="$(git rev-parse --short HEAD 2>/dev/null || echo 'no-git')"
APP_STATUS="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
NODEV="$(node -v 2>/dev/null || echo 'node-n/a')"
PYV="$(python3 -V 2>/dev/null || echo 'python3-n/a')"

# Estado del servidor (no lo controla este script; solo referencia)
LOCAL_URL="http://localhost:8080/"

# Generar prompt detallado (incluye acuerdos)
cat > "$TXT" <<EOF
INFORME DETALLADO (AUTO) — wf-app / wf-data — ES-419
Generado: $(date)
Ubicación wf-app: $APP_PWD
URL local esperada: $LOCAL_URL

ESTADO (lo que debe verse)
- Al abrir el navegador en $LOCAL_URL se debe ver: wf-app + selector de subcategoría + buscar + Total + lista (Top 20).
- Cambiar subcategoría debe cambiar el Total y la lista (Mods ya funciona).
- Buscar debe reducir resultados en tiempo real.

ACUERDOS CLAVE (no negociables)
- Objetivo: herramienta tipo AlecaFrame (funcional/visual), sin tocar archivos del juego.
- Datos: fuentes confiables (Public Export/public-export-plus) canalizadas por wf-data.
- Idioma: ES-419.
- Método: comandos reproducibles desde terminal; sin nano; validación con capturas.
- Norma nueva: antes de cada acción, Copilot indica la terminal: WF-SERVER / WF-APP / WF-DATA.

TERMINALES (roles)
- WF-SERVER (8080): corre python3 -m http.server 8080 dentro de wf-app. No se usa para cambios.
- WF-APP (UI): cambios en app.js y UI.
- WF-DATA (DATOS): scripts/generación de datos y git.

ESTADO TÉCNICO (wf-app)
- app.js actual está en modo UI ordenada (filtros arriba, resultados abajo).
- Subcategorías de Mods se derivan de compatName (como AlecaFrame) y el filtro lee directamente el valor del selector UI.

NOTAS IMPORTANTES (lecciones)
- No suponer que Mods.json trae subCategory/subCategory_es.
- Derivar subcategorías en cliente (Mods) desde compatName/category/type.
- Evitar “Cargando…” infinito: el motor no debe depender del DOM para decidir qué cargar.
- No pegar JS en terminal (zsh puede fallar). JS va en DevTools si se requiere.

VERSIÓN / ENTORNO
- git wf-app: $APP_GIT (cambios sin commit: $APP_STATUS)
- node: $NODEV
- python: $PYV

PROMPT MUY DETALLADO PARA RETOMAR EN OTRO CHAT
Hola Copilot. Retomemos el proyecto wf-app / wf-data para construir una app tipo AlecaFrame (funcional y visual) en Español Latino (ES-419), sin tocar archivos del juego.
Reglas: una instrucción por paso, sin nano, comandos reproducibles; validación por capturas; antes de cada acción indicar terminal (WF-SERVER / WF-APP / WF-DATA).
Estado actual: wf-app ya carga Mods automáticamente y muestra filtro de subcategoría + búsqueda; el total y lista cambian al filtrar. Las subcategorías se derivan (no vienen en Mods.json).
Siguiente objetivo: extender el mismo patrón a Arcanos (cargar Arcanes.json y derivar subcategorías por type/category/uniqueName), luego integrar selector de Familia/Fuente (manifest), y finalmente UX tipo AlecaFrame (paneles, tabs, persistencia).
EOF

# Convertir a PDF si cupsfilter está disponible
if command -v cupsfilter >/dev/null 2>&1; then
  cupsfilter -m application/pdf "$TXT" > "$PDF" || true
fi

echo "OK: Reporte generado:"
echo " - TXT: $TXT"
if [ -f "$PDF" ]; then
  echo " - PDF: $PDF"
else
  echo " - PDF: (no generado; cupsfilter no disponible o falló)."
fi
