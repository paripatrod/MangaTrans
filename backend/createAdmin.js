require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        // Drop the problematic index if it exists
        try {
            await mongoose.connection.collection('users').dropIndex('firebaseUid_1');
            console.log('⚠️ Dropped likely obsolete index: firebaseUid_1');
        } catch (e) {
            // Index might not exist, ignore
        }

        const email = 'admin';
        const passwordPlain = '1004';
        const name = 'Admin God Mode';

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(passwordPlain, salt);

        // Find existing admin or create new
        let admin = await User.findOne({ email });

        if (admin) {
            console.log('Found existing admin, updating...');
            admin.password = passwordHash;
            admin.membershipType = 'admin';
            admin.membershipExpiry = new Date('2099-12-31');
            admin.provider = 'credentials';
        } else {
            console.log('Creating new admin...');
            admin = new User({
                email,
                name,
                password: passwordHash,
                membershipType: 'admin',
                membershipExpiry: new Date('2099-12-31'),
                provider: 'credentials',
                image: 'https://cdn-icons-png.flaticon.com/512/2942/2942813.png'
            });
        }

        await admin.save();
        console.log('🎉 Admin user created successfully!');
        console.log(`Username: ${email}`);
        console.log(`Password: ${passwordPlain}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
}

createAdmin();
