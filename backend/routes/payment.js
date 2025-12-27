const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const User = require('../models/User');
const Payment = require('../models/Payment');

// Config
const THUNDER_API_KEY = process.env.THUNDER_API_KEY || 'fc6bc503-3a95-48ad-8a8a-6674b62fa3c8';
const TRUEMONEY_PHONE = process.env.TRUEMONEY_PHONE || '0807818346';

// Expected amounts
const PLANS = {
    '7days': { price: 30, days: 7, name: 'Starter' },
    '30days': { price: 60, days: 30, name: 'Pro Reader' }
};

// Bank account for verification
const BANK_ACCOUNT = {
    bank: 'KTB', // Krungthai Bank
    accountNumber: '8780750761',
    accountName: 'ปริพัฒน์ รอดหยู่'
};

/**
 * GET /api/payment/plans
 * Get available plans
 */
router.get('/plans', (req, res) => {
    res.json({
        success: true,
        plans: PLANS,
        bankAccount: BANK_ACCOUNT
    });
});

/**
 * POST /api/payment/truemoney
 * Process True Money Wallet voucher
 */
router.post('/truemoney', async (req, res) => {
    try {
        const { email, plan, giftLink } = req.body;

        if (!email || !plan || !giftLink) {
            return res.status(400).json({
                success: false,
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
            });
        }

        if (!PLANS[plan]) {
            return res.status(400).json({
                success: false,
                message: 'แพ็กเกจไม่ถูกต้อง'
            });
        }

        // Extract gift code from link
        let giftCode = giftLink;
        if (giftLink.includes('gift.truemoney.com')) {
            const match = giftLink.match(/v=([a-zA-Z0-9]+)/);
            if (match) giftCode = match[1];
        }

        console.log(`💰 Processing True Money: ${giftCode} for ${email} (${plan})`);

        // Call mystrix2.me API
        const response = await axios.post('https://api.mystrix2.me/truemoney', {
            phone: TRUEMONEY_PHONE,
            gift: giftCode
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        const data = response.data;

        // Check for errors
        if (data.redeemResponse && data.redeemResponse.status) {
            const errorCode = data.redeemResponse.status.code;
            const errorMsg = data.redeemResponse.status.message;

            return res.status(400).json({
                success: false,
                message: `ไม่สามารถแกะซองได้: ${errorMsg}`,
                code: errorCode
            });
        }

        // Check amount
        const amount = parseFloat(data.data?.voucher?.amount_baht || 0);
        const expectedAmount = PLANS[plan].price;

        if (amount < expectedAmount) {
            return res.status(400).json({
                success: false,
                message: `ยอดเงินไม่ถูกต้อง ได้รับ ฿${amount} แต่ต้องการ ฿${expectedAmount}`
            });
        }

        // Check for duplicate
        const voucherId = data.data?.voucher?.voucher_id;
        const existingPayment = await Payment.findOne({ transactionId: voucherId });
        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: 'ซองนี้ถูกใช้งานแล้ว'
            });
        }

        // Save payment record
        const payment = new Payment({
            email,
            plan,
            amount,
            method: 'truemoney',
            transactionId: voucherId,
            truemoneyData: {
                voucherId,
                amount,
                owner: data.data?.owner_profile?.full_name
            },
            status: 'success'
        });
        await payment.save();

        // Update user membership
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบผู้ใช้งาน'
            });
        }

        const expiry = new Date();
        expiry.setDate(expiry.getDate() + PLANS[plan].days);

        user.membershipType = plan;
        user.membershipExpiry = expiry;
        await user.save();

        console.log(`✅ Payment success: ${email} upgraded to ${plan} until ${expiry}`);

        res.json({
            success: true,
            message: 'ชำระเงินสำเร็จ!',
            data: {
                plan: PLANS[plan].name,
                days: PLANS[plan].days,
                expiry: expiry.toISOString(),
                amount
            }
        });

    } catch (error) {
        console.error('True Money Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่'
        });
    }
});

/**
 * POST /api/payment/slip
 * Verify bank slip
 */
router.post('/slip', async (req, res) => {
    try {
        const { email, plan, slipImage } = req.body;

        if (!email || !plan || !slipImage) {
            return res.status(400).json({
                success: false,
                message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
            });
        }

        if (!PLANS[plan]) {
            return res.status(400).json({
                success: false,
                message: 'แพ็กเกจไม่ถูกต้อง'
            });
        }

        console.log(`💰 Verifying slip for ${email} (${plan})`);

        // Call Thunder API with base64 image
        const response = await axios.post('https://api.thunder.in.th/v1/verify', {
            image: slipImage.replace(/^data:image\/\w+;base64,/, '')
        }, {
            headers: {
                'Authorization': `Bearer ${THUNDER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        const data = response.data;

        // Debug log
        console.log('🔍 Thunder API Response:', JSON.stringify(data, null, 2));

        // Check verification result - Thunder API returns different formats
        // Sometimes: { success: true, data: {...} }
        // Sometimes: { status: 200, data: {...} }
        const slipInfo = data.data || data;

        if (!slipInfo || (!slipInfo.amount && !slipInfo.transRef)) {
            return res.status(400).json({
                success: false,
                message: 'ไม่สามารถอ่านสลิปได้ กรุณาถ่ายภาพใหม่'
            });
        }

        const slipData = slipInfo;

        // Thunder API returns amount as object { amount: 30, local: {...} }
        const rawAmount = slipData.amount;
        const amount = typeof rawAmount === 'object' ? parseFloat(rawAmount.amount || 0) : parseFloat(rawAmount || 0);
        const expectedAmount = PLANS[plan].price;

        // Check amount
        if (amount < expectedAmount) {
            return res.status(400).json({
                success: false,
                message: `ยอดเงินไม่ถูกต้อง ได้รับ ฿${amount} แต่ต้องการ ฿${expectedAmount}`
            });
        }

        // Check if same slip was used before (by transRef)
        const transRef = slipData.transRef || slipData.ref1;
        if (transRef) {
            const existingPayment = await Payment.findOne({ transactionRef: transRef });
            if (existingPayment) {
                return res.status(400).json({
                    success: false,
                    message: 'สลิปนี้ถูกใช้งานแล้ว'
                });
            }
        }

        // Extract sender info from Thunder API format
        const senderName = slipData.sender?.account?.name?.th || slipData.sender?.account?.name?.en || 'Unknown';
        const senderBank = slipData.sender?.bank?.name || slipData.sender?.bank?.short || 'Unknown';
        const receiverName = slipData.receiver?.account?.name?.th || slipData.receiver?.account?.name?.en || BANK_ACCOUNT.accountName;

        // Save payment record
        const payment = new Payment({
            email,
            plan,
            amount,
            method: 'slip',
            transactionRef: transRef,
            slipData: {
                sender: senderName,
                receiver: receiverName,
                amount,
                date: slipData.date ? new Date(slipData.date) : new Date(),
                bank: senderBank
            },
            status: 'success'
        });
        await payment.save();

        // Update user membership
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'ไม่พบผู้ใช้งาน'
            });
        }

        const expiry = new Date();
        expiry.setDate(expiry.getDate() + PLANS[plan].days);

        user.membershipType = plan;
        user.membershipExpiry = expiry;
        await user.save();

        console.log(`✅ Slip verified: ${email} upgraded to ${plan} until ${expiry}`);

        res.json({
            success: true,
            message: 'ชำระเงินสำเร็จ!',
            data: {
                plan: PLANS[plan].name,
                days: PLANS[plan].days,
                expiry: expiry.toISOString(),
                amount,
                sender: slipData.sender?.name
            }
        });

    } catch (error) {
        console.error('Slip Verification Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการตรวจสอบสลิป กรุณาลองใหม่'
        });
    }
});

/**
 * GET /api/payment/history/:email
 * Get payment history for user
 */
router.get('/history/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const payments = await Payment.find({ email, status: 'success' })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            payments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาด'
        });
    }
});

module.exports = router;
