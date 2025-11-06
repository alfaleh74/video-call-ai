# Why This Works on Vercel (Serverless)

## The Question
"Why does a WebRTC app with WebSockets work on Vercel, which is a serverless environment?"

## The Answer: Separation of Concerns

Your application has **three separate layers**, and only ONE of them runs on Vercel:

```
┌─────────────────────────────────────────────┐
│  Layer 1: Frontend (Vercel/Render)          │
│  - Next.js pages                             │
│  - React components                          │
│  - Client-side JavaScript                    │
│  - SERVERLESS ✓ (No persistent connections) │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Layer 2: Signaling (PartyKit)              │
│  - WebSocket server                          │
│  - Always running                            │
│  - NOT on Vercel                             │
│  - Deployed to PartyKit's infrastructure     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Layer 3: Media Streams (Peer-to-Peer)      │
│  - Direct browser-to-browser                 │
│  - Video/audio bypass all servers            │
│  - Uses STUN servers only for NAT traversal  │
└─────────────────────────────────────────────┘
```

## Why Vercel Works

### 1. Vercel Only Serves Static Content
```javascript
// What Vercel does:
// - Serves HTML pages
// - Serves JavaScript bundles
// - Renders React components server-side (SSR)
// - Returns the page to the browser
// 
// What Vercel does NOT do:
// - Run WebSocket servers
// - Handle real-time connections
// - Manage video streams
```

When you visit `https://your-app.vercel.app`:
1. Vercel's serverless function renders the page
2. Returns HTML + JavaScript to your browser
3. **Job done** - serverless function terminates
4. Everything else happens **client-side in the browser**

### 2. WebSocket Connection Happens Client-Side

```javascript
// In your browser (NOT on Vercel):
import PartySocket from "partysocket";

const socket = new PartySocket({
  host: "your-project.username.partykit.dev", // ← This is PartyKit, NOT Vercel
  room: callId
});
```

The WebSocket connection is made **from your browser directly to PartyKit**:

```
Browser → PartyKit (WebSocket)
   ↑
   └─ NOT through Vercel
```

### 3. Video/Audio is Peer-to-Peer

```
Browser A ←──────────────────────→ Browser B
         (Direct P2P connection)
              Video/Audio

         ↑
         └─ Doesn't touch Vercel OR PartyKit
```

Once the peer connection is established, video and audio flow **directly between browsers**. Neither Vercel nor PartyKit see this data.

## Complete Flow Diagram

```
┌──────────────┐
│   Browser A  │
│              │
│  1. Visit    │
│  vercel.app  │──────┐
│              │      │
│  2. Page     │      │ HTTP Request
│  loads from  │      │
│  Vercel      │      ↓
│              │  ┌─────────────────┐
│  3. JS runs  │  │  Vercel         │
│  in browser  │  │  (Serverless)   │
│              │  │                 │
│  4. Connect  │  │  - Serves page  │
│  WebSocket   │  │  - Returns HTML │
│  to PartyKit │  │  - Function     │
│              │  │    terminates   │
│  5. Exchange │  └─────────────────┘
│  signaling   │
│  messages    │      PartyKit
│              │      WebSocket
│  6. Connect  │      Connection
│  P2P with    │         ↓
│  Browser B   │  ┌─────────────────┐
│              │  │  PartyKit       │
│  7. Video    │  │  (Always On)    │
│  streams     │  │                 │
│  directly    │  │  - WebSocket    │
└──────────────┘  │  - Signaling    │
       ↕           │  - Forwarding   │
    P2P Video      └─────────────────┘
       ↕                  ↑
┌──────────────┐          │
│   Browser B  │          │
│              │──────────┘
│  Same process│
│  as above    │
└──────────────┘
```

## Why PartyKit Needs to be Always Running

PartyKit MUST be a persistent server because:
- **WebSocket connections** require a server that stays alive
- **Real-time messaging** needs instant forwarding
- **Connection state** must be maintained

This is why PartyKit has its own infrastructure separate from Vercel.

## Comparison: What If We Put WebSocket on Vercel?

```javascript
// ❌ This would NOT work on Vercel
export default function handler(req, res) {
  // Vercel serverless functions:
  // - Have a 10-60 second timeout
  // - Cannot maintain persistent connections
  // - Terminate after response sent
  
  const ws = new WebSocket(); // This won't work!
  // Function terminates → connection dies
}
```

Vercel serverless functions are designed for:
- ✅ HTTP request/response
- ✅ API endpoints
- ✅ Server-side rendering
- ❌ Long-lived WebSocket connections
- ❌ Real-time state management

## The Magic of This Architecture

### Your App's Deployment:
```
Vercel:
  ├── Next.js frontend (serverless)
  ├── Pages + Components
  └── Client-side JavaScript
      └── Contains: PartySocket connection code

PartyKit:
  └── WebSocket server (always running)
      └── party/index.ts

Browsers:
  └── Direct P2P connections
```

### Why It's Brilliant:
1. **Vercel handles what it's good at**: Fast, global CDN for static content
2. **PartyKit handles what it's good at**: Real-time WebSocket connections
3. **WebRTC handles what it's good at**: Direct peer-to-peer media

## Key Takeaways

1. **Vercel = Frontend Only**
   - Serves pages
   - No WebSocket server needed
   - Serverless is fine

2. **PartyKit = Signaling Only**
   - Deployed separately
   - Always running
   - Handles WebSocket connections

3. **Browsers = Media Streams**
   - Direct peer-to-peer
   - Video/audio bypass all servers
   - Only use STUN for NAT traversal

4. **This is a STANDARD architecture**
   - Most video calling apps work this way
   - Separates concerns properly
   - Scales efficiently

## Bonus: Cost Efficiency

This architecture is cost-effective because:

- **Vercel**: Free for frontend (or cheap at scale)
- **PartyKit**: Only pays for signaling messages (not video data)
- **STUN**: Free (Google's servers)
- **Video/Audio**: Free (direct P2P, no bandwidth costs)

The most expensive part of video calling (bandwidth for video) is handled peer-to-peer, so you don't pay for it! 🎉

## Summary

**Vercel works because it's not doing the hard work.** It just delivers the JavaScript to the browser, which then connects to PartyKit (separate server) for signaling, and uses WebRTC (browser-to-browser) for actual video/audio.

This is why you can deploy to:
- ✅ Vercel (serverless)
- ✅ Netlify (serverless)
- ✅ Render (can be serverless)
- ✅ GitHub Pages (static only)
- ✅ Any static host

As long as PartyKit is deployed separately! 🚀

