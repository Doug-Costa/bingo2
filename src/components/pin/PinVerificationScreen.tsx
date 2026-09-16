'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { resolvePin } from '@/services/api';
import { buildBaseUrl, getDefaultIp, getDefaultPort, saveCredentials, getCredentials } from '@/storage/credentials';
import { useAppTheme } from '@/contexts/ThemeContext';
import { ThemeSelector } from '@/components/theme';
 
export type PinStatus = 'idle' | 'validating' | 'error' | 'success';

export interface PinVerificationScreenProps {
  onSuccess?: (_roomId: string) => void;
  initialPin?: string;
}

export function PinVerificationScreen({ onSuccess, initialPin = '' }: PinVerificationScreenProps) {
  const router = useRouter();
  const { themeId, isBlue } = useAppTheme();

  const [pin, setPin] = useState(initialPin);
  const [status, setStatus] = useState<PinStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [resolvedRoom, setResolvedRoom] = useState<{ roomId: string; roomName: string } | null>(null);
  const [focused, setFocused] = useState(true);
  const [isShaking, setIsShaking] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Carrega PIN salvo anteriormente se houver
  useEffect(() => {
    const creds = getCredentials();
    if (creds?.pin && !initialPin) {
      setPin(creds.pin);
    }
  }, [initialPin]);

  // Foco automático no input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const triggerShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  }, []);

  const handleValidatePin = useCallback(
    async (pinToValidate?: string) => {
      const pinValue = (pinToValidate ?? pin).trim();

      if (!pinValue) {
        setStatus('error');
        setErrorMessage('Por favor, informe o PIN do telão.');
        triggerShake();
        inputRef.current?.focus();
        return;
      }

      setStatus('validating');
      setErrorMessage('');

      const cleanIp = getDefaultIp();
      const cleanPort = getDefaultPort();
      const baseUrl = buildBaseUrl(cleanIp, cleanPort);

      try {
        const data = await resolvePin(baseUrl, pinValue);

        setStatus('success');
        setResolvedRoom({
          roomId: data.roomId,
          roomName: data.roomName || 'Sala ao Vivo',
        });

        saveCredentials({
          ip: cleanIp,
          port: cleanPort,
          pin: pinValue,
          roomId: data.roomId,
          roomName: data.roomName || '',
          theme: {
            ...(data.theme || {}),
            name: themeId,
            type: themeId,
          },
        });

        // Aguarda 1s para o usuário visualizar a confirmação de sucesso
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(data.roomId);
          } else {
            router.push('/tv');
          }
        }, 1100);
      } catch (err: unknown) {
        setStatus('error');
        const msg =
          err instanceof Error
            ? err.message
            : 'PIN incorreto. O código informado não existe ou expirou.';
        setErrorMessage(msg);
        triggerShake();
        inputRef.current?.focus();
      }
    },
    [pin, themeId, router, onSuccess, triggerShake]
  );

  const handleKeyPress = (num: string) => {
    if (status === 'validating' || status === 'success') return;
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage('');
    }
    if (pin.length < 8) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        // Auto-valida ao atingir 4 dígitos se desejado
        inputRef.current?.focus();
      }
    }
  };

  const handleBackspace = () => {
    if (status === 'validating' || status === 'success') return;
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage('');
    }
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (status === 'validating' || status === 'success') return;
    setPin('');
    setStatus('idle');
    setErrorMessage('');
    inputRef.current?.focus();
  };

  const handleDemoPin = () => {
    setPin('1234');
    handleValidatePin('1234');
  };

  const primaryColor = isBlue ? '#087FFC' : '#FFDE38';
  const glowColor = isBlue ? 'rgba(8, 127, 252, 0.45)' : 'rgba(255, 222, 56, 0.45)';
  const cyanColor = isBlue ? '#17C8FF' : '#00E5FF';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      {/* Card Principal */}
      <div
        style={{
          width: '100%',
          backgroundColor: isBlue ? 'rgba(3, 17, 48, 0.92)' : 'rgba(6, 10, 40, 0.92)',
          border: `2px solid ${
            status === 'error'
              ? '#E52B21'
              : status === 'success'
              ? '#34D399'
              : focused
              ? primaryColor
              : 'rgba(255, 255, 255, 0.15)'
          }`,
          borderRadius: 24,
          padding: '28px 32px',
          boxSizing: 'border-box',
          boxShadow:
            status === 'error'
              ? '0 0 35px rgba(229, 43, 33, 0.45)'
              : status === 'success'
              ? '0 0 35px rgba(52, 211, 153, 0.45)'
              : `0 10px 40px ${glowColor}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          animation: isShaking ? 'bs-shake 0.5s ease-in-out' : 'none',
          transition: 'border-color 200ms ease, box-shadow 200ms ease',
        }}
      >
        {/* Título e Instrução */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 999,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: status === 'error' ? '#E52B21' : status === 'success' ? '#34D399' : primaryColor,
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF', letterSpacing: 1 }}>
              AUTENTICAÇÃO DO TELÃO
            </span>
          </div>
          <h2
            style={{
              margin: '4px 0 6px',
              fontSize: 26,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: 0.5,
            }}
          >
            DIGITE O PIN DO TELÃO
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255, 255, 255, 0.65)' }}>
            Informe o código de 4 a 6 dígitos para sintonizar a sala de sorteio ao vivo.
          </p>
        </div>

        {/* Display Visual dos Dígitos do PIN */}
        <div
          onClick={() => inputRef.current?.focus()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 20,
            cursor: 'text',
          }}
        >
          {Array.from({ length: Math.max(4, pin.length) }).map((_, idx) => {
            const digit = pin[idx];
            const isCurrent = idx === pin.length;
            const isFilled = digit !== undefined;

            return (
              <div
                key={idx}
                style={{
                  width: 58,
                  height: 68,
                  borderRadius: 14,
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  border: `2px solid ${
                    status === 'error'
                      ? '#E52B21'
                      : status === 'success'
                      ? '#34D399'
                      : isFilled
                      ? primaryColor
                      : isCurrent
                      ? cyanColor
                      : 'rgba(255, 255, 255, 0.15)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  fontWeight: 900,
                  color: status === 'error' ? '#FF6B6B' : status === 'success' ? '#34D399' : '#FFFFFF',
                  boxShadow:
                    isFilled && status !== 'error'
                      ? `0 0 16px ${glowColor}`
                      : isCurrent
                      ? `0 0 12px rgba(0, 229, 255, 0.3)`
                      : 'none',
                  transition: 'all 150ms ease',
                }}
              >
                {digit ?? (isCurrent ? <span style={{ opacity: 0.5 }}>|</span> : '')}
              </div>
            );
          })}
        </div>

        {/* Input Oculto para capturar digitação física */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
            setPin(val);
            if (status === 'error') {
              setStatus('idle');
              setErrorMessage('');
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleValidatePin();
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            height: 0,
            width: 0,
          }}
        />

        {/* Banner de Mensagem e Feedback */}
        {status === 'error' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 18px',
              borderRadius: 12,
              backgroundColor: 'rgba(229, 43, 33, 0.16)',
              border: '1.5px solid #E52B21',
              marginBottom: 20,
              boxShadow: '0 4px 20px rgba(229, 43, 33, 0.25)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: '#E52B21',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 900,
                color: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              ✕
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#FF6B6B', textTransform: 'uppercase' }}>
                PIN INCORRETO
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 }}>
                {errorMessage || 'O código informado não existe ou expirou. Verifique e tente novamente.'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              LIMPAR
            </button>
          </div>
        )}

        {status === 'success' && resolvedRoom && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 18px',
              borderRadius: 12,
              backgroundColor: 'rgba(52, 211, 153, 0.16)',
              border: '1.5px solid #34D399',
              marginBottom: 20,
              boxShadow: '0 4px 20px rgba(52, 211, 153, 0.25)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 900,
                color: '#000000',
                flexShrink: 0,
              }}
            >
              ✓
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#34D399', textTransform: 'uppercase' }}>
                PIN CONFIRMADO COM SUCESSO!
              </div>
              <div style={{ fontSize: 12, color: '#FFFFFF', marginTop: 2 }}>
                Sintonizando: <strong>{resolvedRoom.roomName}</strong> (#{resolvedRoom.roomId})
              </div>
            </div>
          </div>
        )}

        {/* Teclado Virtual Numérico Integrado (0-9 + Backspace + Limpar) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            maxWidth: 380,
            margin: '0 auto 20px',
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              disabled={status === 'validating' || status === 'success'}
              style={{
                height: 52,
                borderRadius: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                fontSize: 22,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 120ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)')}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            disabled={status === 'validating' || status === 'success' || pin.length === 0}
            style={{
              height: 52,
              borderRadius: 12,
              backgroundColor: 'rgba(229, 43, 33, 0.15)',
              border: '1px solid rgba(229, 43, 33, 0.3)',
              color: '#FF6B6B',
              fontSize: 13,
              fontWeight: 800,
              cursor: pin.length === 0 ? 'default' : 'pointer',
              opacity: pin.length === 0 ? 0.4 : 1,
            }}
          >
            LIMPAR
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            disabled={status === 'validating' || status === 'success'}
            style={{
              height: 52,
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: 22,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            disabled={status === 'validating' || status === 'success' || pin.length === 0}
            style={{
              height: 52,
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: 20,
              fontWeight: 800,
              cursor: pin.length === 0 ? 'default' : 'pointer',
              opacity: pin.length === 0 ? 0.4 : 1,
            }}
          >
            ⌫
          </button>
        </div>

        {/* Botão Principal de Conexão */}
        <button
          type="button"
          onClick={() => handleValidatePin()}
          disabled={status === 'validating' || status === 'success'}
          style={{
            width: '100%',
            height: 54,
            borderRadius: 14,
            backgroundColor: status === 'success' ? '#34D399' : primaryColor,
            border: 'none',
            color: isBlue && status !== 'success' ? '#FFFFFF' : '#000000',
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            cursor: status === 'validating' ? 'default' : 'pointer',
            boxShadow: `0 6px 20px ${glowColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 200ms ease',
            marginBottom: 16,
          }}
        >
          {status === 'validating' ? (
            <>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '3px solid rgba(0,0,0,0.2)',
                  borderTopColor: '#000000',
                  animation: 'bs-spin 700ms linear infinite',
                }}
              />
              VALIDANDO PIN...
            </>
          ) : status === 'success' ? (
            'CONECTADO COM SUCESSO!'
          ) : (
            'CONFIRMAR E CONECTAR TELÃO'
          )}
        </button>

        {/* Seção de Seleção de Temas */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: 18,
            marginTop: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>
              ESCOLHA O TEMA DO TELÃO:
            </span>
            <button
              type="button"
              onClick={handleDemoPin}
              style={{
                fontSize: 11,
                color: cyanColor,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                textDecoration: 'underline',
              }}
            >
              Usar PIN de Teste (1234)
            </button>
          </div>
          <ThemeSelector variant="cards" />
        </div>
      </div>
    </div>
  );
}

export default PinVerificationScreen;
