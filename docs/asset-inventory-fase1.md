# Inventário de assets — Fase 1

Nesta fase só um asset foi copiado, exatamente conforme pedido (não copiar os
66MB completos ainda — só o necessário para validar o palco). Nenhum arquivo
foi otimizado, redimensionado ou convertido.

| Arquivo original (tvapp1) | Destino (bingo-show-next) | Motivo da cópia | Componente futuro que vai usar |
|---|---|---|---|
| `Theme.Bingo.Show/assets/backgrounds/4x/bg-space.png` | `public/themes/bingo-show/backgrounds/4x/bg-space.png` | Validar que uma imagem de fundo real preenche o `TvStage` (1920×1080) corretamente e escala junto com o palco em todas as resoluções testadas, sem distorcer. Usado na página `/tv` como fundo do palco de teste. | `BingoShowAmbientBackground` (Fase 2/4) — é o backdrop padrão (`backdrop="space"`) do Loop/Draw no RN. |

## Não copiado nesta fase (proposital)

- Nenhum outro arquivo de `Theme.Bingo.Show/assets/` (balls, cards, panels, borders, jackpot, textures, decorative, particles, icons, stage) — serão copiados sob demanda, tela por tela, a partir da Fase 2.
- `src/assets/themes/bingo-show/` (pasta órfã do RN) — **não copiada**, conforme decisão registrada na Fase 0: só é referenciada pelo sistema de tema antigo (`src/theme/themes.ts`), não pelo Bingo Show V2. Só será usada como fonte se algum uso real for comprovado no código ativo.
- Logo do Bingo Show — não copiada porque não existe como asset de imagem: `BingoShowLogo.tsx` no RN desenha o wordmark inteiro via paths SVG embutidos no próprio componente (`Theme.Bingo.Show/assets/logos/logo-*.svg` foram usados como referência para extrair o path, mas o componente não faz `require()` de nenhum arquivo). Será portado como componente de código na Fase 2/4, não como asset copiado.
- Áudio (`public/audio/{pt,es,en}/`) — fora de escopo desta fase ("não implementar áudio nesta fase").
