const express = require('express');
const router = express.Router();
const User = require('../models/User');

const bcrypt = require('bcryptjs');

// Admin/Credentials Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: true, message: 'Email and password required' });
        }

        // Find user by email OR name
        const user = await User.findOne({
            $or: [
                { email: email },
                { name: email } // 'email' variable here holds the input which could be name
            ]
        }).select('+password');

        if (!user || !user.password) {
            return res.status(401).json({ error: true, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: true, message: 'Invalid credentials' });
        }

        // Return user info (no token needed here as we use session/firebase mostly, 
        // but for admin we simply return user object to be stored in frontend context)
        // In a strict env, we would issue a JWT here. For this MVP, we re-use the 'sync' response structure.

        user.lastLogin = new Date();
        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                image: user.image,
                membershipType: user.membershipType,
                membershipExpiry: user.membershipExpiry,
                isMember: user.isMember, // virtual will be true for admin
                remainingDays: 9999,
                translationCount: user.translationCount,
                role: user.membershipType // explicit role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Create or update user (called after login)
router.post('/sync', async (req, res) => {
    try {
        const { email, name, image, provider } = req.body;

        if (!email) {
            return res.status(400).json({ error: true, message: 'Email is required' });
        }

        // Find or create user
        let user = await User.findOne({ email });

        if (user) {
            // Update existing user
            user.lastLogin = new Date();
            user.name = name || user.name;
            user.image = image || user.image;
            if (provider) user.provider = provider;
            await user.save();
        } else {
            // Create new user
            user = new User({
                email,
                name: name || email.split('@')[0],
                image: image || '',
                provider: provider || 'credentials'
            });
            await user.save();
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                image: user.image,
                membershipType: user.membershipType,
                membershipExpiry: user.membershipExpiry,
                isMember: user.isMember,
                remainingDays: user.getRemainingDays(),
                translationCount: user.translationCount,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Auth sync error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Get user profile
router.get('/profile/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });

        if (!user) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        // Calculate rate limit info for free users
        const FREE_MAX_TRANSLATIONS = 10;
        const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

        let remainingTranslations = FREE_MAX_TRANSLATIONS;
        let cooldownEndsAt = null;

        const isMember = user.membershipType === 'admin' ||
            (user.membershipType !== 'free' && user.membershipExpiry && new Date() < user.membershipExpiry);

        if (!isMember) {
            remainingTranslations = Math.max(0, FREE_MAX_TRANSLATIONS - (user.translationCount || 0));

            if (user.lastTranslationAt) {
                const cooldownEnd = new Date(user.lastTranslationAt).getTime() + COOLDOWN_MS;
                if (cooldownEnd > Date.now()) {
                    cooldownEndsAt = new Date(cooldownEnd).toISOString();
                }
            }
        }

        res.json({
            id: user._id,
            email: user.email,
            name: user.name,
            image: user.image,
            membershipType: user.membershipType,
            membershipExpiry: user.membershipExpiry,
            isMember,
            remainingDays: user.getRemainingDays(),
            translationCount: user.translationCount,
            remainingTranslations,
            cooldownEndsAt,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

// Upgrade membership (demo - just sets expiry)
router.post('/upgrade', async (req, res) => {
    try {
        const { email, plan } = req.body;

        if (!email || !plan) {
            return res.status(400).json({ error: true, message: 'Email and plan required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        // Calculate expiry
        const now = new Date();
        let expiryDate = user.membershipExpiry && user.membershipExpiry > now
            ? new Date(user.membershipExpiry)
            : new Date();

        if (plan === '7days') {
            expiryDate.setDate(expiryDate.getDate() + 7);
            user.membershipType = '7days';
        } else if (plan === '30days') {
            expiryDate.setDate(expiryDate.getDate() + 30);
            user.membershipType = '30days';
        }

        user.membershipExpiry = expiryDate;
        await user.save();

        res.json({
            success: true,
            membershipType: user.membershipType,
            membershipExpiry: user.membershipExpiry,
            remainingDays: user.getRemainingDays()
        });

    } catch (error) {
        console.error('Upgrade error:', error);
        res.status(500).json({ error: true, message: error.message });
    }
});

module.exports = router;
