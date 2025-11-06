# Deploy to Render - Quick Steps

## 1. Deploy PartyKit (1 minute)

```bash
npx partykit login
npx partykit deploy
```

Copy your PartyKit URL (e.g., `project.username.partykit.dev`)

## 2. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## 3. Deploy to Render (5 minutes)

1. Go to https://render.com and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add environment variable:
   - **Key:** `NEXT_PUBLIC_PARTYKIT_HOST`
   - **Value:** `your-project.username.partykit.dev` (from Step 1)
6. Click **"Create Web Service"**

## 4. Test

1. Open your Render URL (e.g., `https://your-app.onrender.com`)
2. Create a call
3. Join from another device with the call ID
4. Done! 🎉

## That's it!

**Free tier works perfectly for testing.**

Full guide: See `docs/DEPLOY_TO_RENDER.md`

