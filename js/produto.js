/* ============================================================
   KAZOLAU SERVICES — produto.js
   produto.html?id=... carrega tudo automaticamente do produtos.json
   ============================================================ */

async function initProduto() {
  const container = document.getElementById("produto-container");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const produtos = await carregarJSON("produtos.json");
  const produto = produtos.find(p => p.id === id);

  if (!produto) {
    container.innerHTML = `<div class="empty-state"><div class="emoji">😕</div><p>Produto não encontrado.</p><a href="loja.html" class="btn btn-navy" style="margin-top:14px">Voltar à loja</a></div>`;
    return;
  }

  document.title = `${produto.nome} — Kazolau Services`;

  const variante = {};
  if (produto.variantes?.cor?.length) variante.cor = produto.variantes.cor[0].nome;
  if (produto.variantes?.capacidade?.length) variante.capacidade = produto.variantes.capacidade[0].nome;
  if (produto.variantes?.tamanho?.length) variante.tamanho = produto.variantes.tamanho[0].nome;

  function precoAtual() {
    if (produto.variantes?.capacidade) {
      const cap = produto.variantes.capacidade.find(c => c.nome === variante.capacidade);
      if (cap?.preco) return cap.preco;
    }
    return produto.preco_final ?? produto.preco_inicial;
  }

  function imagemAtual() {
    if (produto.variantes?.cor) {
      const cor = produto.variantes.cor.find(c => c.nome === variante.cor);
      if (cor?.imagem) return cor.imagem;
    }
    return produto.imagens?.[0] || "";
  }

  function render() {
    const preco = precoAtual();
    container.innerHTML = `
      <div class="breadcrumbs"><a href="index.html">Início</a> / <a href="loja.html?categoria=${produto.categoria}">${produto.categoria}</a> / ${produto.nome}</div>
      <div class="product-view">
        <div>
          <div class="gallery-main"><img id="gm-img" src="${imagemAtual()}" alt="${produto.nome}"></div>
          ${produto.imagens?.length > 1 ? `<div class="gallery-thumbs">${produto.imagens.map((img, i) => `<img src="${img}" class="${img === imagemAtual() ? 'active' : ''}" onclick="document.getElementById('gm-img').src='${img}'; document.querySelectorAll('.gallery-thumbs img').forEach(t=>t.classList.remove('active')); this.classList.add('active')">`).join("")}</div>` : ""}
        </div>
        <div class="product-info">
          <h1>${produto.nome}</h1>
          <div class="brand">${produto.marca || ""} ${produto.atributos?.estado ? "· " + produto.atributos.estado : ""} ${produto.atributos?.garantia ? "· Garantia " + produto.atributos.garantia : ""}</div>
          <div class="price-block">
            <span class="price">${preco ? formatKz(preco) : "Preço a negociar 🤝"}</span>
            ${produto.preco_inicial && produto.preco_final && produto.preco_inicial > produto.preco_final ? `<span class="card-price-old">${formatKz(produto.preco_inicial)}</span>` : ""}
          </div>
          ${produto.stock !== undefined ? `<div>${produto.stock === 0 ? '<span class="stock-tag out">Esgotado</span>' : produto.stock <= 2 ? `<span class="stock-tag low">Últimas ${produto.stock} unidades</span>` : '<span class="stock-tag ok">Em stock</span>'}</div>` : ""}

          ${produto.variantes?.cor ? `<div class="option-group"><h4>Cor</h4><div class="option-pills">${produto.variantes.cor.map(c => `<button class="option-pill ${c.nome === variante.cor ? 'active' : ''}" data-tipo="cor" data-valor="${c.nome}">${c.nome}</button>`).join("")}</div></div>` : ""}
          ${produto.variantes?.capacidade ? `<div class="option-group"><h4>Capacidade</h4><div class="option-pills">${produto.variantes.capacidade.map(c => `<button class="option-pill ${c.nome === variante.capacidade ? 'active' : ''}" data-tipo="capacidade" data-valor="${c.nome}">${c.nome}</button>`).join("")}</div></div>` : ""}
          ${produto.variantes?.tamanho ? `<div class="option-group"><h4>Tamanho</h4><div class="option-pills">${produto.variantes.tamanho.map(t => `<button class="option-pill ${t.nome === variante.tamanho ? 'active' : ''}" data-tipo="tamanho" data-valor="${t.nome}">${t.nome}</button>`).join("")}</div></div>` : ""}

          <div class="card-actions" style="margin-top:6px">
            <button class="btn btn-orange" id="btn-comprar">Comprar</button>
            <button class="btn btn-outline-navy" id="btn-negociar">🤝 Negociar</button>
            <button class="btn btn-outline-navy btn-icon-only" id="btn-add-carrinho" title="Adicionar ao carrinho">🛒</button>
            <button class="btn btn-outline-navy btn-icon-only card-fav" data-id="${produto.id}" title="Favoritos">♥</button>
          </div>

          <p class="product-desc">${produto.descricao || ""}</p>
        </div>
      </div>
    `;

    document.querySelectorAll(".option-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        variante[pill.dataset.tipo] = pill.dataset.valor;
        render();
      });
    });

    document.getElementById("btn-comprar").addEventListener("click", () => comprarAgora(produto, variante));
    document.getElementById("btn-negociar").addEventListener("click", () => abrirNegociar(produto));
    document.getElementById("btn-add-carrinho").addEventListener("click", () => Carrinho.adicionar(produto, variante));
    Favoritos.marcarAtivos();
  }

  render();

  // Relacionados
  const relEl = document.getElementById("relacionados-grid");
  if (relEl) {
    const relacionados = produtos.filter(p => p.categoria === produto.categoria && p.id !== produto.id).slice(0, 4);
    relEl.innerHTML = relacionados.map(cardProduto).join("") || `<p style="color:var(--text-muted)">Sem produtos relacionados de momento.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", initProduto);
