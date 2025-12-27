// ========================================
// MangaTrans - Canvas Text Renderer
// Memory-optimized for 512MB servers
// ========================================

const { createCanvas, registerFont, Image } = require('canvas');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Register Thai fonts from @fontsource/sarabun
const FONT_PATH = path.join(__dirname, '../node_modules/@fontsource/sarabun/files');

let fontsRegistered = false;

// Pre-load wordcut once
let wordcutInstance = null;
function getWordcut() {
    if (!wordcutInstance) {
        wordcutInstance = require('wordcut');
        wordcutInstance.init();
    }
    return wordcutInstance;
}

function registerFonts() {
    if (fontsRegistered) return;

    try {
        const fonts = [
            { file: 'sarabun-thai-400-normal.woff', family: 'Sarabun', weight: 'normal' },
            { file: 'sarabun-thai-700-normal.woff', family: 'Sarabun', weight: 'bold' },
        ];

        for (const font of fonts) {
            const fontPath = path.join(FONT_PATH, font.file);
            if (fs.existsSync(fontPath)) {
                registerFont(fontPath, { family: font.family, weight: font.weight });
                console.log(`✅ Registered font: ${font.file}`);
            }
        }

        fontsRegistered = true;
    } catch (error) {
        console.warn('⚠️ Font registration failed:', error.message);
    }
}

/**
 * Render translated text onto image using Canvas API
 * Memory-optimized version
 */
async function renderTextWithCanvas(imageBuffer, textBlocks) {
    registerFonts();

    // Get image dimensions (use raw() to avoid extra memory)
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw base image
    const img = new Image();
    img.src = imageBuffer;
    ctx.drawImage(img, 0, 0);

    // Clear reference to help GC
    img.src = null;

    // Draw each text block
    for (const block of textBlocks) {
        try {
            const { bounds, translatedText } = block;

            if (!translatedText || translatedText.trim() === '') continue;
            if (!bounds || bounds.width <= 0 || bounds.height <= 0) continue;

            // Calculate font size
            const area = bounds.width * bounds.height;
            const textLen = translatedText.length;

            let fontSize = Math.sqrt(area) / 6;
            if (textLen > 30) fontSize *= 0.8;
            if (textLen > 50) fontSize *= 0.7;
            if (textLen > 80) fontSize *= 0.6;
            if (fontSize < 14) fontSize = 14;
            if (fontSize > 48) fontSize = 48;

            // Detect emphasis
            const isShout = translatedText.includes('!') || (translatedText.length < 5 && !translatedText.includes(' '));
            const fontWeight = isShout ? 'bold' : 'normal';

            // Set font
            ctx.font = `${fontWeight} ${fontSize}px Sarabun, Arial, sans-serif`;
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Word wrap
            const maxWidth = bounds.width - 10;
            const lines = wrapText(ctx, translatedText, maxWidth);

            // Shrink font if too many lines
            const lineHeight = fontSize * 1.3;
            const maxLines = Math.floor(bounds.height / lineHeight);
            if (lines.length > maxLines && maxLines > 0) {
                const scale = maxLines / lines.length;
                fontSize = Math.max(12, fontSize * scale);
                ctx.font = `${fontWeight} ${fontSize}px Sarabun, Arial, sans-serif`;
                lines.length = 0;
                lines.push(...wrapText(ctx, translatedText, maxWidth));
            }

            // Calculate Y position for vertical centering
            const totalHeight = lines.length * lineHeight;
            let y = bounds.y + (bounds.height - totalHeight) / 2 + lineHeight / 2;

            const centerX = bounds.x + bounds.width / 2;

            // Draw each line
            for (const line of lines) {
                ctx.fillText(line, centerX, y);
                y += lineHeight;
            }

        } catch (err) {
            console.warn('Error rendering text block:', err.message);
        }
    }

    // Return as JPEG (smaller than PNG) with compression
    const result = canvas.toBuffer('image/png');

    // Help garbage collector
    canvas.width = 0;
    canvas.height = 0;

    return result;
}

/**
 * Wrap text to fit within maxWidth
 */
function wrapText(ctx, text, maxWidth) {
    const wordcut = getWordcut();
    const segmented = wordcut.cut(text);
    const words = segmented.split('|').filter(w => w.length > 0);

    if (words.length <= 1 && text.length > 0) {
        // Fallback: simple character wrap
        words.length = 0;
        for (let i = 0; i < text.length; i += 5) {
            words.push(text.substring(i, i + 5));
        }
    }

    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine + word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
}

module.exports = {
    renderTextWithCanvas,
    registerFonts
};
