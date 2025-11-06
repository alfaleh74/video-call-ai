"use client";

import { useEffect, useRef } from "react";
import { 
  renderObjectDetections, 
  renderClassifications,
  renderHandLandmarks,
  clearCanvas 
} from "@/utils/render-predictions";

/**
 * AI Overlay Component - Simplified and optimized
 * Draws detection results on top of video
 * 
 * Based on proven patterns from working Next.js AI detection apps
 */
export default function AIOverlay({ videoRef, getResults, aiEnabled = true }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  /**
   * Render loop - continuously draws AI results on canvas
   * Following proven pattern with requestAnimationFrame
   */
  useEffect(() => {
    const videoElement = videoRef?.current?.video || videoRef?.current;
    const canvas = canvasRef.current;
    
    if (!canvas || !videoElement) return;
    
    const ctx = canvas.getContext('2d');
    
    const renderLoop = () => {
      // Check if video is ready (readyState === 4 means HAVE_ENOUGH_DATA)
      if (videoElement && videoElement.readyState === 4) {
        // Sync canvas size to video dimensions
        if (
          canvas.width !== videoElement.videoWidth ||
          canvas.height !== videoElement.videoHeight
        ) {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
        }
        
        // Always clear canvas first
        clearCanvas(ctx);
        
        // Only render AI results if AI is enabled
        if (aiEnabled) {
        // Get latest AI results
        const aiResults = getResults ? getResults() : {};
        
        // Render object detections (bounding boxes)
        if (aiResults.objects && aiResults.objects.length > 0) {
          renderObjectDetections(aiResults.objects, ctx);
        }
        
        // Render classifications (top-left corner)
        if (aiResults.classifications && aiResults.classifications.length > 0) {
          renderClassifications(aiResults.classifications, ctx);
        }
        
        // Render hand tracking
        if (aiResults.hands && aiResults.hands.length > 0) {
          renderHandLandmarks(aiResults.hands, ctx);
        }
        }
      }
      
      // Continue render loop
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };
    
    // Start render loop
    renderLoop();
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [videoRef, getResults, aiEnabled]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}
