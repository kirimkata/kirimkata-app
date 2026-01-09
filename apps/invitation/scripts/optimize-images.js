const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Directories
const inputDir = path.join(__dirname, '../public/images/raw');
const outputDir = path.join(__dirname, '../public/images/optimized');

// Ensure directories exist
if (!fs.existsSync(inputDir)) {
    fs.mkdirSync(inputDir, { recursive: true });
    console.log('📁 Created input directory: public/images/raw');
    console.log('ℹ️  Place your original images here');
    process.exit(0);
}

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Sizes configuration
const sizes = [
    { width: 640, suffix: '-sm', quality: 75 },   // Mobile
    { width: 828, suffix: '-md', quality: 80 },   // Tablet
    { width: 1200, suffix: '-lg', quality: 85 },  // Desktop
];

async function optimizeImage(inputPath) {
    const filename = path.basename(inputPath, path.extname(inputPath));
    const stats = fs.statSync(inputPath);
    const originalSize = (stats.size / 1024).toFixed(2);

    console.log(`\n🖼️  Processing: ${filename}`);
    console.log(`   Original size: ${originalSize} KB`);

    let totalSaved = 0;

    for (const size of sizes) {
        const outputPath = path.join(outputDir, `${filename}${size.suffix}.webp`);

        await sharp(inputPath)
            .resize(size.width, null, {
                fit: 'inside',
                withoutEnlargement: true,
                kernel: sharp.kernel.lanczos3
            })
            .webp({
                quality: size.quality,
                effort: 6 // Max compression effort
            })
            .toFile(outputPath);

        const outputStats = fs.statSync(outputPath);
        const outputSize = (outputStats.size / 1024).toFixed(2);
        const saved = stats.size - outputStats.size;
        totalSaved += saved;

        console.log(`   ✅ ${filename}${size.suffix}.webp (${size.width}px) - ${outputSize} KB`);
    }

    const percentSaved = ((totalSaved / (stats.size * sizes.length)) * 100).toFixed(1);
    console.log(`   💾 Saved: ${percentSaved}% per image`);
}

async function main() {
    console.log('🚀 Starting image optimization...\n');

    const files = fs.readdirSync(inputDir);
    const imageFiles = files.filter(file =>
        file.match(/\.(jpg|jpeg|png|webp)$/i)
    );

    if (imageFiles.length === 0) {
        console.log('⚠️  No images found in public/images/raw');
        console.log('   Supported formats: .jpg, .jpeg, .png, .webp');
        return;
    }

    console.log(`Found ${imageFiles.length} image(s) to optimize\n`);

    for (const file of imageFiles) {
        try {
            await optimizeImage(path.join(inputDir, file));
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
        }
    }

    console.log('\n✨ Optimization complete!');
    console.log(`📂 Optimized images saved to: ${outputDir}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Review optimized images');
    console.log('   2. Upload to CDN or use in your app');
    console.log('   3. Update image paths in your code');
}

main().catch(console.error);
