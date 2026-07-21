// ===== PÁGINA INDIVIDUAL DE PRODUTO =====
// Lê o parâmetro ?id= da URL, vai buscar o produtos.json e preenche a página.
// Exemplo de uso: produto.html?id=iphone-13-pro

const WHATSAPP_NUMBER = '244957400234';
const PRODUTOS_JSON_PATH = 'loja/produtos.json'; // mesmo caminho já usado no index.html

let produtoAtual = null;
let categoriaAtual = null;
let todosProdutos = [];
let selecoes = {}; // { cor: 'Preto', tamanho: '40' }
let imagemAtiva = 0;

function precoParaNumero(precoStr) {
  if (!precoStr) return null;
  const num = String(precoStr).replace(/\./g, '').replace(/[^\d]/g, '');
  return num ? parseInt(num, 10) : null;
}

function formatarKz(valor) {
  return valor.toLocaleString('pt-PT').replace(/,/g, '.') + ' Kz';
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    renderNaoEncontrado('Nenhum produto foi indicado.');
    return;
  }

  let catalogo;
  try {
    const resp = await fetch(PRODUTOS_JSON_PATH);
    catalogo = await resp.json();
  } catch (e) {
    renderNaoEncontrado('Não foi possível carregar o catálogo de produtos.');
    return;
  }

  // Achata todos os produtos, guardando a categoria de origem
  todosProdutos = [];
  catalogo.categorias.forEach(cat => {
    cat.produtos.forEach(p => {
      todosProdutos.push({ ...p, _categoria: p.categoria || cat.id, _categoriaNome: cat.nome, _categoriaIcone: cat.icone });
    });
  });

  produtoAtual = todosProdutos.find(p => p.id === id);

  if (!produtoAtual) {
    renderNaoEncontrado(`Não encontrámos o produto "${id}".`);
    return;
  }

  categoriaAtual = produtoAtual._categoria;

  // Inicializa seleções com a primeira opção de cada atributo
  selecoes = {};
  (produtoAtual.atributos || []).forEach(attr => {
    selecoes[attr.nome] = attr.opcoes[0];
  });

  atualizarMetaTags();
  renderBreadcrumb();
  renderProduto();
  renderRelacionados();
}

function atualizarMetaTags() {
  const p = produtoAtual;
  document.title = `${p.nome} — Kazolau Services`;
  document.getElementById('page-title').textContent = `${p.nome} — Kazolau Services`;
  document.getElementById('meta-description').setAttribute('content', `${p.nome}${p.marca ? ' · ' + p.marca : ''} — disponível na Kazolau Services. Entrega em toda Luanda.`);
  document.getElementById('og-title').setAttribute('content', p.nome);
  document.getElementById('og-description').setAttribute('content', `${p.nome} disponível na loja Kazolau Services.`);
  document.getElementById('canonical-link').setAttribute('href', `https://kazolau.site/produto.html?id=${p.id}`);
  document.getElementById('og-url').setAttribute('content', `https://kazolau.site/produto.html?id=${p.id}`);
  if (p.imagens && p.imagens[0]) {
    document.getElementById('og-image').setAttribute('content', `https://kazolau.site/${p.imagens[0]}`);
  }
}

function renderBreadcrumb() {
  const bc = document.getElementById('breadcrumb');
  bc.innerHTML = `
    <a href="index.html">Início</a> <span class="sep">›</span>
    <a href="index.html#loja">Loja</a> <span class="sep">›</span>
    <a href="index.html#loja">${produtoAtual._categoriaIcone || ''} ${produtoAtual._categoriaNome}</a> <span class="sep">›</span>
    <span class="current">${produtoAtual.nome}</span>
  `;
}

function variantesCorrespondentes() {
  return produtoAtual.variantes.filter(v =>
    Object.keys(selecoes).every(attr => !v[attr] || v[attr] === selecoes[attr])
  );
}

function varianteAtual() {
  const candidatas = variantesCorrespondentes();
  return candidatas[0] || null;
}

function renderProduto() {
  const p = produtoAtual;
  const container = document.getElementById('produto-container');

  const imagens = p.imagens && p.imagens.length ? p.imagens : [];

  const galeriaHtml = imagens.length
    ? imagens.map((img, i) => `<img class="produto-galeria-slide${i === 0 ? ' active' : ''}" src="${img}" alt="${p.nome}" data-idx="${i}" onerror="this.style.display='none'">`).join('')
    : `<div class="produto-galeria-fallback">${p._categoriaIcone || '📦'}</div>`;

  const thumbsHtml = imagens.length > 1
    ? `<div class="produto-thumbs">${imagens.map((img, i) => `
        <div class="produto-thumb${i === 0 ? ' active' : ''}" data-idx="${i}" onclick="trocarImagem(${i})">
          <img src="${img}" alt="miniatura ${i + 1}" onerror="this.parentElement.style.display='none'">
        </div>`).join('')}</div>`
    : '';

  const atributosHtml = (p.atributos || []).map(attr => {
    const opcoesHtml = attr.opcoes.map(op => {
      const selecionado = selecoes[attr.nome] === op ? ' selected' : '';
      return `<div class="variante-opcao${selecionado}" data-attr="${attr.nome}" data-valor="${op}" onclick="selecionarVariante('${attr.nome}', '${op.replace(/'/g, "\\'")}')">${op}</div>`;
    }).join('');
    return `<div class="variante-grupo"><label>${attr.rotulo}</label><div class="variante-opcoes">${opcoesHtml}</div></div>`;
  }).join('');

  const v = varianteAtual();
  const precoTexto = v ? v.preco : '—';

  container.innerHTML = `
    <div class="produto-wrap">
      <div>
        <div class="produto-galeria" id="produto-galeria">${galeriaHtml}</div>
        ${thumbsHtml}
      </div>
      <div>
        <span class="produto-info-badge">${p._categoriaIcone || ''} ${p._categoriaNome}</span>
        <h1 class="produto-titulo">${p.nome}</h1>
        ${p.marca ? `<p class="produto-marca">Marca: <strong>${p.marca}</strong></p>` : ''}
        ${p.garantia ? `<span class="produto-garantia">🛡️ Garantia de ${p.garantia}</span>` : ''}
        <div class="produto-preco" id="produto-preco"><small>Preço</small>${precoTexto}</div>

        ${atributosHtml}

        <div class="produto-acoes">
          <a class="btn-comprar-produto" id="btn-comprar-whatsapp" href="#" target="_blank">💬 Comprar via WhatsApp</a>
          <button class="btn-negociar-produto" onclick="negociarPreco()">🤝 Negociar</button>
        </div>

        <p class="produto-nota">📌 Confirmamos disponibilidade e prazo de entrega diretamente no WhatsApp antes de fechar o pedido.</p>
      </div>
    </div>
  `;

  atualizarPrecoEBotao();
}

function trocarImagem(idx) {
  imagemAtiva = idx;
  document.querySelectorAll('.produto-galeria-slide').forEach((el, i) => el.classList.toggle('active', i === idx));
  document.querySelectorAll('.produto-thumb').forEach((el, i) => el.classList.toggle('active', i === idx));
}

function selecionarVariante(attrNome, valor) {
  selecoes[attrNome] = valor;
  document.querySelectorAll(`.variante-opcao[data-attr="${attrNome}"]`).forEach(el => {
    el.classList.toggle('selected', el.dataset.valor === valor);
  });
  atualizarPrecoEBotao();
}

function atualizarPrecoEBotao() {
  const p = produtoAtual;
  const v = varianteAtual();
  const precoEl = document.getElementById('produto-preco');
  precoEl.innerHTML = `<small>Preço</small>${v ? v.preco : 'Indisponível nesta combinação'}`;

  let msg = `Olá Kazolau Services! Tenho interesse em:\n\n*${p.nome}*`;
  if (p.marca) msg += `\nMarca: ${p.marca}`;
  Object.keys(selecoes).forEach(attr => {
    const rotulo = (p.atributos.find(a => a.nome === attr) || {}).rotulo || attr;
    msg += `\n${rotulo}: ${selecoes[attr]}`;
  });
  if (v) msg += `\nPreço: ${v.preco}`;
  if (p.garantia) msg += `\nGarantia: ${p.garantia}`;
  msg += '\n\nGostaria de saber se ainda está disponível.';

  document.getElementById('btn-comprar-whatsapp').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function negociarPreco() {
  const p = produtoAtual;
  const v = varianteAtual();
  const msg = `Olá Kazolau Services! 🤝\n\nGostaria de negociar o preço de: *${p.nome}*${v ? ` (preço de tabela: ${v.preco})` : ''}.`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

function renderRelacionados() {
  const relacionados = todosProdutos
    .filter(p => p._categoria === categoriaAtual && p.id !== produtoAtual.id)
    .slice(0, 4);

  if (!relacionados.length) return;

  document.getElementById('relacionados-section').style.display = 'block';
  document.getElementById('rel-grid').innerHTML = relacionados.map(p => {
    const img = p.imagens && p.imagens[0];
    const preco = p.variantes && p.variantes[0] ? p.variantes[0].preco : '';
    return `
      <a class="rel-card" href="produto.html?id=${p.id}">
        <div class="rel-img">${img ? `<img src="${img}" alt="${p.nome}" onerror="this.parentElement.textContent='${p._categoriaIcone || '📦'}'">` : (p._categoriaIcone || '📦')}</div>
        <div class="rel-body">
          <h4>${p.nome}</h4>
          <p>Desde ${preco}</p>
        </div>
      </a>`;
  }).join('');
}

function renderNaoEncontrado(motivo) {
  document.getElementById('produto-container').innerHTML = `
    <div class="estado-vazio">
      <p style="font-size:40px;margin-bottom:12px;">🔍</p>
      <p style="font-weight:700;margin-bottom:6px;">Produto não encontrado</p>
      <p style="margin-bottom:16px;">${motivo}</p>
      <a href="index.html#loja">← Voltar à loja</a>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', init);
