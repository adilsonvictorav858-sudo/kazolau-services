/* ============================================================
   KAZOLAU SERVICES — pedidos.js
   Cria pedidos no Firestore (quando o cliente tem sessão iniciada)
   e mostra "Os meus pedidos" em pedidos.html.
   Não substitui o WhatsApp — funciona ao lado dele. Se o cliente
   não tiver sessão iniciada, tudo continua a funcionar como antes
   (só por WhatsApp, sem ficar guardado).
   ============================================================ */

const ESTADOS_PEDIDO = {
  pendente: { label: "Pendente", cor: "var(--orange)" },
  confirmado: { label: "Confirmado", cor: "var(--blue)" },
  a_caminho: { label: "A caminho", cor: "var(--purple)" },
  entregue: { label: "Entregue", cor: "var(--green)" },
  cancelado: { label: "Cancelado", cor: "#d1394a" },
};

/* Cria um pedido associado ao utilizador com sessão iniciada.
   Se ninguém tiver sessão iniciada, não faz nada (silenciosamente) —
   o fluxo por WhatsApp continua a funcionar na mesma. */
async function criarPedido({ tipo, itens, total, resumo, telefone }) {
  if (!KZ_USER) return null;
  try {
    const doc = await db.collection("pedidos").add({
      uid: KZ_USER.uid,
      clienteNome: KZ_USER.displayName || "",
      clienteEmail: KZ_USER.email || "",
      telefone: telefone || "",
      tipo,               // "loja" ou "servico"
      itens: itens || [],
      total: total || 0,
      resumo: resumo || "",
      estado: "pendente",
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return doc.id;
  } catch (err) {
    console.error("Erro ao guardar pedido:", err);
    return null;
  }
}

function formatarData(timestamp) {
  if (!timestamp) return "";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function pedidosOcultos() {
  try { return JSON.parse(localStorage.getItem("kazolau_pedidos_ocultos")) || []; }
  catch { return []; }
}

function ocultarPedido(id) {
  const lista = pedidosOcultos();
  if (!lista.includes(id)) lista.push(id);
  localStorage.setItem("kazolau_pedidos_ocultos", JSON.stringify(lista));
  const el = document.getElementById(`pedido-${id}`);
  if (el) el.remove();
}

/* ---------- Página "Os meus pedidos" ---------- */
function initPaginaPedidos() {
  const container = document.getElementById("pedidos-container");
  if (!container) return;

  const semSessao = document.getElementById("sem-sessao");
  const comSessao = document.getElementById("com-sessao");

  document.addEventListener("kz-auth-changed", (ev) => {
    const user = ev.detail.user;
    if (!user) {
      semSessao.style.display = "block";
      comSessao.style.display = "none";
      return;
    }
    semSessao.style.display = "none";
    comSessao.style.display = "block";
    carregarPedidosDoCliente(user.uid, container);
  });
}

function carregarPedidosDoCliente(uid, container) {
  container.innerHTML = `<p style="color:var(--text-muted)">A carregar os teus pedidos...</p>`;
  db.collection("pedidos").where("uid", "==", uid).get()
    .then(snap => {
      if (snap.empty) {
        container.innerHTML = `<div class="empty-state"><div class="emoji">📦</div><p>Ainda não tens pedidos.<br>Explora a loja ou solicita um serviço.</p><a href="loja.html" class="btn btn-navy" style="margin-top:14px">Ir à loja</a></div>`;
        return;
      }
      const ocultos = pedidosOcultos();
      const pedidos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(p => !ocultos.includes(p.id));
      if (!pedidos.length) {
        container.innerHTML = `<div class="empty-state"><div class="emoji">📦</div><p>Ainda não tens pedidos.<br>Explora a loja ou solicita um serviço.</p><a href="loja.html" class="btn btn-navy" style="margin-top:14px">Ir à loja</a></div>`;
        return;
      }
      pedidos.sort((a, b) => {
        const ta = a.criadoEm?.toMillis ? a.criadoEm.toMillis() : 0;
        const tb = b.criadoEm?.toMillis ? b.criadoEm.toMillis() : 0;
        return tb - ta;
      });
      container.innerHTML = pedidos.map(p => cardPedido(p.id, p)).join("");
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `<p style="color:#d1394a">Não foi possível carregar os pedidos. Tenta recarregar a página.</p>`;
    });
}

function cardPedido(id, p) {
  const estado = ESTADOS_PEDIDO[p.estado] || ESTADOS_PEDIDO.pendente;
  const msg = `Olá! Gostaria de falar sobre o meu pedido #${id.slice(0, 6).toUpperCase()} (${p.tipo === "loja" ? "Loja" : "Serviço"}).\n\n${p.resumo || ""}\n\nEstado atual: ${estado.label}`;
  const podeRemover = p.estado === "entregue" || p.estado === "cancelado";
  return `
    <div class="card" id="pedido-${id}" style="flex-direction:row;align-items:center;gap:16px;padding:18px;margin-bottom:14px">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <strong>Pedido #${id.slice(0, 6).toUpperCase()}</strong>
          <span class="card-badge" style="background:${estado.cor};position:static">${estado.label}</span>
        </div>
        <div style="font-size:13.5px;color:var(--text-muted);margin-bottom:6px">${formatarData(p.criadoEm)} · ${p.tipo === "loja" ? "Compra na loja" : "Pedido de serviço"}</div>
        <div style="font-size:14px;white-space:pre-line">${p.resumo || ""}</div>
        ${p.total ? `<div style="font-weight:700;margin-top:8px">${formatKz(p.total)}</div>` : ""}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:stretch">
        <a class="btn btn-outline-navy btn-sm" href="${linkWhatsApp(msg)}" target="_blank">💬 Falar sobre este pedido</a>
        ${podeRemover ? `<button class="btn btn-outline-navy btn-sm" style="color:#d1394a;border-color:#d1394a" onclick="ocultarPedido('${id}')">Remover da lista</button>` : ""}
      </div>
    </div>
  `;
}
