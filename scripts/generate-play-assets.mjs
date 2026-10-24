// Renders Google Play store listing images into store/android/.
// Run after changing the logo or retaking screenshots:  node scripts/generate-play-assets.mjs
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { buildLogoSvg } from '../src/components/brand/logo-svg.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const spaceGrotesk = (weight) =>
  join(root, `node_modules/@expo-google-fonts/space-grotesk/${weight}/SpaceGrotesk_${weight}.ttf`);

// Feature graphic: 1024 × 500, shown at the top of the Play listing. Matches the app's hero.
const LOGO_SIZE = 220;
const logo = buildLogoSvg().replace(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
  `<svg x="${150 - LOGO_SIZE / 2}" y="${250 - LOGO_SIZE / 2}" width="${LOGO_SIZE}" height="${LOGO_SIZE}" viewBox="0 0 64 64">`,
);

// A faint dot grid, the same texture as the app's hero.
const grid = Array.from({ length: 21 * 11 }, (_, i) => {
  const x = 12 + (i % 21) * 50;
  const y = 0 + Math.floor(i / 21) * 50;
  return `<circle cx="${x}" cy="${y}" r="1.6" fill="#FFFFFF" opacity="0.12"/>`;
}).join('');

const featureGraphic = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <rect width="1024" height="500" fill="#0B0B0B"/>
  ${grid}
  ${logo}
  <rect x="334" y="150" width="56" height="6" fill="#FF6A2B"/>
  <text x="330" y="245" font-family="Space Grotesk" font-weight="700" font-size="84" letter-spacing="-3" fill="#F5F5F2">WHATCHA EATIN’</text>
  <text x="334" y="305" font-family="Space Grotesk" font-weight="500" font-size="36" fill="#FF6A2B">Snap it. Type it. Scan it.</text>
  <text x="334" y="360" font-family="Space Grotesk" font-weight="500" font-size="26" fill="#9A9A95">Photo, text or barcode · no account</text>
</svg>`;

const outDir = join(root, 'store/android');
mkdirSync(outDir, { recursive: true });
const png = new Resvg(featureGraphic, {
  font: {
    fontFiles: [spaceGrotesk('700Bold'), spaceGrotesk('500Medium')],
    loadSystemFonts: false,
    defaultFontFamily: 'Space Grotesk',
  },
}).render().asPng();
writeFileSync(join(outDir, 'feature-graphic-1024x500.png'), png);
console.log('wrote store/android/feature-graphic-1024x500.png');

// Phone screenshots. Play rejects images whose long side is more than twice the short side.
// The iPhone shots are 1320 × 2868, so crop the iOS status bar off the top to get 1320 × 2640.
const iosDir = join(root, 'store/screenshots');
const shotsDir = join(outDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
const CROP_TOP = 228;
for (const file of readdirSync(iosDir).filter((name) => /^0\d-.*\.png$/.test(name))) {
  const data = readFileSync(join(iosDir, file)).toString('base64');
  const cropped = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1320" height="2640">
    <image x="0" y="-${CROP_TOP}" width="1320" height="2868" xlink:href="data:image/png;base64,${data}"/>
  </svg>`;
  writeFileSync(join(shotsDir, file), new Resvg(cropped).render().asPng());
  console.log(`wrote store/android/screenshots/${file}`);
}
