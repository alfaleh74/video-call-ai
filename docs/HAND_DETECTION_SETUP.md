# Hand Detection Implementation

## Overview
Added MediaPipe Hands for real-time hand tracking with 21 keypoints per hand.

## Features
- **21 Landmarks per hand**: Wrist + all finger joints
- **Left/Right Detection**: Automatically distinguishes hands
- **Multi-hand Tracking**: Tracks up to 2 hands simultaneously
- **Real-time Performance**: ~10 FPS processing
- **Visual Feedback**: Color-coded (Green=Left, Cyan=Right)

## Installation
```bash
npm install @tensorflow-models/hand-pose-detection @mediapipe/hands
```

## Configuration

### Next.js Config (`next.config.mjs`)
Added server-side exclusions to prevent SSR errors:

```javascript
serverExternalPackages: [
  '@tensorflow/tfjs',
  '@tensorflow-models/hand-pose-detection',
  '@mediapipe/hands',
],

webpack: (config, { isServer }) => {
  if (isServer) {
    config.resolve.alias['@mediapipe/hands'] = false;
    config.resolve.alias['@tensorflow-models/hand-pose-detection'] = false;
  }
  return config;
}
```

**Why?** MediaPipe is browser-only and cannot run during server-side rendering.

## Implementation

### 1. Hook (`useTensorFlow.js`)
```javascript
// Load MediaPipe Hands (client-side only)
if (aiSettings.handTracking && typeof window !== 'undefined') {
  const handPoseModule = await import('@tensorflow-models/hand-pose-detection');
  modelsRef.current.handTracking = await handPoseModule.createDetector(
    handPoseModule.SupportedModels.MediaPipeHands,
    {
      runtime: 'tfjs',
      modelType: 'lite', // Fast model
      maxHands: 2,
    }
  );
}

// Run detection
const predictions = await modelsRef.current.handTracking.estimateHands(videoElement);
```

### 2. Rendering (`render-predictions.js`)
```javascript
export function renderHandLandmarks(hands, ctx) {
  hands.forEach((hand) => {
    // Draw 21 keypoints
    hand.keypoints.forEach((keypoint) => {
      ctx.arc(keypoint.x, keypoint.y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw connections between joints
    connections.forEach(([start, end]) => {
      ctx.moveTo(keypoints[start].x, keypoints[start].y);
      ctx.lineTo(keypoints[end].x, keypoints[end].y);
      ctx.stroke();
    });
  });
}
```

### 3. UI Integration (`AISettings.jsx`)
```javascript
{
  id: "handTracking",
  name: "Hand Tracking",
  description: "Track hand landmarks and gestures (21 points)",
  icon: "✋",
  status: "ready", // Marked as ready
}
```

## Hand Landmark Structure

MediaPipe Hands provides 21 keypoints:
- **0**: Wrist
- **1-4**: Thumb (4 points)
- **5-8**: Index finger (4 points)
- **9-12**: Middle finger (4 points)
- **13-16**: Ring finger (4 points)
- **17-20**: Pinky finger (4 points)

## Deployment Notes

### Vercel/Next.js Build Error
If you see: `Export Hands doesn't exist in target module`

**Solution**: The Next.js config above prevents server-side bundling.

### Key Points:
1. **Client-only execution**: Check `typeof window !== 'undefined'`
2. **Dynamic imports**: Use `await import()` for conditional loading
3. **Error handling**: Gracefully handle failed imports
4. **Server externals**: Configure in `next.config.mjs`

## Usage

### Test Camera Page
1. Navigate to `/test-camera`
2. Enable "Hand Tracking" ✋
3. Show your hands to camera
4. See real-time tracking with:
   - 21 keypoints per hand
   - Skeleton connections
   - Left/Right labels

### Video Call
1. Create/join a call
2. Click "AI Features" button
3. Enable "Hand Tracking"
4. Hand landmarks appear on both local and remote video

## Performance

- **Model Load Time**: ~2-3 seconds (first time)
- **Inference Speed**: ~100ms per frame
- **Processing Rate**: 10 FPS (100ms interval)
- **Memory Usage**: ~50MB additional

## Troubleshooting

### Build Error: "Hands doesn't exist"
- ✅ Check `next.config.mjs` has webpack aliases
- ✅ Ensure `typeof window !== 'undefined'` check

### Model Not Loading
- Check console for "[useTensorFlow] Loading MediaPipe Hands..."
- Verify dynamic import works: `await import('@tensorflow-models/hand-pose-detection')`
- Check network tab for model file downloads

### No Hands Detected
- Ensure good lighting
- Keep hands visible and not too close
- Try moving hands slowly
- Check confidence threshold (default detects most hands)

## Future Enhancements

1. **Gesture Recognition**: Detect thumbs up, peace sign, etc.
2. **Hand Pose Classification**: Identify hand shapes
3. **Multi-hand Interactions**: Track hand proximity/interactions
4. **Performance Mode**: Toggle between 'lite' and 'full' models

## Files Modified

1. `next.config.mjs` - Server-side exclusions
2. `src/hooks/useTensorFlow.js` - Model loading & inference
3. `src/utils/render-predictions.js` - Hand landmark rendering
4. `src/components/AIOverlay.jsx` - Integration
5. `src/components/AISettings.jsx` - UI control
6. `package.json` - Dependencies

## Dependencies

```json
{
  "@tensorflow-models/hand-pose-detection": "^2.1.3",
  "@mediapipe/hands": "^0.4.1675469240"
}
```

---

**Status**: ✅ Implemented and tested
**Last Updated**: 2025-11-05

