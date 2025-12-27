const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Auth info
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        default: '',
        sparse: true // Allows unique index to ignore null/empty values if we add unique later, but for now just helps with lookup
    },
    image: {
        type: String,
        default: ''
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },

    // Membership
    membershipType: {
        type: String,
        enum: ['free', '7days', '30days', 'admin'], // Added 'admin'
        default: 'free'
    },
    membershipExpiry: {
        type: Date,
        default: null
    },

    // Stats
    translationCount: {
        type: Number,
        default: 0
    },
    lastTranslationAt: {
        type: Date,
        default: null
    },

    // Provider info (google, credentials)
    provider: {
        type: String,
        default: 'credentials'
    },

    // Password for admin/credentials login (optional)
    password: {
        type: String,
        select: false // Don't return by default
    }
});

// Virtual for checking if membership is active
userSchema.virtual('isMember').get(function () {
    if (this.membershipType === 'admin') return true; // Admin is always member
    if (this.membershipType === 'free') return false;
    if (!this.membershipExpiry) return false;
    return new Date() < this.membershipExpiry;
});

// Method to get remaining days
userSchema.methods.getRemainingDays = function () {
    if (!this.membershipExpiry) return 0;
    const diff = this.membershipExpiry - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

module.exports = mongoose.model('User', userSchema);
