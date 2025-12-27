const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Translation = require('../models/Translation');
const User = require('../models/User');
const { scrapeImages } = require('../services/scraper');
const { translateImages } = require('../services/translator');

// In-memory job storage for real-time progress
const jobs = new Map();

const { optionalAuth } = require('../middleware/auth');

// Start a new translation job
router.post('/start', optionalAuth, async (req, res) => {
    try {
        const { url, sourceLang, targetLang, title } = req.body;
        // TRUST ONLY req.userId from middleware, fallback to body only if not auth (but prefer middleware)
        const userEmail = req.userId || req.body.userEmail || null;

        // 1. Input Validation
        if (!url) {
            return res.status(400).json({ error: true, message: 'URL is required' });
        }

        try {
            new URL(url); // Validate URL format
        } catch (e) {
            return res.status(400).json({ error: true, message: 'Invalid URL format' });
        }

        const ALLOWED_LANGS = ['ko', 'ja', 'zh', 'en'];
        if (sourceLang && !ALLOWED_LANGS.includes(sourceLang)) {
            return res.status(400).json({ error: true, message: `Invalid source language. Allowed: ${ALLOWED_LANGS.join(', ')}` });
        }

        // Rate limiting for free users
        if (userEmail) {
            const user = await User.findOne({ email: userEmail });
            if (user) {
                const isMember = user.membershipType === 'admin' ||
                    (user.membershipType !== 'free' && user.membershipExpiry && new Date() < user.membershipExpiry);

                if (!isMember) {
                    // Free user limits: 10 translations max, 1 hour cooldown
                    const FREE_MAX_TRANSLATIONS = 10;
                    const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

                    // Check total limit
                    if (user.translationCount >= FREE_MAX_TRANSLATIONS) {
                        return res.status(429).json({
                            error: true,
                            message: `คุณใช้สิทธิ์ฟรีครบ ${FREE_MAX_TRANSLATIONS} ครั้งแล้ว กรุณาอัปเกรดเป็นสมาชิก`,
                            limitReached: true
                        });
                    }

                    // Check cooldown
                    if (user.lastTranslationAt) {
                        const timeSinceLast = Date.now() - new Date(user.lastTranslationAt).getTime();
                        if (timeSinceLast < COOLDOWN_MS) {
                            const remainingMins = Math.ceil((COOLDOWN_MS - timeSinceLast) / (60 * 1000));
                            return res.status(429).json({
                                error: true,
                                message: `กรุณารอ ${remainingMins} นาที ก่อนแปลครั้งถัดไป`,
                                cooldown: true,
                                remainingMinutes: remainingMins
                            });
                        }
                    }

                    // Update user stats
                    user.translationCount = (user.translationCount || 0) + 1;
                    user.lastTranslationAt = new Date();
                    await user.save();
                    console.log(`📊 Free user ${userEmail} used translation ${user.translationCount}/10`);
                }
            }
        }

        // Generate job ID
        const jobId = uuidv4();

        // Initialize job status
        jobs.set(jobId, {
            status: 'pending',
            progress: 0,
            message: 'เริ่มต้นกระบวนการ...',
            pages: [],
            error: null
        });

        // Start processing in background
        processJob(jobId, url, sourceLang || 'ko', targetLang || 'th', title, userEmail);

        res.json({
            success: true,
            jobId: jobId,
            message: 'เริ่มกระบวนการแปลแล้ว'
        });

    } catch (error) {
        console.error('Translation start error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get job status
router.get('/status/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;

        // Check in-memory first
        if (jobs.has(jobId)) {
            const job = jobs.get(jobId);
            return res.json({
                jobId,
                ...job
            });
        }

        // Check database
        const translation = await Translation.findOne({ jobId });
        if (translation) {
            return res.json({
                jobId,
                status: translation.status,
                progress: translation.progress,
                message: translation.status === 'completed' ? 'แปลเสร็จสิ้น!' : 'กำลังประมวลผล...',
                pages: translation.pages
            });
        }

        res.status(404).json({ error: true, message: 'Job not found' });

    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Background job processor
async function processJob(jobId, url, sourceLang, targetLang, title, userEmail) {
    try {
        // Update status: Scraping
        updateJobStatus(jobId, 'processing', 5, 'กำลังดึงรูปภาพจากเว็บไซต์...');

        // 1. Scrape images
        console.log(`\n🚀 Starting job ${jobId}`);
        console.log(`   URL: ${url}`);
        console.log(`   Language: ${sourceLang} → ${targetLang}`);

        const imageUrls = await scrapeImages(url);

        if (!imageUrls || imageUrls.length === 0) {
            throw new Error('ไม่พบรูปภาพในหน้าเว็บนี้');
        }

        updateJobStatus(jobId, 'processing', 10, `พบ ${imageUrls.length} รูปภาพ กำลังเริ่มแปล...`);

        // 2. Translate images
        const pages = await translateImages(
            imageUrls,
            sourceLang,
            targetLang,
            jobId,
            (progress, message) => {
                // Progress is 10-95 during translation
                const adjustedProgress = 10 + Math.round(progress * 0.85);
                updateJobStatus(jobId, 'processing', adjustedProgress, message);
            },
            url // Pass original URL as referer
        );

        // 3. Save to database
        updateJobStatus(jobId, 'processing', 98, 'กำลังบันทึกผลลัพธ์...');

        const translation = new Translation({
            jobId,
            userId: userEmail,
            sourceUrl: url,
            title: title || extractTitle(url),
            sourceLang,
            targetLang,
            status: 'completed',
            progress: 100,
            pages: pages.map(p => ({
                pageNumber: p.pageNumber,
                originalUrl: p.originalUrl,
                translatedUrl: p.translatedUrl,
                hasText: p.hasText
            })),
            completedAt: new Date()
        });

        await translation.save();

        // Update user translation count
        if (userEmail) {
            await User.findOneAndUpdate(
                { email: userEmail },
                { $inc: { translationCount: 1 } }
            );
        }

        // Final status
        const job = jobs.get(jobId);
        job.status = 'completed';
        job.progress = 100;
        job.message = 'แปลเสร็จสิ้น!';
        job.pages = pages;

        console.log(`✅ Job ${jobId} completed: ${pages.length} pages`);

    } catch (error) {
        console.error(`❌ Job ${jobId} failed:`, error.message);

        const job = jobs.get(jobId);
        if (job) {
            job.status = 'error';
            job.message = error.message;
            job.error = error.message;
        }

        // Save failed job to database
        try {
            const translation = new Translation({
                jobId,
                userId: userEmail,
                sourceUrl: url,
                title: title || 'Unknown',
                sourceLang,
                targetLang,
                status: 'error',
                progress: 0,
                errorMessage: error.message
            });
            await translation.save();
        } catch (e) {
            console.error('Failed to save error state:', e);
        }
    }
}

// Update job status
function updateJobStatus(jobId, status, progress, message) {
    const job = jobs.get(jobId);
    if (job) {
        job.status = status;
        job.progress = progress;
        job.message = message;
    }
}

// Extract title from URL
function extractTitle(url) {
    try {
        const pathname = new URL(url).pathname;
        const parts = pathname.split('/').filter(p => p);
        return parts[parts.length - 1] || 'Untitled';
    } catch {
        return 'Untitled';
    }
}

module.exports = router;
