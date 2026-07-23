/* ============================================================
   KAZOLAU SERVICES — app.js
   Configuração geral, carrinho, favoritos, WhatsApp, modais.
   Guardado no navegador (localStorage) — sem necessidade de backend.
   ============================================================ */

const KAZOLAU = {
  WHATSAPP: "244957400234",
  CART_KEY: "kazolau_carrinho",
  FAV_KEY: "kazolau_favoritos",
};

/* ---------- Utilidades ---------- */
function formatKz(valor) {
  if (valor === null || valor === undefined) return "Sob consulta";
  return Number(valor).toLocaleString("pt-PT") + " Kz";
}

async function carregarJSON(caminho) {
  try {
    const resp = await fetch(caminho);
    if (!resp.ok) throw new Error("Falha ao carregar " + caminho);
    return await resp.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function toast(msg) {
  let el = document.getElementById("kz-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "kz-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
}

function linkWhatsApp(mensagem) {
  return `https://wa.me/${KAZOLAU.WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
}

function abrirWhatsApp(mensagem) {
  window.open(linkWhatsApp(mensagem), "_blank");
}

/* ================= CARRINHO ================= */
const Carrinho = {
  obter() {
    try { return JSON.parse(localStorage.getItem(KAZOLAU.CART_KEY)) || []; }
    catch { return []; }
  },
  guardar(itens) {
    localStorage.setItem(KAZOLAU.CART_KEY, JSON.stringify(itens));
    Carrinho.atualizarBadge();
  },
  adicionar(produto, variante = {}, qtd = 1) {
    const itens = Carrinho.obter();
    const chave = produto.id + JSON.stringify(variante);
    const existente = itens.find(i => i.chave === chave);
    if (existente) {
      existente.qtd += qtd;
    } else {
      itens.push({
        chave,
        id: produto.id,
        nome: produto.nome,
        preco: produto.preco_final ?? produto.preco ?? null,
        imagem: (produto.imagens && produto.imagens[0]) || produto.icone || "",
        variante,
        qtd
      });
    }
    Carrinho.guardar(itens);
    toast(`"${produto.nome}" adicionado ao carrinho`);
    Carrinho.abrirDrawer();
  },
  remover(chave) {
    Carrinho.guardar(Carrinho.obter().filter(i => i.chave !== chave));
    Carrinho.render();
  },
  alterarQtd(chave, delta) {
    const itens = Carrinho.obter();
    const item = itens.find(i => i.chave === chave);
    if (!item) return;
    item.qtd += delta;
    if (item.qtd <= 0) {
      Carrinho.remover(chave);
      return;
    }
    Carrinho.guardar(itens);
    Carrinho.render();
  },
  total() {
    return Carrinho.obter().reduce((s, i) => s + (i.preco || 0) * i.qtd, 0);
  },
  contagem() {
    return Carrinho.obter().reduce((s, i) => s + i.qtd, 0);
  },
  atualizarBadge() {
    document.querySelectorAll(".cart-count").forEach(b => {
      const n = Carrinho.contagem();
      b.textContent = n;
      b.style.display = n > 0 ? "flex" : "none";
    });
  },
  abrirDrawer() {
    document.getElementById("cart-drawer")?.classList.add("open");
    document.getElementById("cart-overlay")?.classList.add("open");
    Carrinho.render();
  },
  fecharDrawer() {
    document.getElementById("cart-drawer")?.classList.remove("open");
    document.getElementById("cart-overlay")?.classList.remove("open");
  },
  render() {
    const body = document.getElementById("cart-body");
    const foot = document.getElementById("cart-foot");
    if (!body) return;
    const itens = Carrinho.obter();
    if (itens.length === 0) {
      body.innerHTML = `<div class="empty-state"><div class="emoji">🛒</div><p>O seu carrinho está vazio.<br>Explore a loja e adicione produtos.</p></div>`;
      if (foot) foot.innerHTML = "";
      return;
    }
    body.innerHTML = itens.map(i => `
      <div class="cart-item">
        <img src="${i.imagem}" alt="${i.nome}" onerror="this.style.opacity=0">
        <div class="ci-info">
          <strong>${i.nome}</strong>
          <div class="ci-meta">${Object.values(i.variante || {}).filter(Boolean).join(" · ") || "&nbsp;"}</div>
          <div class="ci-price">${i.preco ? formatKz(i.preco * i.qtd) : "Sob consulta"}</div>
          <div class="qty-control">
            <button class="qty-minus" data-chave="${escapeAttr(i.chave)}">−</button>
            <span>${i.qtd}</span>
            <button class="qty-plus" data-chave="${escapeAttr(i.chave)}">+</button>
          </div>
        </div>
        <div>
          <button class="ci-remove" data-chave="${escapeAttr(i.chave)}">Remover</button>
        </div>
      </div>
    `).join("");
    const total = Carrinho.total();
    if (foot) {
      foot.innerHTML = `
        <div class="cart-totals-row"><span>Subtotal</span><span>${formatKz(total)}</span></div>
        <div class="cart-totals-row"><span>Entrega</span><span>A combinar</span></div>
        <div class="cart-totals-row total"><span>Total</span><span>${formatKz(total)}</span></div>
        <button class="btn btn-navy btn-block" style="margin-top:14px" onclick="Carrinho.finalizar()">Finalizar por WhatsApp</button>
      `;
    }
  },
  finalizar() {
    const itens = Carrinho.obter();
    if (itens.length === 0) { toast("O carrinho está vazio"); return; }
    let msg = "Olá! Gostaria de finalizar esta encomenda na Kazolau Services:\n\n";
    let resumo = "";
    itens.forEach(i => {
      const varTxt = Object.values(i.variante || {}).filter(Boolean).join(", ");
      const linha = `• ${i.nome}${varTxt ? " (" + varTxt + ")" : ""} — Qtd: ${i.qtd}${i.preco ? " — " + formatKz(i.preco * i.qtd) : ""}`;
      msg += linha + "\n";
      resumo += linha + "\n";
    });
    msg += `\nTotal estimado: ${formatKz(Carrinho.total())}\n\nAguardo confirmação, obrigado!`;
    if (typeof criarPedido === "function") {
      criarPedido({ tipo: "loja", itens, total: Carrinho.total(), resumo: resumo.trim() });
    }
    abrirWhatsApp(msg);
  }
};

/* ================= FAVORITOS ================= */
const Favoritos = {
  obter() {
    try { return JSON.parse(localStorage.getItem(KAZOLAU.FAV_KEY)) || []; }
    catch { return []; }
  },
  guardar(lista) {
    localStorage.setItem(KAZOLAU.FAV_KEY, JSON.stringify(lista));
  },
  alternar(produtoId) {
    let lista = Favoritos.obter();
    const btns = document.querySelectorAll(`.card-fav[data-id="${produtoId}"]`);
    if (lista.includes(produtoId)) {
      lista = lista.filter(id => id !== produtoId);
      btns.forEach(b => b.classList.remove("active"));
      toast("Removido dos favoritos");
    } else {
      lista.push(produtoId);
      btns.forEach(b => b.classList.add("active"));
      toast("Adicionado aos favoritos ❤");
    }
    Favoritos.guardar(lista);
  },
  marcarAtivos() {
    const lista = Favoritos.obter();
    document.querySelectorAll(".card-fav").forEach(b => {
      if (lista.includes(b.dataset.id)) b.classList.add("active");
    });
  }
};

/* ================= NEGOCIAR (modal) ================= */
let produtoEmNegociacao = null;

function abrirNegociar(produto) {
  produtoEmNegociacao = produto;
  document.getElementById("neg-produto-nome").textContent = produto.nome;
  document.getElementById("neg-produto-preco").textContent = "Preço de tabela: " + (produto.preco_final ?? produto.preco ? formatKz(produto.preco_final ?? produto.preco) : "sob consulta");
  document.getElementById("neg-oferta").value = "";
  document.getElementById("neg-nome").value = "";
  document.getElementById("neg-whatsapp").value = "";
  document.getElementById("modal-negociar").classList.add("open");
}

function fecharNegociar() {
  document.getElementById("modal-negociar").classList.remove("open");
}

function enviarNegociacao(ev) {
  ev.preventDefault();
  if (!produtoEmNegociacao) return;
  const nome = document.getElementById("neg-nome").value.trim();
  const whatsapp = document.getElementById("neg-whatsapp").value.trim();
  const oferta = document.getElementById("neg-oferta").value.trim();
  if (!nome || !whatsapp || !oferta) { toast("Preencha todos os campos"); return; }
  const precoTabela = produtoEmNegociacao.preco_final ?? produtoEmNegociacao.preco;
  const msg = `Olá! Gostaria de negociar o preço de "${produtoEmNegociacao.nome}".\n` +
    `Preço de tabela: ${precoTabela ? formatKz(precoTabela) : "sob consulta"}\n` +
    `Minha oferta: ${formatKz(oferta)}\n\n` +
    `Nome: ${nome}\nWhatsApp: ${whatsapp}`;
  abrirWhatsApp(msg);
  fecharNegociar();
}

/* ================= COMPRAR DIRETO ================= */
function comprarAgora(produto, variante = {}) {
  const varTxt = Object.values(variante).filter(Boolean).join(", ");
  const preco = produto.preco_final ?? produto.preco;
  const msg = `Olá! Quero comprar:\n\n• ${produto.nome}${varTxt ? " (" + varTxt + ")" : ""}\n${preco ? "Preço: " + formatKz(preco) : "Preço: sob consulta"}\n\nPor favor confirmem disponibilidade e forma de entrega. Obrigado!`;
  abrirWhatsApp(msg);
}

function solicitarServico(servico) {
  const msg = `Olá! Gostaria de solicitar o serviço "${servico.nome}".\n${servico.preco ? "Valor de referência: " + formatKz(servico.preco) : ""}\n\nPor favor enviem mais informações.`;
  abrirWhatsApp(msg);
}

/* ================= HEADER / MENU ================= */
function initHeader() {
  Carrinho.atualizarBadge();
  Favoritos.marcarAtivos();

  document.getElementById("nav-toggle")?.addEventListener("click", () => {
    document.getElementById("main-nav")?.classList.toggle("open");
  });
  document.getElementById("cart-toggle")?.addEventListener("click", Carrinho.abrirDrawer);
  document.getElementById("cart-close")?.addEventListener("click", Carrinho.fecharDrawer);
  document.getElementById("cart-overlay")?.addEventListener("click", Carrinho.fecharDrawer);

  document.getElementById("neg-form")?.addEventListener("submit", enviarNegociacao);
  document.querySelectorAll("[data-close-modal]").forEach(el => {
    el.addEventListener("click", () => el.closest(".modal")?.classList.remove("open"));
  });

  // delegação de eventos para favoritos e itens do carrinho criados dinamicamente
  document.addEventListener("click", (ev) => {
    const favBtn = ev.target.closest(".card-fav");
    if (favBtn) { Favoritos.alternar(favBtn.dataset.id); return; }

    const minusBtn = ev.target.closest(".qty-minus");
    if (minusBtn) { Carrinho.alterarQtd(minusBtn.dataset.chave, -1); return; }

    const plusBtn = ev.target.closest(".qty-plus");
    if (plusBtn) { Carrinho.alterarQtd(plusBtn.dataset.chave, 1); return; }

    const removeBtn = ev.target.closest(".ci-remove");
    if (removeBtn) { Carrinho.remover(removeBtn.dataset.chave); return; }
  });
}

document.addEventListener("DOMContentLoaded", initHeader);
