const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
    userId: {
        type: String, // Changed from ObjectId to String to support email/auth0/firebase IDs
        required: false // Made optional to allow guest translations (or handle missing auth gracefully)
    },
    jobId: {
        type: String,
        required: true,
        unique: true
    },
    sourceUrl: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: 'Untitled'
    },
    sourceLang: {
        type: String,
        required: true,
        enum: ['ko', 'ja', 'zh', 'en']
    },
    targetLang: {
        type: String,
        required: true,
        default: 'th'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'error'],
        default: 'pending'
    },
    progress: {
        type: Number,
        default: 0
    },
    message: {
        type: String,
        default: ''
    },
    pages: [{
        pageNumber: Number,
        originalUrl: String,
        translatedUrl: String,
        hasText: Boolean
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    }
});

// Index for faster queries
translationSchema.index({ userId: 1, createdAt: -1 });
translationSchema.index({ userId: 1, createdAt: -1 });
// translationSchema.index({ jobId: 1 }); // Removed to fix duplicate index warning (unique: true handles this)

module.exports = mongoose.model('Translation', translationSchema);
