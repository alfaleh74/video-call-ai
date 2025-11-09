"use client";

import { useEffect, useRef, useCallback } from "react";
import { 
  renderObjectDetections, 
  renderClassifications,
  renderHandLandmarks,
  clearCanvas 
} from "@/utils/render-predictions";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";

/**
 * AI Overlay Component - Simplified and optimized
 * Draws detection results on top of video
 * 
 * Based on proven patterns from working Next.js AI detection apps
 */
export default function AIOverlay({ videoRef, getResults, aiEnabled = true }) {
  const canvasRef = useRef(null);

  // Render callback throttled to 60 FPS
  const renderFrame = useCallback(() => {
    const videoElement = videoRef?.current?.video || videoRef?.current;
    const canvas = canvasRef.current;
    if (!canvas || !videoElement) return;

    const ctx = canvas.getContext('2d');

    // Check if video is ready (readyState === 4 means HAVE_ENOUGH_DATA)
    if (videoElement.readyState === 4) {
      // Get video intrinsic dimensions (actual video resolution)
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;
      
      // Get displayed size (what user sees after CSS scaling)
      const displayWidth = videoElement.clientWidth;
      const displayHeight = videoElement.clientHeight;
      
      // Sync canvas to displayed size for 1:1 pixel mapping
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      // Calculate scaling factors
      const scaleX = displayWidth / videoWidth;
      const scaleY = displayHeight / videoHeight;

      // Always clear canvas first
      clearCanvas(ctx);

      // Only render AI results if AI is enabled
      if (aiEnabled) {
        const aiResults = getResults ? getResults() : {};

        // Apply coordinate scaling transform
        ctx.save();
        ctx.scale(scaleX, scaleY);

        if (aiResults.objects && aiResults.objects.length > 0) {
          renderObjectDetections(aiResults.objects, ctx);
        }

        if (aiResults.classifications && aiResults.classifications.length > 0) {
          renderClassifications(aiResults.classifications, ctx);
        }

        if (aiResults.hands && aiResults.hands.length > 0) {
          renderHandLandmarks(aiResults.hands, ctx);
        }
        
        ctx.restore();
      }
    }
  }, [videoRef, getResults, aiEnabled]);

  // Throttle rendering to a target of 60 FPS regardless of monitor refresh rate
  useAnimationFrame(renderFrame, true, 60);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ 
        zIndex: 10,
        objectFit: 'cover' // Match video's object-fit to prevent coordinate drift
      }}
    />
  );
}
