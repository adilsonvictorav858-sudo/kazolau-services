/* ============================================================
   KAZOLAU SERVICES — firebase-config.js
   ⚠️ PREENCHE COM OS DADOS DO TEU PROJETO FIREBASE ⚠️
   Vai a https://console.firebase.google.com → cria um projeto →
   Definições do projeto → "As tuas apps" → Web → copia os valores
   para aqui. Instruções completas no LEIA-ME-LOGIN.md
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
// Muda para o teu email do Google (o mesmo que vais usar para entrar).
const ADMIN_EMAIL = "adilsonvictorav858@gmail.com";

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
