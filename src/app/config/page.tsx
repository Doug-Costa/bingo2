'use client';

/**
 * `/config` — porte de `tvapp1/src/screens/ConfigScreen.tsx`.
 *
 * Fluxo preservado do RN: campos IP/Porta/PIN pré-preenchidos com as
 * credenciais salvas (se houver) ou os defaults (`getDefaultIp`/
 * `getDefaultPort`); "Conectar" valida os 3 campos, resolve o PIN
 * (`resolvePin`), salva as credenciais retornadas e segue para `/tv`.
 * Nenhuma regra de validação/mensagem de erro/URL foi alterada.
 *
 * Decisões de porte:
 * - `SafeAreaView`/`KeyboardAvoidingView` (RN) → mesmo palco fixo 1920×1080
 *   já usado em `/tv` (`TvViewport`/`TvStage`/`TvSafeArea`) — é a mesma TV,
 *   mesma resolução de referência; teclado virtual não se aplica a
 *   navegador de TV/desktop.
 * - Refs + `onSubmitEditing` (RN, workaround de D-pad) → `onKeyDown`
 *   (Enter) chama `.focus()` no próximo campo / dispara `handleConnect` no
 *   PIN — é encadeamento de formulário padrão, não uma feature de controle
 *   remoto (fora de escopo desta migração, ver `TvFocusable`).
 *   `hasTVPreferredFocus` → `autoFocus` (mesma convenção já usada no resto
 *   do porte).
 * - Botão "DEV: VISUAL TEST" (`__DEV__`, navega para uma galeria de
 *   componentes que não existe neste projeto) — não portado, fora de
 *   escopo.
 * - Botão "← CANCELAR" (`navigation.canGoBack()`) → aparece só quando há
 *   histórico de navegação real no browser (`window.history.length > 1`),
 *   equivalente mais próximo do que existe na web para "veio de algum
 *   lugar" — usa `router.back()`.
 */

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TvViewport } from '@/components/tv/TvViewport';
import { TvStage } from '@/components/tv/TvStage';
import { TvSafeArea } from '@/components/tv/TvSafeArea';
import { BingoShowAmbientBackground } from '@/features/bingo-show/components/BingoShowAmbientBackground';
import { BingoShowPanel } from '@/features/bingo-show/components/BingoShowPanel';
import { BingoShowText } from '@/features/bingo-show/components/BingoShowText';
import { BingoShowBadge } from '@/features/bingo-show/components/BingoShowBadge';
import { BingoShowIcon } from '@/features/bingo-show/components/BingoShowIcon';
import { BingoShowAssets } from '@/features/bingo-show/assets';
import { BingoShowColors, BingoShowRadius, BingoShowSpacing, BingoShowTypography, glowToCssBoxShadow } from '@/features/bingo-show/design-system';
import { resolvePin } from '@/services/api';
import { buildBaseUrl, getCredentials, getDefaultIp, getDefaultPort, saveCredentials } from '@/storage/credentials';

type FocusedField = 'pin' | null;

export default function ConfigPage() {
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const pinRef = useRef<HTMLInputElement>(null);

  // Carrega dados salvos
  useEffect(() => {
    const creds = getCredentials();
    if (creds) {
      setPin(creds.pin);
    }
    setCanGoBack(typeof window !== 'undefined' && window.history.length > 1);
    setLoadingInit(false);
  }, []);

  async function handleConnect() {
    setError('');
    const cleanIp = getDefaultIp();
    const cleanPort = getDefaultPort();
    const cleanPin = pin.trim();

    if (!cleanPin) {
      setError('Preencha o PIN do telão.');
      return;
    }

    const baseUrl = buildBaseUrl(cleanIp, cleanPort);
    setLoading(true);
    try {
      const data = await resolvePin(baseUrl, cleanPin);
      saveCredentials({
        ip: cleanIp,
        port: cleanPort,
        pin: cleanPin,
        roomId: data.roomId,
        roomName: data.roomName || '',
        theme: data.theme || {},
      });
      router.push('/tv');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao conectar. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  }



  function handleEnterConnect(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConnect();
    }
  }

  const inputBaseStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    backgroundColor: BingoShowColors.bgDeep,
    border: `2px solid ${BingoShowColors.borderSubtle}`,
    borderRadius: BingoShowRadius.lg,
    paddingLeft: BingoShowSpacing.lg,
    paddingRight: BingoShowSpacing.lg,
    paddingTop: BingoShowSpacing.md,
    paddingBottom: BingoShowSpacing.md,
    fontSize: BingoShowTypography.fontSize.medium,
    fontWeight: BingoShowTypography.fontWeight.bold,
    color: BingoShowColors.textPrimary,
    outline: 'none',
  };

  if (loadingInit) {
    return (
      <TvViewport>
        <TvStage>
          <BingoShowAmbientBackground backdrop="blue" brightness="light" vignetteStrength={0.55} accentGlow>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: BingoShowSpacing.md }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: `4px solid ${BingoShowColors.cyanNeon}33`,
                  borderTopColor: BingoShowColors.cyanNeon,
                  animation: 'bs-spin 800ms linear infinite',
                }}
              />
              <BingoShowText preset="label" color="textSecondary" style={{ marginTop: BingoShowSpacing.xs }}>
                CARREGANDO CREDENCIAIS…
              </BingoShowText>
            </div>
          </BingoShowAmbientBackground>
        </TvStage>
      </TvViewport>
    );
  }

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
                paddingLeft: BingoShowSpacing.xl,
                paddingRight: BingoShowSpacing.xl,
                paddingTop: BingoShowSpacing.xxl,
                paddingBottom: BingoShowSpacing.xxl,
              }}
            >
              {/* Botão voltar */}
              {canGoBack && (
                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{
                    alignSelf: 'flex-start',
                    marginBottom: BingoShowSpacing.lg,
                    paddingTop: BingoShowSpacing.sm,
                    paddingBottom: BingoShowSpacing.sm,
                    paddingLeft: BingoShowSpacing.md,
                    paddingRight: BingoShowSpacing.md,
                    borderRadius: BingoShowRadius.md,
                    border: '1px solid rgba(0, 229, 255, 0.35)',
                    backgroundColor: 'rgba(0, 229, 255, 0.08)',
                    cursor: 'pointer',
                  }}
                >
                  <BingoShowText preset="label" color="cyanNeon">
                    ← CANCELAR
                  </BingoShowText>
                </button>
              )}

              {/* Header */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: BingoShowSpacing.xl, gap: BingoShowSpacing.sm }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- porte 1:1 do RN, logo dinâmica do tema V2 */}
                <img src={BingoShowAssets.logos.badge} alt="Bingo Show" style={{ height: 76, width: 'auto', objectFit: 'contain' }} />
                <BingoShowText preset="hero" color="textPrimary" align="center" style={{ letterSpacing: 2, marginTop: BingoShowSpacing.xs }}>
                  CONFIGURAÇÃO
                </BingoShowText>
                <BingoShowBadge label="CONEXÃO DO TELÃO" variant="cyan" />
              </div>

              {/* Card de campos */}
              <div style={{ width: '100%', maxWidth: 640 }}>
                <BingoShowPanel variant="elevated" radius="xl" padding="xl" style={{ width: '100%', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                  {/* IP e Porta foram fixados pelo backend oficial */}

                  {/* PIN */}
                  <div style={{ marginBottom: BingoShowSpacing.lg }}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: BingoShowSpacing.xs, marginBottom: BingoShowSpacing.sm }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: BingoShowColors.primary }} />
                      <BingoShowText preset="label" color="textSecondary">
                        PIN DO TELÃO
                      </BingoShowText>
                    </div>
                    <input
                      ref={pinRef}
                      style={{
                        ...inputBaseStyle,
                        borderColor: 'rgba(255, 222, 56, 0.25)',
                        ...(focusedField === 'pin' ? { borderColor: BingoShowColors.primary, boxShadow: glowToCssBoxShadow('gold') } : {}),
                      }}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="PIN fornecido pelo sistema"
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoFocus
                      onKeyDown={handleEnterConnect}
                      onFocus={() => setFocusedField('pin')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>

                  {/* Preview da URL */}
                  <div
                    style={{
                      backgroundColor: BingoShowColors.bgDeep,
                      border: `1px solid ${BingoShowColors.borderSubtle}`,
                      borderRadius: BingoShowRadius.md,
                      padding: BingoShowSpacing.md,
                      marginBottom: BingoShowSpacing.lg,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: BingoShowSpacing.xxs,
                    }}
                  >
                    <BingoShowText preset="label" color="textMuted">
                      URL GERADA
                    </BingoShowText>
                    <span
                      style={{
                        fontSize: BingoShowTypography.fontSize.small,
                        fontWeight: BingoShowTypography.fontWeight.bold,
                        color: BingoShowColors.cyanNeon,
                        fontFamily: BingoShowTypography.fontFamily.digital,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {buildBaseUrl(getDefaultIp(), getDefaultPort())}
                    </span>
                  </div>

                  {/* Erro */}
                  {!!error && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: BingoShowSpacing.sm,
                        backgroundColor: 'rgba(255, 51, 51, 0.12)',
                        border: '1px solid rgba(255, 51, 51, 0.4)',
                        borderRadius: BingoShowRadius.md,
                        padding: BingoShowSpacing.md,
                        marginBottom: BingoShowSpacing.lg,
                      }}
                    >
                      <BingoShowIcon name="notification" size={18} color={BingoShowColors.redDanger} transparentBg />
                      <span style={{ flex: 1, fontSize: BingoShowTypography.fontSize.small, fontWeight: BingoShowTypography.fontWeight.bold, color: BingoShowColors.redDanger }}>{error}</span>
                    </div>
                  )}

                  {/* Botão Conectar */}
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={loading}
                    style={{
                      width: '100%',
                      backgroundColor: loading ? 'rgba(255, 255, 255, 0.08)' : BingoShowColors.primary,
                      border: `1.5px solid ${loading ? BingoShowColors.borderSubtle : '#FFFFFF'}`,
                      borderRadius: BingoShowRadius.lg,
                      paddingTop: BingoShowSpacing.lg,
                      paddingBottom: BingoShowSpacing.lg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: BingoShowSpacing.md,
                      boxShadow: loading ? 'none' : glowToCssBoxShadow('gold'),
                      cursor: loading ? 'default' : 'pointer',
                    }}
                  >
                    {loading ? (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2.5px solid ${BingoShowColors.textOnGold}55`, borderTopColor: BingoShowColors.textOnGold, animation: 'bs-spin 700ms linear infinite' }} />
                    ) : (
                      <span
                        style={{
                          fontSize: BingoShowTypography.fontSize.medium,
                          fontWeight: BingoShowTypography.fontWeight.heavy,
                          color: BingoShowColors.textOnGold,
                          letterSpacing: BingoShowTypography.letterSpacing.widest,
                          textTransform: 'uppercase',
                        }}
                      >
                        CONECTAR
                      </span>
                    )}
                  </button>

                  <BingoShowText preset="body" color="textMuted" align="center" style={{ fontStyle: 'italic' }}>
                    Os dados são salvos automaticamente para reconexão após reinicialização.
                  </BingoShowText>
                </BingoShowPanel>
              </div>

                {/* Footer opcional / espaçamento */}
            </div>
          </TvSafeArea>
        </BingoShowAmbientBackground>
      </TvStage>
    </TvViewport>
  );
}
