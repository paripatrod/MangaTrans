// ========================================
// MangaTrans - AI Inpainting Service
// Uses gradient fill for text removal (No external API needed)
// ========================================

const sharp = require('sharp');
const Jimp = require('jimp');

/**
 * Remove text from image using gradient fill inpainting
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Array} textBlocks - Array of text blocks with bounds
 * @returns {Promise<Buffer>} - Cleaned image buffer
 */
async function removeTextWithAI(imageBuffer, textBlocks) {
    console.log('   🎨 Using gradient fill for text removal...');
    return await fallbackInpaint(imageBuffer, textBlocks);
}

/**
 * Create a mask image from text blocks
 * White = area to inpaint, Black = keep
 */
async function createMask(imageBuffer, textBlocks) {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width;
    const height = metadata.height;

    // Create black base mask
    const mask = await Jimp.create(width, height, 0x000000FF);

    // Draw white rectangles for each text block
    for (const block of textBlocks) {
        const { bounds } = block;
        if (!bounds) continue;

        const padding = 10;
        const x = Math.max(0, bounds.x - padding);
        const y = Math.max(0, bounds.y - padding);
        const w = Math.min(width - x, bounds.width + padding * 2);
        const h = Math.min(height - y, bounds.height + padding * 2);

        for (let py = y; py < y + h && py < height; py++) {
            for (let px = x; px < x + w && px < width; px++) {
                mask.setPixelColor(0xFFFFFFFF, px, py);
            }
        }
    }

    return await mask.getBufferAsync(Jimp.MIME_PNG);
}

/**
 * Fallback inpainting using gradient fill
 */
async function fallbackInpaint(imageBuffer, textBlocks) {
    const image = await Jimp.read(imageBuffer);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    for (const block of textBlocks) {
        const { bounds } = block;
        if (!bounds || bounds.width <= 0 || bounds.height <= 0) continue;

        const padding = 5;
        const x = Math.max(0, bounds.x - padding);
        const y = Math.max(0, bounds.y - padding);
        const w = Math.min(width - x, bounds.width + padding * 2);
        const h = Math.min(height - y, bounds.height + padding * 2);

        if (w > 0 && h > 0) {
            smartInpaint(image, x, y, w, h);
        }
    }

    return await image.getBufferAsync(Jimp.MIME_PNG);
}

/**
 * Smart Inpainting - Edge sampling with median color
 */
function smartInpaint(image, x, y, width, height) {
    const samples = [];

    // Sample edges
    for (let i = 0; i < 10; i++) {
        const tx = x + (width * i / 10);
        const ty = Math.max(0, y - 1);
        const by = Math.min(image.bitmap.height - 1, y + height);

        if (tx < image.bitmap.width && ty >= 0) {
            samples.push(Jimp.intToRGBA(image.getPixelColor(Math.floor(tx), ty)));
        }
        if (tx < image.bitmap.width && by < image.bitmap.height) {
            samples.push(Jimp.intToRGBA(image.getPixelColor(Math.floor(tx), by)));
        }

        const lx = Math.max(0, x - 1);
        const rx = Math.min(image.bitmap.width - 1, x + width);
        const ly = y + (height * i / 10);

        if (lx >= 0 && ly < image.bitmap.height) {
            samples.push(Jimp.intToRGBA(image.getPixelColor(lx, Math.floor(ly))));
        }
        if (rx < image.bitmap.width && ly < image.bitmap.height) {
            samples.push(Jimp.intToRGBA(image.getPixelColor(rx, Math.floor(ly))));
        }
    }

    if (samples.length === 0) {
        image.scan(x, y, width, height, function (px, py, idx) {
            this.bitmap.data[idx + 0] = 255;
            this.bitmap.data[idx + 1] = 255;
            this.bitmap.data[idx + 2] = 255;
            this.bitmap.data[idx + 3] = 255;
        });
        return;
    }

    samples.sort((a, b) => (a.r + a.g + a.b) - (b.r + b.g + b.b));
    const median = samples[Math.floor(samples.length / 2)];

    image.scan(x, y, width, height, function (px, py, idx) {
        this.bitmap.data[idx + 0] = median.r;
        this.bitmap.data[idx + 1] = median.g;
        this.bitmap.data[idx + 2] = median.b;
        this.bitmap.data[idx + 3] = 255;
    });
}

module.exports = {
    removeTextWithAI,
    createMask,
    fallbackInpaint
};
