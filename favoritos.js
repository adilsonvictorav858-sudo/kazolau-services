/* ============================================================
   favoritos.js — Lista de favoritos guardada no navegador
   ============================================================ */

const Favoritos = (() => {

  const CHAVE = "kazolau_favoritos";

  function ler() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE)) || [];
    } catch {
      return [];
    }
  }

  function guardar(lista) {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  }

  function alternar(produtoId) {
    const lista = ler();
    const posicao = lista.indexOf(produtoId);
    if (posicao === -1) {
      lista.push(produtoId);
    } else {
      lista.splice(posicao, 1);
    }
    guardar(lista);
    return lista.includes(produtoId);
  }

  function ehFavorito(produtoId) {
    return ler().includes(produtoId);
  }

  return { ler, alternar, ehFavorito };
})();
