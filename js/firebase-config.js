/* ============================================================
   KAZOLAU SERVICES — firebase-config.js
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyCpulYiERxyAJknlbe7Fmtoc4S6yr7alY4",
  authDomain: "kazolau-services.firebaseapp.com",
  projectId: "kazolau-services",
  storageBucket: "kazolau-services.firebasestorage.app",
  messagingSenderId: "814927011147",
  appId: "1:814927011147:web:6b536cca059fe2d6321cce"
};

// 🔑 Email da conta que deve ter acesso ao painel de administração.
const ADMIN_EMAIL = "adilsonvictorav858@gmail.com";

// ID do cliente OAuth da Web (Google Identity Services) — usado para o
// login funcionar mesmo em navegadores que bloqueiam cookies entre domínios.
const GOOGLE_CLIENT_ID = "814927011147-jnsuccbha311j2snddf5rl7el2n0t1sb.apps.googleusercontent.com";

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();