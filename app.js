const state = {
  docs: [],
  q: "",
  cat: "all",
};

const el = (id) => document.getElementById(id);

function normalize(s) {
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildCategories(docs) {
  const set = new Set(docs.map(d => d.category).filter(Boolean));
  return ["all", ...Array.from(set).sort((a,b)=>a.localeCompare(b))];
}

function renderCategoryOptions(categories) {
  const select = el("cat");
  select.innerHTML = "";
  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c === "all" ? "all" : c;
    opt.textContent = c === "all" ? "Todas" : c;
    select.appendChild(opt);
  });
}

function filterDocs(docs) {
  const qn = normalize(state.q);
  const cat = state.cat;

  return docs.filter((d) => {
    const inCat = (cat === "all") ? true : d.category === cat;
    if (!qn) return inCat;

    const hay = normalize([d.title, d.desc, d.category, d.source].join(" "));
    return inCat && hay.includes(qn);
  });
}

function docCard(d) {
  const wrap = document.createElement("article");
  wrap.className = "doc";

  const top = document.createElement("div");
  top.className = "doc__top";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = d.category || "Documento";

  const src = document.createElement("span");
  src.className = "badge";
  src.textContent = d.source ? `Fonte: ${d.source}` : "PDF";

  top.appendChild(badge);
  top.appendChild(src);

  const title = document.createElement("h3");
  title.className = "doc__title";
  title.textContent = d.title || "Documento";

  const desc = document.createElement("p");
  desc.className = "doc__desc";
  desc.textContent = d.desc || "";

  const actions = document.createElement("div");
  actions.className = "doc__actions";

  const open = document.createElement("a");
  open.className = "btn btn--primary";
  open.href = d.url;
  open.target = "_blank";
  open.rel = "noopener";
  open.textContent = "Abrir";

  const download = document.createElement("a");
  download.className = "btn btn--ghost";
  download.href = d.url;
  download.target = "_blank";
  download.rel = "noopener";
  download.textContent = "Baixar";

  actions.appendChild(open);
  actions.appendChild(download);

  wrap.appendChild(top);
  wrap.appendChild(title);
  wrap.appendChild(desc);
  wrap.appendChild(actions);

  return wrap;
}

function render() {
  const list = el("docList");
  const count = el("count");

  const filtered = filterDocs(state.docs);
  count.textContent = String(filtered.length);

  list.innerHTML = "";
  filtered.forEach((d) => list.appendChild(docCard(d)));
}

async function loadDocs() {
  const res = await fetch("docs.json", { cache: "no-store" });
  const docs = await res.json();

  state.docs = docs;
  renderCategoryOptions(buildCategories(docs));
  render();
}

function setupUI() {
  const q = el("q");
  const cat = el("cat");
  const clearBtn = el("clearBtn");

  q.addEventListener("input", (e) => {
    state.q = e.target.value;
    render();
  });

  cat.addEventListener("change", (e) => {
    state.cat = e.target.value;
    render();
  });

  clearBtn.addEventListener("click", () => {
    state.q = "";
    state.cat = "all";
    q.value = "";
    cat.value = "all";
    render();
  });

  // Bottom nav: "Mais"
  const moreBtn = el("moreBtn");
  const moreSheet = el("moreSheet");
  const closeMore = el("closeMore");

  const openSheet = () => { if (moreSheet) moreSheet.hidden = false; };
  const closeSheet = () => { if (moreSheet) moreSheet.hidden = true; };

  if (moreBtn) moreBtn.addEventListener("click", openSheet);
  if (closeMore) closeMore.addEventListener("click", closeSheet);

  if (moreSheet) {
    moreSheet.addEventListener("click", (e) => {
      if (e.target === moreSheet) closeSheet();
    });
    moreSheet.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeSheet));
  }
}

setupUI();
loadDocs().catch((err) => {
  console.error(err);
  const list = el("docList");
  list.innerHTML = `
    <div class="doc">
      <div class="doc__top">
        <span class="badge">Erro</span>
        <span class="badge">docs.json</span>
      </div>
      <h3 class="doc__title">Erro ao carregar documentos</h3>
      <p class="doc__desc">Verifique se <code>docs.json</code> está publicado na raiz do repositório.</p>
    </div>
  `;
  el("count").textContent = "0";
});
