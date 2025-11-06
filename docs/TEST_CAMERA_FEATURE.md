# Test Camera Feature

## Overview

A standalone camera testing page where users can try out all ml5.js AI features before joining a call. This allows you to:
- Preview your camera
- Test AI detection models (objects, hands, poses, faces)
- Verify camera permissions and quality
- Experiment with AI features risk-free

## How to Access

From the home page, click the **"🎥 Test AI Features"** button at the top.

## Features

### Camera Preview
- Full-screen video display
- Real-time camera feed
- Automatic permission request

### AI Testing
- Access to all 6 AI features via dropdown:
  - 🎯 Object Detection
  - 🤸 Pose Detection
  - 😊 Face Detection
  - ✋ Hand Tracking
  - 🖼️ Background Removal
  - 🏷️ Image Classification

### Controls
- **AI Features Button** - Toggle features on/off
- **Back to Menu** - Return to home page (top left)
- **Done Testing** - Alternative back button (bottom right)

### Visual Indicators
- Green dot: ML5 ready status
- Blue processing indicator: AI actively analyzing frames
- Feature count: Shows how many features are enabled
- Real-time overlays: Visual feedback on detected objects/poses/hands

## Use Cases

### Before Your First Call
1. Test camera permissions work
2. Verify camera angle and lighting
3. Try different AI features to see which you prefer

### Debugging
1. Check if specific AI models load correctly
2. Verify detection accuracy in your environment
3. Test performance on your device

### Demos & Presentations
1. Show AI capabilities without needing a second party
2. Compare different AI features side-by-side
3. Take screenshots of detections

## Technical Details

### What Gets Tested
- Camera access (getUserMedia API)
- ml5.js model loading
- Real-time frame processing
- Canvas overlay rendering
- AI detection accuracy

### What Doesn't Happen
- No WebRTC peer connection
- No signaling to PartyKit
- No network bandwidth usage (besides model downloads)
- No call recording or storage

### Performance
- Processes frames at 2 FPS (same as during calls)
- Models download on first enable (1-10 MB each)
- Local processing only (no cloud AI APIs)

## File Structure

```
src/app/test-camera/
└── page.js          # Test camera page component
```

## Code Reuse

The test camera page reuses existing components:
- `useML5` hook - Same AI processing logic
- `AISettings` component - Same dropdown menu
- `AIOverlay` component - Same visual overlays

This ensures consistency between testing and actual calls.

## User Flow

```
Home Page
   ↓
[Click "Test AI Features"]
   ↓
Test Camera Page
- Camera activates
- Enable AI features
- See overlays in real-time
   ↓
[Click "Back" or "Done Testing"]
   ↓
Home Page
- Camera stops automatically
- Ready to create/join call
```

## Tips for Best Results

### Lighting
- Face a light source (window or lamp)
- Avoid backlighting (light behind you)
- Consistent lighting improves detection

### Camera Position
- Center yourself in frame
- Keep 2-3 feet from camera
- Try different angles for pose/hand tracking

### Performance
- Test one feature at a time on slower devices
- Object detection is usually fastest
- Pose and face detection need more processing

### Testing Checklist
- [ ] Camera displays correctly
- [ ] ML5 shows "Ready" status
- [ ] Object detection finds common items
- [ ] Hand tracking follows hand movements
- [ ] Pose detection tracks body keypoints
- [ ] Face detection finds facial features
- [ ] Back button returns to home

## Troubleshooting

**Camera not loading:**
- Check browser permissions (click lock icon in address bar)
- Try refreshing the page
- Ensure no other app is using the camera

**AI features not working:**
- Wait 5-10 seconds for models to download
- Check console for errors (F12)
- Try disabling and re-enabling features
- Ensure stable internet for model downloads

**Overlays not appearing:**
- Ensure feature is enabled (checkbox)
- Check if objects/hands/face are in frame
- Try adjusting lighting
- Wait for "AI Processing Active" indicator

**Page is slow/laggy:**
- Disable unused features
- Close other browser tabs
- Try on a more powerful device
- Refresh the page to clear memory

## Future Enhancements

Potential additions to the test camera page:
- [ ] Screenshot button to save detections
- [ ] Side-by-side feature comparison
- [ ] Performance metrics (FPS, latency)
- [ ] Recording capability
- [ ] Gesture-based controls demo
- [ ] Model accuracy stats
- [ ] Custom background upload for segmentation
- [ ] Lighting quality indicator

## Benefits

### For Users
- Build confidence before first call
- Understand AI features without commitment
- Quick testing without setup

### For Developers
- Isolated testing environment
- Easy bug reproduction
- Performance benchmarking
- Demo capabilities

### For Support
- Users can self-diagnose issues
- Easier to identify camera/permission problems
- Reduces support tickets

---

**The test camera feature makes your WebRTC app more user-friendly by allowing risk-free experimentation with AI features!** 🎥✨

