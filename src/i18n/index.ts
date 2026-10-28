/**
 * i18n — textos da TV em português (padrão) e espanhol.
 *
 * Instância própria do i18next, inicializada de forma síncrona com os
 * dicionários embutidos (sem backend/HTTP). Os componentes não usam a língua
 * "global" do i18next: pegam um tradutor fixo no idioma da TV com `useT()`
 * (TvConfigContext), o que evita re-render por evento e hydration mismatch.
 *
 * Chave nova: adicionar nos dois arquivos de `locales/` — o tipo do `pt-BR`
 * é a referência, então faltar chave em `es` é erro de compilação.
 */
import { createInstance } from 'i18next';
import ptBR from './locales/pt-BR';
import es from './locales/es';

export const i18n = createInstance();

void i18n.init({
  resources: {
    'pt-BR': { translation: ptBR },
    es: { translation: es },
  },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});
