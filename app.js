const $ = (s,doc=document)=>doc.querySelector(s);
const $$ = (s,doc=document)=>Array.from(doc.querySelectorAll(s));

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

const currency = v => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(v||0);

let catalogue = [];
let leads = JSON.parse(localStorage.getItem("gc_leads")||"[]");

const state = {
  q: "", cat: "", cond: "", seg: "", sort:"relevance"
};

function initFilters() {
  const sel = $("#cat");
  sel.innerHTML = '<option value="">Catégorie</option>' + CATEGORIES.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
  const sellCat = $("#sellCat");
  if (sellCat) sellCat.innerHTML = CATEGORIES.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");

  ["q","cat","cond","seg","sort"].forEach(id=> {
    const el = $("#"+id);
    if (!el) return;
    el.addEventListener("input", ()=>{
      state[id] = el.value.trim();
      render();
    });
  });
}

async function loadCatalogue() {
  try{
    const resp = await fetch("products.json?ts="+Date.now());
    catalogue = await resp.json();
  }catch(e){
    catalogue = [];
  }
  render();
}

function match(p) {
  const term = state.q.toLowerCase();
  const t = (p.title||"").toLowerCase()+" "+(p.description||"").toLowerCase()+" "+(p.brand||"").toLowerCase();
  if (term && !t.includes(term)) return false;
  if (state.cat && p.category!==state.cat) return false;
  if (state.cond && p.condition!==state.cond) return false;
  if (state.seg && p.segment!==state.seg) return false;
  return true;
}

function sortFn(a,b){
  switch(state.sort){
    case "price_asc": return (a.price||0) - (b.price||0);
    case "price_desc": return (b.price||0) - (a.price||0);
    case "date_desc": return new Date(b.updated_at||b.created_at||0) - new Date(a.updated_at||a.created_at||0);
    default: return 0;
  }
}

function render(){
  const grid = $("#grid");
  const items = catalogue.filter(match).sort(sortFn);
  grid.innerHTML = items.map(p=>`
    <article class="card item">
      <img src="${p.image||'assets/placeholder.webp'}" alt="${p.title}"/>
      <h3>${p.title}</h3>
      <div class="muted">${p.brand||""} • ${p.condition||""}${p.segment?(' • '+(p.segment==='camping'?'Camping':'Espaces verts')):''}</div>
      <div class="price">${p.price?currency(p.price):"Prix sur demande"}</div>
      <button class="btn" onclick='contact("${p.sku||""}")'>Je suis intéressé(e)</button>
    </article>
  `).join("") || '<p class="muted">Aucun produit ne correspond à votre recherche.</p>';
}

function contact(sku){
  const p = catalogue.find(x=> (x.sku||"")===sku);
  const subject = encodeURIComponent("Intérêt produit • "+(p?.title||sku));
  const body = encodeURIComponent(`Bonjour,\n\nJe suis intéressé(e) par : ${(p?.title||sku)}\nRéférence: ${sku}\nPrix affiché: ${p?.price?currency(p.price):"-" }\n\nMerci de me recontacter.`);
  location.href = `mailto:contact@greencycle.local?subject=${subject}&body=${body}`;
}

function bindSellForm(){
  const f = $("#sellForm");
  if (!f) return;
  f.addEventListener("submit", (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(f).entries());
    data.created_at = new Date().toISOString();
    leads.push(data);
    localStorage.setItem("gc_leads", JSON.stringify(leads));
    alert("Merci ! Votre proposition a été enregistrée (démo).");
    f.reset();
  });
}

function initYear(){
  $$("#year").forEach(n=> n.textContent = (new Date()).getFullYear());
}

initFilters();
bindSellForm();
loadCatalogue();
initYear();
