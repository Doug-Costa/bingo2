/**
 * i18n — textos da TV em português (padrão), espanhol e inglês.
 *
 * Instância própria do i18next, inicializada de forma síncrona com os
 * dicionários embutidos (sem backend/HTTP). Os componentes não usam a língua
 * "global" do i18next: pegam um tradutor fixo no idioma da TV com `useT()`
 * (TvConfigContext), o que evita re-render por evento e hydration mismatch.
 *
 * Chave nova: adicionar nos três arquivos de `locales/` — o tipo do `pt-BR`
 * é a referência, então faltar chave em `es`/`en` é erro de compilação.
 */
import { createInstance } from 'i18next';
import ptBR from './locales/pt-BR';
import es from './locales/es';
import en from './locales/en';

export const i18n = createInstance();

void i18n.init({
  resources: {
    'pt-BR': { translation: ptBR },
    es: { translation: es },
    en: { translation: en },
  },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});
