const express = require('express');
const router = express.Router();
const Translation = require('../models/Translation');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Get user's translation history
router.get('/:firebaseUid', async (req, res) => {
    try {
        const { firebaseUid } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        const translations = await Translation.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('jobId title sourceUrl sourceLang status pages createdAt completedAt');

        const total = await Translation.countDocuments({ userId: user._id });

        res.json({
            translations,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get single translation
router.get('/detail/:jobId', async (req, res) => {
    try {
        const translation = await Translation.findOne({ jobId: req.params.jobId });

        if (!translation) {
            return res.status(404).json({ error: true, message: 'Translation not found' });
        }

        res.json(translation);

    } catch (error) {
        console.error('Detail error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Delete translation
router.delete('/:jobId', async (req, res) => {
    try {
        const result = await Translation.findOneAndDelete({ jobId: req.params.jobId });

        if (!result) {
            return res.status(404).json({ error: true, message: 'Translation not found' });
        }

        res.json({ success: true, message: 'Translation deleted' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

module.exports = router;
