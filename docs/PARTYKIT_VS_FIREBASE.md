# PartyKit vs Firebase for WebRTC Signaling

## Overview
Both PartyKit and Firebase can serve as signaling servers for your WebRTC application. Here's how they compare and what using PartyKit would look like.

## Architecture Comparison

### Firebase Firestore Approach
```
Party A <---> Firestore Database <---> Party B
         (reads/writes documents)
```
- Uses document-based database with real-time listeners
- Parties read/write to shared document
- Firebase SDK polls for changes

### PartyKit Approach
```
Party A <---> PartyKit Room <---> Party B
         (WebSocket connections)
```
- Uses WebSocket connections to a "room" server
- Real-time bidirectional communication
- Server can manage connection state

---

## Key Differences

| Feature | Firebase Firestore | PartyKit |
|---------|-------------------|----------|
| **Connection Type** | HTTP + Listeners | WebSocket |
| **Setup Complexity** | Moderate (Firebase Console) | Simple (npm install) |
| **Real-time Speed** | Good (polling-based) | Excellent (true WebSocket) |
| **Server Logic** | Client-side only | Server + Client |
| **Room Management** | Manual (documents) | Built-in (rooms) |
| **Pricing** | Free tier + usage-based | Free tier + usage-based |
| **Best For** | Database-driven apps | Real-time multiplayer apps |

---

## PartyKit Integration Overview

### Phase 1: Setup
**Install PartyKit:**
```bash
npx partykit@latest init
npm install partykit partysocket
```

**Project Structure:**
```
webrtc-project/
├── src/app/              # Next.js frontend
├── party/                # PartyKit server code
│   └── webrtc-room.ts    # Room server for signaling
└── partykit.json         # PartyKit config
```

### Phase 2: PartyKit Room Server
**Create `party/webrtc-room.ts`:**
```typescript
import type * as Party from "partykit/server";

export default class WebRTCRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // Handle new connections
  onConnect(conn: Party.Connection) {
    console.log(`User ${conn.id} connected to room ${this.room.id}`);
  }

  // Handle incoming messages (offers, answers, ICE candidates)
  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);
    
    // Broadcast to all OTHER users in the room
    this.room.broadcast(
      message,
      [sender.id] // exclude sender
    );
  }

  // Handle disconnections
  onClose(conn: Party.Connection) {
    console.log(`User ${conn.id} disconnected`);
    // Notify other party
    this.room.broadcast(JSON.stringify({
      type: 'peer-disconnected',
      peerId: conn.id
    }), [conn.id]);
  }
}
```

**Why This Works:**
- PartyKit automatically manages "rooms" (perfect for calls)
- Each call gets its own room (identified by call ID)
- Messages are broadcast to other party instantly via WebSocket
- Built-in connection/disconnection handling

### Phase 3: Client-Side Connection
**Create `src/services/signaling.js`:**
```javascript
import PartySocket from "partysocket";

export class PartyKitSignaling {
  constructor(callId) {
    // Connect to PartyKit room
    this.socket = new PartySocket({
      host: "localhost:1999", // dev server
      room: callId,
      party: "webrtc-room"
    });

    this.messageHandlers = new Map();
  }

  // Send offer to remote peer
  sendOffer(offer) {
    this.socket.send(JSON.stringify({
      type: 'offer',
      offer: offer
    }));
  }

  // Send answer to remote peer
  sendAnswer(answer) {
    this.socket.send(JSON.stringify({
      type: 'answer',
      answer: answer
    }));
  }

  // Send ICE candidate
  sendIceCandidate(candidate) {
    this.socket.send(JSON.stringify({
      type: 'ice-candidate',
      candidate: candidate
    }));
  }

  // Listen for messages from remote peer
  onMessage(callback) {
    this.socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    });
  }

  // Close connection
  close() {
    this.socket.close();
  }
}
```

### Phase 4: Using PartyKit with WebRTC
**In your WebRTC hook/component:**
```javascript
// Initialize signaling
const signaling = new PartyKitSignaling(callId);

// Create peer connection
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

// Send ICE candidates through PartyKit
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    signaling.sendIceCandidate(event.candidate);
  }
};

// Listen for remote messages
signaling.onMessage((data) => {
  switch (data.type) {
    case 'offer':
      peerConnection.setRemoteDescription(data.offer);
      // Create answer...
      break;
    case 'answer':
      peerConnection.setRemoteDescription(data.answer);
      break;
    case 'ice-candidate':
      peerConnection.addIceCandidate(data.candidate);
      break;
    case 'peer-disconnected':
      // Handle disconnection
      break;
  }
});
```

---

## Updated File Structure with PartyKit

```
webrtc-project/
├── src/
│   ├── app/
│   │   ├── page.js                    # Home: Create/Join call
│   │   ├── call/[callId]/page.js      # Call interface
│   │   └── layout.js
│   ├── components/
│   │   ├── VideoDisplay.jsx           # Video elements
│   │   └── CallControls.jsx           # End call, mute
│   ├── services/
│   │   ├── signaling.js               # PartyKit signaling
│   │   └── webrtc.js                  # WebRTC logic
│   └── hooks/
│       └── useWebRTC.js               # Main WebRTC hook
├── party/
│   └── webrtc-room.ts                 # PartyKit room server
├── partykit.json                      # PartyKit config
└── package.json
```

---

## Development Workflow

### Running the App:
```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: PartyKit dev server
npx partykit dev
```

### Deploying:
```bash
# Deploy PartyKit room server
npx partykit deploy

# Deploy Next.js app (Vercel, etc.)
npm run build
```

---

## Pros of Using PartyKit

✅ **Simpler Architecture**
- No database setup needed
- No Firebase Console configuration
- Just npm install and code

✅ **True Real-Time**
- Native WebSocket connections
- Instant message delivery
- No polling overhead

✅ **Room-Based Design**
- Perfect for call/room scenarios
- Automatic room isolation
- Built-in presence detection

✅ **Server Logic Control**
- Can add validation on server
- Can implement custom room logic
- Better security (server validates messages)

✅ **Better for WebRTC**
- Designed for real-time multiplayer apps
- Lower latency for signaling
- Automatic reconnection handling

---

## Pros of Using Firebase

✅ **Persistent Storage**
- Call history can be stored
- User management built-in
- Can add authentication easily

✅ **Ecosystem Integration**
- Firebase Auth for user login
- Firebase Storage for recordings
- Firebase Functions for backend logic

✅ **Familiar for Many Developers**
- Popular, well-documented
- Large community
- Many tutorials available

✅ **No Server Management**
- Purely client-side code
- No server deployment needed
- Just database rules

---

## Recommendation for Your MVP

### Use **PartyKit** if:
- You want the simplest setup
- Focus is purely on WebRTC calling
- You want true real-time performance
- You're comfortable with minimal backend code

### Use **Firebase** if:
- You plan to add user accounts/authentication
- You want to store call history
- You need database features beyond signaling
- You prefer no server deployment

---

## Quick Start with PartyKit

1. **Initialize PartyKit:**
   ```bash
   npx partykit@latest init
   ```

2. **Create room server** (`party/webrtc-room.ts`) - see Phase 2 above

3. **Update signaling service** - Replace Firebase code with PartyKit WebSocket

4. **Run both dev servers:**
   ```bash
   npm run dev              # Next.js
   npx partykit dev         # PartyKit
   ```

5. **Test**: Create call in one tab, join in another using call ID

---

## Hybrid Approach (Best of Both Worlds)

You can also use **both** together:
- **PartyKit** for real-time signaling (fast WebSocket messaging)
- **Firebase** for user authentication and call history storage

This gives you optimal real-time performance while maintaining user/data management capabilities.

---

## Conclusion

For a **simple WebRTC MVP focusing on core concepts**, PartyKit is actually **simpler and more suitable** than Firebase:
- Faster setup (no Firebase Console)
- Better performance (native WebSockets)
- Natural fit for room-based calling
- Less code to write

The original plan with Firebase is still excellent if you want to learn about using databases for signaling or plan to expand with auth/storage features later.

