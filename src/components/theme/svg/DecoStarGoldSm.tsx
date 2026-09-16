/**
 * DecoStarGoldSm.tsx — porte de `tvapp1/src/components/theme/svg/DecoStarGoldSm.tsx`.
 * `react-native-svg` → SVG nativo do DOM, mesmo path/gradiente, nada alterado.
 */
export interface DecoStarGoldSmProps {
  size?: number;
}

export function DecoStarGoldSm({ size = 24 }: DecoStarGoldSmProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill="url(#star_gold_grad)"
        stroke="#FFFFFF"
        strokeWidth="1.2"
      />
      <defs>
        <linearGradient id="star_gold_grad" x1="12" y1="2" x2="12" y2="21.02" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF299" />
          <stop offset="0.5" stopColor="#FFBF33" />
          <stop offset="1" stopColor="#D9991A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default DecoStarGoldSm;
