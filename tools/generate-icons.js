const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const resBase = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');
const appIconSvg = path.join(projectRoot, 'app-icon.svg');

// Read background color from values
const bgXmlPath = path.join(resBase, 'values', 'ic_launcher_background.xml');
let bgColor = '#08090f';
try {
  const bgXml = fs.readFileSync(bgXmlPath, 'utf8');
  const m = bgXml.match(/<color\s+name="[^"]+">(#[0-9A-Fa-f]+)<\/color>/);
  if (m) bgColor = m[1];
} catch (e) {}

// Foreground SVG — logo on transparent background, sized for adaptive icon (108dp canvas, content in safe zone)
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="432" height="432">
  <g transform="translate(54, 52) scale(1.9)">
    <path d="M -18 -14 Q -18 -18 -14 -18 L 14 -18 Q 18 -18 18 -14 L 18 6 Q 18 10 14 10 L -4 10 L -10 18 L -8 10 L -14 10 Q -18 10 -18 6 Z"
          fill="white" opacity="0.25"/>
    <rect x="-9" y="-2" width="4" height="10" rx="2" fill="white"/>
    <rect x="-2" y="-6" width="4" height="14" rx="2" fill="white"/>
    <rect x="5" y="-4" width="4" height="12" rx="2" fill="white"/>
  </g>
</svg>`;

// Mipmap sizes for launcher icons (non-adaptive fallback)
const launcherSizes = [
  { dir: 'mipmap-mdpi',    size: 48  },
  { dir: 'mipmap-hdpi',    size: 72  },
  { dir: 'mipmap-xhdpi',   size: 96  },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

// Foreground sizes for adaptive icons (108dp at each density)
const foregroundSizes = [
  { dir: 'mipmap-mdpi',    size: 108 },
  { dir: 'mipmap-hdpi',    size: 162 },
  { dir: 'mipmap-xhdpi',   size: 216 },
  { dir: 'mipmap-xxhdpi',  size: 324 },
  { dir: 'mipmap-xxxhdpi', size: 432 },
];

async function generate() {
  // Read app-icon.svg for launcher icons
  const svgBuffer = fs.readFileSync(appIconSvg);

  console.log('Generating launcher icons from app-icon.svg...');
  for (const s of launcherSizes) {
    const outDir = path.join(resBase, s.dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // ic_launcher.png — full icon from app-icon.svg
    await sharp(svgBuffer)
      .resize(s.size, s.size)
      .png()
      .toFile(path.join(outDir, 'ic_launcher.png'));

    // ic_launcher_round.png — same image (Android masks to circle)
    await sharp(svgBuffer)
      .resize(s.size, s.size)
      .png()
      .toFile(path.join(outDir, 'ic_launcher_round.png'));

    console.log(`  ${s.dir}: ic_launcher.png + ic_launcher_round.png (${s.size}px)`);
  }

  // Generate foreground PNGs for adaptive icons
  console.log('\nGenerating adaptive icon foregrounds...');
  const fgBuffer = Buffer.from(foregroundSvg);
  for (const s of foregroundSizes) {
    const outDir = path.join(resBase, s.dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    await sharp(fgBuffer)
      .resize(s.size, s.size)
      .png()
      .toFile(path.join(outDir, 'ic_launcher_foreground.png'));

    console.log(`  ${s.dir}: ic_launcher_foreground.png (${s.size}px)`);
  }

  // Update adaptive icon XMLs to use mipmap PNG foreground
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

  const anydpiDir = path.join(resBase, 'mipmap-anydpi-v26');
  if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml);
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml);
  console.log('\n  mipmap-anydpi-v26: adaptive icon XMLs updated (@mipmap/ic_launcher_foreground)');

  // Remove old vector drawable foreground (we use PNG now)
  const oldVectorFg = path.join(resBase, 'drawable', 'ic_launcher_foreground.xml');
  if (fs.existsSync(oldVectorFg)) {
    fs.unlinkSync(oldVectorFg);
    console.log('  Removed drawable/ic_launcher_foreground.xml (using PNG instead)');
  }

  console.log('\nIcon generation complete!');
}

generate().catch(err => { console.error(err); process.exit(1); });
