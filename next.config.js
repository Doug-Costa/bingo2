/** @type {import('next').NextConfig} */

// Imagens e vozes têm nomes fixos: sem isto, a Vercel responde `max-age=0` e a TV
// confirma cada arquivo com o servidor antes de usar. Por 1 dia a TV usa a cópia
// local direto; depois atualiza em segundo plano, então um arquivo trocado chega
// às TVs em até 1 dia.
const ASSET_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';

module.exports = {
  // O i18next 26 é publicado com sintaxe nova (`?.`, `??`), que só roda em
  // Chrome/WebView 80+. Ele entra no layout de todas as telas, então em TV com
  // WebView mais antiga o JS inteiro falhava e a tela ficava em "Carregando…".
  // Compilar o pacote junto com o site deixa ele no mesmo nível do resto (Chrome 64+).
  transpilePackages: ['i18next'],
  // A Vercel restaura o cache do webpack do deploy anterior, e esse cache não
  // percebeu o transpilePackages: continuou publicando o i18next sem compilar.
  // O build de produção sem cache leva ~40s e sai sempre do código atual.
  webpack(config, { dev }) {
    if (!dev) config.cache = false;
    // Só para medir localmente (BENCH_PROFILE=1 next build): nomes legíveis dos
    // componentes no perfil. Nunca ligado no deploy.
    if (process.env.BENCH_PROFILE) config.optimization.minimize = false;
    return config;
  },
  compiler: {
    // O SSE registra cada evento com o payload inteiro, o que custa CPU e mantém
    // os objetos na memória do console do WebView.
    removeConsole: { exclude: ['error', 'warn'] },
  },
  async headers() {
    return ['/audio/:path*', '/themes/:path*', '/bingoshow-v2/:path*'].map((source) => ({
      source,
      headers: [{ key: 'Cache-Control', value: ASSET_CACHE }],
    }));
  },
};
