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
 *
 * `es-loteriai`: só as chaves que o tema Loteria'i troca; o resto cai no `es`.
 */
import { createInstance } from 'i18next';
import ptBR from './locales/pt-BR';
import es from './locales/es';
import esLoteriai from './locales/es-loteriai';

/** Código interno do vocabulário do Loteria'i (não é um idioma de verdade). */
export const LOTERIAI_ES_LNG = 'es-loteriai';

export const i18n = createInstance();

void i18n.init({
  resources: {
    'pt-BR': { translation: ptBR },
    es: { translation: es },
    [LOTERIAI_ES_LNG]: { translation: esLoteriai },
  },
  lng: 'pt-BR',
  fallbackLng: { [LOTERIAI_ES_LNG]: ['es', 'pt-BR'], default: ['pt-BR'] },
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});
