/* ============================================================
   pesquisa.js — Pesquisa em tempo real (produtos + serviços)
   Responsabilidade única: procurar por nome, categoria, marca,
   descrição e etiquetas, mostrando resultados instantaneamente
   ============================================================ */

const Pesquisa = (() => {

  let indice = [];
  let inicializado = false;

  async function construirIndice() {
    const [produtos, servicos] = await Promise.all([
      Kazolau.carregarJSON("produtos.json"),
      Kazolau.carregarJSON("servicos.json")
    ]);

    const itensProdutos = produtos.map(p => ({
      tipo: "produto",
      id: p.id,
      nome: p.nome,
      texto: [p.nome, p.categoria, p.marca, p.descricao, ...(p.etiquetas || [])].join(" ").toLowerCase(),
      preco: Kazolau.precoMinimo(p),
      link: `produto.html?id=${p.id}`
    }));

    const itensServicos = servicos.map(s => ({
      tipo: "servico",
      id: s.id,
      nome: s.nome,
      texto: [s.nome, s.categoria, s.descricao].join(" ").toLowerCase(),
      preco: s.preco,
      link: s.link
    }));

    indice = [...itensProdutos, ...itensServicos];
    inicializado = true;
  }

  async function procurar(termo) {
    if (!inicializado) await construirIndice();
    const alvo = termo.trim().toLowerCase();
    if (!alvo) return [];
    return indice.filter(item => item.texto.includes(alvo)).slice(0, 8);
  }

  /**
   * Liga um <input> de pesquisa a uma lista de resultados (dropdown).
   * @param {string} seletorInput - ex: "#campo-pesquisa"
   * @param {string} seletorResultados - ex: "#resultados-pesquisa"
   */
  function ligar(seletorInput, seletorResultados) {
    const input = document.querySelector(seletorInput);
    const lista = document.querySelector(seletorResultados);
    if (!input || !lista) return;

    let timeoutId;
    input.addEventListener("input", () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const resultados = await procurar(input.value);

        if (input.value.trim() === "") {
          lista.innerHTML = "";
          lista.style.display = "none";
          return;
        }

        lista.style.display = "block";
        lista.innerHTML = resultados.length
          ? resultados.map(item => `
              <a href="${item.link}" style="display:block;padding:10px 14px;border-bottom:1px solid var(--border);text-decoration:none;color:var(--text);">
                <strong>${item.nome}</strong>
                <span style="float:right;color:var(--text2);font-size:13px;">${Kazolau.formatarPreco(item.preco)}</span>
              </a>`).join("")
          : `<div style="padding:14px;color:var(--text2);">Sem resultados para "${input.value}"</div>`;
      }, 150); // pequeno debounce para não pesquisar a cada tecla instantaneamente
    });

    // Fecha o dropdown ao clicar fora
    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !lista.contains(e.target)) {
        lista.style.display = "none";
      }
    });
  }

  return { procurar, ligar, construirIndice };
})();
