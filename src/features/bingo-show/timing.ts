/**
 * Tempos compartilhados do ciclo da TV.
 *
 * FINISH_SCREEN_HOLD_MS — por quanto tempo o BingoShowLoopScreen mantém a tela de
 * sorteio (com o resumo "Ganhadores da Rodada") depois do `draw_finish`, antes de
 * voltar ao lobby e à contagem do próximo sorteio. É o tempo REAL em que o resumo
 * fica visível; quem pagina ganhadores precisa caber dentro dele.
 */
export const FINISH_SCREEN_HOLD_MS = 20000;
