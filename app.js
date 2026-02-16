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
  open.textContent = "Abrir PDF";

  const download = document.createElement("a");
  download.className = "btn btn--ghost";
  download.href = d.url;
  download.target = "_blank";
  download.rel = "noopener";
  download.textContent = "Abrir em nova aba";

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
  list.innerHTML = "";

  const filtered = filterDocs(state.docs);
  el("count").textContent = String(filtered.length);

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "doc";
    empty.innerHTML = `
      <div class="doc__top">
        <span class="badge">Sem resultados</span>
        <span class="badge">0</span>
      </div>
      <h3 class="doc__title">Nenhum documento encontrado</h3>
      <p class="doc__desc">Tente outra busca ou selecione “Todas” as categorias.</p>
    `;
    list.appendChild(empty);
    return;
  }

  filtered.forEach((d) => list.appendChild(docCard(d)));
}

async function loadDocs() {
  const list = el("docList");
  list.innerHTML = '<div class="doc"><h3 class="doc__title">Carregando documentos…</h3></div>';
  
  const res = await fetch("./docs.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar docs.json");
  const docs = await res.json();

  state.docs = Array.isArray(docs) ? docs : [];
  renderCategoryOptions(buildCategories(state.docs));
  render();
}

function setupUI() {
  el("q").addEventListener("input", (e) => {
    state.q = e.target.value || "";
    render();
  });

  el("cat").addEventListener("change", (e) => {
    state.cat = e.target.value || "all";
    render();
  });

  el("clearBtn").addEventListener("click", () => {
    state.q = "";
    state.cat = "all";
    el("q").value = "";
    el("cat").value = "all";
    render();
  });

  // Mobile menu
  const menuBtn = el("menuBtn");
  const mobileNav = el("mobileNav");
  const overlay = el("overlay");

  menuBtn.addEventListener("click", () => {
    const isOpen = mobileNav.classList.contains("mobileNav--open");
    if (isOpen) {
      mobileNav.classList.remove("mobileNav--open");
      overlay.classList.remove("overlay--visible");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.textContent = "☰";
    } else {
      mobileNav.classList.add("mobileNav--open");
      overlay.classList.add("overlay--visible");
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.textContent = "✕";
    }
  });

  // Close menu when clicking overlay
  overlay.addEventListener("click", () => {
    mobileNav.classList.remove("mobileNav--open");
    overlay.classList.remove("overlay--visible");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "☰";
  });

  // Close menu when clicking nav links
  mobileNav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      mobileNav.classList.remove("mobileNav--open");
      overlay.classList.remove("overlay--visible");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.textContent = "☰";
    });
  });

  // Scroll spy with IntersectionObserver
  setupScrollSpy();

  // Back to top button
  setupBackToTop();
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

// Scroll Spy - Track active section
function setupScrollSpy() {
  const sections = document.querySelectorAll("#inicio, #curso, #documentos, #contato");
  const navLinks = document.querySelectorAll(".desktopNav a, .mobileNav a");

  const observerOptions = {
    root: null,
    rootMargin: "-80px 0px -60% 0px",
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        
        // Remove active class from all links
        navLinks.forEach((link) => {
          link.classList.remove("active");
        });

        // Add active class to links that match this section
        navLinks.forEach((link) => {
          if (link.getAttribute("href") === `#${id}`) {
            link.classList.add("active");
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach((section) => observer.observe(section));
}

// Back to top button
function setupBackToTop() {
  const backToTop = el("backToTop");
  
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTop.classList.add("backToTop--visible");
    } else {
      backToTop.classList.remove("backToTop--visible");
    }
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
