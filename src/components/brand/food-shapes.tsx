import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

/**
 * Simple flat food glyphs drawn on a 48×48 grid. Each returns SVG children (not a full <Svg>),
 * so many of them can share one canvas, which keeps the hero background cheap to render.
 */
type FoodShape = () => React.ReactElement;

const Apple: FoodShape = () => (
  <G>
    <Path
      d="M24 15c-3-3-9-3-12 1-4 5-2 14 2 19 3 4 6 5 10 3 4 2 7 1 10-3 4-5 6-14 2-19-3-4-9-4-12-1z"
      fill="#EF4444"
    />
    <Path d="M24 15c0-3 1-6 3-8" stroke="#7C4A1E" strokeWidth={2.5} strokeLinecap="round" fill="none" />
    <Ellipse cx={31} cy={10} rx={5} ry={2.5} fill="#22C55E" transform="rotate(-25 31 10)" />
  </G>
);

const Carrot: FoodShape = () => (
  <G>
    <Path d="M10 40 31 17c3-3 8 2 5 5L13 43c-2 1-4-1-3-3z" fill="#F97316" />
    <Path d="M19 33l3 3M24 27l3 3" stroke="#C2410C" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M34 15c1-5 4-8 8-9-1 4-3 7-8 9zM35 17c4-2 8-2 11 0-3 2-7 3-11 0z" fill="#16A34A" />
  </G>
);

const Avocado: FoodShape = () => (
  <G>
    <Path d="M24 5c-6 0-9 8-11 14-3 9 1 22 11 22s14-13 11-22C33 13 30 5 24 5z" fill="#15803D" />
    <Path d="M24 10c-4 0-7 7-8 11-2 7 1 16 8 16s10-9 8-16c-1-4-4-11-8-11z" fill="#BEF264" />
    <Circle cx={24} cy={27} r={6} fill="#92400E" />
  </G>
);

const FriedEgg: FoodShape = () => (
  <G>
    <Path d="M12 18c4-9 17-10 23-4 6 5 6 15 1 20-6 7-18 8-24 1-4-5-3-11 0-17z" fill="#FFFFFF" />
    <Circle cx={24} cy={25} r={7} fill="#FACC15" />
    <Circle cx={21.5} cy={22.5} r={2} fill="#FEF9C3" />
  </G>
);

const Banana: FoodShape = () => (
  <G>
    <Path d="M8 28c7 9 23 9 30-6l3 1c-5 17-26 21-35 8z" fill="#FACC15" />
    <Path d="M38 22l2-6 2 1-1 6z" fill="#854D0E" />
    <Path d="M11 30c7 6 18 6 25-2" stroke="#EAB308" strokeWidth={1.5} fill="none" />
  </G>
);

const PizzaSlice: FoodShape = () => (
  <G>
    <Path d="M7 12h34L24 43z" fill="#FDE68A" />
    <Rect x={6} y={8} width={36} height={6} rx={3} fill="#D97706" />
    <Circle cx={18} cy={20} r={3.5} fill="#DC2626" />
    <Circle cx={29} cy={21} r={3} fill="#DC2626" />
    <Circle cx={24} cy={31} r={3} fill="#DC2626" />
  </G>
);

const Broccoli: FoodShape = () => (
  <G>
    <Path d="M21 26h6l2 16h-10z" fill="#86EFAC" />
    <Circle cx={17} cy={20} r={7} fill="#16A34A" />
    <Circle cx={31} cy={20} r={7} fill="#16A34A" />
    <Circle cx={24} cy={13} r={8} fill="#22C55E" />
    <Circle cx={24} cy={23} r={6} fill="#15803D" />
  </G>
);

const Cherries: FoodShape = () => (
  <G>
    <Path d="M17 30c2-10 6-17 14-22M31 32c-1-9 0-17 0-24" stroke="#166534" strokeWidth={2} fill="none" strokeLinecap="round" />
    <Ellipse cx={34} cy={9} rx={5} ry={2.5} fill="#22C55E" transform="rotate(20 34 9)" />
    <Circle cx={16} cy={34} r={7} fill="#DC2626" />
    <Circle cx={32} cy={36} r={7} fill="#B91C1C" />
  </G>
);

export const FOOD_SHAPES: FoodShape[] = [Apple, Carrot, Avocado, FriedEgg, Banana, PizzaSlice, Broccoli, Cherries];
