/* ============================================================
   filtros.js — Lógica de filtragem da página da Loja
   Responsabilidade única: cruzar produtos com os filtros ativos
   ============================================================ */

const Filtros = (() => {

  let todosProdutos = [];
  let filtrosAtivos = {
    categoria: null,
    marca: null,
    precoMax: null,
    tamanho: null,
    cor: null,
    ordenacao: "relevancia"
  };

  async function iniciar() {
    todosProdutos = await Kazolau.carregarJSON("produtos.json");

    // Categoria vem da URL, ex: loja.html?categoria=telefones
    const categoriaURL = Kazolau.getParam("categoria");
    if (categoriaURL) filtrosAtivos.categoria = categoriaURL;

    aplicar();
  }

  function definir(chave, valor) {
    filtrosAtivos[chave] = valor || null;
    aplicar();
  }

  function limpar() {
    filtrosAtivos = { categoria: filtrosAtivos.categoria, marca: null, precoMax: null, tamanho: null, cor: null, ordenacao: "relevancia" };
    aplicar();
  }

  function aplicar() {
    let resultado = [...todosProdutos];

    if (filtrosAtivos.categoria) {
      resultado = resultado.filter(p => p.categoria === filtrosAtivos.categoria);
    }
    if (filtrosAtivos.marca) {
      resultado = resultado.filter(p => (p.marca || "").toLowerCase() === filtrosAtivos.marca.toLowerCase());
    }
    if (filtrosAtivos.precoMax) {
      resultado = resultado.filter(p => Kazolau.precoMinimo(p) <= filtrosAtivos.precoMax);
    }
    if (filtrosAtivos.tamanho) {
      resultado = resultado.filter(p =>
        p.atributos?.tamanhos?.includes(filtrosAtivos.tamanho)
      );
    }
    if (filtrosAtivos.cor) {
      resultado = resultado.filter(p =>
        p.atributos?.cores?.includes(filtrosAtivos.cor)
      );
    }

    switch (filtrosAtivos.ordenacao) {
      case "preco-asc":
        resultado.sort((a, b) => Kazolau.precoMinimo(a) - Kazolau.precoMinimo(b));
        break;
      case "preco-desc":
        resultado.sort((a, b) => Kazolau.precoMinimo(b) - Kazolau.precoMinimo(a));
        break;
      case "novidades":
        resultado.sort((a, b) => (b.novo === true) - (a.novo === true));
        break;
    }

    const container = document.querySelector("#produtos-grid");
    if (container) {
      container.innerHTML = resultado.length
        ? resultado.map(Catalogo.cartaoProduto).join("")
        : `<p style="grid-column:1/-1;text-align:center;color:var(--text2);padding:30px 0;">Nenhum produto encontrado com estes filtros.</p>`;
    }

    return resultado;
  }

  return { iniciar, definir, limpar, aplicar };
})();
