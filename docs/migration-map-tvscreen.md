# Mapa de migração — TvScreen (tema04 / Bingo Show) + camada de conexão

Fonte de verdade: `tvapp1/` (React Native). Alvo: `bingo-show-next/` (Next.js).
Escopo confirmado com o usuário nesta sessão:

- Tela de loop/sorteio a migrar = `src/screens/TvScreen.tsx` (não
  `BingoShowLoopScreen`/`BingoShowDrawScreen` — esses não existem no projeto
  real e não são o alvo).
- Só **tema04** (`temaBingoShow`) — tema01/02/03 ficam de fora.
- Áudio (`audioService`) e controle remoto (foco espacial D-pad) **não**
  entram nesta rodada — só a estrutura de dados/visual.
- Mocks só em modo dev.

Correção em relação ao handoff anterior: `src/assets/themes/bingo-show/`
(20MB, 108 PNGs) **não é órfã** — é a única fonte de assets real de
`temaBingoShow` (confirmado: `resolveBallAsset.ts`/`ThemeImage.tsx` não
referenciam `features/bingo-show/assets/` nenhuma vez). `Theme.Bingo.Show/`
citada no handoff antigo é irrelevante para este fluxo.

## A. Camada de dados/conexão (pedido original desta mensagem)

| Arquivo RN | Destino Next.js | Notas |
|---|---|---|
| `src/services/storage.ts` | `src/storage/credentials.ts` (já existe como placeholder — será reescrito) | Mesmas chaves `tv_ip/tv_port/tv_pin/tv_roomId/tv_roomName/tv_theme`. AsyncStorage→localStorage. API pedida: `getCredentials/saveCredentials/clearCredentials/hasSavedCredentials/getRoomId/getRoomName/getTheme`. |
| `src/services/api.ts` | `src/services/api.ts` (novo) | `resolvePin(baseUrl, pin)` → `GET /bingo/tvapp/resolve?pin=..&type=bingo`; `fetchNextDraws(baseUrl, roomId, pin)` → `POST /bingo/tvapp/next-draws`. Mesmos paths, mesmo body, mesmo tratamento de erro (`res.ok` → throw `body.message`). |
| `src/contexts/SSEContext.tsx` | `src/contexts/SSEContext.tsx` (novo, React Context) | Port do parser XHR incremental → `EventSource` nativo do browser (mais simples: `EventSource` já entrega `event:`/`data:` parseados). Preservar: path `/bingo/realtime-sse/stream`, query `pin/token/roomId/_t`, TODOS os `case` do switch de eventos (`snapshot, my_tickets, promotions_list, draw_start, new_ball, top_winners, line_winner, jackpot_trigger_update, jackpot_paid/won, jackpot_delayed, winners/final_winners, draw_finish, draw_end, draw_cancel, next_draws, hot_draws, jackpot_info, tv_restart/restart`), mesma lógica de detecção de troca de sorteio via `lastSeenDrawIdRef`, backoff exponencial 1s→30s, cleanup no unmount. `useGameSocket()` = `useContext`. |
| `src/features/bingo-show/screens/BingoShowV2RealtimeGate.tsx` | lógica equivalente no root (`page.tsx` + um `RealtimeGate`/layout) | Sem credenciais → renderiza `ConfigScreen` real; com credenciais (salvas ou recém-conectadas) → monta `GameSocketProvider` em volta da tela principal. |
| `src/screens/ConfigScreen.tsx` | `src/app/config/page.tsx` (substitui o placeholder atual) | Campos IP/Porta/PIN, preview de URL, botão Conectar, loading, erro, `hasTVPreferredFocus`→`autoFocus` no campo IP, encadeamento de campos via Enter. Usa componentes do design system **Bingo Show V2** (`BingoShowAmbientBackground/GlowHalo/Panel/Text/Badge/Icon`) — nenhum desses existe ainda em `bingo-show-next` (só os tokens da Fase 1 existem), precisam ser portados (subconjunto pequeno, só o que `ConfigScreen` usa). |

`useGameSocket`/`useBingoShowRealtimeDraw` (o hook adaptador da V2) **não** se
aplica a `TvScreen` — `TvScreen` consome `useGameSocket()` (o contexto SSE
cru) diretamente, sem adaptador intermediário.

## B. Camada visual — TvScreen (tema04)

### B.1 Tokens de tema

| RN | Next.js | Notas |
|---|---|---|
| `src/theme/colors.ts` (`Colors.bingoShow.*`) | `src/theme/colors.ts` | Só a paleta `bingoShow` — resto (`bingoPrimary`, `lotoPrimary` etc.) é de outros temas, não migrar. |
| `src/theme/typography.ts` | `src/theme/typography.ts` | Só as chaves usadas por `temaBingoShow.typography` (18 variantes). |
| `src/theme/themes.ts` | `src/theme/themes.ts` | Só `ThemeTokens` (interface) + `temaBingoShow` (valores) + `alphaColor()`. `resolveTheme/getThemeKey` simplificam para sempre retornar `temaBingoShow` (sem tema01-03, sem `FORCE_BINGO_SHOW_DEV`/`devFlags`). |
| `src/theme/responsive.ts` | `src/theme/responsive.ts` | `getLayoutProfile/getGridMetrics/scaleSize/scaleFont/getBallSize`. `Platform.isTV` (RN-only) → substituir por profile fixo `'tv1080'`/detecção por `window.innerWidth` (sem API de TV no browser). |
| `src/assets/themes/bingo-show/index.ts` (108 PNGs, `require()`) | `public/themes/bingo-show/**` + `src/theme/assets.ts` | Copiar só os PNGs (20MB), trocar `require()` por paths estáticos `/themes/bingo-show/...`. Documentar em `docs/asset-inventory-tvscreen.md`. |

### B.2 Biblioteca de componentes genéricos de tema (`src/components/theme/*` → `src/components/theme/*`)

14 arquivos: `utils.ts`, `ThemeBackground`, `ThemeCard`, `ThemeText`,
`ThemeButton`, `ThemeImage`, `ThemeGlass`, `ThemeBorder`, `ThemeGlow`,
`ThemeDivider`, `ThemeBadge`, `ThemeOverlay`, `TvFocusable`, `ThemePanel`,
`ThemeLogo` (só o branch `LogoGold` SVG, tema04), `resolveBallAsset.ts`.
(`ThemeShowcase.tsx` não migra — galeria de dev.)

Substituições RN→web necessárias (documentadas, não escondidas):
- `LinearGradient` → CSS `linear-gradient()`.
- `Animated.*` (`ThemeButton`, `TvFocusable`) → CSS transitions (sem lib de
  animação pesada, por regra do projeto).
- `hasTVPreferredFocus`/`nextFocusUp/Down/Left/Right` (`TvFocusable`) →
  `autoFocus` + navegação por Tab/click; sem grafo de foco espacial D-pad
  nesta rodada (controle remoto fica pra depois, por pedido explícito).
- `elevation` (Android-only shadow) → ignorado, só `box-shadow` (via
  `shadowColor/Offset/Opacity/Radius`, mesmo padrão já usado em
  `shadows.ts`/`glow.ts` da Fase 1).
- `ImageBackground` (stretch) → `<img>`/`background-image` com
  `object-fit`/`background-size: 100% 100%`.
- `adjustsFontSizeToFit`/`minimumFontScale` (`ThemeText`) → `text-overflow:
  ellipsis` (mesma decisão já tomada na Fase 1 para os componentes V2).

### B.3 Componentes standalone (`src/components/*` → `src/components/tvscreen/*`)

10 arquivos (excluindo `ThreeWinnersScreen.tsx`, confirmado não usado nesta
cadeia): `AnimatedActiveBall`, `NumberGrid`, `DigitalNumber`, `TopPlayers`,
`WinnerModal`, `MyTicketsPanel`, `PostDrawCycle`, `Icon` (SVG puro, porte
direto), `WinnerTicketCard`, `Ball`.

Substituições adicionais:
- `Animated.spring/loop/sequence/parallel/timing` → CSS keyframes/transition.
- `FlatList numColumns` (`NumberGrid`) → CSS Grid.
- `Modal` (`WinnerModal`) → `<dialog>`/overlay posicionado (sem portal lib).
- `useWindowDimensions` → hook próprio (`useElementSize`/`window.innerWidth`
  + listener, já existe padrão equivalente da Fase 1).
- `NativeModules.TtsModule` (`audioService`, chamado por `TvScreen` mas
  **não migrado agora**) → chamadas viram no-op/comentadas nesta rodada.

### B.4 A tela em si

`src/screens/TvScreen.tsx` (2120 linhas) → `src/app/tv/page.tsx` (substitui
o placeholder da grade de validação da Fase 1) + sub-componentes extraídos
(`TvHeader`, `LobbyView`, `InGameView`, `LoadingView`, `TriggerBallStar`,
`JackpotTag` — hoje funções internas do arquivo RN, viram arquivos próprios
em `src/components/tvscreen/` para não empilhar tudo num arquivo só).
Preserva os 3 estados (LOBBY/DRAW_ACTIVE/POST_DRAW) e a máquina de estados
`drawUiState` (`LOBBY→DRAW_ACTIVE→WINNER_ANNOUNCEMENT→POST_DRAW→RETURNING_TO_LOBBY`)
exatamente como está, incluindo o watchdog de 30s e o corte por countdown
≤30s.

## Ordem de implementação

1. Camada de dados: `storage/credentials.ts`, `services/api.ts`,
   `contexts/SSEContext.tsx` — testável isoladamente (typecheck/lint), sem
   depender de nenhuma decisão visual.
2. Tokens de tema (`theme/colors.ts`, `theme/typography.ts`,
   `theme/themes.ts`, `theme/responsive.ts`) + assets (cópia dos 108 PNGs).
3. Biblioteca `components/theme/*` (14 arquivos).
4. Componentes standalone (10 arquivos).
5. `TvScreen` real em `/tv`, consumindo `GameSocketProvider`.
6. `ConfigScreen` real em `/config` (subconjunto pequeno do design system V2:
   `BingoShowAmbientBackground/GlowHalo/Panel/Text/Badge/Icon` + assets do
   logo).
7. Gate no `page.tsx` raiz (sem credenciais→`/config`, com→`/tv` conectando
   de verdade).
8. lint + typecheck + build, listar arquivos alterados e pendências.
