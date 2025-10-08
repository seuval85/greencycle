const $ = (s,doc=document)=>doc.querySelector(s);
const $$ = (s,doc=document)=>Array.from(doc.querySelectorAll(s));
const currency = v => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(v||0);

const CATEGORIES = [
  {id:"tondeuses", name:"Tondeuses & autoportées"},
  {id:"tronconneuses", name:"Tronçonneuses"},
  {id:"debroussailleuses", name:"Débroussailleuses"},
  {id:"souffleurs", name:"Souffleurs & aspirateurs"},
  {id:"micro_tracteurs", name:"Micro-tracteurs"},
  {id:"bornes", name:"Bornes électriques (camping)"},
  {id:"mobilier", name:"Mobilier extérieur"},
  {id:"sanitaires", name:"Sanitaires / accessoires camping"},
  {id:"divers", name:"Divers"}
];

let catalogue = [];
let leads = JSON.parse(localStorage.getItem("gc_leads")||"[]");

function setCats(){
  const sel = $("#adminCat");
  if (sel) sel.innerHTML = CATEGORIES.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
}

async function load(){
  try{
    const r = await fetch("products.json?ts="+Date.now());
    catalogue = await r.json();
  }catch(e){ catalogue = []; }
  renderList();
  renderLeads();
  setCats();
  $$("#year").forEach(n=> n.textContent = (new Date()).getFullYear());
}

function save(){
  const blob = JSON.stringify(catalogue,null,2);
  localStorage.setItem("gc_products", blob);
}

function renderList(){
  const host = $("#adminList");
  host.innerHTML = catalogue.map((p,i)=>`
    <div class="card item">
      <div class="muted">${p.sku||"No-SKU"}</div>
      <h3>${p.title}</h3>
      <div>${p.brand||""} • ${p.category||""} • ${p.segment||""} • ${p.condition||""}</div>
      <div class="price">${p.price?currency(p.price):"-"}</div>
      <div class="row">
        <button class="btn ghost" onclick="edit(${i})">Éditer</button>
        <button class="btn danger" onclick="del(${i})">Supprimer</button>
      </div>
    </div>
  `).join("") || '<p class="muted">Aucun produit.</p>';
}

function renderLeads(){
  const host = $("#leadList");
  host.innerHTML = leads.map((l,i)=>`
    <div class="card">
      <strong>${l.title}</strong>
      <div class="muted">${l.name} • ${l.email}</div>
      <div>${l.category||""} • ${l.condition||""} • ${l.price?currency(l.price):"-"}</div>
      <p>${l.description||""}</p>
    </div>
  `).join("") || '<p class="muted">Aucun lead pour l’instant.</p>';
}

function edit(i){
  const p = catalogue[i];
  const f = $("#prodForm");
  Object.entries(p).forEach(([k,v])=>{
    if (f[k]!==undefined) f[k].value = v;
  });
  del(i,false);
}

function del(i, ask=true){
  if (ask && !confirm("Supprimer cet article ?")) return;
  catalogue.splice(i,1);
  saveJsonFile();
  renderList();
}

function toCsv(rows){
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = s => String(s??"").replaceAll('"','""');
  const head = cols.map(c=>`"${esc(c)}"`).join(",");
  const lines = rows.map(r=> cols.map(c=>`"${esc(r[c])}"`).join(",")).join("\n");
  return head+"\n"+lines;
}

function fromCsv(csv){
  const [head, ...lines] = csv.split(/\r?\n/).filter(Boolean);
  const cols = head.split(",").map(h=> h.replace(/^"|"$/g,"").replaceAll('""','"'));
  return lines.map(line=>{
    const vals = line.match(/"(?:[^"]|"")*"|[^,]+/g)?.map(v=> v.replace(/^"|"$/g,"").replaceAll('""','"')) || [];
    const obj = {};
    cols.forEach((c,i)=> obj[c]=vals[i]||"");
    return obj;
  });
}

function saveJsonFile(){
  const data = JSON.stringify(catalogue, null, 2);
  const blob = new Blob([data], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "products.json";
  a.click();
}

function saveCsvFile(rows, name){
  const data = toCsv(rows);
  const blob = new Blob([data], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name || "export.csv";
  a.click();
}

function generateGoogleXml(){
  const items = catalogue.map(p=>`
    <item>
      <g:id>${p.sku||p.title}</g:id>
      <title>${escapeXml(p.title||"")}</title>
      <description>${escapeXml(p.description||"")}</description>
      <link>${location.origin}/index.html#${encodeURIComponent(p.sku||p.title)}</link>
      <g:price>${(p.price||0).toFixed(2)} EUR</g:price>
      <g:condition>${(p.condition||"used")}</g:condition>
      <g:availability>in_stock</g:availability>
      <g:brand>${escapeXml(p.brand||"")}</g:brand>
      <g:image_link>${p.image || (location.origin + "/assets/placeholder.webp")}</g:image_link>
      <g:product_type>${p.segment||""} &gt; ${p.category||""}</g:product_type>
    </item>
  `).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>GreenCycle Catalogue</title>
    <link>${location.origin}/</link>
    <description>Catalogue produits GreenCycle</description>
    ${items}
  </channel>
</rss>`;

  // Save to /feeds/google-products.xml (works when served from file system with SW, here we trigger download)
  const blob = new Blob([xml], {type:"application/xml"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "google-products.xml";
  a.click();
  alert("Flux Google Merchant généré (téléchargé). Placez-le dans /feeds/ pour la prod.");
}

function escapeXml(s){
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

// Events
addEventListener("DOMContentLoaded", ()=>{
  $("#btnExportJson").addEventListener("click", ()=>{
    saveJsonFile();
  });
  $("#btnImportJson").addEventListener("click", async ()=>{
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "application/json";
    inp.onchange = async ()=>{
      const txt = await inp.files[0].text();
      catalogue = JSON.parse(txt);
      saveJsonFile(); // refresh file on disk suggestion
      renderList();
    };
    inp.click();
  });

  $("#btnExportCsv").addEventListener("click", ()=>{
    saveCsvFile(catalogue, "products.csv");
  });
  $("#btnImportCsv").addEventListener("click", async ()=>{
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".csv,text/csv";
    inp.onchange = async ()=>{
      const txt = await inp.files[0].text();
      const rows = fromCsv(txt);
      // try to coerce price to number
      rows.forEach(r=> r.price = parseFloat(String(r.price||"0").replace(",",".")) || 0);
      catalogue = rows;
      saveJsonFile();
      renderList();
    };
    inp.click();
  });

  $("#btnGenerateGoogleXml").addEventListener("click", generateGoogleXml);
  $("#btnExportLeads").addEventListener("click", ()=>{
    saveCsvFile(leads, "leads.csv");
  });
  $("#btnClearLeads").addEventListener("click", ()=>{
    if (confirm("Vider tous les leads ?")) {
      leads = [];
      localStorage.setItem("gc_leads", JSON.stringify(leads));
      renderLeads();
    }
  });

  $("#prodForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.price = parseFloat(data.price||"0");
    data.created_at = new Date().toISOString();
    if (!data.sku) data.sku = "SKU-"+Math.random().toString(36).slice(2,8).toUpperCase();
    catalogue.push(data);
    saveJsonFile();
    e.target.reset();
    renderList();
  });

  load();
});
