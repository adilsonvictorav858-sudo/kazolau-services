/* ============================================================
   KAZOLAU SERVICES — admin/admin.js
   Painel restrito à conta definida em ADMIN_EMAIL (js/firebase-config.js)
   ============================================================ */

let FILTRO_ESTADO = "todos";
let TODOS_PEDIDOS_ADMIN = [];

document.addEventListener("kz-auth-changed", (ev) => {
  const user = ev.detail.user;
  const loginBox = document.getElementById("admin-login-box");
  const negadoBox = document.getElementById("admin-negado-box");
  const painel = document.getElementById("admin-painel");
  const userBox = document.getElementById("admin-user-box");
  const userName = document.getElementById("admin-user-name");

  if (!user) {
    loginBox.style.display = "block";
    negadoBox.style.display = "none";
    painel.style.display = "none";
    userBox.style.display = "none";
    return;
  }

  userBox.style.display = "flex";
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
  carregarTodosPedidos();
});

function carregarTodosPedidos() {
  const lista = document.getElementById("admin-pedidos-lista");
  lista.innerHTML = `<p style="color:var(--text-muted)">A carregar pedidos...</p>`;
  db.collection("pedidos").orderBy("criadoEm", "desc").get()
    .then(snap => {
      TODOS_PEDIDOS_ADMIN = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      montarFiltrosAdmin();
      renderPedidosAdmin();
    })
    .catch(err => {
      console.error(err);
      lista.innerHTML = `<p style="color:#d1394a">Erro ao carregar pedidos. Confirma as regras de segurança do Firestore (ver LEIA-ME-LOGIN.md).</p>`;
    });
}

function montarFiltrosAdmin() {
  const el = document.getElementById("admin-filtros");
  const contagens = { todos: TODOS_PEDIDOS_ADMIN.length };
  Object.keys(ESTADOS_PEDIDO).forEach(k => {
    contagens[k] = TODOS_PEDIDOS_ADMIN.filter(p => p.estado === k).length;
  });
  const pill = (chave, label) => `<button class="stat-pill" data-filtro="${chave}" style="border:2px solid ${FILTRO_ESTADO === chave ? 'var(--gold)' : 'transparent'}">${label} (${contagens[chave] ?? 0})</button>`;
  el.innerHTML = pill("todos", "Todos") + Object.entries(ESTADOS_PEDIDO).map(([k, v]) => pill(k, v.label)).join("");
  el.querySelectorAll("[data-filtro]").forEach(b => b.addEventListener("click", () => {
    FILTRO_ESTADO = b.dataset.filtro;
    montarFiltrosAdmin();
    renderPedidosAdmin();
  }));
}

function renderPedidosAdmin() {
  const lista = document.getElementById("admin-pedidos-lista");
  const contagem = document.getElementById("admin-contagem");
  const filtrados = FILTRO_ESTADO === "todos" ? TODOS_PEDIDOS_ADMIN : TODOS_PEDIDOS_ADMIN.filter(p => p.estado === FILTRO_ESTADO);
  contagem.textContent = `${filtrados.length} pedido${filtrados.length === 1 ? "" : "s"}`;

  if (!filtrados.length) {
    lista.innerHTML = `<div class="empty-state"><div class="emoji">📭</div><p>Sem pedidos nesta categoria.</p></div>`;
    return;
  }

  lista.innerHTML = filtrados.map(p => `
    <div class="pedido-row">
      <div class="info">
        <strong>#${p.id.slice(0, 6).toUpperCase()}</strong> — ${p.clienteNome || p.clienteEmail || "Cliente"}
        <div style="font-size:12.5px;color:var(--text-muted);margin:4px 0">${formatarData(p.criadoEm)} · ${p.tipo === "loja" ? "Compra na loja" : "Pedido de serviço"} · ${p.clienteEmail || ""}</div>
        <div style="font-size:13.5px;white-space:pre-line">${p.resumo || ""}</div>
        ${p.total ? `<div style="font-weight:700;margin-top:6px">${formatKz(p.total)}</div>` : ""}
      </div>
      <select onchange="atualizarEstadoPedido('${p.id}', this.value)">
        ${Object.entries(ESTADOS_PEDIDO).map(([k, v]) => `<option value="${k}" ${p.estado === k ? "selected" : ""}>${v.label}</option>`).join("")}
      </select>
    </div>
  `).join("");
}

function atualizarEstadoPedido(id, novoEstado) {
  db.collection("pedidos").doc(id).update({
    estado: novoEstado,
    atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
  }).then(() => {
    toast("Estado do pedido atualizado");
    const p = TODOS_PEDIDOS_ADMIN.find(x => x.id === id);
    if (p) p.estado = novoEstado;
    montarFiltrosAdmin();
    renderPedidosAdmin();
  }).catch(err => {
    console.error(err);
    toast("Não foi possível atualizar. Confirma as regras do Firestore.");
  });
}
