# Kazolau Services — Atualização do site (v2, com o teu catálogo real)

## ⚠️ Importante — corrige isto primeiro

Reparei, pela tua captura de ecrã do GitHub, que o site já tem pastas chamadas
`loja/` e `servicos/`, e o `produtos.json` parece estar dentro da pasta `loja/`
em vez de estar na raiz. Isso faz com que as secções da homepage (categorias,
destaques) fiquem vazias, porque o `js/catalogo.js` procura os ficheiros assim:

```
fetch("produtos.json")   // à espera de encontrar em: https://kazolau.site/produtos.json
fetch("servicos.json")   // à espera de encontrar em: https://kazolau.site/servicos.json
```

**Os ficheiros `produtos.json` e `servicos.json` têm de estar na RAIZ do
repositório**, ao lado do `index.html`. Se tiverem sido carregados para dentro
de `loja/produtos.json` ou `servicos/servicos.json`, o site não os encontra.

Também confirma que existe mesmo uma pasta `css/` na raiz com o `style.css`
lá dentro — pela tua captura não estava visível, só um `produto.css` solto.

## O que mudou nesta versão

- `produtos.json` foi **substituído** pelo teu catálogo real: 25 produtos,
  com preços exatos por cor/armazenamento/tamanho (ex: iPhone X Prateado
  64GB = 135.000 Kz, iPhone X Prateado 256GB = 185.000 Kz, etc.)
- Os cartões de produto agora mostram "A partir de X Kz" quando há mais do
  que um preço possível, ou o preço exato quando é único.
- A página `produto.html` agora deixa escolher cor/armazenamento/tamanho e
  o preço muda automaticamente conforme a combinação — exatamente como
  descreveste no Plano Geral.
- Se escolheres uma combinação que não existe no catálogo (ex: Adidas
  Runfalcon Cinza/Rosa tamanho 42, que não está na tua lista), os botões de
  compra ficam desativados e aparece um aviso a pedir para escolher outra
  opção ou falar no WhatsApp.

## Como fazer o upload correto (evitando o erro anterior)

1. Vai à raiz do repositório no GitHub.
2. Se existirem `loja/produtos.json` ou `servicos/servicos.json`, apaga-os
   (ou move o conteúdo para a raiz).
3. Faz upload destes ficheiros **diretamente na raiz** (não dentro de
   nenhuma subpasta):
   - `produtos.json` ← substitui o antigo
   - `servicos.json`
   - `index.html`, `loja.html`, `produto.html`, `servicos.html`, `vistos.html`,
     `contactos.html`, `sobre.html`
   - a pasta `css/` inteira
   - a pasta `js/` inteira
4. Cria uma pasta `imagens/` na raiz e move para lá estas fotos (mesmo nome,
   já existem na raiz do teu repo): `telefone-iphone-blue.jpeg`,
   `telefone-iphone-graphite.jpeg`, `telefone-iphone-lineup.jpeg`,
   `telefone-samsung-stack.jpeg`, `tenis-adidas.jpeg`, `tenis-vans.jpeg`,
   `sandalhas.jpeg`, `sandalia-slide-adidas.jpeg`, `bolsas.jpeg`, `v2.jpeg`,
   `ves.jpeg`.
5. Depois de subir tudo, abre `https://kazolau.site/produtos.json`
   diretamente no navegador — se aparecer o JSON em texto, está no sítio
   certo. Se der erro 404, ainda não está na raiz.

## Como adicionar um novo produto no futuro

Abre `produtos.json`, copia um bloco `{ ... }` existente (ex: o do
"iPhone 13"), muda `id`, `nome`, `marca`, `imagens`, os `atributos`
(cor/armazenamento/tamanho conforme o produto) e a lista `combinacoes`
com o preço de cada combinação. Grava — aparece sozinho no site.
