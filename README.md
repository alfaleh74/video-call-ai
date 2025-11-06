# WebRTC Video Call MVP

A simple peer-to-peer video calling application using **WebRTC**, **Next.js**, and **PartyKit** for signaling.

## Tech Stack

- **Next.js 15** - React framework
- **WebRTC** - Peer-to-peer video/audio
- **PartyKit** - Real-time signaling via WebSocket
- **STUN** - NAT traversal (Google's free servers)
- **ml5.js** - AI/ML features (object detection, hand tracking, etc.)

## Features

✅ **Peer-to-peer video calls** - Direct WebRTC connections, no server relay  
✅ **Real-time AI overlays** - Object detection, pose tracking, hand tracking  
✅ **Test camera mode** - Try AI features before joining a call  
✅ **Simple room system** - Share a call ID to connect  
✅ **Modern UI** - Clean, responsive design with Tailwind CSS  
✅ **Production ready** - Deploy to Vercel (frontend) + Render (signaling)

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Run both servers** (in separate terminals):

Terminal 1 - Next.js:
```bash
npm run dev
```

Terminal 2 - PartyKit:
```bash
npm run partykit
```

3. **Test the app:**
   - Open [http://localhost:3000](http://localhost:3000)
   
   **Option A: Test AI Features First (Recommended)**
   - Click "🎥 Test AI Features"
   - Allow camera permission
   - Try different AI features (object detection, hand tracking, etc.)
   - Click "Back" when done
   
   **Option B: Start a Video Call**
   - Click "Create New Call" → Copy the call ID
   - Open another browser tab/window
   - Enter the call ID and click "Join"
   - Allow camera/microphone permissions in both tabs
   - You should see both video streams!
   - Enable AI features and see overlays on both sides

## How It Works

1. **Party A** creates a call → gets a unique call ID
2. Both parties connect to a PartyKit "room" (identified by call ID)
3. WebRTC offers, answers, and ICE candidates are exchanged via PartyKit
4. Direct peer-to-peer connection is established
5. Video/audio streams flow directly between browsers

## Project Structure

```
webrtc-project/
├── src/
│   ├── app/
│   │   ├── page.js                    # Home (create/join)
│   │   └── call/[callId]/page.js      # Call interface
│   ├── hooks/
│   │   └── useWebRTC.js               # WebRTC logic
│   └── services/
│       └── signaling.js               # PartyKit WebSocket
├── party/
│   └── index.ts                       # PartyKit server
└── docs/
    ├── DEVELOPMENT_PHASES.md
    ├── PARTYKIT_VS_FIREBASE.md
    └── PARTYKIT_IMPLEMENTATION.md
```

## Documentation

See `/docs` for detailed guides:
- `DEVELOPMENT_PHASES.md` - Original Firebase-based plan
- `PARTYKIT_VS_FIREBASE.md` - Comparison of signaling approaches
- `PARTYKIT_IMPLEMENTATION.md` - PartyKit implementation guide
- `ML5JS_INTEGRATION.md` - Complete ml5.js integration guide
- `ML5JS_INTEGRATION_COMPLETE.md` - ml5.js implementation summary
- `TEST_CAMERA_FEATURE.md` - **Test AI features before calls**
- `DEPLOY_TO_RENDER.md` - Deploy to production on Render
- `TESTING_GUIDE.md` - Local testing instructions

## Troubleshooting

**Camera/mic not working?**
- Check browser permissions
- Use HTTPS in production (HTTP only works on localhost)

**Connection fails?**
- Check both terminals are running (Next.js + PartyKit)
- Open browser console for detailed logs
- Ensure call ID matches exactly

**No remote video?**
- Wait a few seconds for ICE candidates to exchange
- Check connection state indicator (should show "Connected")

## Next Steps

- Add mute/unmute controls
- Add video on/off toggle
- Implement screen sharing
- Add TURN server for better NAT traversal
- Store call history
- Add user authentication
