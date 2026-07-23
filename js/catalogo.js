/* ============================================================
   KAZOLAU SERVICES — catalogo.js
   Lê produtos.json / servicos.json e gera o HTML automaticamente.
   Nunca escrever produtos/serviços manualmente numa página.
   ============================================================ */

const CATEGORIAS = [
  { id: "digitais", nome: "Serviços Digitais", desc: "CV, Traduções, PDFs e muito mais", icone: "🗂️", cor: "var(--blue)", link: "servicos.html#digitais" },
  { id: "vistos", nome: "Vistos e Agendamentos", desc: "Vistos, Agendamentos e Consultoria", icone: "🌍", cor: "var(--green)", link: "vistos.html" },
  { id: "websites", nome: "Desenvolvimento Web", desc: "Websites, Sistemas e Aplicações", icone: "💻", cor: "var(--purple)", link: "servicos.html#websites" },
  { id: "design", nome: "Design Gráfico", desc: "Flyers, Logótipos, Cartões e mais", icone: "🎨", cor: "var(--gold)", link: "servicos.html#design" },
  { id: "loja", nome: "Loja Online", desc: "Telefones, Roupas, Ténis e Acessórios", icone: "🛍️", cor: "var(--orange)", link: "loja.html" },
  { id: "entregas", nome: "Entregas", desc: "Entregas Nacionais e Internacionais", icone: "🚚", cor: "#2fa7d6", link: "servicos.html#entregas" },
];

function renderCategorias(containerId = "categorias-grid") {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = CATEGORIAS.map(c => `
    <a class="cat-card" href="${c.link}">
      <div class="cat-icon" style="background:${c.cor}22;color:${c.cor}">${c.icone}</div>
      <h3>${c.nome}</h3>
      <p>${c.desc}</p>
      <div class="cat-arrow" style="background:${c.cor}">→</div>
    </a>
  `).join("");
}

/* ---------- Preço a partir das combinações ---------- */
function faixaPreco(p) {
  const precos = (p.combinacoes || []).map(c => c.preco).filter(n => typeof n === "number");
  if (!precos.length) return { min: null, max: null };
  return { min: Math.min(...precos), max: Math.max(...precos) };
}

function comboMaisBarato(p) {
  if (!p.combinacoes || !p.combinacoes.length) return null;
  return p.combinacoes.reduce((a, b) => (a.preco <= b.preco ? a : b));
}

/* Objeto "produto-like" com o preço já resolvido, para reutilizar comprarAgora/abrirNegociar/Carrinho.adicionar */
function produtoComPreco(p, combo) {
  const { preco, ...variante } = combo || {};
  return {
    produto: { id: p.id, nome: p.nome, imagens: p.imagens, preco_final: preco ?? faixaPreco(p).min },
    variante
  };
}

/* ---------- Cartão de produto ---------- */
function cardProduto(p) {
  const { min, max } = faixaPreco(p);
  const precoTxt = min === null ? "Preço a negociar 🤝" : (min === max ? formatKz(min) : `A partir de ${formatKz(min)}`);
  const img = (p.imagens && p.imagens[0]) || "";
  const combo = comboMaisBarato(p);
  const { produto: pProduto, variante } = produtoComPreco(p, combo);
  const stockTxt = p.stock === 0 ? '<span class="stock-tag out">Esgotado</span>' : (p.stock && p.stock <= 2 ? `<span class="stock-tag low">Últimas ${p.stock} unid.</span>` : '<span class="stock-tag ok">Em stock</span>');
  return `
    <div class="card" data-produto-id="${p.id}">
      <div class="card-media">
        ${p.estado === "novo" ? `<span class="card-badge">Novo</span>` : ""}
        <button class="card-fav" data-id="${p.id}" title="Favoritos">♥</button>
        <a href="produto.html?id=${p.id}"><img src="${img}" alt="${p.nome}" loading="lazy" onerror="this.closest('.card-media').style.background='var(--bg-alt)'"></a>
      </div>
      <div class="card-body">
        <a href="produto.html?id=${p.id}"><h3>${p.nome}</h3></a>
        <div class="card-sub">${p.marca || ""}${p.marca ? " · " : ""}${p.descricao ? p.descricao.slice(0, 40) + (p.descricao.length > 40 ? "…" : "") : ""}</div>
        <div class="card-price-row"><span class="card-price">${precoTxt}</span></div>
        ${stockTxt}
        <div class="card-actions">
          <a class="btn btn-orange" href="produto.html?id=${p.id}">Ver Detalhes</a>
          <button class="btn btn-outline-navy btn-icon-only" title="Negociar" onclick='abrirNegociar(${JSON.stringify(pProduto).replace(/'/g, "&#39;")})'>🤝</button>
          <button class="btn btn-outline-navy btn-icon-only" title="Adicionar ao carrinho" onclick='Carrinho.adicionar(${JSON.stringify(pProduto).replace(/'/g, "&#39;")}, ${JSON.stringify(variante).replace(/'/g, "&#39;")})'>🛒</button>
        </div>
      </div>
    </div>
  `;
}

/* ---------- Cartão de serviço ---------- */
function cardServico(s) {
  return `
    <div class="card" data-servico-id="${s.id}">
      <div class="card-media" style="display:flex;align-items:center;justify-content:center;font-size:52px;background:linear-gradient(145deg,#fff7e8,#f5f7fb)">
        ${s.novo ? `<span class="card-badge badge-gold">Novo</span>` : (s.destaque ? `<span class="card-badge">Popular</span>` : "")}
        ${s.icone || "🧾"}
      </div>
      <div class="card-body">
        <h3>${s.nome}</h3>
        <div class="card-sub">${s.descricao || ""}</div>
        <div class="card-price-row"><span class="card-price">${s.preco_texto || (s.preco ? formatKz(s.preco) : "Sob consulta")}</span></div>
        <div class="card-actions">
          <button class="btn btn-navy btn-block" onclick='solicitarServico(${JSON.stringify(s).replace(/'/g, "&#39;")})'>Solicitar</button>
        </div>
      </div>
    </div>
  `;
}

/* ---------- Homepage: destaques ---------- */
async function renderDestaquesHome() {
  const elServ = document.getElementById("servicos-destaque");
  const elProd = document.getElementById("produtos-destaque");
  if (elServ) {
    const servicos = await carregarJSON("servicos.json");
    const destaque = servicos.filter(s => s.destaque).slice(0, 3);
    elServ.innerHTML = destaque.map(cardServico).join("");
  }
  if (elProd) {
    const produtos = await carregarJSON("produtos.json");
    const destaque = produtos.slice(0, 3);
    elProd.innerHTML = destaque.map(cardProduto).join("");
  }
  Favoritos.marcarAtivos();
}

/* ---------- Loja: grelha completa com filtros ---------- */
let TODOS_PRODUTOS = [];

async function initLoja() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;
  TODOS_PRODUTOS = await carregarJSON("produtos.json");

  const params = new URLSearchParams(window.location.search);
  const categoriaUrl = params.get("categoria");
  const buscaUrl = params.get("busca");

  montarFiltros(TODOS_PRODUTOS);

  if (categoriaUrl) {
    const chk = document.querySelector(`.filtro-categoria[value="${categoriaUrl}"]`);
    if (chk) chk.checked = true;
  }
  if (buscaUrl) {
    const busca = document.getElementById("busca-loja");
    if (busca) busca.value = buscaUrl;
  }

  aplicarFiltros();

  document.getElementById("filters-panel")?.addEventListener("change", aplicarFiltros);
  document.getElementById("ordenar")?.addEventListener("change", aplicarFiltros);
  document.getElementById("busca-loja")?.addEventListener("input", aplicarFiltros);
  document.getElementById("limpar-filtros")?.addEventListener("click", () => {
    document.querySelectorAll(".filters-panel input[type=checkbox]").forEach(c => c.checked = false);
    document.getElementById("busca-loja").value = "";
    aplicarFiltros();
  });
}

function montarFiltros(produtos) {
  const categorias = [...new Set(produtos.map(p => p.categoria))];
  const marcas = [...new Set(produtos.map(p => p.marca).filter(Boolean))];
  const catEl = document.getElementById("filtro-categorias");
  const marcaEl = document.getElementById("filtro-marcas");
  const nomesCat = { telefones: "Telefones", roupas: "Roupas", tenis: "Ténis", sandalias: "Sandálias", acessorios: "Acessórios" };
  if (catEl) {
    catEl.innerHTML = categorias.map(c => `
      <label><input type="checkbox" class="filtro-categoria" value="${c}"> ${nomesCat[c] || c}</label>
    `).join("");
  }
  if (marcaEl) {
    marcaEl.innerHTML = marcas.map(m => `
      <label><input type="checkbox" class="filtro-marca" value="${m}"> ${m}</label>
    `).join("");
  }
}

function aplicarFiltros() {
  let lista = [...TODOS_PRODUTOS];

  const catsSelecionadas = [...document.querySelectorAll(".filtro-categoria:checked")].map(c => c.value);
  if (catsSelecionadas.length) lista = lista.filter(p => catsSelecionadas.includes(p.categoria));

  const marcasSelecionadas = [...document.querySelectorAll(".filtro-marca:checked")].map(c => c.value);
  if (marcasSelecionadas.length) lista = lista.filter(p => marcasSelecionadas.includes(p.marca));

  const busca = document.getElementById("busca-loja")?.value?.trim().toLowerCase();
  if (busca) {
    lista = lista.filter(p => [p.nome, p.marca, p.categoria, p.descricao, ...(p.etiquetas || [])]
      .join(" ").toLowerCase().includes(busca));
  }

  const ordenar = document.getElementById("ordenar")?.value;
  if (ordenar === "preco-asc") lista.sort((a, b) => (faixaPreco(a).min || 0) - (faixaPreco(b).min || 0));
  if (ordenar === "preco-desc") lista.sort((a, b) => (faixaPreco(b).min || 0) - (faixaPreco(a).min || 0));
  if (ordenar === "nome") lista.sort((a, b) => a.nome.localeCompare(b.nome));

  const grid = document.getElementById("products-grid");
  const contagem = document.getElementById("results-count");
  if (contagem) contagem.textContent = `${lista.length} produto${lista.length === 1 ? "" : "s"}`;
  grid.innerHTML = lista.length
    ? lista.map(cardProduto).join("")
    : `<div class="empty-state" style="grid-column:1/-1"><div class="emoji">🔍</div><p>Nenhum produto encontrado com estes filtros.</p></div>`;
  Favoritos.marcarAtivos();
}

/* ---------- Página de Serviços: agrupado por categoria ---------- */
const NOMES_CATEGORIA_SERVICO = {
  digitais: "Serviços Digitais",
  websites: "Criação de Websites",
  design: "Design & Flyers",
  consultoria: "Consultoria e Imigração",
  entregas: "Entregas",
  agendamentos: "Agendamentos",
  vistos: "Vistos",
};

async function renderPaginaServicos(filtroCategorias = null) {
  const container = document.getElementById("servicos-page");
  if (!container) return;
  const servicos = await carregarJSON("servicos.json");
  const categorias = [...new Set(servicos.map(s => s.categoria))].filter(c => !filtroCategorias || filtroCategorias.includes(c));

  container.innerHTML = categorias.map(cat => `
    <div class="section-head" id="${cat}" style="scroll-margin-top:90px">
      <h2>${NOMES_CATEGORIA_SERVICO[cat] || cat}</h2>
    </div>
    <div class="card-row" style="margin-bottom:44px">
      ${servicos.filter(s => s.categoria === cat).map(cardServico).join("")}
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderCategorias();
  renderDestaquesHome();
  initLoja();
  renderPaginaServicos();
});
