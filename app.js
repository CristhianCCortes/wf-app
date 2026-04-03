// 1) PEGA AQUÍ el RAW URL de manifest.json (del paso 1)
const MANIFEST_URL = "PEGA_AQUI_EL_RAW_URL_DEL_MANIFEST";

const statusEl = document.getElementById("status");
const infoEl = document.getElementById("info");
const refreshBtn = document.getElementById("refresh");

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status} al pedir ${url}`);
  return await r.json();
}

async function downloadSources(manifest) {
  const results = {};
  const sources = manifest.sources || {};
  for (const [key, src] of Object.entries(sources)) {
    statusEl.textContent = `Descargando: ${key}…`;
    const r = await fetch(src.url, { cache: "no-store" });
    if (!r.ok) throw new Error(`No se pudo descargar ${key}: HTTP ${r.status}`);
    const text = await r.text();

    // Guardamos una copia "simple" (por ahora) en localStorage si cabe.
    // i18n.json es muy grande, así que NO lo guardamos aquí: solo registramos que se descargó.
    if (text.length < 4_000_000) {
      localStorage.setItem(`wf_source_${key}`, text);
    }
    results[key] = { ok: true, size: src.size, sha256: src.sha256, url: src.url };
  }
  return results;
}

async function runUpdate() {
  try {
    statusEl.textContent = "Descargando manifest…";
    const manifest = await fetchJson(MANIFEST_URL);

    const results = await downloadSources(manifest);

    const meta = {
      updatedAt: new Date().toISOString(),
      generatedAt: manifest.generatedAt,
      versions: Object.fromEntries(Object.entries(manifest.sources).map(([k,v]) => [k, v.version])),
      results
    };
    localStorage.setItem("wf_update_meta", JSON.stringify(meta, null, 2));

    infoEl.textContent = JSON.stringify(meta, null, 2);
    statusEl.textContent = "✅ Fuentes descargadas. (Siguiente: cache en segundo plano con Service Worker)";
  } catch (e) {
    statusEl.textContent = `❌ Error: ${e.message}`;
    console.error(e);
  }
}

refreshBtn.addEventListener("click", runUpdate);

// Ejecutar al cargar
runUpdate();
``
