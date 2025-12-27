// ========================================
// MangaTrans Backend Server
// Full-Stack with MongoDB + Firebase Auth
// ========================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const path = require('path');
const helmet = require('helmet');

// Import routes
const authRoutes = require('./routes/auth');
const translateRoutes = require('./routes/translate');
const historyRoutes = require('./routes/history');
const paymentRoutes = require('./routes/payment');
const promptpayRoutes = require('./routes/promptpay');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ========================================
// Security Middleware
// ========================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow serving images
}));

// CORS Whitelist
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            FRONTEND_URL,
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ];

        // Allow if origin is in whitelist or is a Vercel preview deploy
        if (allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Global Rate Limiting (IP-based)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes per IP (generous for dev)
    message: {
        error: true,
        message: 'คุณส่งคำขอเยอะเกินไป กรุณารอสักครู่'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/output'), // Skip for static files
});
app.use(globalLimiter);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files with cache headers
app.use('/output', express.static(path.join(__dirname, 'output'), {
    maxAge: '1d', // Cache for 1 day
    etag: true,
    lastModified: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/promptpay', promptpayRoutes);

// Health check
app.get('/', (req, res) => {
    res.send('MangaTrans API is running 🚀');
});

// Error handler
app.use((err, req, res, next) => {
    console.error('🔥 Global Error:', err.stack);

    // Distinguish between validation errors and internal server errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: true,
            message: err.message,
            type: 'validation_error'
        });
    }

    res.status(err.status || 500).json({
        error: true,
        message: process.env.NODE_ENV === 'production'
            ? 'Something went wrong on the server'
            : err.message
    });
});

// ========================================
// Start Server
// ========================================

// Connect to MongoDB first
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB: Connected');

        // Only start server after DB connection
        app.listen(PORT, () => {
            console.log(`
  ╔═══════════════════════════════════════════╗
  ║   🎉 MangaTrans API Server Running        ║
  ║   📡 Port: ${PORT}                            ║
  ║   🌐 http://localhost:${PORT}                 ║
  ╚═══════════════════════════════════════════╝
  `);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
    });

module.exports = app;
