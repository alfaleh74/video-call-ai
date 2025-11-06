# WebRTC MVP with PartyKit - Implementation Guide

## Tech Stack
- **Next.js 15** - Frontend framework
- **PartyKit** - Real-time signaling via WebSocket
- **WebRTC** - Peer-to-peer video/audio
- **STUN** - NAT traversal (Google's free STUN servers)

## Quick Overview
1. Party A creates a call → gets call ID
2. Both parties connect to PartyKit room (call ID)
3. Exchange WebRTC offers/answers/ICE via PartyKit WebSocket
4. Establish direct peer-to-peer connection
5. Video streams flow directly between browsers

---

## Phase 1: Setup PartyKit + Dependencies
- Install PartyKit and PartySocket
- Create PartyKit server directory
- Set up basic Next.js pages

## Phase 2: PartyKit Room Server
- Create WebRTC signaling room server
- Handle offer/answer/ICE candidate broadcasting
- Implement connection/disconnection events

## Phase 3: Signaling Service (Client)
- WebSocket connection to PartyKit room
- Methods to send/receive signaling data
- Handle message types (offer, answer, ICE)

## Phase 4: WebRTC Hook
- Create peer connection with STUN config
- Integrate with signaling service
- Handle local/remote streams
- Manage connection lifecycle

## Phase 5: UI Components
- Home page (create/join call)
- Call page with video displays
- Call controls (end call, copy ID)
- Connection status indicator

## Phase 6: Testing
- Two-tab local testing
- Connection state monitoring
- Error handling and cleanup

---

## File Structure

```
webrtc-project/
├── src/
│   ├── app/
│   │   ├── page.js                    # Home: Create/Join
│   │   ├── call/[callId]/page.js      # Call interface
│   │   ├── layout.js
│   │   └── globals.css
│   ├── components/
│   │   ├── VideoDisplay.jsx           # Video elements
│   │   ├── CallControls.jsx           # End/Copy buttons
│   │   └── ConnectionStatus.jsx       # Status indicator
│   ├── services/
│   │   └── signaling.js               # PartyKit WebSocket
│   └── hooks/
│       └── useWebRTC.js               # Main WebRTC logic
├── party/
│   └── index.ts                       # PartyKit room server
└── partykit.json                      # PartyKit config
```

---

## Development Commands

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: PartyKit
npx partykit dev
```

