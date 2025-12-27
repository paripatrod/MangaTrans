// ========================================
// MangaTrans - Font Manager
// Uses Arial fallback for server-side SVG rendering
// (Sharp/librsvg doesn't support web fonts without local install)
// ========================================

const fs = require('fs');
const path = require('path');

const FONT_DIR = path.join(__dirname, '../fonts');

let fontChecked = false;

/**
 * Ensure fonts directory exists
 */
async function ensureFont() {
    if (fontChecked) return null;

    // Create fonts directory if not exists
    if (!fs.existsSync(FONT_DIR)) {
        fs.mkdirSync(FONT_DIR, { recursive: true });
    }

    fontChecked = true;
    return null; // No custom font - use system fallbacks
}

/**
 * Get font as base64 for embedding in SVG
 * Returns null - we use system font fallbacks instead
 */
async function getFontBase64() {
    return null; // Use system fallbacks
}

/**
 * Create SVG style - uses Arial which is available on most systems
 * For Thai text on Linux servers without Thai fonts, text may render as boxes
 * but this is the most reliable cross-platform approach
 */
async function createFontStyle(fontSize, fontWeight, color) {
    // Use a font stack that works across platforms
    // Arial for Latin, system fonts for Thai (if available)
    return `
        .text { 
            font-family: Arial, Helvetica, "Noto Sans Thai", "Sarabun", sans-serif; 
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
    FONT_DIR
};
