/* ============================================================
   KAZOLAU SERVICES — auth.js
   Login com Google, usando o SDK "Google Identity Services" (GIS)
   diretamente, em vez do signInWithPopup/signInWithRedirect do Firebase.
   ============================================================ */

let KZ_USER = null;
let googleTokenClient = null;
let kzLoginCallback = null;

/* Se um utilizador diferente do último a ter sessão iniciada neste
   aparelho entrar agora, limpa carrinho/favoritos/telefone guardados —
   evita que dados de uma pessoa apareçam para a pessoa seguinte a usar
   o mesmo telemóvel/computador. */
function limparDadosSeContaDiferente(user) {
  const ultimoUid = localStorage.getItem("kazolau_ultimo_uid");
  if (ultimoUid && ultimoUid !== user.uid) {
    localStorage.removeItem("kazolau_carrinho");
    localStorage.removeItem("kazolau_favoritos");
    localStorage.removeItem("kazolau_telefone_cliente");
  }
  localStorage.setItem("kazolau_ultimo_uid", user.uid);
}

function obterTokenClient() {
  if (googleTokenClient) return googleTokenClient;
  googleTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: "openid email profile",
    callback: (response) => {
      if (response.error) {
        console.error(response);
        toast("Não foi possível entrar. Tenta novamente.");
        return;
      }
      const credential = firebase.auth.GoogleAuthProvider.credential(null, response.access_token);
      auth.signInWithCredential(credential)
        .then(result => {
          KZ_USER = result.user;
          limparDadosSeContaDiferente(result.user);
          if (kzLoginCallback) { const cb = kzLoginCallback; kzLoginCallback = null; cb(); }
        })
        .catch(err => {
          console.error(err);
          toast("Erro ao entrar: " + (err.message || err.code));
        });
    },
  });
  return googleTokenClient;
}

function loginGoogle() {
  kzLoginCallback = null;
  obterTokenClient().requestAccessToken();
}

function logoutGoogle() {
  auth.signOut();
}

function isAdmin(user) {
  return !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function exigirLogin(callback) {
  if (KZ_USER) { callback(); return; }
  kzLoginCallback = callback;
  toast("Inicia sessão para continuares");
  obterTokenClient().requestAccessToken();
}

function initAccountButton() {
  auth.onAuthStateChanged(user => {
    KZ_USER = user;
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
