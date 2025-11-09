"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import { loadMediaPipeHands } from "@/lib/mediapipeHandsLoader";

// TODO: Add when ready
// import * as poseDetection from "@tensorflow-models/pose-detection";
// import * as faceDetection from "@tensorflow-models/face-detection";
// import * as bodyPix from "@tensorflow-models/body-pix";

/**
 * TensorFlow.js Hook - Simplified and optimized for real-time video processing
 * 
 * Based on proven patterns from working Next.js AI detection apps
 * 
 * Performance Optimizations:
 * - setInterval-based detection loop (10ms interval like proven implementations)
 * - WebGL backend with GPU acceleration
 * - Optimized model configurations (lite variants)
 * - Tensor memory management
 * - Model caching and lazy loading
 */

let detectInterval = null;

export function useTensorFlow(videoRef, aiSettings) {
  const [isLoading, setIsLoading] = useState(true);
  const [tfReady, setTfReady] = useState(false);
  const [activeModels, setActiveModels] = useState({});
  
  const modelsRef = useRef({});
  const lastResultsRef = useRef({});

  // Initialize TensorFlow.js with WebGL backend
  useEffect(() => {
    const initTF = async () => {
      try {
        console.log('[useTensorFlow] Initializing TensorFlow.js...');
        await tf.ready();
        
        // Force WebGL backend for GPU acceleration
        await tf.setBackend('webgl');
        
        // Enable WebGL optimizations
        tf.env().set('WEBGL_VERSION', 2);
        tf.env().set('WEBGL_CPU_FORWARD', false);
        tf.env().set('WEBGL_PACK', true);
        
        console.log('[useTensorFlow] ✅ TensorFlow.js ready');
        console.log('[useTensorFlow] Backend:', tf.getBackend());
        console.log('[useTensorFlow] Memory:', tf.memory());
        
        setTfReady(true);
      } catch (error) {
        console.error('[useTensorFlow] Failed to initialize:', error);
      }
    };
    
    initTF();
    
    // Cleanup on unmount
    return () => {
      if (detectInterval) {
        clearInterval(detectInterval);
        detectInterval = null;
      }
      
      // Dispose all models
      Object.values(modelsRef.current).forEach(model => {
        if (model && model.dispose) {
          model.dispose();
        }
        if (model && model.close) {
          model.close();
        }
      });
      modelsRef.current = {};
    };
  }, []);

  /**
   * Load models based on active AI settings
   */
  const loadModels = useCallback(async () => {
    if (!tfReady) return;
    
    try {
      // Load Object Detection (COCO-SSD)
      if (aiSettings.objectDetection && !modelsRef.current.objectDetection) {
        console.log('[useTensorFlow] Loading COCO-SSD...');
        const cocoSsdModule = await import('@tensorflow-models/coco-ssd');
        // Access the load function correctly (could be default or named export)
        const loadFn = cocoSsdModule.default?.load || cocoSsdModule.load;
        if (!loadFn) {
          throw new Error('COCO-SSD load function not found');
        }
        // Use mobilenet_v1 base for broader compatibility
        modelsRef.current.objectDetection = await loadFn({ base: 'mobilenet_v1' });
        console.log('[useTensorFlow] ✅ COCO-SSD loaded');
        setActiveModels({ ...modelsRef.current });
      }
      
      // Load Image Classification (MobileNet)
      if (aiSettings.imageClassification && !modelsRef.current.imageClassification) {
        console.log('[useTensorFlow] Loading MobileNet...');
        const mobilenetModule = await import('@tensorflow-models/mobilenet');
        // Access the load function correctly (could be default or named export)
        const loadFn = mobilenetModule.default?.load || mobilenetModule.load;
        if (!loadFn) {
          throw new Error('MobileNet load function not found');
        }
        modelsRef.current.imageClassification = await loadFn({
          version: 2,
          alpha: 0.5 // Faster, less accurate
        });
        console.log('[useTensorFlow] ✅ MobileNet loaded');
        setActiveModels({ ...modelsRef.current });
      }
      
      // 3D Hand Pose using MediaPipe Hands via CDN (avoid ESM import issues)
      if (aiSettings.handPose3D && !modelsRef.current.handPose3D) {
        console.log('[useTensorFlow] Loading 3D Hand Pose (MediaPipe via CDN)...');
        const Hands = await loadMediaPipeHands();
        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        hands.setOptions({
          modelComplexity: 1,
          maxNumHands: 2,
          selfieMode: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        hands.onResults((res) => {
          modelsRef.current.handPose3DLast = res;
        });
        modelsRef.current.handPose3D = hands;
        console.log('[useTensorFlow] ✅ 3D Hand Pose (MediaPipe) ready');
        setActiveModels({ ...modelsRef.current });
      }
      
      // Background segmentation removed per user request
      
      setIsLoading(false);
    } catch (error) {
      console.error('[useTensorFlow] Error loading models:', error);
      setIsLoading(false);
    }
  }, [tfReady, aiSettings]);

  /**
   * Run object detection on video frame
   */
  const runObjectDetection = useCallback(async (videoElement) => {
    if (!modelsRef.current.objectDetection) return null;
    
    try {
      // Run detection (use default signature to avoid runtime issues across versions)
      const predictions = await modelsRef.current.objectDetection.detect(videoElement);
      
      // Filter low-confidence detections manually
      const filtered = Array.isArray(predictions)
        ? predictions.filter(p => (typeof p.score === 'number' ? p.score >= 0.6 : true))
        : [];
      
      return filtered.map(p => ({
        label: p.class,
        confidence: p.score,
        x: p.bbox[0],
        y: p.bbox[1],
        width: p.bbox[2],
        height: p.bbox[3]
      }));
    } catch (error) {
      console.error('[useTensorFlow] Object detection error:', error);
      return null;
    }
  }, []);

  /**
   * Run image classification on video frame
   */
  const runImageClassification = useCallback(async (videoElement) => {
    if (!modelsRef.current.imageClassification) return null;
    
    try {
      const predictions = await modelsRef.current.imageClassification.classify(
        videoElement,
        3 // Top 3 predictions
      );
      
      // MobileNet returns predictions pre-sorted by confidence (highest first)
      // But let's ensure they're sorted descending just in case
      const sorted = predictions.sort((a, b) => b.probability - a.probability);
      
      return sorted.map(p => ({
        label: p.className,
        confidence: p.probability
      }));
    } catch (error) {
      console.error('[useTensorFlow] Classification error:', error);
      return null;
    }
  }, []);

  /**
   * Run hand tracking on video frame
   */
  const runHandTracking = useCallback(async (videoElement) => {
    if (!modelsRef.current.handTracking) return null;
    
    try {
      const predictions = await modelsRef.current.handTracking.estimateHands(videoElement);
      
      if (!predictions || predictions.length === 0) return null;
      
      return predictions.map(hand => ({
        handedness: hand.handedness, // 'Left' or 'Right'
        score: hand.score,
        keypoints: hand.keypoints.map(kp => ({
          x: kp.x,
          y: kp.y,
          z: kp.z,
          name: kp.name
        }))
      }));
    } catch (error) {
      console.error('[useTensorFlow] Hand tracking error:', error);
      return null;
    }
  }, []);

  /**
   * Run 3D hand pose on video frame
   */
  const runHandPose3D = useCallback(async (videoElement) => {
    if (!modelsRef.current.handPose3D) return null;

    try {
      const hands = modelsRef.current.handPose3D;
      await hands.send({ image: videoElement });
      const res = modelsRef.current.handPose3DLast;
      if (!res) return null;

      const videoW = videoElement.videoWidth || 0;
      const videoH = videoElement.videoHeight || 0;
      const names = [
        "wrist",
        "thumb_cmc","thumb_mcp","thumb_ip","thumb_tip",
        "index_finger_mcp","index_finger_pip","index_finger_dip","index_finger_tip",
        "middle_finger_mcp","middle_finger_pip","middle_finger_dip","middle_finger_tip",
        "ring_finger_mcp","ring_finger_pip","ring_finger_dip","ring_finger_tip",
        "pinky_finger_mcp","pinky_finger_pip","pinky_finger_dip","pinky_finger_tip"
      ];

      const out = [];
      const lms2D = res.multiHandLandmarks || [];
      const lms3D = res.multiHandWorldLandmarks || [];
      const handedness = res.multiHandedness || [];

      for (let i = 0; i < lms2D.length; i++) {
        const pts2 = lms2D[i] || [];
        const pts3 = lms3D[i] || [];
        const handness = handedness[i];

        const keypoints = pts2.map((pt, idx) => ({
          x: (pt.x <= 1 ? pt.x * videoW : pt.x),
          y: (pt.y <= 1 ? pt.y * videoH : pt.y),
          z: pt.z,
          name: names[idx] || `kp_${idx}`
        }));

        const keypoints3D = pts3.map((pt, idx) => ({
          x: pt.x,
          y: pt.y,
          z: pt.z,
          name: names[idx] || `kp_${idx}`
        }));

        out.push({
          handedness: handness?.label || 'Hand',
          score: handness?.score ?? 0,
          keypoints,
          keypoints3D,
        });
      }

      return out.length ? out : null;
    } catch (error) {
      console.error('[useTensorFlow] 3D hand pose error:', error);
      return null;
    }
  }, []);

  /**
   * Run background segmentation on video frame
   */
  const runBackgroundSegmentation = useCallback(async (videoElement) => {
    if (!modelsRef.current.backgroundRemoval) return null;
    
    try {
      // Segment the person from background
      const segmentation = await modelsRef.current.backgroundRemoval.segmentPerson(videoElement, {
        flipHorizontal: false,
        internalResolution: 'medium', // 'low', 'medium', 'high', 'full'
        segmentationThreshold: 0.7 // 0-1, higher = more strict
      });
      
      // Return segmentation data (will be processed by rendering utility)
      return {
        data: segmentation.data, // Uint8Array where 1 = person, 0 = background
        width: segmentation.width,
        height: segmentation.height
      };
    } catch (error) {
      console.error('[useTensorFlow] Background segmentation error:', error);
      return null;
    }
  }, []);

  /**
   * Main detection function - runs on interval
   * Following proven pattern from working implementations
   */
  const runDetection = useCallback(async () => {
    const videoElement = videoRef?.current?.video || videoRef?.current;
    
    // Check if video is ready
    if (
      !videoElement ||
      !tfReady ||
      videoElement.readyState !== 4
    ) {
      return;
    }
    
    // Check if any AI features are enabled
    if (!Object.values(aiSettings).some(v => v)) {
      return;
    }
    
    try {
      const results = {};
      
      // Object Detection
      if (aiSettings.objectDetection) {
        const objects = await runObjectDetection(videoElement);
        if (objects) {
          results.objects = objects;
        }
      }
      
      // Image Classification
      if (aiSettings.imageClassification) {
        const classifications = await runImageClassification(videoElement);
        if (classifications) {
          results.classifications = classifications;
        }
      }
      
      // Hand Tracking
      if (aiSettings.handTracking) {
        const hands = await runHandTracking(videoElement);
        if (hands) {
          results.hands = hands;
        }
      }

      // 3D Hand Pose
      if (aiSettings.handPose3D) {
        const hands = await runHandPose3D(videoElement);
        if (hands) {
          results.hands = hands;
        }
      }
      
      // Store results
      lastResultsRef.current = results;
      
    } catch (error) {
      console.error('[useTensorFlow] Detection error:', error);
    }
  }, [videoRef, tfReady, aiSettings, runObjectDetection, runImageClassification, runHandTracking, runHandPose3D]);

  /**
   * Load models when settings change
   */
  useEffect(() => {
    if (!tfReady) return;
    
    // Load models asynchronously (isLoading managed within loadModels)
    loadModels().catch(err => {
      console.error('[useTensorFlow] Model loading failed:', err);
    });
  }, [tfReady, aiSettings, loadModels]);
  
  /**
   * Start/stop detection loop based on settings
   */
  useEffect(() => {
    if (!tfReady) return;
    
    // Start detection loop if any feature is enabled
    const hasActiveFeatures = Object.values(aiSettings).some(v => v);
    
    if (hasActiveFeatures && !detectInterval) {
      console.log('[useTensorFlow] Starting detection loop (100ms interval)...');
      detectInterval = setInterval(() => {
        // Ensure any promise rejection is caught to avoid Uncaught (in promise)
        Promise.resolve(runDetection()).catch((e) => {
          console.error('[useTensorFlow] Detection loop error:', e);
        });
      }, 100); // 100ms = 10 FPS (good balance between performance and smoothness)
    } else if (!hasActiveFeatures && detectInterval) {
      console.log('[useTensorFlow] Stopping detection loop...');
      clearInterval(detectInterval);
      detectInterval = null;
    }
    
    // Cleanup
    return () => {
      if (detectInterval) {
        clearInterval(detectInterval);
        detectInterval = null;
      }
    };
  }, [tfReady, aiSettings, runDetection]);

  /**
   * Get latest results
   */
  const getResults = useCallback(() => {
    return lastResultsRef.current;
  }, []);

  return {
    tfReady,
    isLoading,
    activeModels,
    getResults,
  };
}
