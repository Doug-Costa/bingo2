# Tema Bingo Show Azul (`bingo-show-azul`)

Tema novo, separado de todos os outros. **Não muda o Loteria'i nem nenhum tema existente.**

## Onde está

- **GitHub:** repositório `Doug-Costa/bingo2`, branch **`tema-bingo-show-azul`**. O `main` não foi alterado.
- **Base do código:** cópia da pasta `~/bingo-tv-marcola` do servidor PY, feita em 17/11/2026. Ela já tem o modo para TVs fracas (`tv-lite`, `tv-ultra`, PerfMonitor, bola nativa).
- **Prévia sem PIN:** `/preview-azul` no deploy da Vercel. Mostra dados de exemplo e sai uma bola nova a cada 4s. Com `/preview-azul?cartelas=1`, aparece também o quadro "MINHAS CARTELAS".

## Como ativar numa TV

No painel, coloque o nome do tema como `bingo-show-azul`. Qualquer nome com "azul" também funciona. Depois faça o restart remoto da TV ou digite o PIN de novo. Idioma, moeda e som continuam vindo do PIN. A tela não tem botão de som: ele liga e desliga só pelo `enableSound` do painel.

## Arquivos

Arquivos novos:

| Arquivo | O que é |
|---|---|
| `src/features/bingo-show/components/azul/AzulDrawScreen.tsx` | Tela de sorteio do tema (segue o mockup) |
| `src/features/bingo-show/components/azul/AzulDraw.module.css` | Visual da tela de sorteio |
| `src/features/bingo-show/components/azul/AzulBackground.tsx` + `.module.css` | Fundo 100% CSS |
| `src/features/bingo-show/components/azul/CouponsTableAzul.module.css` | Tabela CARTELA / JOGADOR / FALTAM |
| `src/features/bingo-show/components/azul/TicketsGridAzul.module.css` | Quadro "MINHAS CARTELAS" |
| `public/themes/bingo-show-azul/*.webp` | Troféu, cartelas, globo e bolas (fundo transparente) |
| `src/app/preview-azul/page.tsx` | Página de prévia |

Arquivos alterados, só com acréscimos para o tema novo:

- `src/theme/themes.ts`: registro do tema e regra do nome "azul".
- `src/contexts/ThemeContext.tsx`: flag `isAzul`. O Azul também conta como família Blue (`isBlue`).
- `BingoShowDrawScreen.tsx`: quando o tema é o Azul, abre a tela própria.
- `BingoShowAmbientBackground.tsx`, `BingoShowCouponsTable.tsx`, `BingoShowTicketsGrid.tsx`: ramo do Azul.
- `src/i18n/locales/pt-BR.ts` e `es.ts`: textos da seção `azul`.

## TVs fracas

- O fundo e os anéis das bolas são feitos só com gradientes e bordas. Não usam blur, `backdrop-filter`, nem `box-shadow` nos anéis.
- Não há animação contínua. Só a entrada da bola grande anima, com transform e opacity.
- No modo `tv-lite` saem os pontos e as bolinhas desfocadas do fundo.
- No modo `tv-ultra` saem também os raios. O app já reduz as animações a 1ms nesse modo.
- O build passou na checagem `check-legacy-js` (Chrome 66).

## Ainda não feito (próximos passos)

- **Bola nativa do APK:** o tema ainda usa a bola da página. Para usar a bola nativa, gere o sprite com `scripts/capture-ball.js` e registre o tema em `src/lib/nativeBall.ts`.
- **Lobby e popups de ganhador:** por enquanto usam os do tema Blue.

## Para levar ao servidor PY (deploy)

1. Copie os arquivos novos e alterados listados acima para `~/bingo-tv-marcola`.
2. Rode `npm run build` e confira se o build passa.
3. **Atenção:** `vercel --prod` dentro dessa pasta publica no projeto **`loteria-i`**, que é a TV do Paraguai no ar. Combinem antes quem publica e quando.
