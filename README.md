# MangaTrans Full-Stack Web App

เว็บแปลมังงะ/มังฮวาแบบ Full-Stack

## 🚀 Quick Start

### 1. ติดตั้ง Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Setup Firebase

1. ไปที่ [Firebase Console](https://console.firebase.google.com)
2. สร้าง Project ใหม่
3. ไปที่ Authentication > Sign-in method
4. เปิดใช้งาน Email/Password และ Google
5. คัดลอก config ไปใส่ใน `frontend/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. รัน Application

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

เปิด http://localhost:3000

---

## 📁 Project Structure

```
Translate/
├── frontend/          # Next.js 14 + Tailwind + Framer Motion
│   ├── src/app/       # Pages (App Router)
│   ├── src/components/  # React Components
│   └── src/lib/       # Firebase + API Client
│
└── backend/           # Express.js + MongoDB
    ├── routes/        # API Routes
    ├── models/        # Mongoose Models
    ├── services/      # OCR + Translation
    └── middleware/    # Auth
```

## 🔑 Environment Variables

### Frontend (.env.local)
- `NEXT_PUBLIC_FIREBASE_*` - Firebase config
- `NEXT_PUBLIC_API_URL` - Backend URL

### Backend (.env)
- `MONGODB_URI` - MongoDB connection string
- `GOOGLE_API_KEY` - Cloud Vision + Translate API
- `PORT` - Server port (default: 5000)

## 🌐 Deploy

**Frontend → Vercel**
**Backend → Render**
