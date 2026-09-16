/**
 * colors.ts — porte de `tvapp1/src/theme/colors.ts`.
 *
 * Só a paleta `bingoShow` (tema04) — o resto do arquivo original
 * (`bingoPrimary`, `lotoPrimary`, etc.) pertence a temas fora do escopo
 * desta migração (tema01/02/03) e não foi portado.
 */
export const Colors = {
  bingoShow: {
    backgroundPrimary: '#040826', // Azul espacial profundo (bg-space/bg-main)
    backgroundSecondary: '#0b1140', // Azul médio para sub-seções
    backgroundDeep: '#020412', // Fundo ultra-escuro para áreas de alto contraste
    surfacePrimary: '#0b1575', // Superfície de painéis principais
    surfaceSecondary: '#121f8a', // Superfície de elementos em evidência
    surfaceGlass: 'rgba(11,21,117,0.85)', // Painel de vidro fosco (glassmorphism)
    surfaceElevated: '#1c2aa6', // Superfícies flutuantes ou destacadas
    goldPrimary: '#ffde38', // Dourado principal para textos em destaque/logos
    goldSecondary: '#d38908', // Dourado escuro para gradientes de ouro
    goldLight: '#ffef49', // Dourado brilhante/neon
    bluePrimary: '#4868ff', // Azul principal do tema
    blueSecondary: '#1333f0', // Azul escuro das premiações
    blueNeon: '#00d54f', // Destaques em neon verde
    textPrimary: '#ffffff', // Texto principal de alto contraste
    textSecondary: '#c0d0ff', // Texto secundário — azul claro legível a distância
    textMuted: '#8fa8f8', // Texto muted — azul acinzentado legível
    textOnGold: '#040826', // Texto escuro sobreposto ao fundo dourado
    success: '#00d54f', // Verde neon de sucesso/bola sorteada
    warning: '#ffde38', // Dourado/Amarelo para aviso
    error: '#ff1f1f', // Vermelho neon para erro/bola excedida
    info: '#7ea0ff', // Azul brilhante para informações
    borderPrimary: '#ffde38', // Bordas douradas em destaque
    borderSecondary: '#4868ff', // Bordas azuis comuns
    borderGlow: 'rgba(72,104,255,0.5)', // Bordas com efeito de brilho neon azul
    overlay: 'rgba(4,8,38,0.75)', // Overlay para modais e popups
    scrim: 'rgba(0,0,0,0.85)', // Escurecimento total de fundo
    focus: '#ffde38', // Amarelo neon de foco para TV
    disabled: 'rgba(255,255,255,0.2)', // Estados desativados
  },
};

export default Colors;
