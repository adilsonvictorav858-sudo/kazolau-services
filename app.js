/* ============================================================
   app.js — Utilitários partilhados por todo o site Kazolau
   Responsabilidade única: funções genéricas reutilizáveis
   ============================================================ */

const Kazolau = (() => {

  /** Formata um número em Kwanzas: 45000 -> "45.000 Kz" */
  function formatarPreco(valor) {
    if (valor === null || valor === undefined) return "Sob consulta";
    return new Intl.NumberFormat("pt-PT").format(valor) + " Kz";
  }

  /** Lê um parâmetro da URL, ex: getParam('categoria') */
  function getParam(nome) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nome);
  }

  /** Carrega um ficheiro JSON e devolve os dados (com cache simples em memória) */
  const cache = {};
  async function carregarJSON(caminho) {
    if (cache[caminho]) return cache[caminho];
    const resposta = await fetch(caminho);
    if (!resposta.ok) throw new Error(`Falha ao carregar ${caminho}: ${resposta.status}`);
    const dados = await resposta.json();
    cache[caminho] = dados;
    return dados;
  }

  /** Constrói o caminho da imagem principal de um produto (primeira imagem da primeira variante de cor) */
  function imagemPrincipal(produto) {
    const chaves = Object.keys(produto.imagens || {});
    if (chaves.length === 0) return "";
    const lista = produto.imagens[chaves[0]];
    return Array.isArray(lista) ? lista[0] : lista;
  }

  /** Devolve o preço mais baixo entre as variantes de um produto */
  function precoMinimo(produto) {
    if (!produto.variantes || produto.variantes.length === 0) return produto.precoInicial;
    return Math.min(...produto.variantes.map(v => v.preco));
  }

  /** Escapa texto para evitar problemas ao inserir no HTML */
  function escapeHTML(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
  }

  return { formatarPreco, getParam, carregarJSON, imagemPrincipal, precoMinimo, escapeHTML };
})();
