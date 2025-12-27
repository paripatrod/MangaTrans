# Deployment Guide

## 1. Backend → Render

### Setup
1. Go to [render.com](https://render.com) and create new **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

### Environment Variables (Add in Render Dashboard)
```
MONGODB_URI=mongodb+srv://your_connection_string
GOOGLE_API_KEY=your_gemini_api_key
THUNDER_API_KEY=fc6bc503-3a95-48ad-8a8a-6674b62fa3c8
TRUEMONEY_PHONE=0807818346
REPLICATE_API_TOKEN=your_replicate_token
PROMPTPAY_ID=0807818346
FRONTEND_URL=https://your-app.vercel.app
```

---

## 2. Frontend → Vercel

### Setup
1. Go to [vercel.com](https://vercel.com) and import project
2. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js

### Environment Variables (Add in Vercel Dashboard)
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## 3. Post-Deployment Checklist

- [ ] Update CORS whitelist in `backend/server.js` with Vercel domain
- [ ] Update `FRONTEND_URL` env var on Render
- [ ] Update Google OAuth callback URL in Google Console
- [ ] Test all payment flows
- [ ] Test translation flow
