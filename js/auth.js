/* ============================================================
   KAZOLAU SERVICES — auth.js
   Login com Google (Firebase Auth). Atualiza o botão de conta no
   cabeçalho em todas as páginas e mantém o utilizador disponível
   globalmente em KZ_USER.
   ============================================================ */

let KZ_USER = null;

function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => {
    console.error(err);
    toast("Não foi possível entrar. Tenta novamente.");
  });
}

function logoutGoogle() {
  auth.signOut();
}

function isAdmin(user) {
  return !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function initAccountButton() {
  // A deteção de sessão iniciada funciona sempre, mesmo em páginas
  // (como o painel admin) que não têm o botão 👤 do cabeçalho normal.
  auth.onAuthStateChanged(user => {
    KZ_USER = user;
    document.dispatchEvent(new CustomEvent("kz-auth-changed", { detail: { user } }));

    const btn = document.getElementById("account-btn");
    if (!btn) return;
    if (user) {
      btn.title = `Os meus pedidos — ${user.displayName || user.email}`;
      btn.innerHTML = user.photoURL
        ? `<img src="${user.photoURL}" alt="" style="width:26px;height:26px;border-radius:50%;object-fit:cover">`
        : "🙂";
    } else {
      btn.title = "Entrar com Google";
      btn.innerHTML = "👤";
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
