/**
 * Tempos compartilhados do ciclo da TV.
 */

/**
 * WINNER_POPUP_MS — tempo de cada popup individual de ganhador (1ª linha, 2ª linha,
 * bingo) durante o sorteio. Era 6,5s (curto demais para ler na TV).
 */
export const WINNER_POPUP_MS = 10000;

/** Tempo mínimo do resumo "Ganhadores da Rodada" na tela. */
export const ROUND_SUMMARY_MIN_MS = 20000;

/**
 * FINISH_SCREEN_HOLD_MS — por quanto tempo o BingoShowLoopScreen mantém a tela de
 * sorteio depois do `draw_finish`, antes de voltar ao lobby e à contagem do próximo
 * sorteio. Nessa janela, o popup do BINGO (se estiver no ar) termina o seu tempo
 * — antes ele era cortado na hora — e depois o resumo ocupa o restante (mínimo de
 * ROUND_SUMMARY_MIN_MS). Sem popup no ar, o resumo ocupa a janela toda. Quem pagina
 * ganhadores precisa caber no tempo real do resumo.
 */
export const FINISH_SCREEN_HOLD_MS = WINNER_POPUP_MS + ROUND_SUMMARY_MIN_MS;
