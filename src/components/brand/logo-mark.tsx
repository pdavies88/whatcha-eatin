import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { APP_NAME } from '@/constants/brand';

const DAYS = 7;
const CENTER = 32;
const DOT_RADIUS_FROM_CENTER = 25;

/**
 * The Seven Plates mark: a plate on a green tile, ringed by seven dots for the seven days
 * the app remembers. The last dot (today) is highlighted.
 */
export function LogoMark({ size = 72 }: { size?: number }) {
  const dots = Array.from({ length: DAYS }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / DAYS;
    return {
      cx: CENTER + DOT_RADIUS_FROM_CENTER * Math.cos(angle),
      cy: CENTER + DOT_RADIUS_FROM_CENTER * Math.sin(angle),
      isToday: index === DAYS - 1,
    };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityRole="image" accessibilityLabel={`${APP_NAME} logo`}>
      <Rect width={64} height={64} rx={16} fill="#16A34A" />
      <Circle cx={CENTER} cy={CENTER} r={18} fill="#FFFFFF" />
      <Circle cx={CENTER} cy={CENTER} r={13} fill="none" stroke="#DCFCE7" strokeWidth={2} />
      {/* Sprout in the middle of the plate. */}
      <Path d="M32 39v-9" stroke="#15803D" strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M32 31c-1-5-5-7-9-6 1 4 4 7 9 6z" fill="#22C55E" />
      <Path d="M32 31c1-6 5-8 10-7-1 5-5 8-10 7z" fill="#16A34A" />
      {dots.map((dot, index) => (
        <Circle
          key={index}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.isToday ? 3.2 : 2.4}
          fill={dot.isToday ? '#FACC15' : '#FFFFFF'}
          opacity={dot.isToday ? 1 : 0.6}
        />
      ))}
    </Svg>
  );
}
