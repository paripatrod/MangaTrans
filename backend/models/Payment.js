const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // User info
    email: {
        type: String,
        required: true,
        index: true
    },

    // Plan info
    plan: {
        type: String,
        enum: ['7days', '30days'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },

    // Payment method
    method: {
        type: String,
        enum: ['truemoney', 'slip'],
        required: true
    },

    // Transaction details
    transactionId: {
        type: String,
        default: null
    },
    transactionRef: {
        type: String,
        default: null
    },

    // For slip verification
    slipData: {
        sender: String,
        receiver: String,
        amount: Number,
        date: Date,
        bank: String
    },

    // For truemoney
    truemoneyData: {
        voucherId: String,
        amount: Number,
        owner: String
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for finding duplicates
paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
