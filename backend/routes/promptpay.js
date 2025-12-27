const express = require('express');
const router = express.Router();
const generatePayload = require('promptpay-qr');
const QRCode = require('qrcode');
const User = require('../models/User');
const Payment = require('../models/Payment');

// Config
const PROMPTPAY_ID = process.env.PROMPTPAY_ID || '0807818346'; // Phone number for PromptPay

// Plans config
const PLANS = {
    '7days': { price: 30, days: 7, name: 'Starter' },
    '30days': { price: 60, days: 30, name: 'Pro Reader' }
};

/**
 * POST /api/promptpay/generate
 * Generate PromptPay QR Code for payment
 */
router.post('/generate', async (req, res) => {
    try {
        const { email, plan } = req.body;

        if (!email || !plan) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุ email และ plan'
            });
        }

        if (!PLANS[plan]) {
            return res.status(400).json({
                success: false,
                message: 'แพ็กเกจไม่ถูกต้อง'
            });
        }

        const amount = PLANS[plan].price;

        // Generate PromptPay payload
        const payload = generatePayload(PROMPTPAY_ID, { amount });

        // Generate QR Code as data URL
        const qrDataUrl = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 400,
            margin: 2
        });

        // Create expiry time (5 minutes)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        res.json({
            success: true,
            data: {
                qrCode: qrDataUrl,
                amount,
                plan: PLANS[plan].name,
                days: PLANS[plan].days,
                expiresAt: expiresAt.toISOString(),
                promptPayId: PROMPTPAY_ID
            }
        });

    } catch (error) {
        console.error('PromptPay QR Error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการสร้าง QR Code'
        });
    }
});

module.exports = router;
