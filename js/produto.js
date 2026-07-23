/* ============================================================
   KAZOLAU SERVICES — produto.js
   produto.html?id=... carrega tudo automaticamente do produtos.json
   Preço varia conforme a combinação de atributos escolhida (cor,
   armazenamento, tamanho, etc.) — tal como definido em "combinacoes".
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

  const atributos = produto.atributos || [];
  const selecao = {};
  atributos.forEach(a => { selecao[a.nome] = a.opcoes[0]; });

  function comboAtual() {
    return (produto.combinacoes || []).find(c =>
      atributos.every(a => c[a.nome] === selecao[a.nome])
    );
  }

  function render() {
    const combo = comboAtual();
    const { min, max } = faixaPreco(produto);
    const precoTxt = combo
      ? formatKz(combo.preco)
      : (min === max ? formatKz(min) : `A partir de ${formatKz(min)}`);

    container.innerHTML = `
      <div class="breadcrumbs"><a href="index.html">Início</a> / <a href="loja.html?categoria=${produto.categoria}">${produto.categoria}</a> / ${produto.nome}</div>
      <div class="product-view">
        <div>
          <div class="gallery-main"><img id="gm-img" src="${produto.imagens?.[0] || ''}" alt="${produto.nome}"></div>
          ${produto.imagens?.length > 1 ? `<div class="gallery-thumbs">${produto.imagens.map((img, i) => `<img src="${img}" class="${i === 0 ? 'active' : ''}" onclick="document.getElementById('gm-img').src='${img}'; document.querySelectorAll('.gallery-thumbs img').forEach(t=>t.classList.remove('active')); this.classList.add('active')">`).join("")}</div>` : ""}
        </div>
        <div class="product-info">
          <h1>${produto.nome}</h1>
          <div class="brand">${produto.marca || ""} ${produto.estado ? "· " + (produto.estado === "usado" ? "Usado - bom estado" : "Novo") : ""} ${produto.garantia ? "· Garantia " + produto.garantia : ""}</div>
          <div class="price-block">
            <span class="price">${precoTxt}</span>
          </div>

          ${atributos.map(a => `
            <div class="option-group">
              <h4>${a.rotulo}</h4>
              <div class="option-pills">
                ${a.opcoes.map(op => `<button class="option-pill ${selecao[a.nome] === op ? 'active' : ''}" data-tipo="${a.nome}" data-valor="${op}">${op}</button>`).join("")}
              </div>
            </div>
          `).join("")}

          ${!combo ? `<div class="note-box" style="background:#fff0f0;border:1px solid #f3b8bd;border-radius:10px;padding:12px 14px;font-size:13.5px;margin-bottom:14px">⚠️ Esta combinação não está disponível no momento. Escolha outra opção ou fale connosco no WhatsApp.</div>` : ""}

          <div class="card-actions" style="margin-top:6px">
            <button class="btn btn-orange" id="btn-comprar" ${!combo ? "disabled" : ""}>Comprar</button>
            <button class="btn btn-outline-navy" id="btn-negociar" ${!combo ? "disabled" : ""}>🤝 Negociar</button>
            <button class="btn btn-outline-navy btn-icon-only" id="btn-add-carrinho" title="Adicionar ao carrinho" ${!combo ? "disabled" : ""}>🛒</button>
            <button class="btn btn-outline-navy btn-icon-only card-fav" data-id="${produto.id}" title="Favoritos">♥</button>
          </div>

          <p class="product-desc">${produto.descricao || ""}</p>
        </div>
      </div>
    `;

    document.querySelectorAll(".option-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        selecao[pill.dataset.tipo] = pill.dataset.valor;
        render();
      });
    });

    const comboFinal = comboAtual();
    if (comboFinal) {
      const produtoComPrecoObj = { id: produto.id, nome: produto.nome, imagens: produto.imagens, preco_final: comboFinal.preco };
      document.getElementById("btn-comprar").addEventListener("click", () => comprarAgora(produtoComPrecoObj, selecao));
      document.getElementById("btn-negociar").addEventListener("click", () => abrirNegociar(produtoComPrecoObj));
      document.getElementById("btn-add-carrinho").addEventListener("click", () => Carrinho.adicionar(produtoComPrecoObj, selecao));
    }
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
