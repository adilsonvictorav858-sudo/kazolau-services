/* ============================================================
   catalogo.js — Gera automaticamente os cartões de produtos
   e serviços a partir de produtos.json / servicos.json.
   Nunca escrever produtos/serviços diretamente no HTML.
   ============================================================ */

const Catalogo = (() => {

  /** Cria o HTML de UM cartão de produto (usa as classes CSS já existentes no site) */
  function cartaoProduto(produto) {
    const img = Kazolau.imagemPrincipal(produto);
    const preco = Kazolau.precoMinimo(produto);
    const badge = produto.novo ? `<span class="badge-new">Novo</span>` : "";
    const estadoBadge = produto.estado ? `<span class="product-img-badge">${Kazolau.escapeHTML(produto.estado)}</span>` : "";

    return `
      <div class="product-card" data-id="${produto.id}" data-categoria="${produto.categoria}">
        ${badge}
        <div class="product-img">
          ${estadoBadge}
          <img src="${img}" alt="${Kazolau.escapeHTML(produto.nome)}" loading="lazy">
        </div>
        <div class="product-body">
          <h3>${Kazolau.escapeHTML(produto.nome)}</h3>
          <p>${Kazolau.escapeHTML(produto.descricao || produto.marca || "")}</p>
          <div class="product-price">${Kazolau.formatarPreco(preco)}</div>
          <div class="product-actions">
            <a class="btn-comprar" href="produto.html?id=${produto.id}">Ver Detalhes</a>
            <button class="btn-negociar" onclick="Catalogo.abrirNegociacao('${produto.id}', '${Kazolau.escapeHTML(produto.nome)}', ${preco})">Negociar</button>
          </div>
        </div>
      </div>`;
  }

  /** Cria o HTML de UM cartão de serviço */
  function cartaoServico(servico) {
    const badge = servico.novo ? `<span class="badge-new">Novo</span>` : "";
    return `
      <a class="card" href="${servico.link}">
        ${badge}
        <h3>${servico.icone ? servico.icone + " " : ""}${Kazolau.escapeHTML(servico.nome)}</h3>
        <p>${Kazolau.escapeHTML(servico.descricao)}</p>
        <div class="card-price">${servico.precoTexto || Kazolau.formatarPreco(servico.preco)}</div>
      </a>`;
  }

  /**
   * Renderiza produtos dentro de um elemento.
   * @param {string} seletor - ex: "#produtos-grid"
   * @param {object} opcoes - { categoria, destaque, limite }
   */
  async function renderizarProdutos(seletor, opcoes = {}) {
    const container = document.querySelector(seletor);
    if (!container) return;

    try {
      let produtos = await Kazolau.carregarJSON("produtos.json");

      if (opcoes.categoria) {
        produtos = produtos.filter(p => p.categoria === opcoes.categoria);
      }
      if (opcoes.destaque) {
        produtos = produtos.filter(p => p.destaque);
      }
      if (opcoes.limite) {
        produtos = produtos.slice(0, opcoes.limite);
      }

      if (produtos.length === 0) {
        container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text2);padding:30px 0;">Nenhum produto encontrado nesta categoria.</p>`;
        return;
      }

      container.innerHTML = produtos.map(cartaoProduto).join("");
    } catch (erro) {
      console.error("Erro ao carregar produtos:", erro);
      container.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text2);">Não foi possível carregar os produtos. Tente novamente.</p>`;
    }
  }

  /**
   * Renderiza serviços dentro de um elemento.
   * @param {string} seletor
   * @param {object} opcoes - { categoria, destaque, limite }
   */
  async function renderizarServicos(seletor, opcoes = {}) {
    const container = document.querySelector(seletor);
    if (!container) return;

    try {
      let servicos = await Kazolau.carregarJSON("servicos.json");

      if (opcoes.categoria) {
        servicos = servicos.filter(s => s.categoria === opcoes.categoria);
      }
      if (opcoes.destaque) {
        servicos = servicos.filter(s => s.destaque);
      }
      if (opcoes.limite) {
        servicos = servicos.slice(0, opcoes.limite);
      }

      container.innerHTML = servicos.map(cartaoServico).join("");
    } catch (erro) {
      console.error("Erro ao carregar serviços:", erro);
      container.innerHTML = `<p style="text-align:center;color:var(--text2);">Não foi possível carregar os serviços.</p>`;
    }
  }

  /** Abre o modal de negociação já existente no site, preenchendo os dados do produto */
  function abrirNegociacao(id, nome, preco) {
    const overlay = document.getElementById("offerOverlay");
    if (!overlay) {
      console.warn("Modal #offerOverlay não encontrado nesta página.");
      return;
    }
    const nomeEl = overlay.querySelector(".offer-product");
    const precoEl = overlay.querySelector(".offer-original span");
    const idInput = overlay.querySelector("[name='produtoId']");

    if (nomeEl) nomeEl.textContent = nome;
    if (precoEl) precoEl.textContent = Kazolau.formatarPreco(preco);
    if (idInput) idInput.value = id;

    overlay.classList.add("active");
  }

  return { renderizarProdutos, renderizarServicos, abrirNegociacao, cartaoProduto, cartaoServico };
})();
