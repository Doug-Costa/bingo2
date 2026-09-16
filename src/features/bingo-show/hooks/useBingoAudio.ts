import { useEffect, useRef } from 'react';
import { WinnerEvent } from '../../../contexts/SSEContext';

export function useBingoAudio(soundOn: boolean, currentBall: number | null, winners: WinnerEvent[]) {
  const previousBallRef = useRef<number | null>(null);
  const previousWinnersCountRef = useRef<number>(0);

  useEffect(() => {
    // Inicializa a referência de ganhadores na primeira montagem para não tocar tudo de uma vez
    previousWinnersCountRef.current = winners.length;
    // Não inicializamos previousBallRef aqui porque queremos tocar a bola se ela já estiver presente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1. Toca a voz da bola
  useEffect(() => {
    if (soundOn && currentBall !== null && currentBall !== previousBallRef.current) {
      previousBallRef.current = currentBall;
      
      const audio = new Audio(`/audio/pt/${currentBall}.mp3`);
      audio.volume = 1.0;
      audio.play().catch(e => console.log('[AUDIO] Fallback autoplay prevented for ball:', currentBall, e));
    } else if (currentBall === null) {
      previousBallRef.current = null;
    }
  }, [currentBall, soundOn]);

  // 2. Toca a voz dos prêmios
  useEffect(() => {
    if (soundOn && winners.length > previousWinnersCountRef.current) {
      // Pega os novos ganhadores (pode haver mais de um chegando no mesmo evento de SPLIT, mas a faixa é a mesma)
      const newWinners = winners.slice(previousWinnersCountRef.current);
      previousWinnersCountRef.current = winners.length;

      // Extrai os tipos de prêmio dos novos ganhadores
      const newTypes = new Set(newWinners.map(w => w.type));

      newTypes.forEach(type => {
        let soundFile = '';
        if (type.toLowerCase().includes('line1') || type.toLowerCase().includes('linha 1')) {
          soundFile = '/audio/pt/win_line1.mp3';
        } else if (type.toLowerCase().includes('line2') || type.toLowerCase().includes('linha 2')) {
          soundFile = '/audio/pt/win_line2.mp3';
        } else if (type.toLowerCase().includes('bingo')) {
          soundFile = '/audio/pt/win_bingo.mp3';
        } else if (type.toLowerCase().includes('jackpot')) {
          soundFile = '/audio/pt/win_bingo.mp3'; // Fallback to bingo se não houver win_jackpot
        }

        if (soundFile) {
          const audio = new Audio(soundFile);
          audio.volume = 1.0;
          audio.play().catch(e => console.log('[AUDIO] Fallback autoplay prevented for win:', type, e));
        }
      });
    } else if (winners.length < previousWinnersCountRef.current) {
      // Rodada resetada
      previousWinnersCountRef.current = winners.length;
    }
  }, [winners, soundOn]);
}
