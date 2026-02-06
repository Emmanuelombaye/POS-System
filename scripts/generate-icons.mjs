/**
 * PWA Icon Generator Script
 * Run this to generate all required icon sizes from the base SVG
 * 
 * Usage: node scripts/generate-icons.mjs
 * 
 * For production, you should use a proper tool like:
 * - https://realfavicongenerator.net/
 * - pwa-asset-generator package
 * 
 * For now, we'll create simple placeholder PNGs using Canvas or ImageMagick
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Create SVG template for each size
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c2d12;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#991b1b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="${size / 2}" y="${size * 0.68}" font-family="Arial, sans-serif" font-size="${size * 0.55}" font-weight="bold" fill="#fbbf24" text-anchor="middle">E</text>
</svg>`;
};

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons for each size
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  const svgContent = createSVGIcon(size);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✓ Generated ${filename}`);
});

console.log('\n✅ Icon generation complete!');
console.log('\n📝 Note: For production, convert SVGs to PNGs using:');
console.log('   - Online tool: https://realfavicongenerator.net/');
console.log('   - Or: npm install -D pwa-asset-generator');
console.log('   - Or: Use ImageMagick/Sharp to convert SVGs to PNGs\n');
