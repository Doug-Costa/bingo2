'use client';

/**
 * `/config` — Tela de configuração e validação de PIN do telão.
 * Renderiza o componente dedicado PinVerificationScreen com validação
 * em tempo real, teclado interativo, detecção de PIN incorreto e
 * seletor de temas integrado.
 */

import { useRouter } from 'next/navigation';
import { TvViewport } from '@/components/tv/TvViewport';
import { TvStage } from '@/components/tv/TvStage';
import { TvSafeArea } from '@/components/tv/TvSafeArea';
import { BingoShowAmbientBackground } from '@/features/bingo-show/components/BingoShowAmbientBackground';
import { BingoShowAssets } from '@/features/bingo-show/assets';
import { PinVerificationScreen } from '@/components/pin/PinVerificationScreen';
import { useAppTheme } from '@/contexts/ThemeContext';
import { getEsSkin } from '@/features/bingo-show/components/esSkin';

export default function ConfigPage() {
  const router = useRouter();
  // Paraguay / Loteria'i: logo da Loteria'i no lugar do Bingo Show.
  const { themeId } = useAppTheme();
  const esSkin = getEsSkin(themeId);

  return (
    <TvViewport>
      <TvStage>
        <BingoShowAmbientBackground backdrop="blue" brightness="light" vignetteStrength={0.55} accentGlow>
          <TvSafeArea style={{ height: '100%', overflowY: 'auto' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100%',
                boxSizing: 'border-box',
                padding: '24px 20px',
              }}
            >
              {/* Logo Superior */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: 16,
                  cursor: 'pointer',
                }}
                onClick={() => router.push('/tv')}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={esSkin ? esSkin.art.logo : BingoShowAssets.logos.badge}
                  alt={esSkin ? "Loteria'i" : 'Bingo Show'}
                  style={{ height: esSkin ? 150 : 68, width: 'auto', objectFit: 'contain', filter: esSkin ? 'drop-shadow(0 4px 8px rgba(104, 57, 0, 0.35))' : undefined }}
                />
              </div>

              {/* Componente de PIN com mensagens e erro de PIN incorreto */}
              <PinVerificationScreen />
            </div>
          </TvSafeArea>
        </BingoShowAmbientBackground>
      </TvStage>
    </TvViewport>
  );
}
