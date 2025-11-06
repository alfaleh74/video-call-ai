# Testing Guide

## Local Testing (Two Browser Tabs)

### Setup
1. Start both servers:
   - Terminal 1: `npm run dev` (Next.js on port 3000)
   - Terminal 2: `npm run partykit` (PartyKit on port 1999)

### Test Steps

**Tab 1 - Party A (Initiator):**
1. Open http://localhost:3000
2. Click "Create New Call"
3. Allow camera/microphone permissions
4. Copy the call ID displayed at top
5. You should see your local video in bottom-right corner
6. Wait for Party B to join

**Tab 2 - Party B (Answerer):**
1. Open http://localhost:3000 in new tab/window
2. Paste the call ID from Party A
3. Click "Join"
4. Allow camera/microphone permissions
5. Connection should establish within 2-5 seconds

**Expected Results:**
- Both tabs show "Connected" status (green dot)
- Party A sees Party B's video in main screen
- Party B sees Party A's video in main screen
- Both see their own video in bottom-right corner
- Audio works both directions

### Troubleshooting

**Connection stays "Connecting":**
- Check browser console for errors
- Ensure both servers are running
- Check call ID matches exactly
- Wait 10 seconds (ICE gathering can be slow)

**No video/audio:**
- Check camera/mic permissions in browser
- Check browser DevTools → Console for errors
- Try refreshing both tabs
- Ensure using Chrome/Firefox/Edge (Safari can be tricky)

**"Other party disconnected" immediately:**
- One party may have denied permissions
- Check if tab was accidentally closed
- Try restarting both tabs

## Browser Console Logs

Good connection flow should show:
```
Requesting camera and microphone access...
Media access granted
Creating peer connection with STUN servers
Connecting to signaling server...
Connected to PartyKit room: [callId]
Creating initial offer... (Party A only)
New ICE candidate generated (multiple times)
Received offer from remote peer (Party B only)
Received ICE candidate from remote peer (multiple times)
Connection state: connected
```

## Testing Checklist
- [ ] Both parties can create calls
- [ ] Call ID can be copied
- [ ] Both parties can join with call ID
- [ ] Camera permissions work
- [ ] Microphone permissions work
- [ ] Video displays for both parties
- [ ] Audio works bidirectionally
- [ ] Connection status updates correctly
- [ ] End call button works
- [ ] Return to home after ending call
- [ ] Error messages display when appropriate

