// wf-app/app.js
const $status = document.getElementById("status");
const $out = document.getElementById("out");
const $refresh = document.getElementById("refresh");

// 1) Cambia ESTE usuario/repositorio si lo renombras
const WF_DATA_OWNER = "CristhianCcortes";
const WF_DATA_REPO = "wf-data";

// 2) URLs robustas (probamos varias; si una falla, usamos otra)
const MANIFEST_URLS = [
  // JSDelivr (muy estable para GitHub)
  `https://cdn.jsdelivr.net/gh/${WF_DATA_OWNER}/${WF_DATA_REPO}@main/manifest.json`,
  // Raw GitHub (fallback)
  `https://raw.githubusercontent.com/${WF_DATA_OWNER}/${WF_DATA_REPO}/main/manifest.json`,
];

function setStatus(msg, type = "muted") {
  $status.className = type;
  $status.textContent = msg;
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status} al pedir ${url}`);
  return await r.json();
}

async function loadManifest() {
  let lastErr = null;
  for (const url of MANIFEST_URLS) {
    try {
      return await fetchJson(url);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("No se pudo cargar el manifest (sin detalle).");
}

function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

async function run() {
  try {
    setStatus("Descargando manifest…", "muted");

    const manifest = await loadManifest();

    // Validación mínima
    if (!manifest || typeof manifest !== "object" || !manifest.sources) {
      throw new Error("El manifest no tiene el formato esperado (falta 'sources').");
    }

    setStatus("OK: manifest cargado ✅", "ok");
    $out.textContent = pretty(manifest);

  } catch (e) {
    setStatus(`ERROR: ${e.message}`, "bad");
    $out.textContent =
      "No se pudo cargar el manifest.\n\n" +
      "Sugerencia rápida:\n" +
      "1) revisa que wf-data tenga manifest.json en la raíz\n" +
      "2) revisa que el repo se llame exactamente wf-data\n" +
      "3) espera 1-2 minutos (cache de GitHub Pages)\n\n" +
      "Detalle:\n" + String(e);
  }
}

$refresh.addEventListener("click", run);
run();
