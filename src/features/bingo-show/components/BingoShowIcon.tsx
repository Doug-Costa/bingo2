/**
 * BingoShowIcon.tsx — porte de `tvapp1/src/features/bingo-show/components/BingoShowIcon.tsx`.
 * `react-native-svg` → SVG nativo do DOM, mesmos paths/gradientes/máscaras,
 * nenhum ícone redesenhado. `<Mask fill="white">` (RN) → `<mask>` com um
 * `<rect>` branco de fundo (equivalente exato: SVG `<mask>` usa luminância,
 * branco = totalmente visível).
 */
export type BingoShowIconName =
  | 'money-bag'
  | 'coins'
  | 'hourglass'
  | 'calendar'
  | 'clock'
  | 'sound'
  | 'speaker-off'
  | 'star'
  | 'heart'
  | 'bingo-ball'
  | 'dollar'
  | 'gift'
  | 'jackpot'
  | 'notification'
  | 'pause'
  | 'play'
  | 'ranking'
  | 'refresh'
  | 'settings'
  | 'stop'
  | 'ticket'
  | 'user'
  | 'wallet'
  | 'winner'
  | 'shield'
  | 'clover';

export interface BingoShowIconProps {
  name: BingoShowIconName;
  size?: number;
  color?: string;
  /** Renderiza somente o glifo, sem o fundo escuro arredondado do asset original. */
  transparentBg?: boolean;
}

function IconBg({ show }: { show: boolean }) {
  return show ? <rect width="80" height="80" rx="12" fill="#0F142E" fillOpacity={0.8} /> : null;
}

export function BingoShowIcon({ name, size = 24, color, transparentBg = false }: BingoShowIconProps) {
  const bg = !transparentBg;

  switch (name) {
    case 'money-bag':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <ellipse cx={40} cy={44} rx={18} ry={16} fill="url(#paint_moneybag)" />
          <rect x={32} y={18} width={16} height={12} rx={4} fill="#D9A626" />
          <rect x={34} y={34} width={12} height={12} rx={2} fill="#996600" />
          <defs>
            <linearGradient id="paint_moneybag" x1="40" y1="28" x2="40" y2="60" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFE666" />
              <stop offset={1} stopColor="#D9991A" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'coins':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <circle cx={29} cy={43} r={14} fill="#FFD600" stroke="#CC9900" strokeWidth={2} />
          <circle cx={45} cy={37} r={14} fill="#FFE64D" stroke="#D9A600" strokeWidth={2} />
        </svg>
      );

    case 'dollar':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <circle cx={40} cy={40} r={19} fill="#26994D" stroke="#33CC66" strokeWidth={2} />
        </svg>
      );

    case 'hourglass':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <rect x={26} y={16} width={28} height={20} rx={4} fill="#FFD600" />
          <rect x={26} y={42} width={28} height={20} rx={4} fill="#D9A600" />
          <rect x={36} y={35} width={8} height={8} transform="rotate(-45 36 35)" fill={color ?? '#FFE666'} />
        </svg>
      );

    case 'calendar':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <rect x={23} y={25} width={34} height={30} rx={5} fill="#264080" stroke={color ?? '#3BBAFF'} strokeWidth={2} />
          <rect x={22} y={22} width={36} height={10} fill={color ?? '#3BBAFF'} />
        </svg>
      );

    case 'clock':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <circle cx={40} cy={40} r={17.75} fill="black" stroke={color ?? '#3BBAFF'} strokeWidth={2.5} />
          <rect x={39} y={26} width={2} height={14} fill={color ?? '#3BBAFF'} />
          <rect x={40} y={36} width={10} height={2} fill={color ?? '#3BBAFF'} />
        </svg>
      );

    case 'sound':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <rect x={24} y={30} width={14} height={20} rx={2} fill={color ?? '#FFFFFF'} />
          <mask id="mask-sound-1">
            <rect width="80" height="80" fill="white" />
            <path d="M48 33.0718C49.2162 33.7739 50.2261 34.7838 50.9282 36C51.6304 37.2162 52 38.5957 52 40C52 41.4043 51.6304 42.7838 50.9282 44C50.2261 45.2162 49.2162 46.2261 48 46.9282L44 40L48 33.0718Z" fill="black" />
          </mask>
          <path
            d="M48 33.0718C49.2162 33.7739 50.2261 34.7838 50.9282 36C51.6304 37.2162 52 38.5957 52 40C52 41.4043 51.6304 42.7838 50.9282 44C50.2261 45.2162 49.2162 46.2261 48 46.9282L44 40L48 33.0718Z"
            stroke={color ?? '#FFFFFF'}
            strokeOpacity={0.8}
            strokeWidth={4}
            mask="url(#mask-sound-1)"
          />
          <mask id="mask-sound-2">
            <rect width="80" height="80" fill="white" />
            <path d="M55.5 28.7417C57.4762 29.8827 59.1173 31.5238 60.2583 33.5C61.3993 35.4762 62 37.718 62 40C62 42.282 61.3993 44.5238 60.2583 46.5C59.1173 48.4762 57.4762 50.1173 55.5 51.2583L49 40L55.5 28.7417Z" fill="black" />
          </mask>
          <path
            d="M55.5 28.7417C57.4762 29.8827 59.1173 31.5238 60.2583 33.5C61.3993 35.4762 62 37.718 62 40C62 42.282 61.3993 44.5238 60.2583 46.5C59.1173 48.4762 57.4762 50.1173 55.5 51.2583L49 40L55.5 28.7417Z"
            stroke={color ?? '#FFFFFF'}
            strokeOpacity={0.6}
            strokeWidth={4}
            mask="url(#mask-sound-2)"
          />
          <mask id="mask-sound-3">
            <rect width="80" height="80" fill="white" />
            <path d="M63 24.4115C65.7363 25.9914 68.0086 28.2637 69.5885 31C71.1683 33.7363 72 36.8403 72 40C72 43.1597 71.1683 46.2637 69.5885 49C68.0086 51.7363 65.7363 54.0086 63 55.5885L54 40L63 24.4115Z" fill="black" />
          </mask>
          <path
            d="M63 24.4115C65.7363 25.9914 68.0086 28.2637 69.5885 31C71.1683 33.7363 72 36.8403 72 40C72 43.1597 71.1683 46.2637 69.5885 49C68.0086 51.7363 65.7363 54.0086 63 55.5885L54 40L63 24.4115Z"
            stroke={color ?? '#FFFFFF'}
            strokeOpacity={0.4}
            strokeWidth={4}
            mask="url(#mask-sound-3)"
          />
        </svg>
      );

    case 'speaker-off':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <rect x={26} y={30} width={14} height={20} rx={2} fill="#80808C" />
          <rect x={24} y={38} width={32} height={3} transform="rotate(45 24 38)" fill="#FF4D4D" />
        </svg>
      );

    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <path d="M40 22L44.0413 34.4377H57.119L46.5389 42.1246L50.5801 54.5623L40 46.8754L29.4199 54.5623L33.4611 42.1246L22.881 34.4377H35.9587L40 22Z" fill={color ?? '#FFD600'} />
        </svg>
      );

    case 'heart':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <circle cx={33} cy={33} r={11} fill={color ?? '#FF4059'} />
          <circle cx={47} cy={33} r={11} fill={color ?? '#FF4059'} />
          <rect x={26} y={30} width={28} height={28} transform="rotate(-45 26 30)" fill={color ?? '#FF4059'} />
        </svg>
      );

    case 'bingo-ball':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <circle cx={40} cy={40} r={19} fill="url(#paint_bingoball)" />
          <defs>
            <radialGradient id="paint_bingoball" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24.8 28.6) scale(19)">
              <stop stopColor="#80B3FF" />
              <stop offset={1} stopColor="#264DB3" />
            </radialGradient>
          </defs>
        </svg>
      );

    case 'gift':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <rect x={23} y={32} width={34} height={26} rx={4} fill="#CC2633" />
          <rect x={21} y={24} width={38} height={10} rx={3} fill="#E63340" />
          <rect x={38} y={24} width={4} height={34} fill="#FFD600" />
        </svg>
      );

    case 'jackpot':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <rect x={20} y={23} width={40} height={34} rx={6} fill="url(#paint_jackpot)" />
          <defs>
            <linearGradient id="paint_jackpot" x1="40" y1="23" x2="40" y2="57" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFD94D" />
              <stop offset={1} stopColor="#E68C00" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'notification':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <ellipse cx={40} cy={34} rx={15} ry={14} fill={color ?? '#3BBAFF'} />
          <rect x={23} y={46} width={34} height={6} rx={3} fill={color ?? '#3BBAFF'} />
          <circle cx={40} cy={56} r={4} fill={color ?? '#3BBAFF'} />
        </svg>
      );

    case 'pause':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <rect x={28} y={26} width={8} height={28} rx={2} fill={color ?? '#FFFFFF'} />
          <rect x={44} y={26} width={8} height={28} rx={2} fill={color ?? '#FFFFFF'} />
        </svg>
      );

    case 'play':
      return (
        <svg width={size} height={(size * 83) / 80} viewBox="0 0 80 83" fill="none">
          <rect y={2.12} width={80} height={80} rx={12} fill={bg ? '#0F142E' : 'none'} fillOpacity={bg ? 0.8 : 0} />
          <path d="M28 12.1244L52 3.43323e-05V24.2487L28 12.1244Z" fill={color ?? '#FFFFFF'} />
        </svg>
      );

    case 'ranking':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <rect x={22} y={22} width={10} height={34} rx={2} fill="#3BBAFF" />
          <rect x={36} y={32} width={10} height={24} rx={2} fill="#FFD600" />
          <rect x={50} y={42} width={10} height={14} rx={2} fill="#3BBAFF" />
        </svg>
      );

    case 'refresh':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <mask id="mask-refresh">
            <rect width="80" height="80" fill="white" />
            <path d="M56 40C56 43.1645 55.0616 46.2579 53.3035 48.8891C51.5454 51.5203 49.0466 53.5711 46.1229 54.7821C43.1993 55.9931 39.9823 56.3099 36.8786 55.6926C33.7749 55.0752 30.9239 53.5513 28.6863 51.3137C26.4487 49.0761 24.9248 46.2251 24.3074 43.1214C23.6901 40.0177 24.0069 36.8007 25.2179 33.8771C26.4289 30.9534 28.4797 28.4546 31.1109 26.6965C33.7421 24.9384 36.8355 24 40 24V40H56Z" fill="black" />
          </mask>
          <path
            d="M56 40C56 43.1645 55.0616 46.2579 53.3035 48.8891C51.5454 51.5203 49.0466 53.5711 46.1229 54.7821C43.1993 55.9931 39.9823 56.3099 36.8786 55.6926C33.7749 55.0752 30.9239 53.5513 28.6863 51.3137C26.4487 49.0761 24.9248 46.2251 24.3074 43.1214C23.6901 40.0177 24.0069 36.8007 25.2179 33.8771C26.4289 30.9534 28.4797 28.4546 31.1109 26.6965C33.7421 24.9384 36.8355 24 40 24V40H56Z"
            stroke={color ?? '#FFFFFF'}
            strokeWidth={6}
            mask="url(#mask-refresh)"
          />
        </svg>
      );

    case 'settings':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <circle cx={40} cy={40} r={10} fill="#808CA6" />
          <circle cx={40} cy={40} r={17} fill="black" stroke="#808CA6" strokeWidth={2} />
        </svg>
      );

    case 'shield':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <path d="M40 20L58 27V41C58 53 51 60 40 64C29 60 22 53 22 41V27L40 20Z" fill={color ?? '#3BBAFF'} fillOpacity={0.22} stroke={color ?? '#3BBAFF'} strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M32 40L38 46L50 33" stroke={color ?? '#3BBAFF'} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    case 'clover':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <circle cx={31} cy={31} r={11} fill={color ?? '#33CC66'} />
          <circle cx={49} cy={31} r={11} fill={color ?? '#33CC66'} />
          <circle cx={31} cy={49} r={11} fill={color ?? '#33CC66'} />
          <circle cx={49} cy={49} r={11} fill={color ?? '#33CC66'} />
          <rect x={38.5} y={48} width={3} height={16} rx={1.5} fill="#1F8A44" />
        </svg>
      );

    case 'stop':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <rect x={26} y={26} width={28} height={28} rx={4} fill={color ?? '#FFFFFF'} />
        </svg>
      );

    case 'ticket':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <rect x={25} y={21} width={30} height={38} rx={3} fill="#1F2E59" stroke={color ?? '#3BBAFF'} strokeWidth={2} />
        </svg>
      );

    case 'user':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <circle cx={40} cy={25} r={9} fill={color ?? '#FFFFFF'} />
          <rect x={25} y={40} width={30} height={16} rx={8} fill={color ?? '#FFFFFF'} />
        </svg>
      );

    case 'wallet':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <rect x={21} y={26} width={38} height={28} rx={5} fill="#4D3399" stroke="#804DE6" strokeWidth={2} />
          <circle cx={57} cy={40} r={5} fill="#FFD600" />
        </svg>
      );

    case 'winner':
      return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
          <IconBg show={bg} />
          <rect x={26} y={20} width={28} height={24} rx={4} fill="#FFD600" />
          <rect x={30} y={48} width={20} height={6} rx={2} fill="#D9A600" />
          <rect x={37} y={42} width={6} height={8} fill="#E6B300" />
        </svg>
      );

    default:
      return null;
  }
}

export default BingoShowIcon;
