// ========================================
// MangaTrans - Web Scraper
// Extracts images from manga/manhwa pages
// Uses Axios + Cheerio for fast scraping
// ========================================

const axios = require('axios');
const cheerio = require('cheerio');

// Common image selectors for popular manga sites
const IMAGE_SELECTORS = [
    // Generic manga reader selectors
    'img.wp-manga-chapter-img',
    'img.page-image',
    'img.chapter-image',
    'img.manga-page',
    'img.comic-image',
    '.reading-content img',
    '.chapter-content img',
    '.reader-area img',
    '#reader-area img',
    '.container-chapter-reader img',

    // Korean manhwa sites
    '.view-content img',
    '.chapter-c img',
    '#chapter-container img',
    '.chapter-img img',

    // Japanese manga sites
    '.viewer-cnt img',
    '#comic-area img',
    '.manga-container img',

    // Specific patterns
    '[class*="page"] img',
    '[class*="chapter"] img',
    '[id*="image"] img',
    'article img',
    '.content img',

    // Fallback
    'main img',
    '#content img',
    '.post-content img',
    '.entry-content img'
];

// Minimum image dimensions for manga pages
const MIN_WIDTH = 200;
const MIN_HEIGHT = 300;

// User agents to rotate
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

/**
 * Scrape images from a manga chapter URL
 * @param {string} url - The chapter URL to scrape
 * @returns {Promise<string[]>} - Array of image URLs
 */
async function scrapeImages(url) {
    console.log(`🔍 Scraping: ${url}`);

    try {
        const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

        const response = await axios.get(url, {
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
                'Referer': new URL(url).origin + '/', // Ensure trailing slash sometimes helps
                'Cache-Control': 'no-cache',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 60000,
            maxRedirects: 5,
            validateStatus: (status) => status < 500 // Accept 404/403 to handle manually
        });

        if (response.status === 403 || response.status === 404) {
            console.warn(`⚠️ Direct access failed with ${response.status}. This site might need a headless browser (Puppeteer) or has anti-bot.`);
            // We can't fix complex anti-bot with just Axios, but let's try to proceed if we got some HTML
        }

        const $ = cheerio.load(response.data);
        const images = [];
        const seenUrls = new Set();

        // Try each selector
        for (const selector of IMAGE_SELECTORS) {
            $(selector).each((_, element) => {
                const src = $(element).attr('src') ||
                    $(element).attr('data-src') ||
                    $(element).attr('data-lazy-src') ||
                    $(element).attr('data-original') ||
                    $(element).attr('data-cfsrc') ||
                    $(element).attr('data-aload');

                if (src && isValidMangaImage(src)) {
                    const absoluteUrl = resolveUrl(src, url);
                    if (!seenUrls.has(absoluteUrl)) {
                        seenUrls.add(absoluteUrl);
                        images.push(absoluteUrl);
                    }
                }
            });

            // If we found multiple images with a selector, likely found the right one
            if (images.length >= 3) break;
        }

        // Also check for images in JSON/JavaScript data
        if (images.length < 3) {
            const scriptImages = extractImagesFromScripts(response.data);
            for (const img of scriptImages) {
                const absoluteUrl = resolveUrl(img, url);
                if (!seenUrls.has(absoluteUrl) && isValidMangaImage(absoluteUrl)) {
                    seenUrls.add(absoluteUrl);
                    images.push(absoluteUrl);
                }
            }
        }

        // Filter and sort
        const filteredImages = filterMangaImages(images);

        if (filteredImages.length > 0) {
            console.log(`✅ Found ${filteredImages.length} manga page images`);
            return filteredImages;
        }

        throw new Error('ไม่พบรูปภาพมังงะในหน้าเว็บนี้');

    } catch (error) {
        console.error('❌ Scraping error:', error.message);

        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            throw new Error('ไม่สามารถเชื่อมต่อกับเว็บไซต์นี้ได้');
        }
        if (error.response?.status === 403) {
            throw new Error('เว็บไซต์นี้บล็อกการเข้าถึง กรุณาลองเว็บอื่น');
        }
        if (error.response?.status === 404) {
            throw new Error('ไม่พบหน้าเว็บนี้');
        }

        throw new Error(`ไม่สามารถดึงภาพได้: ${error.message}`);
    }
}

/**
 * Extract image URLs from inline scripts
 */
function extractImagesFromScripts(html) {
    const images = [];

    // Common patterns for image arrays in scripts
    const patterns = [
        /"(https?:\/\/[^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/gi,
        /'(https?:\/\/[^']+\.(jpg|jpeg|png|webp|gif)[^']*)'/gi,
        /src\s*[:=]\s*["'](https?:\/\/[^"']+\.(jpg|jpeg|png|webp|gif)[^"']*)["']/gi
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            const url = match[1];
            if (url && isValidMangaImage(url)) {
                images.push(url);
            }
        }
    }

    return [...new Set(images)];
}

/**
 * Check if URL is a valid manga page image
 */
function isValidMangaImage(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('data:')) return false;

    const lowerUrl = url.toLowerCase();

    // Exclude common non-manga images
    const excludePatterns = [
        'logo', 'icon', 'avatar', 'banner', 'ads', 'advertisement',
        'button', 'badge', 'thumb', 'thumbnail', 'small',
        'spinner', 'loading', 'placeholder', 'blank',
        'facebook', 'twitter', 'instagram', 'discord',
        '50x', '100x', '150x', '200x',
        'favicon', 'emoji', 'sticker'
    ];

    for (const pattern of excludePatterns) {
        if (lowerUrl.includes(pattern)) {
            return false;
        }
    }

    // Must have image extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasImageExt = imageExtensions.some(ext => lowerUrl.includes(ext));

    return hasImageExt || lowerUrl.includes('/images/') || lowerUrl.includes('/manga/') || lowerUrl.includes('/chapter/');
}

/**
 * Convert relative URL to absolute
 */
function resolveUrl(src, baseUrl) {
    if (src.startsWith('http://') || src.startsWith('https://')) {
        return src;
    }
    if (src.startsWith('//')) {
        return 'https:' + src;
    }

    const base = new URL(baseUrl);
    if (src.startsWith('/')) {
        return `${base.origin}${src}`;
    }

    return new URL(src, baseUrl).href;
}

/**
 * Filter to only include likely manga page images
 */
function filterMangaImages(images) {
    return images.filter(url => {
        const lowerUrl = url.toLowerCase();

        // Additional filtering for manga pages
        const excludePatterns = [
            'profile', 'user', 'comment', 'reply',
            'share', 'bookmark', 'heart', 'like',
            'arrow', 'next', 'prev', 'back', 'forward'
        ];

        for (const pattern of excludePatterns) {
            if (lowerUrl.includes(pattern)) {
                return false;
            }
        }

        return true;
    });
}

module.exports = { scrapeImages };
