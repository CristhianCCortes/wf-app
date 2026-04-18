/*
 wf-app v10 — Base canónica tipo AlecaFrame (Mods + Arcanos)
 - Datos: manifest.json (wf-data) → fuentes raw (auto-actualizable)
 - UI: filtros arriba (Tipo/Sección, Subcategoría, Buscar), resultados abajo
 - Subcategorías: derivadas (no dependen de que el JSON traiga subCategory)
*/

var MANIFEST = null;

var STATE = {
  dataset: "Mods.json",     // Mods.json | Arcanes.json
  subcategory: "",
  search: ""
};

var DATA = []; // datos ya normalizados + clasificados

function $(id) { return document.getElementById(id); }

/* ---------- UI ---------- */
function ensureLayout() {
  if (document.getElementById("appRoot")) return;

  document.body.innerHTML = `
    <div id="appRoot" style="font-family: sans-serif; padding: 12px;">
      <h2>wf-app</h2>

      <div id="filters" style="display:flex; gap:10px; align-items:center; margin-bottom:12px;">
        <select id="datasetSelect"></select>
        <select id="subcatSelect"></select>
        <input id="searchInput" placeholder="Buscar..." />
      </div>

      <div id="results">
        <pre id="out"></pre>
      </div>
    </div>
  `;
}

function setStatus(msg) {
  var out = $("out");
  if (out) out.textContent = msg;
}

/* ---------- Manifest y carga ---------- */
async function loadManifest() {
  setStatus("Cargando manifest...");
  var res = await fetch(
    "https://raw.githubusercontent.com/CristhianCCortes/wf-data/main/manifest.json",
    { cache: "no-store" }
  );
  MANIFEST = await res.json();
}

async function loadDataFile(fileName) {
  if (!MANIFEST || !MANIFEST.sources || !MANIFEST.sources[fileName]) {
    throw new Error("Manifest no contiene la fuente: " + fileName);
  }
  var src = MANIFEST.sources[fileName];
  var url = (typeof src === "string") ? src : src.url;

  setStatus("Cargando datos: " + fileName + " ...");
  var res = await fetch(url, { cache: "no-store" });
  var json = await res.json();
  return Array.isArray(json) ? json : Object.values(json);
}

/* ---------- Clasificadores (derivación tipo AlecaFrame) ---------- */
function classifyMod(item) {
  var c = (item.compatName || "").toLowerCase();

  if (c.includes("warframe")) return "Warframe";
  if (c.includes("rifle") || c.includes("shotgun")) return "Arma primaria";
  if (c.includes("pistol")) return "Arma secundaria";
  if (c.includes("melee")) return "Cuerpo a cuerpo";
  if (c.includes("aura")) return "Aura";
  if (c.includes("sentinel") || c.includes("companion")) return "Compañero";
  if (c.includes("archwing")) return "Archwing";
  if (c.includes("necramech")) return "Necramech";
  return "Otros";
}

function classifyArcane(item) {
  var t = (item.type || "").toLowerCase();
  var c = (item.category || "").toLowerCase();
  var u = (item.uniqueName || "").toLowerCase();
  var n = (item.name || "").toLowerCase();
  var blob = (t + " " + c + " " + u + " " + n);

  // Prioridad 1: type (más confiable)
  if (t.includes("warframe")) return "Warframe";
  if (t.includes("operator") || t.includes("amp")) return "Operador / Amp";
  if (t.includes("primary")) return "Arma primaria";
  if (t.includes("secondary")) return "Arma secundaria";
  if (t.includes("melee")) return "Cuerpo a cuerpo";
  if (t.includes("kitgun")) return "Kitguns";
  if (t.includes("zaw")) return "Zaws";
  if (t.includes("companion") || t.includes("sentinel") || t.includes("pet")) return "Compañeros";
  if (t.includes("necramech")) return "Necramech";

  // Fallback por huellas en texto completo
  if (blob.includes("warframe")) return "Warframe";
  if (blob.includes("operator") || blob.includes("amp")) return "Operador / Amp";
  if (blob.includes("primary")) return "Arma primaria";
  if (blob.includes("secondary")) return "Arma secundaria";
  if (blob.includes("melee")) return "Cuerpo a cuerpo";
  if (blob.includes("kitgun")) return "Kitguns";
  if (blob.includes("zaw")) return "Zaws";
  if (blob.includes("companion") || blob.includes("sentinel") || blob.includes("pet")) return "Compañeros";
  if (blob.includes("necramech")) return "Necramech";

  return "Otros";
}

function classifyItem(item, fileName) {
  if (fileName === "Mods.json") return classifyMod(item);
  if (fileName === "Arcanes.json") return classifyArcane(item);
  return "Otros";
}

/* ---------- Poblar UI ---------- */
function populateDatasetSelect() {
  var ds = $("datasetSelect");
  if (!ds) return;

  ds.innerHTML = "";
  var options = [
    { value: "Mods.json", label: "Mods" },
    { value: "Arcanes.json", label: "Arcanos" }
  ];

  options.forEach(function (o) {
    var opt = document.createElement("option");
    opt.value = o.value;
    opt.textContent = o.label;
    ds.appendChild(opt);
  });

  ds.value = STATE.dataset;
}

function populateSubcategories() {
  var sel = $("subcatSelect");
  if (!sel) return;

  sel.innerHTML = '<option value="">Todas las subcategorías</option>';

  var counts = {};
  DATA.forEach(function (it) {
    counts[it.__sub] = (counts[it.__sub] || 0) + 1;
  });

  var keys = Object.keys(counts).sort(function (a, b) {
    var da = counts[a], db = counts[b];
    if (db !== da) return db - da;
    return a.localeCompare(b, "es", { sensitivity: "base" });
  });

  keys.forEach(function (sub) {
    var opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = sub + " (" + counts[sub] + ")";
    sel.appendChild(opt);
  });

  sel.value = STATE.subcategory;
}

/* ---------- Filtros ---------- */
function applyFilters() {
  var out = DATA.slice();

  if (STATE.subcategory) {
    out = out.filter(function (it) { return it.__sub === STATE.subcategory; });
  }

  if (STATE.search) {
    var q = STATE.search;
    out = out.filter(function (it) {
      return JSON.stringify(it).toLowerCase().includes(q);
    });
  }

  return out;
}

/* ---------- Render ---------- */
function render() {
  var outEl = $("out");
  if (!outEl) return;

  var filtered = applyFilters();

  var title = (STATE.dataset === "Mods.json") ? "Mods" : "Arcanos";
  var txt = "";
  txt += "Sección: " + title + "\n";
  txt += "Total: " + filtered.length + "\n\n";
  txt += "Top (primeros 20):\n";

  for (var i = 0; i < Math.min(20, filtered.length); i++) {
    var it = filtered[i];
    var name = it.name_es || it.name || it.uniqueName || "(sin nombre)";
    txt += (i + 1) + ". " + name + "\n";
  }

  outEl.textContent = txt;
}

/* ---------- Orquestación ---------- */
async function refreshData() {
  // Cargar dataset actual y clasificar
  var raw = await loadDataFile(STATE.dataset);
  DATA = raw.map(function (it) {
    it.__sub = classifyItem(it, STATE.dataset);
    return it;
  });

  // Si la subcategoría actual no existe en el nuevo dataset, resetearla
  var exists = {};
  DATA.forEach(function (it) { exists[it.__sub] = true; });
  if (STATE.subcategory && !exists[STATE.subcategory]) STATE.subcategory = "";

  populateSubcategories();
  render();
}

async function run() {
  ensureLayout();
  await loadManifest();

  populateDatasetSelect();

  // Listeners
  $("datasetSelect").addEventListener("change", async function () {
    STATE.dataset = this.value;
    STATE.subcategory = "";
    STATE.search = $("searchInput").value.toLowerCase().trim();
    await refreshData();
  });

  $("subcatSelect").addEventListener("change", function () {
    STATE.subcategory = this.value;
    render();
  });

  $("searchInput").addEventListener("input", function () {
    STATE.search = this.value.toLowerCase().trim();
    render();
  });

  // Primera carga
  await refreshData();
}

document.addEventListener("DOMContentLoaded", function () {
  run().catch(function (e) {
    console.error(e);
    setStatus("ERROR: " + e.message);
  });
});
