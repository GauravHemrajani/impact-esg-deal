# 🚀 Deployment Guide: Vercel + Render

## 📦 What We're Deploying:

- **Frontend (React)** → Vercel (Free)
- **Backend (Boardgame.io Server)** → Render (Free tier available)

---

## 🔧 PART 1: Deploy Backend to Render

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Click "New +" → "Web Service"

### Step 2: Connect Your Repository
1. Connect your GitHub repository
2. Or manually upload the `server` folder

### Step 3: Configure Render Service
Fill in these settings:

**Name:** `impact-esg-server` (or any name you like)

**Root Directory:** `server`

**Environment:** `Node`

**Build Command:** `npm install`

**Start Command:** `npm start`

**Instance Type:** `Free` (or upgrade if needed)

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait 2-5 minutes for deployment
3. Copy your server URL (looks like: `https://impact-esg-server.onrender.com`)

### ⚠️ Important: Free Tier Note
- Render free tier spins down after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- Consider upgrading to paid tier ($7/month) for always-on server

---

## 🌐 PART 2: Deploy Frontend to Vercel

### Step 1: Install Vercel CLI (Optional but recommended)
```bash
npm install -g vercel
```

### Step 2: Update Environment Variable
1. Open `.env.production` file
2. Replace `https://your-app-name.onrender.com` with your actual Render URL from Part 1
3. Example: `REACT_APP_SERVER_URL=https://impact-esg-server.onrender.com`

### Step 3A: Deploy via CLI (Recommended)
```bash
cd /Users/gauravhemrajani/Downloads/gamelab\ 25-26/impact-esg-deal
vercel
```

Follow prompts:
- Set up and deploy? `Y`
- Which scope? (your account)
- Link to existing project? `N`
- Project name? `impact-esg-deal`
- In which directory? `./` (press Enter)
- Override settings? `N`

Then deploy to production:
```bash
vercel --prod
```

### Step 3B: Deploy via Vercel Website (Alternative)
1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
6. Add Environment Variable:
   - Key: `REACT_APP_SERVER_URL`
   - Value: `https://impact-esg-server.onrender.com` (your Render URL)
7. Click "Deploy"

### Step 4: Get Your Vercel URL
- Vercel will give you a URL like: `https://impact-esg-deal.vercel.app`
- Copy this URL

---

## 🔄 PART 3: Update Backend CORS Settings

### Step 1: Update server.js origins
1. Go to your Render dashboard
2. Go to "Environment" tab
3. The server.js already has your Vercel domain configured
4. If you used a custom domain, add it to the origins array in server.js

### Step 2: Redeploy Render (if needed)
- Render auto-deploys on git push
- Or click "Manual Deploy" → "Deploy latest commit"

---

## ✅ PART 4: Test Your Deployment

### Test Checklist:
1. [ ] Visit your Vercel URL
2. [ ] Check browser console for errors
3. [ ] Firebase test button still works
4. [ ] Game loads without errors
5. [ ] Open in two different browsers to test multiplayer
6. [ ] Make a move in one browser, see it update in the other

---

## 🐛 Troubleshooting

### Error: "Cannot connect to server"
**Fix:** Check these:
1. Render URL is correct in `.env.production`
2. Render service is running (check Render dashboard)
3. CORS origins include your Vercel domain

### Error: "503 Service Unavailable" on first load
**Fix:** This is normal for Render free tier
- Server is waking up from sleep
- Wait 30-60 seconds and refresh

### Error: Firebase not working
**Fix:** 
1. Check Firebase config in `firebase.js`
2. Ensure Firestore is enabled in Firebase Console
3. Check Firestore security rules allow read/write

### Game not updating in real-time
**Fix:**
1. Check browser console for WebSocket errors
2. Verify Render server is running
3. Check that both clients connect to same match ID

---

## 💰 Cost Breakdown

### Current Setup (Free):
- **Vercel:** Free (includes 100GB bandwidth)
- **Render:** Free (with 750 hours/month, spins down after 15 min)
- **Firebase:** Free (Spark plan, generous limits)

### If You Need More:
- **Render Starter:** $7/month (always-on, better performance)
- **Vercel Pro:** $20/month (if you exceed free limits)
- **Firebase Blaze:** Pay-as-you-go (still cheap for small traffic)

---

## 📝 Next Steps After Deployment

1. Test the current game in production
2. Implement landing page and lobby system
3. Add multiplayer features
4. Redeploy as you add features (Vercel auto-deploys on git push)

---

## 🔐 Security Notes

### Before Production:
1. Enable Firebase App Check
2. Set up proper Firestore security rules
3. Consider hiding API keys using Vercel environment variables
4. Add rate limiting to prevent abuse

---

## 🎯 Quick Commands Reference

```bash
# Test backend locally
cd server
npm install
npm start

# Test frontend locally with backend
cd ..
npm start

# Deploy to Vercel
vercel --prod

# View Vercel logs
vercel logs

# View Render logs
# Go to Render dashboard → Logs tab
```

---

**Ready to deploy? Follow Part 1 first (Render backend), then Part 2 (Vercel frontend)!** 🚀
