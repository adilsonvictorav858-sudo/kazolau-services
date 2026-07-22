/* ============================================================
   carrinho.js — Carrinho de compras guardado no navegador
   Responsabilidade única: adicionar, remover, alterar quantidade
   ============================================================ */

const Carrinho = (() => {

  const CHAVE = "kazolau_carrinho";

  function ler() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE)) || [];
    } catch {
      return [];
    }
  }

  function guardar(itens) {
    localStorage.setItem(CHAVE, JSON.stringify(itens));
    atualizarContador();
  }

  function adicionar(produtoId, nome, preco, imagem, variante = {}, quantidade = 1) {
    const itens = ler();
    const existente = itens.find(i => i.produtoId === produtoId && JSON.stringify(i.variante) === JSON.stringify(variante));

    if (existente) {
      existente.quantidade += quantidade;
    } else {
      itens.push({ produtoId, nome, preco, imagem, variante, quantidade });
    }

    guardar(itens);
  }

  function remover(produtoId, variante = {}) {
    const itens = ler().filter(i => !(i.produtoId === produtoId && JSON.stringify(i.variante) === JSON.stringify(variante)));
    guardar(itens);
  }

  function alterarQuantidade(produtoId, variante, quantidade) {
    const itens = ler();
    const item = itens.find(i => i.produtoId === produtoId && JSON.stringify(i.variante) === JSON.stringify(variante));
    if (item) {
      item.quantidade = Math.max(1, quantidade);
      guardar(itens);
    }
  }

  function limpar() {
    guardar([]);
  }

  function total() {
    return ler().reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  }

  function quantidadeTotal() {
    return ler().reduce((soma, item) => soma + item.quantidade, 0);
  }

  function atualizarContador() {
    const badge = document.querySelector(".notif-badge, #carrinho-contador");
    if (badge) badge.textContent = quantidadeTotal();
  }

  return { ler, adicionar, remover, alterarQuantidade, limpar, total, quantidadeTotal, atualizarContador };
})();

document.addEventListener("DOMContentLoaded", Carrinho.atualizarContador);
