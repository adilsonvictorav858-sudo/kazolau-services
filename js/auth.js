/* ============================================================
   KAZOLAU SERVICES — auth.js
   Login com Google, usando o SDK "Google Identity Services" (GIS)
   diretamente, em vez do signInWithPopup/signInWithRedirect do Firebase.

   Porquê: desde 2024, os navegadores (Chrome, Firefox, Safari) bloqueiam
   por defeito comunicação entre domínios diferentes durante o login
   (kazolau.site ↔ kazolau-services.firebaseapp.com), o que faz o método
   antigo falhar silenciosamente em muitos telemóveis. O GIS evita esse
   problema por completo — o Firebase só recebe o resultado já pronto.
   ============================================================ */

let KZ_USER = null;
let googleTokenClient = null;
let kzLoginCallback = null;

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

function obterTokenClient() {
  if (googleTokenClient) return googleTokenClient;
  googleTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: "openid email profile",
    callback: (response) => {
      if (response.error) {
        kzDebug("GIS erro: " + response.error);
        console.error(response);
        toast("Não foi possível entrar. Tenta novamente.");
        return;
      }
      kzDebug("GIS access_token recebido, a trocar com o Firebase...");
      const credential = firebase.auth.GoogleAuthProvider.credential(null, response.access_token);
      auth.signInWithCredential(credential)
        .then(result => {
          KZ_USER = result.user;
          kzDebug("signInWithCredential OK: " + result.user.email);
          toast("Sessão iniciada: " + result.user.email);
          if (kzLoginCallback) { const cb = kzLoginCallback; kzLoginCallback = null; cb(); }
        })
        .catch(err => {
          kzDebug("signInWithCredential ERRO: " + (err.code || err.message));
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

/* Garante que há sessão iniciada antes de continuar uma ação (comprar,
   negociar, solicitar serviço, finalizar carrinho). */
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
