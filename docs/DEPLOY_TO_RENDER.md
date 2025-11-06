# Deploy WebRTC App to Render

## Overview
This app has two parts:
1. **PartyKit server** (WebSocket signaling) - Deploy to PartyKit Cloud
2. **Next.js app** (Frontend) - Deploy to Render

## Step 1: Deploy PartyKit Server

1. **Login to PartyKit:**
```bash
npx partykit login
```
Follow the prompts to authenticate.

2. **Deploy PartyKit:**
```bash
npx partykit deploy
```

3. **Save your PartyKit URL:**
After deployment, you'll get a URL like:
```
https://your-project.your-username.partykit.dev
```
**Copy this URL** - you'll need it for Step 2.

## Step 2: Prepare for Render Deployment

1. **Create `.env.production` file:**
```bash
# In project root
touch .env.production
```

2. **Add your PartyKit URL to `.env.production`:**
```
NEXT_PUBLIC_PARTYKIT_HOST=your-project.your-username.partykit.dev
```
**Note:** Remove `https://` from the URL, just use the hostname.

3. **Commit your changes to Git:**
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## Step 3: Deploy to Render

1. **Create Render account:**
   - Go to https://render.com
   - Sign up (free account works)

2. **Create new Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub/GitLab repository
   - Select your `webrtc-project` repository

3. **Configure the Web Service:**

**Name:** `webrtc-video-call` (or your choice)

**Environment:** `Node`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Plan:** Free (for testing)

4. **Add Environment Variable:**
   - Click "Environment" tab
   - Click "Add Environment Variable"
   - **Key:** `NEXT_PUBLIC_PARTYKIT_HOST`
   - **Value:** `your-project.your-username.partykit.dev`
   - Click "Save"

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes for first deployment

## Step 4: Test Your Deployment

1. **Open your Render URL:**
   - You'll get a URL like: `https://webrtc-video-call.onrender.com`

2. **Test the connection:**
   - Click "Create New Call"
   - Copy call ID
   - Open **another browser/device** (not just another tab)
   - Paste call ID and join
   - Allow camera/microphone
   - Connection should establish!

## Troubleshooting

### Issue: "Connection stays connecting..."

**Check PartyKit URL:**
```bash
# In your Render dashboard, verify environment variable
NEXT_PUBLIC_PARTYKIT_HOST=your-actual-partykit-url.partykit.dev
```

**Check browser console:**
- Open DevTools → Console
- Look for WebSocket connection errors
- Verify it's connecting to your PartyKit URL

### Issue: "WebSocket connection failed"

**Ensure HTTPS:**
- Both Render and PartyKit use HTTPS automatically
- WebRTC requires secure context (HTTPS) for camera/mic access

**Check PartyKit deployment:**
```bash
# Re-deploy if needed
npx partykit deploy
```

### Issue: "Camera/mic permissions denied"

**For mobile devices:**
- Must use HTTPS (Render provides this automatically)
- Some browsers require user interaction before camera access

### Issue: Free tier limitations

**Render Free Tier:**
- Service sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Consider upgrading for production use

**PartyKit Free Tier:**
- Good for testing and low traffic
- Check limits: https://www.partykit.io/pricing

## Quick Reference Commands

**Redeploy PartyKit:**
```bash
npx partykit deploy
```

**Check PartyKit logs:**
```bash
npx partykit tail
```

**View Render logs:**
- Go to Render Dashboard → Your Service → Logs tab

**Update environment variables:**
- Render Dashboard → Your Service → Environment → Edit

## Production Checklist

- [ ] PartyKit deployed successfully
- [ ] Environment variable set in Render
- [ ] Next.js app deployed to Render
- [ ] Test call creation works
- [ ] Test joining call works
- [ ] Test on different devices/networks
- [ ] Camera permissions work
- [ ] Audio works both directions
- [ ] Connection state shows "Connected"

## Cost Estimate

**For Light Usage (Free):**
- Render: Free tier (750 hours/month)
- PartyKit: Free tier (included limits)
- STUN: Free (using Google's servers)

**Total: $0/month** for testing and light use

## Next Steps

After successful deployment:
- Share your Render URL with friends to test
- Monitor Render logs for errors
- Consider upgrading if traffic increases
- Add custom domain (optional)

