// ========================================
// MangaTrans - Advanced Image Translator
// Professional-grade manga/manhwa translation
// Features:
// - Google Cloud Vision OCR with positioning
// - Context-aware translation
// - Smart text bubble detection
// - Thai font rendering with proper styling
// - Auto text sizing to fit bubbles
// ========================================

const axios = require('axios');
const Jimp = require('jimp');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// API Key
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Thai font path (will be downloaded if not exists)
const FONT_DIR = path.join(__dirname, '../fonts');
const FONT_SIZES = {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 48
};

// Ensure output directory exists
const OUTPUT_DIR = path.join(__dirname, '../output');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Main translation function
 * @param {string} imageUrl - URL of the image to translate
 * @param {string} sourceLang - Source language code (ko, ja, zh, en)
 * @param {string} targetLang - Target language code (th)
 * @param {string} jobId - Unique job ID
 * @param {number} pageNumber - Page number
 * @param {string} referer - Original manga page URL for headers
 * @returns {Promise<{translatedPath: string, hasText: boolean}>}
 */
async function translateImage(imageUrl, sourceLang, targetLang, jobId, pageNumber, referer) {
    console.log(`📖 Processing page ${pageNumber}: ${imageUrl.substring(0, 60)}...`);

    try {
        // 1. Download image (Converted to PNG via Sharp)
        const imageBuffer = await downloadImage(imageUrl, referer);

        // 2. Perform OCR to get text and positions
        const ocrResult = await performOCR(imageBuffer, sourceLang);

        if (!ocrResult.textBlocks || ocrResult.textBlocks.length === 0) {
            console.log(`   ℹ️ No text found on page ${pageNumber}`);
            // Save original image
            const outputPath = await saveImage(imageBuffer, jobId, pageNumber, 'original');
            return { translatedPath: outputPath, hasText: false };
        }

        console.log(`   📝 Found ${ocrResult.textBlocks.length} text blocks`);

        // 2.5 Filter out non-speech bubbles (SFX/Background text)
        // User wants to keep background text original.
        const speechBubbles = await filterSpeechBubbles(imageBuffer, ocrResult.textBlocks);
        console.log(`   💬 Identified ${speechBubbles.length} speech bubbles (filtered ${ocrResult.textBlocks.length - speechBubbles.length} SFX/Background)`);

        if (speechBubbles.length === 0) {
            console.log(`   ℹ️ No speech bubbles found on page ${pageNumber}`);
            const outputPath = await saveImage(imageBuffer, jobId, pageNumber, 'original');
            return { translatedPath: outputPath, hasText: false };
        }

        // 3. Translate ONLY speech bubbles
        const translatedBlocks = await translateTextBlocks(speechBubbles, sourceLang, targetLang);

        // 4. Render translated text on image
        const translatedBuffer = await renderTranslatedText(imageBuffer, translatedBlocks);

        // 5. Save and return
        const outputPath = await saveImage(translatedBuffer, jobId, pageNumber, 'translated');

        console.log(`   ✅ Page ${pageNumber} completed`);
        return { translatedPath: outputPath, hasText: true };

    } catch (error) {
        console.error(`   ❌ Error on page ${pageNumber}:`, error.message);
        throw error;
    }
}

/**
 * Download image from URL and convert to PNG if necessary
 */
async function downloadImage(url, referer) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': referer || new URL(url).origin + '/',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site'
            }
        });

        let buffer = Buffer.from(response.data);

        // Use Sharp to convert any input format (WebP, AVIF, JPEG) to PNG
        // This solves the "Unsupported MIME type" error in Jimp
        try {
            buffer = await sharp(buffer).png().toBuffer();
        } catch (sharpError) {
            console.warn('   ⚠️ Sharp conversion failed, using original buffer:', sharpError.message);
        }

        return buffer;
    } catch (error) {
        // Retry logic for 403/404 errors (sometimes removing referer helps)
        if (error.response?.status === 403 || error.response?.status === 404) {
            if (referer) {
                console.log('   Retrying download without referer...');
                return downloadImage(url, null);
            }
        }
        throw error;
    }
}

/**
 * Perform OCR using Google Cloud Vision API
 */
async function performOCR(imageBuffer, sourceLang) {
    const base64Image = imageBuffer.toString('base64');

    const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
        {
            requests: [{
                image: { content: base64Image },
                features: [
                    { type: 'TEXT_DETECTION', maxResults: 100 },
                    { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
                ],
                imageContext: {
                    languageHints: [sourceLang]
                }
            }]
        },
        { timeout: 60000 }
    );

    const result = response.data.responses[0];

    if (!result.textAnnotations || result.textAnnotations.length === 0) {
        return { textBlocks: [] };
    }

    // Skip first annotation (full text) and process individual blocks
    const textBlocks = [];
    const annotations = result.textAnnotations.slice(1);

    // Group nearby text into blocks
    const groups = groupTextAnnotations(annotations);

    for (const group of groups) {
        const vertices = group.boundingBox;
        const text = group.text;

        textBlocks.push({
            text: text,
            bounds: {
                x: vertices.minX,
                y: vertices.minY,
                width: vertices.maxX - vertices.minX,
                height: vertices.maxY - vertices.minY
            },
            confidence: group.confidence || 0.9
        });
    }

    return { textBlocks };
}

/**
 * Group nearby text annotations into logical speech bubbles
 * Uses aggressive spatial clustering to merge all text within a bubble
 */
function groupTextAnnotations(annotations) {
    if (annotations.length === 0) return [];

    // 1. Extract all bounding boxes
    const boxes = annotations.map((ann, idx) => {
        const v = ann.boundingPoly.vertices;
        return {
            idx,
            text: ann.description,
            minX: Math.min(...v.map(p => p.x || 0)),
            maxX: Math.max(...v.map(p => p.x || 0)),
            minY: Math.min(...v.map(p => p.y || 0)),
            maxY: Math.max(...v.map(p => p.y || 0))
        };
    });

    // 2. Find connected components (boxes that overlap or are very close)
    const parent = boxes.map((_, i) => i);

    function find(i) {
        if (parent[i] !== i) parent[i] = find(parent[i]);
        return parent[i];
    }

    function union(i, j) {
        const pi = find(i), pj = find(j);
        if (pi !== pj) parent[pi] = pj;
    }

    // 3. Merge boxes that are close together (within 100px gap)
    const GAP_THRESHOLD = 100; // Pixels - aggressive grouping for speech bubbles

    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i], b = boxes[j];

            // Calculate gap between boxes
            const xGap = Math.max(0, Math.max(a.minX, b.minX) - Math.min(a.maxX, b.maxX));
            const yGap = Math.max(0, Math.max(a.minY, b.minY) - Math.min(a.maxY, b.maxY));

            // If boxes overlap OR gap is small, merge them
            if (xGap < GAP_THRESHOLD && yGap < GAP_THRESHOLD) {
                union(i, j);
            }
        }
    }

    // 4. Group boxes by their root parent
    const clusters = new Map();
    for (let i = 0; i < boxes.length; i++) {
        const root = find(i);
        if (!clusters.has(root)) clusters.set(root, []);
        clusters.get(root).push(boxes[i]);
    }

    // 5. Create merged groups
    const groups = [];
    for (const cluster of clusters.values()) {
        // Sort by Y position (top to bottom), then X (left to right)
        cluster.sort((a, b) => {
            if (Math.abs(a.minY - b.minY) < 20) return a.minX - b.minX; // Same line
            return a.minY - b.minY; // Different line
        });

        // Merge bounding boxes
        const minX = Math.min(...cluster.map(b => b.minX));
        const maxX = Math.max(...cluster.map(b => b.maxX));
        const minY = Math.min(...cluster.map(b => b.minY));
        const maxY = Math.max(...cluster.map(b => b.maxY));

        // Combine text in reading order
        const text = cluster.map(b => b.text).join(' ');

        groups.push({
            text,
            boundingBox: { minX, maxX, minY, maxY },
            annotations: cluster.map(b => annotations[b.idx])
        });
    }

    console.log(`   📦 Grouped ${annotations.length} words into ${groups.length} speech bubbles`);
    return groups;
}

/**
 * Translate text blocks using Google Translate API
 */
const { translateWithGemini } = require('./geminiTranslator');

// ... existing code ...

/**
 * Translate text blocks using Gemini 2.0 Flash (God Tier)
 */
async function translateTextBlocks(textBlocks, sourceLang, targetLang) {
    const translatedBlocks = [];

    // Batch translate for efficiency and context
    const textsToTranslate = textBlocks.map(b => b.text);

    // Use Gemini for SOTA translation
    const translations = await translateWithGemini(textsToTranslate, sourceLang, targetLang);

    for (let i = 0; i < textBlocks.length; i++) {
        translatedBlocks.push({
            ...textBlocks[i],
            translatedText: translations[i] || textBlocks[i].text
        });
    }

    return translatedBlocks;
}

/**
 * Render translated text onto image with AI Inpainting and Sharp SVG Overlay
 * Uses embedded base64 Thai font for reliable server-side rendering
 */
async function renderTranslatedText(imageBuffer, textBlocks) {
    const { removeTextWithAI } = require('./aiInpainting');
    const { createFontStyle } = require('./fontManager');

    // 1. Use AI Inpainting to remove original text
    console.log('   🎨 Removing original text...');
    const cleanedBuffer = await removeTextWithAI(imageBuffer, textBlocks);

    // Get image dimensions
    const metadata = await sharp(cleanedBuffer).metadata();
    const imgWidth = metadata.width;
    const imgHeight = metadata.height;

    // 2. Create SVG overlays for translated text
    const svgPromises = textBlocks.map(async (block) => {
        try {
            const { bounds, translatedText } = block;

            if (!translatedText || translatedText.trim() === '') return null;
            if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;

            // IMPROVED Font Size Calculation
            // Consider both area AND text length for optimal sizing
            const area = bounds.width * bounds.height;
            const textLen = translatedText.length;

            // Base size from area
            let fontSize = Math.sqrt(area) / 6;

            // Adjust for text length (longer text = smaller font)
            if (textLen > 30) fontSize *= 0.8;
            if (textLen > 50) fontSize *= 0.7;
            if (textLen > 80) fontSize *= 0.6;

            // Clamp to reasonable range
            if (fontSize < 14) fontSize = 14;
            if (fontSize > 48) fontSize = 48;

            // Estimate chars per line
            const charWidth = fontSize * 0.6; // Thai chars are roughly 60% of height
            const maxCharsPerLine = Math.max(1, Math.floor(bounds.width / charWidth));
            const lines = splitTextToLines(translatedText, maxCharsPerLine);

            // If too many lines, shrink font
            const maxLines = Math.floor(bounds.height / (fontSize * 1.3));
            if (lines.length > maxLines && maxLines > 0) {
                const scale = maxLines / lines.length;
                fontSize = Math.max(12, fontSize * scale);
                // Recalculate lines with new font size
                const newMaxChars = Math.max(1, Math.floor(bounds.width / (fontSize * 0.6)));
                lines.length = 0;
                lines.push(...splitTextToLines(translatedText, newMaxChars));
            }

            // Calculate vertical centering
            const lineHeight = 1.25;
            const totalTextHeight = lines.length * lineHeight * fontSize;
            let startY = (bounds.height - totalTextHeight) / 2 + fontSize * 0.85; // Adjust for baseline

            if (startY < fontSize) startY = fontSize;

            // Detect if shout/emphasis
            const isShout = translatedText.includes('!') || (translatedText.length < 5 && !translatedText.includes(' '));
            const fontWeight = isShout ? '700' : 'normal';
            const color = 'black';

            // Get embedded font style (with base64 font if available)
            const fontStyle = await createFontStyle(fontSize, fontWeight, color);

            // Construct SVG with tspans for each line
            const tspanLines = lines.map((line, i) => {
                const escaped = escapeHtml(line);
                const dy = i === 0 ? 0 : `${lineHeight}em`;
                return `<tspan x="50%" dy="${dy}">${escaped}</tspan>`;
            }).join('');

            // SVG with embedded base64 font
            const svg = `
            <svg width="${bounds.width}" height="${bounds.height}" viewBox="0 0 ${bounds.width} ${bounds.height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <style type="text/css">
                        ${fontStyle}
                    </style>
                </defs>
                <text x="50%" y="${startY}" text-anchor="middle" class="text">
                    ${tspanLines}
                </text>
            </svg>
            `;

            return {
                input: Buffer.from(svg),
                top: Math.round(bounds.y),
                left: Math.round(bounds.x)
            };
        } catch (err) {
            console.warn('Error creating SVG composite:', err.message);
            return null;
        }
    });

    const svgComposites = (await Promise.all(svgPromises)).filter(x => x !== null);

    // 3. Composite text using Sharp
    if (svgComposites.length > 0) {
        try {
            return await sharp(cleanedBuffer)
                .composite(svgComposites)
                .png()
                .toBuffer();
        } catch (sharpError) {
            console.error('Sharp composite failed:', sharpError.message);
            return cleanedBuffer;
        }
    }

    return cleanedBuffer;
}

function splitTextToLines(text, maxChars) {
    if (!text) return [];
    if (maxChars <= 0) maxChars = 1;

    // Use Thai word segmentation
    const wordcut = require('wordcut');
    wordcut.init();

    // Segment Thai text into words
    const segmented = wordcut.cut(text);
    const words = segmented.split('|').filter(w => w.length > 0);

    // If segmentation didn't help (non-Thai text), fallback
    if (words.length <= 1 && text.length > maxChars) {
        // Simple character wrap for non-Thai
        const lines = [];
        for (let i = 0; i < text.length; i += maxChars) {
            lines.push(text.substring(i, i + maxChars));
        }
        return lines;
    }

    // Wrap by words
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        if (currentLine.length === 0) {
            currentLine = word;
        } else if (currentLine.length + word.length <= maxChars) {
            currentLine += word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }

    if (currentLine.length > 0) {
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Smart Inpainting - Simple Edge Propagation (Gradient)
 * Fills the area by interpolating colors from the 4 edges
 */
function smartInpaint(image, x, y, width, height) {
    // Simple 4-way interpolation
    const leftColor = Jimp.intToRGBA(image.getPixelColor(x - 1, y + height / 2));
    const rightColor = Jimp.intToRGBA(image.getPixelColor(x + width, y + height / 2));
    const topColor = Jimp.intToRGBA(image.getPixelColor(x + width / 2, y - 1));
    const bottomColor = Jimp.intToRGBA(image.getPixelColor(x + width / 2, y + height));

    // Careful: getPixelColor returns 0 if out of bounds. fallback to white.
    const safeColor = (c) => c.a === 0 ? { r: 255, g: 255, b: 255, a: 255 } : c;
    const l = safeColor(leftColor);
    const r = safeColor(rightColor);
    const t = safeColor(topColor);
    const b = safeColor(bottomColor);

    // Default to white if all fail (common in manga)
    if (l.a === 0 && r.a === 0 && t.a === 0 && b.a === 0) {
        image.scan(x, y, width, height, function (x, y, idx) {
            this.bitmap.data[idx + 0] = 255;
            this.bitmap.data[idx + 1] = 255;
            this.bitmap.data[idx + 2] = 255;
            this.bitmap.data[idx + 3] = 255;
        });
        return;
    }

    // Fill with interpolated color
    const avgR = (l.r + r.r + t.r + b.r) / 4;
    const avgG = (l.g + r.g + t.g + b.g) / 4;
    const avgB = (l.b + r.b + t.b + b.b) / 4;
    const fillInt = Jimp.rgbaToInt(avgR, avgG, avgB, 255);

    image.scan(x, y, width, height, function (x, y, idx) {
        this.bitmap.data[idx + 0] = avgR;
        this.bitmap.data[idx + 1] = avgG;
        this.bitmap.data[idx + 2] = avgB;
        this.bitmap.data[idx + 3] = 255;
    });
}

/**
 * Get average background color from image area
 */
function getAverageBackgroundColor(image, x, y, width, height) {
    let r = 0, g = 0, b = 0, count = 0;

    // Sample edges to get background color
    const samplePoints = [
        { px: x, py: y },
        { px: x + width - 1, py: y },
        { px: x, py: y + height - 1 },
        { px: x + width - 1, py: y + height - 1 }
    ];

    for (const { px, py } of samplePoints) {
        if (px >= 0 && px < image.bitmap.width && py >= 0 && py < image.bitmap.height) {
            const color = Jimp.intToRGBA(image.getPixelColor(px, py));
            r += color.r;
            g += color.g;
            b += color.b;
            count++;
        }
    }

    if (count === 0) return { r: 255, g: 255, b: 255, a: 255 };

    return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count),
        a: 255
    };
}

/**
 * Filter text blocks to keep only likely speech bubbles
 * (High brightness background)
 */
async function filterSpeechBubbles(imageBuffer, textBlocks) {
    const image = await Jimp.read(imageBuffer);
    const bubbles = [];

    for (const block of textBlocks) {
        if (await isLikelySpeechBubble(image, block.bounds)) {
            bubbles.push(block);
        }
    }

    return bubbles;
}

/**
 * Check if a region is likely a speech bubble (Bright background)
 */
async function isLikelySpeechBubble(image, bounds) {
    const { x, y, width, height } = bounds;

    let brightPixels = 0;
    let totalSamples = 0;

    // Scan context (slightly expanded area to catch the bubble edge/fill)
    // Expand by 5px but keep within bounds
    const padding = 2;
    const startX = Math.max(0, x - padding);
    const startY = Math.max(0, y - padding);
    const endX = Math.min(image.bitmap.width, x + width + padding);
    const endY = Math.min(image.bitmap.height, y + height + padding);

    // Stride for performance
    const stride = 4;

    for (let py = startY; py < endY; py += stride) {
        for (let px = startX; px < endX; px += stride) {
            const idx = image.getPixelIndex(px, py);
            const r = image.bitmap.data[idx + 0];
            const g = image.bitmap.data[idx + 1];
            const b = image.bitmap.data[idx + 2];

            // Calculate luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b);

            // Threshold for "Light" background (White/Light Grey/Yellowish)
            // Manga paper is usually white.
            if (luminance > 180) {
                brightPixels++;
            }
            totalSamples++;
        }
    }

    if (totalSamples === 0) return false;

    // If > 40% of the area is bright, it's likely a bubble
    // SFX/Background usually has complex/dark colors or mixed.
    // Text itself is black, so we expect some dark pixels.
    const brightnessRatio = brightPixels / totalSamples;

    return brightnessRatio > 0.4;
}

/**
 * Get contrasting text color
 */
function getContrastColor(bgColor) {
    const luminance = (0.299 * bgColor.r + 0.587 * bgColor.g + 0.114 * bgColor.b) / 255;
    return luminance > 0.5 ? { r: 0, g: 0, b: 0, a: 255 } : { r: 255, g: 255, b: 255, a: 255 };
}

/**
 * Save image to output directory
 */
async function saveImage(imageBuffer, jobId, pageNumber, suffix) {
    const filename = `${jobId}_page${String(pageNumber).padStart(3, '0')}_${suffix}.png`;
    const outputPath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(outputPath, imageBuffer);

    return `/output/${filename}`;
}

/**
 * Translate multiple images (batch processing)
 * @param {string[]} imageUrls - Array of image URLs
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @param {string} jobId - Job ID
 * @param {function} progressCallback - Callback for progress updates
 * @param {string} referer - Original manga page URL (Important for protected images)
 */
async function translateImages(imageUrls, sourceLang, targetLang, jobId, progressCallback, referer) {
    const results = [];
    const total = imageUrls.length;
    const CONCURRENCY_LIMIT = 5; // TURBO: Process 5 pages at once

    // Helper wrapper to catch errors and return consistent result format
    const processPageWrapper = async (url, index) => {
        try {
            const result = await translateImage(
                url, sourceLang, targetLang, jobId, index + 1, referer
            );
            return {
                pageNumber: index + 1,
                originalUrl: url,
                translatedUrl: result.translatedPath,
                hasText: result.hasText
            };
        } catch (error) {
            console.error(`Failed to translate page ${index + 1}:`, error.message);
            return {
                pageNumber: index + 1,
                originalUrl: url,
                translatedUrl: null,
                hasText: false,
                error: error.message
            };
        }
    };

    // Process in chunks to respect API limits but significantly faster
    for (let i = 0; i < total; i += CONCURRENCY_LIMIT) {
        const chunk = imageUrls.slice(i, i + CONCURRENCY_LIMIT);
        console.log(`🚀 Starting batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1} (Pages ${i + 1}-${Math.min(i + CONCURRENCY_LIMIT, total)})`);

        // Execute batch in parallel
        const chunkResults = await Promise.all(
            chunk.map((url, idx) => processPageWrapper(url, i + idx))
        );

        results.push(...chunkResults);

        // Report progress
        if (progressCallback) {
            const progress = Math.round((results.length / total) * 100);
            progressCallback(progress, `กำลังแปล... (${results.length}/${total})`);
        }
    }

    // Sort by page number to be safe
    return results.sort((a, b) => a.pageNumber - b.pageNumber);
}

module.exports = {
    translateImage,
    translateImages
};
