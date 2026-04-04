// wf-app/app.js
// Objetivo: cargar manifest.json desde wf-data y mostrarlo en pantalla con diagnóstico claro.

const $status = document.getElementById("status");
const $out = document.getElementById("out");
const $refresh = document.getElementById("refresh");

// ====== CONFIGURACIÓN (NO TOCAR si tus repos se llaman igual) ======
const WF_DATA_OWNER = "CristhianCcortes"; // tu usuario exacto
const WF_DATA_REPO = "wf-data";           // tu repo de datos exacto
const WF_DATA_BRANCH = "main";            // rama principal (main)

// Probamos varias fuentes: si una falla, usamos la otra
const MANIFEST_URLS = [
  // jsDelivr (CDN, suele ser muy estable para GitHub)
  `https://cdn.jsdelivr.net/gh/${WF_DATA_OWNER}/${WF_DATA_REPO}@${WF_DATA_BRANCH}/manifest.json`,
  // Raw GitHub (fallback directo)
  `https://raw.githubusercontent.com/${WF_DATA_OWNER}/${WF_DATA_REPO}/${WF_DATA_BRANCH}/manifest.json`,
];

// ====== UTILIDADES ======
function setStatus(msg, type = "muted") {
  // type: "muted" | "ok" | "bad"
  $status.className = type;
  $status.textContent = msg;
}

function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

async function fetchJson(url) {
  // Evitar caché agregando un parámetro variable
  const cacheBust = `v=${Date.now()}`;
  const finalUrl = url.includes("?") ? `${url}&${cacheBust}` : `${url}?${cacheBust}`;

  const r = await fetch(finalUrl, { cache: "no-store" });
  if (!r.ok) {
    throw new Error(`HTTP ${r.status} al pedir: ${url}`);
  }

  // Si el JSON está mal formado, esto lanzará error y lo capturamos arriba
  return await r.json();
}

async function loadManifest() {
  let lastError = null;

  for (const url of MANIFEST_URLS) {
    try {
      setStatus(`Descargando manifest… (${url})`, "muted");
      const manifest = await fetchJson(url);

      // Validación mínima del formato esperado
      if (!manifest || typeof manifest !== "object") {
        throw new Error("El manifest no es un objeto JSON válido.");
      }

      // Si tu manifest tiene "sources", mejor (pero no lo forzamos aún)
      // Solo verificamos que exista algo útil
      return { manifest, usedUrl: url };

    } catch (err) {
      lastError = err;
      // seguimos probando la siguiente URL
    }
  }

  // Si llegamos aquí, fallaron todas las URL
  throw lastError || new Error("No se pudo cargar el manifest (sin detalle).");
}

// ====== PROCESO PRINCIPAL ======
async function run() {
  try {
    setStatus("Cargando manifest y fuentes…", "muted");
    $out.textContent = "(sin datos todavía)";

    const { manifest, usedUrl } = await loadManifest();

    setStatus(`OK: manifest cargado ✅ (desde: ${usedUrl})`, "ok");
    $out.textContent = pretty(manifest);

  } catch (e) {
    setStatus(`ERROR: ${e.message}`, "bad");

    $out.textContent =
      "No se pudo cargar el manifest.json.\n\n" +
      "Checklist rápido:\n" +
      "1) Asegúrate de que exista manifest.json en la RAÍZ de wf-data.\n" +
      "2) Asegúrate de que el repo se llame exactamente 'wf-data' y sea público.\n" +
      "3) Asegúrate de que la rama sea 'main'.\n" +
      "4) Espera 1-2 minutos (GitHub Pages puede cachear).\n\n" +
      "Detalle del error:\n" +
      String(e);
  }
}

// Botón manual
$refresh.addEventListener("click", run);

// Auto-ejecución
run();
``
