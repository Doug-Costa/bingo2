# Inventário de assets — TvScreen (tema04)

Fonte: `tvapp1/src/assets/themes/bingo-show/` (108 PNGs, 20MB).
Destino: `bingo-show-next/public/themes/bingo-show/` (mesma estrutura de
pastas, mesmos nomes de arquivo — nenhum renomeado).

Motivo: única fonte de assets real consumida por `temaBingoShow` via
`ThemeTokens.assets` (confirmado por leitura direta de `resolveBallAsset.ts`
e `ThemeImage.tsx` — nenhum dos dois referencia `src/features/bingo-show/assets/`,
a pasta "V2" usada só por `ConfigScreen`). Ver correção de escopo em
`docs/migration-map-tvscreen.md`.

| Pasta | Arquivos | Destino |
|---|---|---|
| `backgrounds/` | 6 PNGs | `public/themes/bingo-show/backgrounds/` |
| `balls/` | 49 PNGs (7 cores × 7 estados) | `public/themes/bingo-show/balls/` |
| `borders/` | 5 PNGs | `public/themes/bingo-show/borders/` |
| `cards/` | 9 PNGs | `public/themes/bingo-show/cards/` |
| `decorative/` | 3 PNGs | `public/themes/bingo-show/decorative/` |
| `effects/` | 10 PNGs | `public/themes/bingo-show/effects/` |
| `panels/` | 9 PNGs | `public/themes/bingo-show/panels/` |
| `particles/` | 11 PNGs | `public/themes/bingo-show/particles/` |
| `textures/` | 6 PNGs | `public/themes/bingo-show/textures/` |

Total: 108 arquivos, ~20MB. Mapeamento chave→path em `src/theme/assets.ts`
(substitui os `require()` do índice RN por strings de path estático,
consumidas por `<img src=...>`/`background-image` nos componentes
`components/theme/*`).

Não copiado (fora do escopo desta migração): `icons/`, `jackpot/`, `logos/`
da mesma pasta RN — não são referenciados por `resolveBallAsset.ts` nem
pelos componentes de tema usados por `TvScreen`. `ThemeLogo` (tema04) usa um
componente SVG (`LogoGold`), não um PNG desta pasta.

Nota: `public/themes/bingo-show/backgrounds/4x/bg-space.png` já existia
(cópia da Fase 1, documentada em `docs/asset-inventory-fase1.md`) — não foi
tocado por esta cópia.
