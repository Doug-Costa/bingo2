/**
 * Icon.tsx — porte de `tvapp1/src/components/Icon.tsx`.
 *
 * Porte quase 1:1: `react-native-svg` (`Svg/Path/Circle/Rect`) mapeia
 * direto para SVG nativo do DOM (`svg/path/circle/rect`) — mesmos nomes de
 * atributo (`strokeWidth`, `strokeLinecap`, `strokeLinejoin`,
 * `strokeDasharray`, `fill`, `stroke`), nenhum path/valor alterado.
 */
import { alphaColor } from '@/theme/themes';

export type IconName =
  | 'trophy'
  | 'calendar'
  | 'clock'
  | 'dice'
  | 'crown'
  | 'ticket'
  | 'jackpot'
  | 'volume-on'
  | 'volume-off'
  | 'globe'
  | 'logout'
  | 'star'
  | 'fire'
  | 'check'
  | 'grid'
  | 'sparkle'
  | 'user'
  | 'cards';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 20, color = '#ffffff' }: IconProps) {
  switch (name) {
    case 'trophy':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
          <path d="M18 4H6v7a6 6 0 0 0 12 0V4z" fill={alphaColor(color, '22')} />
        </svg>
      );

    case 'calendar':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
        </svg>
      );

    case 'clock':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );

    case 'dice':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="8.5" cy="8.5" r="1.5" fill={color} />
          <circle cx="15.5" cy="8.5" r="1.5" fill={color} />
          <circle cx="12" cy="12" r="1.5" fill={color} />
          <circle cx="8.5" cy="15.5" r="1.5" fill={color} />
          <circle cx="15.5" cy="15.5" r="1.5" fill={color} />
        </svg>
      );

    case 'crown':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4l3 12h14l3-12-6 7-4-8-4 8-6-7z" fill={alphaColor(color, '33')} />
          <path d="M5 20h14" />
        </svg>
      );

    case 'ticket':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9a3 3 0 0 1 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 1 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3z" />
          <path d="M13 5v14" strokeDasharray="2 2" />
        </svg>
      );

    case 'jackpot':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12l4 6-10 12L2 9l4-6z" fill={alphaColor(color, '33')} />
          <path d="M11 3l1 18" />
          <path d="M2 9h20" />
        </svg>
      );

    case 'volume-on':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      );

    case 'volume-off':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M23 9l-6 6" />
          <path d="M17 9l6 6" />
        </svg>
      );

    case 'globe':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );

    case 'logout':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );

    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );

    case 'fire':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2c1 3 2.5 3.5 3.5 6 1.5 3.5.5 7.5-2.5 9-1.5.8-3.5.8-5 0-3-1.5-4-5.5-2.5-9C6.5 5.5 8 5 9 2c1 2 2 2 3 0z" fill={alphaColor(color, '44')} />
        </svg>
      );

    case 'check':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      );

    case 'grid':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );

    case 'sparkle':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1">
          <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
        </svg>
      );

    case 'user':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );

    case 'cards':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="14" height="15" rx="2" fill={alphaColor(color, '22')} />
          <path d="M6 3h12a2 2 0 0 1 2 2v12" />
        </svg>
      );

    default:
      return null;
  }
}

export default Icon;
