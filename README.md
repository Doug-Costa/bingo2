# bingo-show-next

Migração front-end do `tvapp1` (React Native) para Next.js, seguindo o fluxo
real de produção:

```
sem credenciais → /config (ConfigScreen real) → salva credenciais → /tv
com credenciais → /tv (TvScreen real, tema04/Bingo Show)
```

Este projeto é separado do `tvapp1` original (React Native) — nada no
projeto RN foi alterado, movido ou removido. O RN continua sendo a fonte de
verdade visual.

## Status: telas reais migradas (dados + conexão + `/tv` + `/config`)

O que existe:

- **Camada de dados/conexão** (`src/storage/credentials.ts`,
  `src/services/api.ts`, `src/contexts/SSEContext.tsx`): mesmas chaves de
  `localStorage`, mesmos endpoints, mesmo formato de payload do RN. SSE via
  `EventSource` nativo (não o parser XHR manual do RN/Hermes), com
  reconexão exponencial (1s→30s), sem instâncias duplicadas, cleanup no
  unmount.
- **`/tv`** (`TvScreenInner`/`TvScreenApp`): porte de
  `tvapp1/src/screens/TvScreen.tsx` (tema04/"Bingo Show", tema antigo —
  confirmado com o usuário, não o `BingoShowLoopScreen`/V2). Header,
  Lobby (countdown + próximas rodadas + jackpot), Em Jogo (bola ativa,
  prêmios, grade de 90 números, Top Winner, Top My Card), ciclo pós-sorteio
  (`PostDrawCycle`), modal de vencedor, máquina de estados
  `LOBBY→DRAW_ACTIVE→POST_DRAW→RETURNING_TO_LOBBY` com watchdog de 30s —
  tudo dentro do palco lógico 1920×1080 (`TvViewport`/`TvStage`/
  `TvSafeArea`, Fase 1).
- **`/config`** (`app/config/page.tsx`): porte de
  `tvapp1/src/screens/ConfigScreen.tsx` — campos IP/Porta/PIN, preview de
  URL, `resolvePin`, salvamento de credenciais, fundo ambiente animado
  (Bingo Show V2: Ken Burns, partículas, glow, vinheta).
- Componentes de tema (`components/theme/*`, 17 arquivos) e componentes
  standalone da tela (`components/tvscreen/*`: `AnimatedActiveBall`,
  `NumberGrid`, `DigitalNumber`, `TopPlayers`, `WinnerModal`,
  `MyTicketsPanel`, `PostDrawCycle`, `WinnerTicketCard`, `Ball`) — só o
  tema04 (Bingo Show), confirmado com o usuário.
- Design system "Bingo Show V2" (`features/bingo-show/*`) — só o subconjunto
  usado pela `ConfigScreen` (`BingoShowAmbientBackground`/`GlowHalo`/
  `Panel`/`Text`/`Badge`/`Icon` + tokens), não a biblioteca completa.

O que **não** está no escopo desta migração (pedido explícito do usuário):

- Áudio/locução (`services/audioService.ts`) — não migrado.
- Controle remoto / navegação espacial por D-pad — `TvFocusable` trata isso
  como no-op documentado; só ordem natural de Tab/click funciona.
- `BingoShowDrawScreen`/`BingoShowLoopScreen`/demais telas do "Bingo Show
  V2" (só a `ConfigScreen` do V2 foi portada, por depender dela).
- `LockScreen`, temas 01/02/03 (Ouro/Âmbar Neon/Azul-PUB) — fora de escopo,
  só tema04.

## Comandos

```bash
npm install
npm run dev        # http://localhost:3010
npm run lint
npm run typecheck
npm run build
```

> **Nota sobre validação (2026-08-05):** `npm run typecheck` e `npm run
> lint` foram executados de verdade a cada arquivo novo/alterado ao longo
> de toda a migração (dados, `/tv`, `/config`) e passam limpos (0 erros, 0
> warnings) no estado final. `npm run build` **não pôde ser confirmado
> neste sandbox**: a pasta do projeto está num mount sincronizado que
> rejeita `rmdir`/substituição de diretório (`EPERM`), deixando os binários
> nativos `@next/swc-linux-*` vazios/quebrados; copiar o projeto para fora
> do mount e instalar do zero também não completou dentro das restrições de
> rede/proxy do sandbox (o comando trava depois de imprimir só o banner do
> Next.js, sem progredir). Rode `npm run build` (e `npm run dev`) no seu
> terminal local para confirmar — é o mesmo cenário já documentado desde a
> primeira validação deste projeto.

## Abrir as páginas

- `http://localhost:3010/config` — `ConfigScreen` real (IP/Porta/PIN,
  `resolvePin`, salvar credenciais).
- `http://localhost:3010/tv` — `TvScreen` real (tema04/Bingo Show):
  Lobby/Em Jogo/Pós-sorteio conectados via SSE.
- `http://localhost:3010/` — decide entre os dois acima conforme
  `localStorage` (`hasSavedCredentials()`).

## Estrutura

- `docs/migration-map-tvscreen.md` — mapa de arquivos/funções portados
  (dados + `/tv`).
- `docs/asset-inventory-tvscreen.md` — inventário dos 108 PNGs do tema04
  (`public/themes/bingo-show/`).
- `public/bingoshow-v2/` — os 7 assets do design system "Bingo Show V2"
  usados pela `ConfigScreen` (recorte de uma biblioteca bem maior, só o que
  esta migração precisou — ver comentário em
  `features/bingo-show/assets/index.ts`).
