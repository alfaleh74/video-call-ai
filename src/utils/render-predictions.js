/**
 * Render AI predictions on canvas
 * Optimized rendering utilities for TensorFlow.js predictions
 */

/**
 * Render object detection predictions (COCO-SSD)
 */
export function renderObjectDetections(predictions, ctx) {
  if (!predictions || predictions.length === 0) return;

  // Font setup
  const font = "16px sans-serif";
  ctx.font = font;
  ctx.textBaseline = "top";

  predictions.forEach((prediction) => {
    const { x, y, width, height, label, confidence } = prediction;

    // Color based on object type
    const isPerson = label === "person";
    const color = isPerson ? "#FF0000" : "#00FFFF";

    // Draw bounding box
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Fill semi-transparent background for person
    if (isPerson) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
      ctx.fillRect(x, y, width, height);
    }

    // Draw label background
    const text = `${label} ${Math.round(confidence * 100)}%`;
    const textWidth = ctx.measureText(text).width;
    const textHeight = parseInt(font, 10);

    ctx.fillStyle = color;
    ctx.fillRect(x, y - textHeight - 4, textWidth + 8, textHeight + 4);

    // Draw label text
    ctx.fillStyle = "#000000";
    ctx.fillText(text, x + 4, y - textHeight - 4);
  });
}

/**
 * Render image classification predictions (MobileNet)
 */
export function renderClassifications(predictions, ctx) {
  if (!predictions || predictions.length === 0) return;

  // Draw on top-left corner
  const padding = 10;
  const lineHeight = 24;
  const font = "16px sans-serif";

  ctx.font = font;
  ctx.textBaseline = "top";

  predictions.forEach((prediction, index) => {
    const y = padding + index * lineHeight;
    const text = `${prediction.label}: ${Math.round(prediction.confidence * 100)}%`;

    // Background
    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(padding - 4, y - 2, textWidth + 8, lineHeight - 4);

    // Text
    ctx.fillStyle = "#00FF00";
    ctx.fillText(text, padding, y);
  });
}

/**
 * Render pose detection keypoints
 */
export function renderPoseKeypoints(poses, ctx) {
  if (!poses || poses.length === 0) return;

  poses.forEach((pose) => {
    // Draw skeleton lines
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;

    // Draw keypoints
    pose.keypoints.forEach((keypoint) => {
      if (keypoint.score > 0.3) {
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  });
}

/**
 * Render hand tracking landmarks
 * MediaPipe Hands provides 21 keypoints per hand
 * Optimized with batched path operations and bounds checking
 */
export function renderHandLandmarks(hands, ctx) {
  if (!hands || hands.length === 0) return;

  // Hand landmark connections (MediaPipe hand model)
  const connections = [
    // Thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Index finger
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Middle finger
    [0, 9], [9, 10], [10, 11], [11, 12],
    // Ring finger
    [0, 13], [13, 14], [14, 15], [15, 16],
    // Pinky
    [0, 17], [17, 18], [18, 19], [19, 20],
    // Palm
    [5, 9], [9, 13], [13, 17]
  ];

  // Pre-compute fingertip indices as Set for O(1) lookup
  const fingertipIndices = new Set([0, 4, 8, 12, 16, 20]);
  
  // Canvas bounds
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  
  // Helper: check if a point is strictly within canvas bounds
  // No margin - dots must be completely on screen to be rendered
  const isInBounds = (x, y) => {
    // Check for valid numbers and strict canvas boundaries
    if (typeof x !== 'number' || typeof y !== 'number' || 
        !isFinite(x) || !isFinite(y) || isNaN(x) || isNaN(y)) {
      return false;
    }
    // Strict bounds: point must be inside the canvas (0 to width/height)
    return x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight;
  };

  hands.forEach((hand) => {
    const keypoints = hand.keypoints;
    if (!keypoints || keypoints.length === 0) return;

    // Determine available depth values from keypoints (if present)
    const zValues = keypoints.map(k => k.z).filter(z => typeof z === 'number' && !Number.isNaN(z));
    const hasDepth = zValues.length === keypoints.length && zValues.length > 0;
    // Normalize z for simple depth cue: smaller (closer) -> larger radius
    let zMin = 0, zMax = 0, zRange = 1;
    if (hasDepth) {
      zMin = Math.min(...zValues);
      zMax = Math.max(...zValues);
      zRange = zMax - zMin || 0.002; // Avoid division by zero
    }
    
    // Determine hand color (left vs right)
    const isLeft = hand.handedness === 'Left';
    const handColor = isLeft ? "#00FF00" : "#00FFFF"; // Green for left, cyan for right
    
    // OPTIMIZATION: Batch all connections into a single path (only if both endpoints are in bounds)
    ctx.strokeStyle = handColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < connections.length; i++) {
      const [start, end] = connections[i];
      const kpStart = keypoints[start];
      const kpEnd = keypoints[end];
      // Only draw connection if both points exist and are within bounds
      if (kpStart && kpEnd && 
          isInBounds(kpStart.x, kpStart.y) && 
          isInBounds(kpEnd.x, kpEnd.y)) {
        ctx.moveTo(kpStart.x, kpStart.y);
        ctx.lineTo(kpEnd.x, kpEnd.y);
      }
    }
    ctx.stroke();
    
    // OPTIMIZATION: Batch keypoint fills and strokes separately
    // First pass: draw all filled circles (only for points in bounds)
    ctx.fillStyle = handColor;
    ctx.beginPath();
    for (let i = 0; i < keypoints.length; i++) {
      const keypoint = keypoints[i];
      if (!keypoint || !isInBounds(keypoint.x, keypoint.y)) continue;
      
      // Larger circle for wrist and fingertips
      let baseRadius = fingertipIndices.has(i) ? 6 : 4;

      if (hasDepth) {
        // Map z to [0.7, 1.3] scale; closer (smaller z) -> larger
        const t = (keypoint.z - zMin) / zRange;
        const scale = 1.3 - 0.6 * t;
        baseRadius *= scale;
      }
      
      ctx.moveTo(keypoint.x + baseRadius, keypoint.y);
      ctx.arc(keypoint.x, keypoint.y, baseRadius, 0, 2 * Math.PI);
    }
    ctx.fill();
    
    // Second pass: draw white borders in one stroke (only for points in bounds)
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < keypoints.length; i++) {
      const keypoint = keypoints[i];
      if (!keypoint || !isInBounds(keypoint.x, keypoint.y)) continue;
      
      let baseRadius = fingertipIndices.has(i) ? 6 : 4;
      if (hasDepth) {
        const t = (keypoint.z - zMin) / zRange;
        const scale = 1.3 - 0.6 * t;
        baseRadius *= scale;
      }
      
      ctx.moveTo(keypoint.x + baseRadius, keypoint.y);
      ctx.arc(keypoint.x, keypoint.y, baseRadius, 0, 2 * Math.PI);
    }
    ctx.stroke();
  });
}

/**
 * Render face detection landmarks
 */
export function renderFaceLandmarks(faces, ctx) {
  if (!faces || faces.length === 0) return;

  faces.forEach((face) => {
    // Draw bounding box
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 2;
    ctx.strokeRect(face.box.x, face.box.y, face.box.width, face.box.height);

    // Draw keypoints
    if (face.keypoints) {
      face.keypoints.forEach((keypoint) => {
        ctx.fillStyle = "#FFFF00";
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  });
}

/**
 * Render background segmentation (BodyPix)
 */
export function renderBackgroundSegmentation(segmentation, ctx, videoElement) {
  if (!segmentation || !segmentation.data) return;
  
  const { data, width, height } = segmentation;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  
  // Create ImageData for the mask
  const imageData = ctx.createImageData(canvasWidth, canvasHeight);
  
  // Scale segmentation data to canvas size
  const scaleX = width / canvasWidth;
  const scaleY = height / canvasHeight;
  
  // Apply semi-transparent overlay on background (non-person pixels)
  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      const segX = Math.floor(x * scaleX);
      const segY = Math.floor(y * scaleY);
      const segIndex = segY * width + segX;
      
      const pixelIndex = (y * canvasWidth + x) * 4;
      
      // If this pixel is background (0), make it blue-tinted and semi-transparent
      if (data[segIndex] === 0) {
        imageData.data[pixelIndex] = 100;     // R
        imageData.data[pixelIndex + 1] = 150; // G
        imageData.data[pixelIndex + 2] = 255; // B
        imageData.data[pixelIndex + 3] = 120; // A (semi-transparent)
      } else {
        // Person pixel - keep transparent
        imageData.data[pixelIndex + 3] = 0;
      }
    }
  }
  
  // Draw the mask
  ctx.putImageData(imageData, 0, 0);
  
  // Add text indicator
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(10, ctx.canvas.height - 40, 200, 30);
  
  ctx.fillStyle = "#00FF00";
  ctx.font = "14px Arial";
  ctx.fillText("Background Segmentation", 15, ctx.canvas.height - 20);
}

/**
 * Clear canvas
 */
export function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

