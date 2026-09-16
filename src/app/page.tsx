'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasSavedCredentials } from '@/storage/credentials';

/**
 * Página raiz — replica a decisão do `BingoShowV2RealtimeGate`/`AppNavigator`
 * do RN (fluxo real de produção):
 *
 *   sem credenciais salvas → /config (ConfigScreen real)
 *   com credenciais salvas → /tv (TvScreen real)
 *
 * `hasSavedCredentials()` (ver `storage/credentials.ts`) é a mesma checagem
 * usada internamente por `/config` e `/tv` — cada rota também revalida por
 * conta própria (`getCredentials()`), então este gate só evita mostrar a
 * tela errada por um instante; não é a única fonte de verdade.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const target = hasSavedCredentials() ? '/tv' : '/config';
    router.replace(target);
  }, [router]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bs-color-bg-deep)',
        color: 'var(--bs-color-text-muted)',
        fontFamily: 'var(--bs-font-base)',
        fontSize: 'var(--bs-font-size-body)',
      }}
    >
      Carregando…
    </div>
  );
}
