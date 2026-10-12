// Renders Google Play store listing images into store/android/.
// Run after changing the logo or retaking screenshots:  node scripts/generate-play-assets.mjs
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

import { buildLogoSvg } from '../src/components/brand/logo-svg.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fredoka = (weight) =>
  join(root, `node_modules/@expo-google-fonts/fredoka/${weight}/Fredoka_${weight}.ttf`);

// Feature graphic: 1024 × 500, shown at the top of the Play listing. Matches the app's hero.
const LOGO_SIZE = 220;
const logo = buildLogoSvg().replace(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
  `<svg x="${150 - LOGO_SIZE / 2}" y="${250 - LOGO_SIZE / 2}" width="${LOGO_SIZE}" height="${LOGO_SIZE}" viewBox="0 0 64 64">`,
);

const dots = [
  [520, 70, 10, '#FFB37A'], [960, 90, 14, '#FF8FA3'], [880, 430, 12, '#FFD36E'],
  [610, 450, 8, '#9ED9A0'], [40, 60, 9, '#FFD36E'], [70, 455, 12, '#9ED9A0'],
  [990, 300, 7, '#FFB37A'], [330, 470, 8, '#FF8FA3'],
];

const featureGraphic = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <rect width="1024" height="500" fill="#FFF1E4"/>
  ${dots.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="0.7"/>`).join('\n  ')}
  <circle cx="150" cy="250" r="140" fill="#FFFFFF"/>
  ${logo}
  <text x="330" y="235" font-family="Fredoka" font-weight="700" font-size="84" fill="#2B1B17">Whatcha Eatin’</text>
  <text x="334" y="305" font-family="Fredoka" font-weight="500" font-size="38" fill="#C9401F">Snap a meal. See your macros.</text>
  <text x="334" y="360" font-family="Fredoka" font-weight="500" font-size="28" fill="#6B5A55">Photos or barcodes · daily targets · no account</text>
</svg>`;

const outDir = join(root, 'store/android');
mkdirSync(outDir, { recursive: true });
const png = new Resvg(featureGraphic, {
  font: { fontFiles: [fredoka('700Bold'), fredoka('500Medium')], loadSystemFonts: false, defaultFontFamily: 'Fredoka' },
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
