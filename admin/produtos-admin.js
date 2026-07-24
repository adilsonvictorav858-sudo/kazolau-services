/* ============================================================
   KAZOLAU SERVICES — admin/produtos-admin.js
   Permite adicionar produtos à loja sem tocar no GitHub.
   Guardados na coleção "produtos_extra" do Firestore.
   ============================================================ */

document.addEventListener("kz-auth-changed", (ev) => {
  const user = ev.detail.user;
  const loginBox = document.getElementById("admin-login-box");
  const negadoBox = document.getElementById("admin-negado-box");
  const painel = document.getElementById("admin-painel");
  const userBox = document.getElementById("admin-user-box");
  const userName = document.getElementById("admin-user-name");
  const nav = document.getElementById("admin-nav");

  if (!user) {
    loginBox.style.display = "block";
    negadoBox.style.display = "none";
    painel.style.display = "none";
    userBox.style.display = "none";
    nav.style.display = "none";
    return;
  }

  userBox.style.display = "flex";
  nav.style.display = "flex";
  userName.textContent = user.displayName || user.email;

  if (!isAdmin(user)) {
    loginBox.style.display = "none";
    negadoBox.style.display = "block";
    painel.style.display = "none";
    return;
  }

  loginBox.style.display = "none";
  negadoBox.style.display = "none";
  painel.style.display = "block";
  carregarProdutosAdmin();
});

document.getElementById("form-produto")?.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const nome = document.getElementById("p-nome").value.trim();
  const imagem = document.getElementById("p-imagem").value.trim();
  if (!nome || !imagem) { toast("Preenche pelo menos o nome e a imagem"); return; }

  const precoVal = document.getElementById("p-preco").value;
  const dados = {
    nome,
    marca: document.getElementById("p-marca").value.trim(),
    categoria: document.getElementById("p-categoria").value,
    estado: document.getElementById("p-estado").value,
    preco: precoVal ? Number(precoVal) : null,
    stock: Number(document.getElementById("p-stock").value) || 0,
    imagem,
    descricao: document.getElementById("p-descricao").value.trim(),
    negociavel: true,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection("produtos_extra").add(dados);
    toast("Produto adicionado à loja!");
    document.getElementById("form-produto").reset();
    document.getElementById("p-stock").value = 1;
    carregarProdutosAdmin();
  } catch (err) {
    console.error(err);
    toast("Não foi possível adicionar. Confirma as regras do Firestore.");
  }
});

function carregarProdutosAdmin() {
  const lista = document.getElementById("produtos-lista");
  const contagem = document.getElementById("produtos-contagem");
  lista.innerHTML = `<p style="color:var(--text-muted)">A carregar...</p>`;
  db.collection("produtos_extra").orderBy("criadoEm", "desc").get()
    .then(snap => {
      contagem.textContent = `${snap.size} produto${snap.size === 1 ? "" : "s"}`;
      if (snap.empty) {
        lista.innerHTML = `<div class="empty-state"><div class="emoji">📦</div><p>Ainda não adicionaste nenhum produto por aqui.</p></div>`;
        return;
      }
      lista.innerHTML = snap.docs.map(doc => {
        const p = doc.data();
        return `
          <div class="produto-row">
            <img src="${p.imagem}" alt="" onerror="this.style.opacity=0">
            <div class="info">
              <strong>${p.nome}</strong> ${p.marca ? "· " + p.marca : ""}
              <div style="font-size:12.5px;color:var(--text-muted)">${p.categoria} · ${p.preco ? formatKz(p.preco) : "Preço a negociar"} · Stock: ${p.stock}</div>
            </div>
            <button class="btn btn-outline-navy btn-sm" onclick="marcarEsgotado('${doc.id}')">Marcar esgotado</button>
            <button class="btn btn-outline-navy btn-sm" style="color:#d1394a;border-color:#d1394a" onclick="removerProdutoExtra('${doc.id}')">Remover</button>
          </div>
        `;
      }).join("");
    })
    .catch(err => {
      console.error(err);
      lista.innerHTML = `<p style="color:#d1394a">Erro ao carregar. Confirma as regras do Firestore.</p>`;
    });
}

function marcarEsgotado(id) {
  db.collection("produtos_extra").doc(id).update({ stock: 0 })
    .then(() => { toast("Marcado como esgotado"); carregarProdutosAdmin(); })
    .catch(err => { console.error(err); toast("Não foi possível atualizar."); });
}

function removerProdutoExtra(id) {
  if (!confirm("Remover este produto da loja?")) return;
  db.collection("produtos_extra").doc(id).delete()
    .then(() => { toast("Produto removido"); carregarProdutosAdmin(); })
    .catch(err => { console.error(err); toast("Não foi possível remover."); });
}