# Kazolau Services — Login com Google e Acompanhamento de Pedidos

## O que foi adicionado

- Botão de conta (👤) no cabeçalho de todas as páginas — clica para entrar
  com Google, ou para ir para "Os meus pedidos" se já tiveres sessão iniciada.
- `pedidos.html` — o cliente vê os pedidos que fez (loja e serviços) e tem
  um botão "Falar sobre este pedido" que abre o WhatsApp já com o número do
  pedido preenchido.
- `admin/index.html` — painel só acessível pela tua conta Google, onde vês
  todos os pedidos de todos os clientes e podes mudar o estado de cada um
  (Pendente → Confirmado → A caminho → Entregue / Cancelado).
- Quando um cliente com sessão iniciada finaliza o carrinho ou solicita um
  serviço, o pedido é guardado automaticamente. **Se não tiver sessão
  iniciada, continua a funcionar exatamente como antes (só por WhatsApp,
  sem ficar guardado)** — nada do que já tinhas foi alterado ou partido.

Isto usa o **Firebase** (Google) como backend gratuito — Auth para o login
e Firestore como base de dados. Não precisas de programar nem gerir
servidores.

## Passo a passo para ativar (± 15 minutos)

### 1. Criar o projeto Firebase
1. Vai a **https://console.firebase.google.com**
2. **Adicionar projeto** → nome, por exemplo `kazolau-services` → segue os
   passos (podes desativar o Google Analytics, não é necessário).

### 2. Ativar o login com Google
1. No menu lateral: **Build → Authentication → Get started**
2. Separador **Sign-in method** → clica em **Google** → ativa (toggle) →
   escolhe o teu email de suporte → **Save**.
3. Ainda em Authentication, vai a **Settings → Authorized domains** e
   adiciona `kazolau.site` (o `localhost` já vem por defeito, útil se
   testares no computador).

### 3. Criar a base de dados (Firestore)
1. Menu lateral: **Build → Firestore Database → Create database**
2. Escolhe **Start in production mode** → escolhe uma região (ex:
   `eur3 (europe-west)`) → **Enable**.
3. Separador **Rules**, apaga o conteúdo e cola isto (troca
   `TEU_EMAIL_AQUI` pelo teu email do Google — o mesmo que vais usar para
   entrar no painel):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pedidos/{pedidoId} {
      allow create: if request.auth != null
                     && request.resource.data.uid == request.auth.uid;
      allow read: if request.auth != null
                  && (resource.data.uid == request.auth.uid
                      || request.auth.token.email == "TEU_EMAIL_AQUI");
      allow update: if request.auth != null
                    && request.auth.token.email == "TEU_EMAIL_AQUI";
      allow delete: if false;
    }
  }
}
```

Clica em **Publish**.

### 4. Copiar a configuração para o site
1. No Firebase: ícone de engrenagem → **Project settings**
2. Em baixo, em "Your apps", clica no ícone **</>** (Web) → dá um nome
   (ex: `kazolau-web`) → **Register app** (não precisas do Firebase
   Hosting, já tens o GitHub Pages).
3. Vai aparecer um bloco `firebaseConfig = { apiKey: "...", ... }`.
   Copia esses valores para o ficheiro `js/firebase-config.js` do site,
   substituindo os `"COLE_AQUI..."`.
4. No mesmo ficheiro, muda também:
   ```js
   const ADMIN_EMAIL = "o-teu-email@gmail.com";
   ```
   para o teu email real do Google (tem de ser **exatamente igual** ao
   que puseste nas regras do Firestore no passo 3).

### 5. Subir para o GitHub
Sobe (ou substitui) estes ficheiros/pastas na raiz do repositório:
- `js/firebase-config.js` (já editado com os teus dados)
- `js/auth.js`
- `js/pedidos.js`
- `pedidos.html`
- a pasta `admin/` (com `index.html` e `admin.js`)
- todos os `.html` existentes (foram atualizados com o botão de conta 👤
  e os scripts do Firebase)

### 6. Testar
1. Abre `kazolau.site`, clica no ícone 👤 → deve abrir o popup de login
   Google.
2. Depois de entrares, adiciona um produto ao carrinho e finaliza o
   pedido → deve abrir o WhatsApp como sempre.
3. Clica em 👤 outra vez → deve levar-te a "Os meus pedidos" e mostrar
   esse pedido com estado "Pendente".
4. Abre `kazolau.site/admin/` com a tua conta → deve mostrar o painel com
   esse pedido. Muda o estado para "Confirmado" e confirma que fica
   guardado.

⚠️ **Nota sobre o índice do Firestore:** na primeira vez que abrires
`pedidos.html`, é possível que apareça um erro na consola do navegador com
um link "Create index". É normal — o Firestore precisa de um índice para
esta pesquisa específica (pedidos de um cliente ordenados por data). Clica
no link, confirma no Firebase, espera 1-2 minutos e recarrega a página.
Só acontece uma vez.

## Plano gratuito chega?

Sim, para o volume de um negócio como este, o plano gratuito (Spark) do
Firebase é mais do que suficiente — inclui autenticação ilimitada e um
volume generoso de leituras/escritas na base de dados por dia.
