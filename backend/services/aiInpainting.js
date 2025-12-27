// ========================================
// MangaTrans - AI Inpainting Service
// Uses Replicate LAMA for professional text removal
// ========================================

const Replicate = require('replicate');
const axios = require('axios');
const sharp = require('sharp');
const Jimp = require('jimp');

// Replicate API Token
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

/**
 * Remove text from image using AI inpainting
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Array} textBlocks - Array of text blocks with bounds
 * @returns {Promise<Buffer>} - Cleaned image buffer
 */
async function removeTextWithAI(imageBuffer, textBlocks) {
    if (REPLICATE_API_TOKEN) {
        try {
            console.log('   🎨 Using Replicate LAMA for inpainting...');
            return await inpaintWithReplicate(imageBuffer, textBlocks);
        } catch (error) {
            console.warn('   ⚠️ Replicate failed:', error.message);
            console.log('   ⚠️ Falling back to gradient fill...');
        }
    } else {
        console.log('   ⚠️ No REPLICATE_API_TOKEN. Using fallback inpainting.');
    }

    return await fallbackInpaint(imageBuffer, textBlocks);
}

/**
 * Inpaint using Replicate LAMA model
 * Model: https://replicate.com/zylim0702/remove-object
 */
async function inpaintWithReplicate(imageBuffer, textBlocks) {
    const replicate = new Replicate({
        auth: REPLICATE_API_TOKEN
    });

    // Create mask
    const maskBuffer = await createMask(imageBuffer, textBlocks);

    // Convert buffers to base64 data URIs
    const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    const maskBase64 = `data:image/png;base64,${maskBuffer.toString('base64')}`;

    // Run LAMA model (andreasjansson/lama - Resolution-robust Large Mask Inpainting)
    const output = await replicate.run(
        "andreasjansson/lama:98ddf31e4276166ab93a90325492fd0cc7d23d9b012b1e42df08271708457008",
        {
            input: {
                image: imageBase64,
                mask: maskBase64
            }
        }
    );

    // Download result
    console.log('   ✅ LAMA inpainting complete!');
    const response = await axios.get(output, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
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
