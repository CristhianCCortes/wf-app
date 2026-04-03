const MANIFEST_URL = "https://raw.githubusercontent.com/CristhianCCortes/wf-data/refs/heads/main/manifest.json";

const statusEl = document.getElementById("status");
const infoEl = document.getElementById("info");
const refreshBtn = document.getElementById("refresh");

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status} al pedir ${url}`);
  return await r.json();
}

async function run() {
  try {
    statusEl.textContent = "Descargando manifest…";
    const manifest = await fetchJson(MANIFEST_URL);
    infoEl.textContent = JSON.stringify(manifest, null, 2);
    statusEl.textContent = "✅ OK: manifest descargado.";
  } catch (e) {
    statusEl.textContent = `❌ Error: ${e.message}`;
    console.error(e);
  }
}

refreshBtn.addEventListener("click", run);
run();
