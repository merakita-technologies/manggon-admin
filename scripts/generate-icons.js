// Script untuk generate PWA icons dari logo1.png
// Install sharp: npm install sharp --save-dev
// Run: node scripts/generate-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const inputFile = path.join(__dirname, '../public/logo1.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  try {
    // Check if logo exists
    if (!fs.existsSync(inputFile)) {
      console.error('logo1.png not found in public folder');
      return;
    }

    for (const size of sizes) {
      const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 248, g: 245, b: 242, alpha: 1 } // Putih Gading background
        })
        .png()
        .toFile(outputFile);
      
      console.log(`✓ Generated icon-${size}x${size}.png`);
    }

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();

