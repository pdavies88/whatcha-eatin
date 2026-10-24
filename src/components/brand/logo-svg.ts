/**
 * The Whatcha Eatin' mark: a bitten orange disc locked inside rounded camera viewfinder corners, on a black tile.
 *
 * This file is the single source for the logo. The app renders it with `SvgXml`, and
 * `scripts/generate-brand-assets.mjs` renders the same markup to the app icon and splash PNGs.
 * Keep it free of imports so Node can load it directly.
 */

export const LOGO_ORANGE = '#FF6A2B';
export const LOGO_INK = '#0B0B0B';

export type LogoSvgOptions = {
  /** Corner radius of the tile in 64-unit space. Use 0 for the iOS icon, which iOS masks itself. */
  cornerRadius?: number;
  /** Draw the black tile. Turn off for the Android adaptive icon foreground. */
  withBackground?: boolean;
};

export function buildLogoSvg({ cornerRadius = 14, withBackground = true }: LogoSvgOptions = {}): string {
  const background = withBackground ? `<rect width="64" height="64" rx="${cornerRadius}" fill="${LOGO_INK}"/>` : '';

  // The disc is a circle (r 12.5 at 32,32) with a bite (r 6.5 at 42.5,22) cut from its top right.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  ${background}
  <path d="M13 21V13h8M43 13h8v8M51 43v8h-8M21 51h-8v-8" stroke="#FFFFFF" stroke-width="4.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M43.95 28.34A12.5 12.5 0 1 1 36.24 20.24A6.5 6.5 0 0 0 43.95 28.34Z" fill="${LOGO_ORANGE}"/>
</svg>`;
}
