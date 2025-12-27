// ========================================
// MangaTrans - Font Manager
// Downloads and manages Thai fonts for SVG rendering
// ========================================

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const FONT_DIR = path.join(__dirname, '../fonts');
const FONT_URL = 'https://github.com/nicholasc/noto-sans-thai/raw/master/fonts/NotoSansThai-Regular.ttf';
const FONT_FILE = path.join(FONT_DIR, 'NotoSansThai-Regular.ttf');

let cachedFontBase64 = null;

/**
 * Ensure the Thai font is downloaded and ready
 */
async function ensureFont() {
    // Create fonts directory if not exists
    if (!fs.existsSync(FONT_DIR)) {
        fs.mkdirSync(FONT_DIR, { recursive: true });
    }

    // Download font if not exists
    if (!fs.existsSync(FONT_FILE)) {
        console.log('📥 Downloading Noto Sans Thai font...');
        try {
            const response = await axios.get(FONT_URL, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            fs.writeFileSync(FONT_FILE, Buffer.from(response.data));
            console.log('✅ Font downloaded successfully!');
        } catch (error) {
            console.error('❌ Failed to download font:', error.message);
            // Use fallback - the font may not be available but we continue
            return null;
        }
    }

    return FONT_FILE;
}

/**
 * Get font as base64 for embedding in SVG
 */
async function getFontBase64() {
    if (cachedFontBase64) return cachedFontBase64;

    const fontPath = await ensureFont();
    if (!fontPath || !fs.existsSync(fontPath)) {
        return null;
    }

    const fontBuffer = fs.readFileSync(fontPath);
    cachedFontBase64 = fontBuffer.toString('base64');
    return cachedFontBase64;
}

/**
 * Create SVG style with embedded font (works offline in sharp)
 */
async function createFontStyle(fontSize, fontWeight, color) {
    const fontBase64 = await getFontBase64();

    if (!fontBase64) {
        // Fallback to system fonts
        return `
            .text { 
                font-family: Arial, Helvetica, sans-serif; 
                font-weight: ${fontWeight};
                fill: ${color};
                font-size: ${fontSize}px;
            }
        `;
    }

    return `
        @font-face {
            font-family: 'ThaiFont';
            src: url('data:font/truetype;base64,${fontBase64}') format('truetype');
            font-weight: normal;
        }
        .text { 
            font-family: 'ThaiFont', Arial, sans-serif; 
            font-weight: ${fontWeight};
            fill: ${color};
            font-size: ${fontSize}px;
        }
    `;
}

module.exports = {
    ensureFont,
    getFontBase64,
    createFontStyle,
    FONT_DIR,
    FONT_FILE
};
