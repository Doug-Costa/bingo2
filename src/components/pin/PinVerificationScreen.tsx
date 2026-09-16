'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { resolvePin, pingServer } from '@/services/api';
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
  const [serverIp, setServerIp] = useState(getDefaultIp());
  const [serverPort, setServerPort] = useState(getDefaultPort());
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [pingStatus, setPingStatus] = useState<{ testing: boolean; ok?: boolean; message?: string } | null>(null);

  const [status, setStatus] = useState<PinStatus>('idle');
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isServerUnreachable, setIsServerUnreachable] = useState(false);
  const [resolvedRoom, setResolvedRoom] = useState<{ roomId: string; roomName: string } | null>(null);
  const [focused, setFocused] = useState(true);
  const [isShaking, setIsShaking] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Carrega credenciais salvas anteriormente se houver
  useEffect(() => {
    const creds = getCredentials();
    if (creds) {
      if (creds.pin && !initialPin) {
        setPin(creds.pin);
      }
      if (creds.ip) {
        setServerIp(creds.ip);
      }
      if (creds.port !== undefined) {
        setServerPort(creds.port);
      }
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

  const handleTestConnection = async () => {
    const baseUrl = buildBaseUrl(serverIp.trim() || getDefaultIp(), serverPort.trim());
    setPingStatus({ testing: true });
    const res = await pingServer(baseUrl);
    setPingStatus({ testing: false, ok: res.ok, message: res.message });
  };

  const handleValidatePin = useCallback(
    async (pinToValidate?: string) => {
      const pinValue = (pinToValidate ?? pin).trim();

      if (!pinValue) {
        setStatus('error');
        setErrorTitle('PIN NÃO INFORMADO');
        setErrorMessage('Por favor, informe o PIN do telão.');
        setIsServerUnreachable(false);
        triggerShake();
        inputRef.current?.focus();
        return;
      }

      setStatus('validating');
      setErrorTitle('');
      setErrorMessage('');
      setIsServerUnreachable(false);

      const cleanIp = serverIp.trim() || getDefaultIp();
      const cleanPort = serverPort.trim();
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
        const rawMsg = err instanceof Error ? err.message : 'Falha na validação do PIN.';
        
        // Distingue erro de servidor offline / timeout vs PIN incorreto
        if (
          rawMsg.includes('Servidor offline') ||
          rawMsg.includes('Não foi possível conectar') ||
          rawMsg.includes('Tempo de resposta esgotado') ||
          rawMsg.includes('522') ||
          rawMsg.includes('Cloudflare')
        ) {
          setErrorTitle('SERVIDOR SEM RESPOSTA');
          setErrorMessage(rawMsg);
          setIsServerUnreachable(true);
          setShowServerConfig(true); // Abre as configurações de servidor para o usuário verificar a URL
        } else {
          setErrorTitle('PIN INCORRETO');
          setErrorMessage(rawMsg);
          setIsServerUnreachable(false);
        }

        triggerShake();
        inputRef.current?.focus();
      }
    },
    [pin, serverIp, serverPort, themeId, router, onSuccess, triggerShake]
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
              padding: '14px 18px',
              borderRadius: 12,
              backgroundColor: isServerUnreachable ? 'rgba(255, 170, 0, 0.16)' : 'rgba(229, 43, 33, 0.16)',
              border: `1.5px solid ${isServerUnreachable ? '#FFAA00' : '#E52B21'}`,
              marginBottom: 20,
              boxShadow: isServerUnreachable
                ? '0 4px 20px rgba(255, 170, 0, 0.25)'
                : '0 4px 20px rgba(229, 43, 33, 0.25)',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: isServerUnreachable ? '#FFAA00' : '#E52B21',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 900,
                color: isServerUnreachable ? '#000000' : '#FFFFFF',
                flexShrink: 0,
              }}
            >
              {isServerUnreachable ? '⚠️' : '✕'}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: isServerUnreachable ? '#FFD54F' : '#FF6B6B',
                  textTransform: 'uppercase',
                }}
              >
                {errorTitle || 'PIN INCORRETO'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', marginTop: 2, lineHeight: 1.4 }}>
                {errorMessage || 'O código informado não existe ou expirou no servidor.'}
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
              VALIDANDO PIN NO SERVIDOR...
            </>
          ) : status === 'success' ? (
            'CONECTADO COM SUCESSO!'
          ) : (
            'CONFIRMAR E CONECTAR TELÃO'
          )}
        </button>

        {/* Configurações de Servidor (URL / IP e Porta) */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: 14,
            marginTop: 8,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => setShowServerConfig((prev) => !prev)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>
                ⚙️ ENDEREÇO DO SERVIDOR (IP / DOMÍNIO)
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'monospace',
                }}
              >
                {buildBaseUrl(serverIp, serverPort)}
              </span>
            </div>
            <span style={{ fontSize: 12, color: cyanColor, fontWeight: 700 }}>
              {showServerConfig ? '▲ Ocultar' : '▼ Alterar'}
            </span>
          </div>

          {showServerConfig && (
            <div
              style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 12,
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 3 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 4 }}>
                    IP / URL DO BACKEND
                  </label>
                  <input
                    type="text"
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    placeholder="https://backend.bingotiopatinhas.com ou http://192.168.1.X"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 4 }}>
                    PORTA (OPCIONAL)
                  </label>
                  <input
                    type="text"
                    value={serverPort}
                    onChange={(e) => setServerPort(e.target.value)}
                    placeholder="3000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={pingStatus?.testing}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    backgroundColor: 'rgba(0, 229, 255, 0.15)',
                    border: '1px solid rgba(0, 229, 255, 0.35)',
                    color: cyanColor,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: pingStatus?.testing ? 'default' : 'pointer',
                  }}
                >
                  {pingStatus?.testing ? 'Testando Servidor...' : '🔌 Testar Conexão com Servidor'}
                </button>

                {pingStatus && !pingStatus.testing && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: pingStatus.ok ? '#34D399' : '#FF6B6B',
                    }}
                  >
                    {pingStatus.ok ? '✓ ' : '✕ '} {pingStatus.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Seção de Seleção de Temas */}
        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: 14,
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
