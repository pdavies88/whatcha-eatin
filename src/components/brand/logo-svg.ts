/**
 * The Whatcha Eatin' mark: a hungry plate with a fork tucked behind it, on a warm gradient tile.
 *
 * This file is the single source for the logo. The app renders it with `SvgXml`, and
 * `scripts/generate-brand-assets.ts` renders the same markup to the app icon and splash PNGs.
 * Keep it free of imports so Node can load it directly.
 */

const INK = '#2B1B17';

export type LogoSvgOptions = {
  /** Corner radius of the tile in 64-unit space. Use 0 for the iOS icon, which iOS masks itself. */
  cornerRadius?: number;
  /** Draw the gradient tile. Turn off for the Android adaptive icon foreground. */
  withBackground?: boolean;
};

export function buildLogoSvg({ cornerRadius = 16, withBackground = true }: LogoSvgOptions = {}): string {
  const background = withBackground
    ? `<defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFA24C"/>
      <stop offset="1" stop-color="#FF5C7A"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="${cornerRadius}" fill="url(#tile)"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  ${background}
  <path d="M13 9l1.6 4.4L19 15l-4.4 1.6L13 21l-1.6-4.4L7 15l4.4-1.6z" fill="#FFF3B0"/>
  <circle cx="21" cy="7.5" r="1.4" fill="#FFF3B0"/>
  <g transform="rotate(18 47 26)">
    <rect x="45.6" y="15" width="2.8" height="22" rx="1.4" fill="#FFFFFF"/>
    <path d="M42 9v7a5 5 0 0 0 10 0V9" stroke="#FFFFFF" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M47 9v13" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>
  </g>
  <circle cx="30" cy="37" r="19" fill="#FFFFFF"/>
  <circle cx="30" cy="37" r="14.5" fill="none" stroke="#FFE1D2" stroke-width="2"/>
  <circle cx="24.5" cy="33" r="3.6" fill="${INK}"/>
  <circle cx="35.5" cy="33" r="3.6" fill="${INK}"/>
  <circle cx="25.9" cy="31.7" r="1.25" fill="#FFFFFF"/>
  <circle cx="36.9" cy="31.7" r="1.25" fill="#FFFFFF"/>
  <ellipse cx="20" cy="40.2" rx="3" ry="1.8" fill="#FF8FA3" opacity="0.75"/>
  <ellipse cx="40" cy="40.2" rx="3" ry="1.8" fill="#FF8FA3" opacity="0.75"/>
  <path d="M25 40.5q5 6 10 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <ellipse cx="33.4" cy="43.6" rx="1.9" ry="1.5" fill="#FF6B81"/>
</svg>`;
}
