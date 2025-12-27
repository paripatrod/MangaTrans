// Simple auth middleware that verifies Firebase tokens
// For production, use firebase-admin to verify tokens

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: true, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        // For development, we'll accept any token and extract userId from it
        // In production, verify with Firebase Admin SDK
        // const decodedToken = await admin.auth().verifyIdToken(token);

        // For now, we'll pass the token as userId (it should be Firebase UID in production)
        req.userId = token;
        req.userToken = token;

        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: true, message: 'Invalid token' });
    }
};

// Optional auth - doesn't require token but uses it if present
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            req.userId = authHeader.split(' ')[1];
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = { verifyToken, optionalAuth };
