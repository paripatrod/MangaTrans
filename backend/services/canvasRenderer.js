// ========================================
// MangaTrans - Canvas Text Renderer
// Uses node-canvas with system fallback
// ========================================

const { createCanvas, registerFont, Image } = require('canvas');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Font paths
const FONT_DIR = path.join(__dirname, '../fonts');
const THAI_FONT_PATH = path.join(FONT_DIR, 'NotoSansThai-Regular.ttf');
const THAI_FONT_URL = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansThai/NotoSansThai-Regular.ttf';

let fontsRegistered = false;
let fontDownloadAttempted = false;

// Pre-load wordcut once
let wordcutInstance = null;
function getWordcut() {
    if (!wordcutInstance) {
        wordcutInstance = require('wordcut');
        wordcutInstance.init();
    }
    return wordcutInstance;
}

/**
 * Download font file if not exists
 */
async function downloadFont() {
    if (fontDownloadAttempted) return fs.existsSync(THAI_FONT_PATH);
    fontDownloadAttempted = true;

    // Create fonts directory
    if (!fs.existsSync(FONT_DIR)) {
        fs.mkdirSync(FONT_DIR, { recursive: true });
    }

    // Check if font already exists
    if (fs.existsSync(THAI_FONT_PATH)) {
        console.log('✅ Thai font already exists');
        return true;
    }

    console.log('📥 Downloading Noto Sans Thai font...');

    return new Promise((resolve) => {
        const file = fs.createWriteStream(THAI_FONT_PATH);

        const request = https.get(THAI_FONT_URL, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                https.get(response.headers.location, (res) => {
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log('✅ Font downloaded successfully');
                        resolve(true);
                    });
                }).on('error', (err) => {
                    console.error('❌ Font download redirect failed:', err.message);
                    fs.unlink(THAI_FONT_PATH, () => { });
                    resolve(false);
                });
                return;
            }

            if (response.statusCode !== 200) {
                console.error('❌ Font download failed: HTTP', response.statusCode);
                resolve(false);
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('✅ Font downloaded successfully');
                resolve(true);
            });
        });

        request.on('error', (err) => {
            console.error('❌ Font download error:', err.message);
            fs.unlink(THAI_FONT_PATH, () => { });
            resolve(false);
        });

        // Timeout after 10 seconds
        request.setTimeout(10000, () => {
            request.destroy();
            console.error('❌ Font download timeout');
            resolve(false);
        });
    });
}

async function registerFonts() {
    if (fontsRegistered) return;

    try {
        // Try to download Thai font
        const fontDownloaded = await downloadFont();

        if (fontDownloaded && fs.existsSync(THAI_FONT_PATH)) {
            try {
                registerFont(THAI_FONT_PATH, { family: 'NotoSansThai', weight: 'normal' });
                console.log('✅ Registered font: NotoSansThai');
            } catch (e) {
                console.warn('⚠️ Failed to register NotoSansThai:', e.message);
            }
        }

        fontsRegistered = true;
    } catch (error) {
        console.warn('⚠️ Font registration failed:', error.message);
        fontsRegistered = true; // Don't retry
    }
}

/**
 * Render translated text onto image using Canvas API
 */
async function renderTextWithCanvas(imageBuffer, textBlocks) {
    await registerFonts();

    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw base image
    const img = new Image();
    img.src = imageBuffer;
    ctx.drawImage(img, 0, 0);
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

            const isShout = translatedText.includes('!') || (translatedText.length < 5 && !translatedText.includes(' '));
            const fontWeight = isShout ? 'bold' : 'normal';

            // Use NotoSansThai if available, fallback to system fonts
            ctx.font = `${fontWeight} ${fontSize}px NotoSansThai, "Noto Sans Thai", Sarabun, Arial, sans-serif`;
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const maxWidth = bounds.width - 10;
            const lines = wrapText(ctx, translatedText, maxWidth);

            const lineHeight = fontSize * 1.3;
            const maxLines = Math.floor(bounds.height / lineHeight);
            if (lines.length > maxLines && maxLines > 0) {
                const scale = maxLines / lines.length;
                fontSize = Math.max(12, fontSize * scale);
                ctx.font = `${fontWeight} ${fontSize}px NotoSansThai, "Noto Sans Thai", Sarabun, Arial, sans-serif`;
                lines.length = 0;
                lines.push(...wrapText(ctx, translatedText, maxWidth));
            }

            const totalHeight = lines.length * lineHeight;
            let y = bounds.y + (bounds.height - totalHeight) / 2 + lineHeight / 2;
            const centerX = bounds.x + bounds.width / 2;

            for (const line of lines) {
                ctx.fillText(line, centerX, y);
                y += lineHeight;
            }

        } catch (err) {
            console.warn('Error rendering text block:', err.message);
        }
    }

    const result = canvas.toBuffer('image/png');
    canvas.width = 0;
    canvas.height = 0;

    return result;
}

function wrapText(ctx, text, maxWidth) {
    const wordcut = getWordcut();
    const segmented = wordcut.cut(text);
    const words = segmented.split('|').filter(w => w.length > 0);

    if (words.length <= 1 && text.length > 0) {
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
