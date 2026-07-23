/* ============================================================
   KAZOLAU SERVICES — pesquisa.js
   Pesquisa em tempo real por nome, categoria, marca, descrição e etiquetas.
   ============================================================ */

async function initPesquisaHero() {
  const input = document.getElementById("hero-search");
  const panel = document.getElementById("search-results");
  const btn = document.getElementById("hero-search-btn");
  if (!input || !panel) return;

  const [produtos, servicos] = await Promise.all([
    carregarJSON("produtos.json"),
    carregarJSON("servicos.json"),
  ]);

  function buscar(termo) {
    termo = termo.trim().toLowerCase();
    if (!termo) { panel.classList.remove("open"); panel.innerHTML = ""; return; }

    const prod = produtos.filter(p => [p.nome, p.marca, p.categoria, p.descricao, ...(p.etiquetas || [])]
      .join(" ").toLowerCase().includes(termo)).slice(0, 4)
      .map(p => `
        <a class="search-result-item" href="produto.html?id=${p.id}">
          <img src="${(p.imagens && p.imagens[0]) || ''}" alt="" onerror="this.style.opacity=0">
          <div class="info"><strong>${p.nome}</strong><span>Loja · ${p.preco_final ? formatKz(p.preco_final) : "Sob consulta"}</span></div>
        </a>`);

    const serv = servicos.filter(s => [s.nome, s.categoria, s.descricao].join(" ").toLowerCase().includes(termo)).slice(0, 4)
      .map(s => `
        <a class="search-result-item" href="${s.link || '#'}">
          <div class="emoji">${s.icone || "🧾"}</div>
          <div class="info"><strong>${s.nome}</strong><span>Serviço · ${s.preco_texto || "Sob consulta"}</span></div>
        </a>`);

    const resultados = [...prod, ...serv];
    panel.innerHTML = resultados.length
      ? resultados.join("")
      : `<div class="search-empty">Sem resultados para "${termo}". Fale connosco no WhatsApp para ajudarmos.</div>`;
    panel.classList.add("open");
  }

  input.addEventListener("input", () => buscar(input.value));
  btn?.addEventListener("click", () => {
    if (input.value.trim()) window.location.href = `loja.html?busca=${encodeURIComponent(input.value.trim())}`;
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) window.location.href = `loja.html?busca=${encodeURIComponent(input.value.trim())}`;
  });
  document.querySelectorAll(".tag-pill").forEach(tag => {
    tag.addEventListener("click", () => { input.value = tag.textContent.trim(); buscar(input.value); input.focus(); });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#search-results") && !e.target.closest("#hero-search") && !e.target.closest("#hero-search-btn")) {
      panel.classList.remove("open");
    }
  });
}

document.addEventListener("DOMContentLoaded", initPesquisaHero);
