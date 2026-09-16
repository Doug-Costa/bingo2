'use client';

/**
 * `/pin` — Rota direta para autenticação e validação de PIN do telão.
 */

import { useRouter } from 'next/navigation';
import { TvViewport } from '@/components/tv/TvViewport';
import { TvStage } from '@/components/tv/TvStage';
import { TvSafeArea } from '@/components/tv/TvSafeArea';
import { BingoShowAmbientBackground } from '@/features/bingo-show/components/BingoShowAmbientBackground';
import { BingoShowAssets } from '@/features/bingo-show/assets';
import { PinVerificationScreen } from '@/components/pin/PinVerificationScreen';

export default function PinPage() {
  const router = useRouter();

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
                  src={BingoShowAssets.logos.badge}
                  alt="Bingo Show"
                  style={{ height: 68, width: 'auto', objectFit: 'contain' }}
                />
              </div>

              {/* Componente de PIN */}
              <PinVerificationScreen onSuccess={(_roomId) => router.push('/tv')} />
            </div>
          </TvSafeArea>
        </BingoShowAmbientBackground>
      </TvStage>
    </TvViewport>
  );
}
