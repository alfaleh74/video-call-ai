"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useTensorFlow } from "@/hooks/useTensorFlow";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useEffect, useRef, useState, useCallback } from "react";
import AISettings from "@/components/AISettings";
import AIOverlay from "@/components/AIOverlay";

export default function CallPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const deviceInfo = useDeviceDetection();
  
  const callId = params.callId;
  const isInitiator = searchParams.get("initiator") === "true";
  
  const [copied, setCopied] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // "user" = front, "environment" = back
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiSettings, setAISettings] = useState({
    objectDetection: false,
    imageClassification: false,
    handPose3D: false,
  });
  const [aiResults, setAIResults] = useState(null); // local pixel-space results
  const [remoteAIResults, setRemoteAIResults] = useState(null); // remote pixel-space results
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const processingInterval = useRef(null);
  const peerConnectionRef = useRef(null); // Track peer connection for video track replacement
  const remoteVideoContainerRef = useRef(null);
  
  // Handle incoming AI settings from remote peer (stable reference)
  const handleRemoteAISettings = useCallback((settings) => {
    console.log("Received AI settings from remote peer:", settings);
    setAISettings(settings);
  }, []);

  // Handle incoming AI results (stable reference)
  const handleRemoteAIResults = useCallback((normalizedResults) => {
    // Convert normalized results to pixel coordinates using remote video intrinsic size
    const videoEl = remoteVideoRef.current;
    if (!videoEl) return;
    const srcW = videoEl.videoWidth || 0;
    const srcH = videoEl.videoHeight || 0;
    if (!srcW || !srcH) return;

    const toPixel = (nr) => {
      const out = {};
      if (nr.objects) {
        out.objects = nr.objects.map(o => ({
          x: o.x * srcW,
          y: o.y * srcH,
          width: o.width * srcW,
          height: o.height * srcH,
          label: o.label,
          confidence: o.confidence
        }));
      }
      if (nr.poses) {
        out.poses = nr.poses.map(p => ({
          keypoints: (p.keypoints || []).map(k => ({ x: k.x * srcW, y: k.y * srcH, confidence: k.confidence })),
          skeleton: (p.skeleton || []).map(seg => ([
            { x: seg[0].x * srcW, y: seg[0].y * srcH, confidence: seg[0].confidence },
            { x: seg[1].x * srcW, y: seg[1].y * srcH, confidence: seg[1].confidence }
          ]))
        }));
      }
      if (nr.faces) {
        out.faces = nr.faces.map(f => ({
          keypoints: (f.keypoints || []).map(pt => ({ x: pt.x * srcW, y: pt.y * srcH }))
        }));
      }
      if (nr.hands) {
        out.hands = nr.hands.map(h => ({
          keypoints: (h.keypoints || []).map(pt => ({ x: pt.x * srcW, y: pt.y * srcH }))
        }));
      }
      if (nr.classifications) {
        out.classifications = nr.classifications;
      }
      return out;
    };

    setRemoteAIResults(toPixel(normalizedResults));
  }, []);

  const { localStream, remoteStream, connectionState, error, cleanup, signalingRef } = useWebRTC(
    callId,
    isInitiator,
    handleRemoteAISettings,
    handleRemoteAIResults
  );

  // Initialize TensorFlow.js with simplified hook
  const { tfReady, isLoading, getResults } = useTensorFlow(localVideoRef, aiSettings);

  // Update local video element when stream is available
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Update remote video element when stream is available
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle AI settings change
  const handleAISettingsChange = (newSettings) => {
    console.log("AI settings changed:", newSettings);
    setAISettings(newSettings);
    
    // Send settings to other party if initiator
    if (isInitiator && signalingRef.current) {
      signalingRef.current.sendAISettings(newSettings);
    }
  };

  // Toggle camera between front and back
  const handleToggleCamera = async () => {
    if (isSwitchingCamera || !localStream) return;
    
    try {
      setIsSwitchingCamera(true);
      const newFacingMode = facingMode === "user" ? "environment" : "user";
      
      console.log(`Switching camera from ${facingMode} to ${newFacingMode}`);
      
      // Get new stream with different facing mode
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { exact: newFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false, // We'll keep the existing audio track
      });
      
      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = localStream.getVideoTracks()[0];
      const audioTrack = localStream.getAudioTracks()[0];
      
      if (!newVideoTrack) {
        throw new Error("Could not get new video track");
      }
      
      // Stop and remove old video track
      if (oldVideoTrack) {
        oldVideoTrack.stop();
        localStream.removeTrack(oldVideoTrack);
      }
      
      // Add new video track
      localStream.addTrack(newVideoTrack);
      
      // Update the video element - force refresh
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
        // Small delay to ensure cleanup
        setTimeout(() => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
          }
        }, 100);
      }
      
      setFacingMode(newFacingMode);
      console.log(`Camera switched successfully to ${newFacingMode}`);
    } catch (err) {
      console.error("Error switching camera:", err);
      
      // Provide user-friendly error messages
      if (err.name === "OverconstrainedError") {
        setError("This device doesn't have a back camera");
      } else if (err.name === "NotAllowedError") {
        setError("Camera permission denied");
      } else {
        setError(`Could not switch camera: ${err.message}`);
      }
      
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  // Process video frames with TensorFlow.js
  useEffect(() => {
    if (!tfReady || !localVideoRef.current || !localStream) return;
    
    // Check if any AI features are enabled
    const anyEnabled = Object.values(aiSettings).some(v => v);
    if (!anyEnabled) {
      // Defer the state update to avoid synchronous setState in the effect body
      setTimeout(() => setAIResults(null), 0);
      return;
    }

    // Get AI results every 500ms and send to remote peer
    processingInterval.current = setInterval(() => {
      const results = getResults();
      if (results) {
        setAIResults(results);
        // Broadcast normalized results so remote can render overlays over our video
        if (signalingRef.current) {
          const videoEl = localVideoRef.current;
          const srcW = videoEl?.videoWidth || 0;
          const srcH = videoEl?.videoHeight || 0;
          if (srcW && srcH) {
            const toNorm = (r) => {
              const out = {};
              if (r.objects) {
                out.objects = r.objects.map(o => ({
                  x: o.x / srcW,
                  y: o.y / srcH,
                  width: o.width / srcW,
                  height: o.height / srcH,
                  label: o.label,
                  confidence: o.confidence
                }));
              }
              if (r.poses) {
                out.poses = r.poses.map(p => ({
                  keypoints: (p.keypoints || []).map(k => ({ x: k.x / srcW, y: k.y / srcH, confidence: k.confidence })),
                  skeleton: (p.skeleton || []).map(seg => ([
                    { x: seg[0].x / srcW, y: seg[0].y / srcH, confidence: seg[0].confidence },
                    { x: seg[1].x / srcW, y: seg[1].y / srcH, confidence: seg[1].confidence }
                  ]))
                }));
              }
              if (r.faces) {
                out.faces = r.faces.map(f => ({
                  keypoints: (f.keypoints || []).map(pt => ({ x: pt.x / srcW, y: pt.y / srcH }))
                }));
              }
              if (r.hands) {
                out.hands = r.hands.map(h => ({
                  keypoints: (h.keypoints || []).map(pt => ({ x: pt.x / srcW, y: pt.y / srcH }))
                }));
              }
              if (r.classifications) {
                out.classifications = r.classifications;
              }
              return out;
            };
            signalingRef.current.sendAIResults(toNorm(results));
          }
        }
      }
    }, 500);

    return () => {
      if (processingInterval.current) {
        clearInterval(processingInterval.current);
      }
    };
  }, [tfReady, localStream, aiSettings, getResults]);

  // Copy call ID to clipboard
  const handleCopyCallId = async () => {
    try {
      await navigator.clipboard.writeText(callId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // End call and return home
  const handleEndCall = () => {
    cleanup();
    router.push("/");
  };

  // Toggle fullscreen for remote video
  const toggleFullscreen = async () => {
    try {
      // Detect iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      
      if (isIOS) {
        // iOS: Use custom fullscreen to preserve AI overlays
        // Native iOS fullscreen removes our canvas overlays
        setIsFullscreen(!isFullscreen);
      } else {
        // Standard fullscreen for desktop/Android
        const element = remoteVideoContainerRef.current;
        if (!element) return;
        
        const isCurrentlyFullscreen = 
          document.fullscreenElement || 
          document.webkitFullscreenElement || 
          document.mozFullScreenElement ||
          document.msFullscreenElement;

        if (!isCurrentlyFullscreen) {
          // Enter fullscreen with vendor prefixes
          if (element.requestFullscreen) {
            await element.requestFullscreen();
          } else if (element.webkitRequestFullscreen) {
            await element.webkitRequestFullscreen();
          } else if (element.mozRequestFullScreen) {
            await element.mozRequestFullScreen();
          } else if (element.msRequestFullscreen) {
            await element.msRequestFullscreen();
          }
          setIsFullscreen(true);
        } else {
          // Exit fullscreen with vendor prefixes
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen();
          } else if (document.msExitFullscreen) {
            await document.msExitFullscreen();
          }
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
      setError("Fullscreen not supported on this device");
      setTimeout(() => setError(null), 2000);
    }
  };

  // Listen for fullscreen changes (with vendor prefixes)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Get connection status display
  const getStatusDisplay = () => {
    switch (connectionState) {
      case "new":
      case "connecting":
        return { text: "Connecting...", color: "bg-yellow-500" };
      case "connected":
        return { text: "Connected", color: "bg-green-500" };
      case "disconnected":
        return { text: "Disconnected", color: "bg-red-500" };
      case "failed":
        return { text: "Failed", color: "bg-red-600" };
      default:
        return { text: connectionState, color: "bg-gray-500" };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="min-h-screen" style={{ background: '#000000' }}>
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-10 window-95 ${deviceInfo.isMobile ? 'p-1' : 'p-2'}`}>
        <div className="flex items-center justify-between text-[11px]">
          {/* Call ID */}
          <div className="flex items-center gap-2">
            <span className="font-bold">Call ID:</span>
            <span className="font-mono">{callId}</span>
            <button
              onClick={handleCopyCallId}
              className="btn-95 px-2 py-0.5 text-[10px]"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 border border-black ${status.color === 'bg-green-500' ? 'bg-green-500' : status.color === 'bg-yellow-500' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <span className="text-[10px]">{status.text}</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20 window-95 max-w-md">
          <div className="title-bar-95">Error</div>
          <div className="p-3 bg-white text-black">
            <p className="text-[11px]">{error}</p>
          </div>
        </div>
      )}

      {/* Video Container */}
      <div className={`relative w-full h-screen ${isFullscreen ? 'fixed inset-0 z-100' : ''}`}>
        {/* Remote Video (Full Screen) */}
        <div ref={remoteVideoContainerRef} className="absolute inset-0 bg-[var(--background)] flex items-center justify-center">
          {remoteStream ? (
            <div className="relative w-full h-full">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* AI Overlay for remote video */}
              <AIOverlay
                videoRef={remoteVideoRef}
                getResults={() => remoteAIResults || {}}
                aiEnabled={Object.values(aiSettings).some(v => v)}
              />
              {/* Fullscreen Button - always visible */}
              {isFullscreen && (
                <button
                  onClick={toggleFullscreen}
                  className="absolute top-2 right-2 btn-95 text-[10px] px-2 py-1 z-30"
                  title="Exit fullscreen"
                >
                  Exit Fullscreen
                </button>
              )}
            </div>
          ) : (
            <div className="window-95 p-3 max-w-sm w-[90%]">
              <div className="title-bar-95">Waiting</div>
              <div className="p-4 bg-[var(--window-bg)] text-black text-center">
                <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center" style={{ background: '#c0c0c0', border: '2px solid #808080' }}>
                  <svg
                    className="w-12 h-12 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <p className="text-[11px]">
                  {connectionState === "connected"
                    ? "Waiting for remote video..."
                    : "Waiting for other party to join..."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className={`absolute ${deviceInfo.isMobile ? 'bottom-24 right-2 w-24 h-32' : 'bottom-20 right-6 w-64 h-48'} z-20 bg-gray-700 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-600`}>
          <div className="relative w-full h-full">
            {localStream ? (
              <>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* AI Overlay for local video */}
                <AIOverlay
                  videoRef={localVideoRef}
                  getResults={getResults}
                  aiEnabled={Object.values(aiSettings).some(v => v)}
                />
                {/* Camera Switch Button */}
                <button
                  onClick={handleToggleCamera}
                  disabled={isSwitchingCamera}
                  className={`absolute ${deviceInfo.isMobile ? 'top-1 right-1' : 'top-2 right-2'} btn-95 text-[10px] px-2 py-1 z-30`}
                  title={facingMode === "user" ? "Switch to back camera" : "Switch to front camera"}
                >
                  {isSwitchingCamera ? '...' : '↻'}
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className={`${deviceInfo.isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>
                  {deviceInfo.isMobile ? '...' : 'Loading camera...'}
                </p>
              </div>
            )}
            <div className={`absolute ${deviceInfo.isMobile ? 'bottom-1 left-1' : 'bottom-2 left-2'} bg-yellow-300 border border-black px-1 py-0.5 text-[10px] z-20`}>
              You{tfReady && Object.values(aiSettings).some(v => v) && " [AI]"}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 ${isFullscreen ? 'z-150' : 'z-10'} window-95 ${deviceInfo.isMobile ? 'p-2' : 'p-3'}`}>
        <div className="flex items-center justify-center gap-2">
          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="btn-95 text-[11px] px-3"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
          
          {/* AI Settings Button */}
          <AISettings
            onSettingsChange={handleAISettingsChange}
            isInitiator={isInitiator}
          />

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="btn-95 text-[11px] px-4"
            >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}

