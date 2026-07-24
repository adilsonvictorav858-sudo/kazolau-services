/* ============================================================
   KAZOLAU SERVICES — auth.js
   Login com Google (Firebase Auth). Atualiza o botão de conta no
   cabeçalho em todas as páginas e mantém o utilizador disponível
   globalmente em KZ_USER.

   Em computador usamos uma janela popup (mais rápido). Em telemóvel
   usamos redireccionamento de página inteira, porque os popups de
   login costumam bloquear ou ficar pendurados em navegadores móveis.
   ============================================================ */

let KZ_USER = null;
let kzLoginEmAndamento = false;

/* ---------- PAINEL DE DIAGNÓSTICO TEMPORÁRIO ----------
   Mostra informação técnica fixa no topo do ecrã, para conseguirmos ver
   o que se passa no login em telemóveis sem precisar de ferramentas de
   programador. Depois de resolvido o problema, isto é removido. */
function kzDebug(texto) {
  let el = document.getElementById("kz-debug-panel");
  if (!el) {
    el = document.createElement("div");
    el.id = "kz-debug-panel";
    el.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;background:#000;color:#0f0;font-family:monospace;font-size:11px;line-height:1.5;padding:10px;max-height:45vh;overflow-y:auto;white-space:pre-wrap;border-bottom:3px solid red";
    document.body.prepend(el);
  }
  const hora = new Date().toLocaleTimeString("pt-PT");
  el.textContent += `[${hora}] ${texto}\n`;
}
kzDebug("Página carregada: " + location.pathname);
kzDebug("User agent: " + navigator.userAgent);

function isMobileDevice() {
  const resultado = /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(navigator.userAgent);
  return resultado;
}
kzDebug("isMobileDevice(): " + isMobileDevice());

function loginGoogle() {
  if (kzLoginEmAndamento) return;
  kzLoginEmAndamento = true;
  const provider = new firebase.auth.GoogleAuthProvider();

  if (isMobileDevice()) {
    auth.signInWithRedirect(provider).catch(err => {
      console.error(err);
      toast("Não foi possível abrir o login. Tenta novamente.");
      kzLoginEmAndamento = false;
    });
    return;
  }

  auth.signInWithPopup(provider)
    .catch(err => {
      console.error(err);
      if (err.code === "auth/popup-blocked") {
        toast("O navegador bloqueou a janela de login. Permite popups para este site e tenta novamente.");
      } else if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        toast("Não foi possível entrar. Tenta novamente.");
      }
    })
    .finally(() => { kzLoginEmAndamento = false; });
}

function logoutGoogle() {
  auth.signOut();
}

function isAdmin(user) {
  return !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/* Garante que há sessão iniciada antes de continuar uma ação (comprar,
   negociar, solicitar serviço, finalizar carrinho).
   - Se já tiver sessão, executa logo (callback).
   - Em computador sem sessão: abre popup e, se tiver sucesso, executa o callback.
   - Em telemóvel sem sessão: guarda o que a pessoa estava a fazer
     (pendingAction) e redireciona para o login da Google. Quando a
     página voltar a carregar já com sessão iniciada, essa ação
     pendente é retomada automaticamente (ver app.js). */
function exigirLogin(callback, pendingAction) {
  if (KZ_USER) { callback(); return; }

  if (isMobileDevice()) {
    if (pendingAction) sessionStorage.setItem("kz_pending_action", JSON.stringify(pendingAction));
    kzDebug("A chamar signInWithRedirect()...");
    toast("A abrir o login da Google...");
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithRedirect(provider).catch(err => {
      kzDebug("ERRO em signInWithRedirect: " + (err.code || err.message));
      console.error(err);
      toast("Não foi possível abrir o login. Tenta novamente.");
      sessionStorage.removeItem("kz_pending_action");
    });
    return;
  }

  toast("Inicia sessão para continuares");
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => { if (result && result.user) { KZ_USER = result.user; callback(); } })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/popup-blocked") {
        toast("O navegador bloqueou a janela de login. Permite popups para este site.");
      } else if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        toast("Não foi possível entrar. Tenta novamente.");
      }
    });
}

function initAccountButton() {
  // A deteção de sessão iniciada funciona sempre, mesmo em páginas
  // (como o painel admin) que não têm o botão 👤 do cabeçalho normal.
  auth.onAuthStateChanged(user => {
    KZ_USER = user;
    kzDebug("onAuthStateChanged: " + (user ? "logado como " + user.email : "sem sessão"));
    document.dispatchEvent(new CustomEvent("kz-auth-changed", { detail: { user } }));

    const btn = document.getElementById("account-btn");
    if (!btn) return;
    if (user) {
      btn.classList.remove("account-btn-highlight");
      btn.title = `Os meus pedidos — ${user.displayName || user.email}`;
      btn.innerHTML = user.photoURL
        ? `<img src="${user.photoURL}" alt="" style="width:26px;height:26px;border-radius:50%;object-fit:cover">`
        : "🙂";
    } else {
      btn.classList.add("account-btn-highlight");
      btn.title = "Entrar com Google";
      btn.innerHTML = `👤 <span>Entrar</span>`;
    }
  });

  const btn = document.getElementById("account-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (KZ_USER) {
      window.location.href = "pedidos.html";
    } else {
      loginGoogle();
    }
  });
}

document.addEventListener("DOMContentLoaded", initAccountButton);

/* Processa o regresso do login por redireccionamento (telemóvel) e mostra
   qualquer erro diretamente no ecrã, já que no telemóvel não é fácil abrir
   a consola do navegador para ver o que correu mal. */
kzDebug("A chamar getRedirectResult()...");
auth.getRedirectResult().then(result => {
  kzDebug("getRedirectResult OK — utilizador: " + (result && result.user ? result.user.email : "NENHUM (result vazio)"));
  if (result && result.user) {
    console.log("Login por redireccionamento concluído:", result.user.email);
    toast("Sessão iniciada: " + result.user.email);
  }
}).catch(err => {
  kzDebug("getRedirectResult ERRO: " + (err.code || err.message || JSON.stringify(err)));
  console.error("Erro no login por redireccionamento:", err);
  toast("Erro no login: " + (err.code || err.message || "desconhecido"));
});
