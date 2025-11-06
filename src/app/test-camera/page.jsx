"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { useTensorFlow } from "@/hooks/useTensorFlow";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import AISettings from "@/components/AISettings";
import AIOverlay from "@/components/AIOverlay";

export default function TestCameraPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const deviceInfo = useDeviceDetection();
  
  const [aiSettings, setAISettings] = useState({
    objectDetection: false,
    imageClassification: false,
  });
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef(null);

  const { tfReady, getResults } = useTensorFlow(videoRef, aiSettings);

  const videoConstraints = {
    width: deviceInfo.isMobile ? 480 : 640,
    height: deviceInfo.isMobile ? 360 : 480,
    facingMode: facingMode
  };

  const handleToggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const handleAISettingsChange = (newSettings) => {
    setAISettings(newSettings);
  };

  const handleBack = () => {
    router.push("/");
  };

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
        const element = videoContainerRef.current;
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

  return (
    <div className="min-h-screen p-2" style={{ background: '#008080' }}>
      {/* Error */}
      {error && (
        <div className="window-95 fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
          <div className="title-bar-95">Error</div>
          <div className="p-3 bg-white">
            <p className="text-[11px]">{error}</p>
            <button onClick={() => setError(null)} className="btn-95 mt-2">OK</button>
          </div>
        </div>
      )}

      {/* Main Window */}
      <div className="max-w-4xl mx-auto">
        <div className="window-95">
          {/* Title Bar */}
          <div className="title-bar-95">
            <span>AI Features Test - WebRTC v1.0</span>
            <div className="flex gap-0.5">
              <button className="window-btn-95">_</button>
              <button onClick={handleBack} className="window-btn-95">×</button>
            </div>
        </div>

          {/* Menu Bar */}
          <div className="bg-[#c0c0c0] border-b border-white flex text-[11px]">
            <button onClick={handleBack} className="px-3 py-1 hover:bg-[#000080] hover:text-white">File</button>
            <button className="px-3 py-1 hover:bg-[#000080] hover:text-white">View</button>
            <button className="px-3 py-1 hover:bg-[#000080] hover:text-white">Help</button>
      </div>

          {/* Toolbar */}
          <div className="bg-[#c0c0c0] border-b border-white p-1 flex gap-1 items-center text-[11px]">
            <button onClick={handleBack} className="btn-95 px-2 py-0.5">Back</button>
            <div className="separator-95 w-px h-4 mx-1"></div>
            <button onClick={handleToggleCamera} className="btn-95 px-2 py-0.5">Switch Camera</button>
            <div className="separator-95 w-px h-4 mx-1"></div>
            <button onClick={toggleFullscreen} className="btn-95 px-2 py-0.5">
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
            <div className="separator-95 w-px h-4 mx-1"></div>
            <AISettings onSettingsChange={handleAISettingsChange} isInitiator={true} />
            <div className="flex-1"></div>
            {tfReady && (
              <div className="flex items-center gap-1 text-[10px]">
                <div className="w-2 h-2 bg-green-600 border border-black"></div>
                <span>TensorFlow Ready</span>
        </div>
      )}
          </div>

          {/* Video Area */}
          <div className="p-2">
            <div 
              className={`panel-95 p-1 ${isFullscreen ? 'fixed inset-0 z-[100] !p-0 !border-0' : ''}`} 
              ref={videoContainerRef}
            >
              <div className={`bg-black relative ${isFullscreen ? 'w-full h-full' : 'aspect-video'}`}>
              <Webcam
                ref={videoRef}
                audio={false}
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
                onUserMediaError={(err) => setError(`Camera error: ${err.message}`)}
              />
                <AIOverlay videoRef={videoRef} getResults={getResults} aiEnabled={Object.values(aiSettings).some(v => v)} />

                {/* Exit Fullscreen Button for iOS */}
                {isFullscreen && (
                  <button
                    onClick={toggleFullscreen}
                    className="absolute top-2 right-2 btn-95 text-[10px] px-2 py-1 z-[150]"
                  >
                    Exit Fullscreen
                  </button>
                )}
            </div>
          </div>

            {/* Info Panel */}
            <div className="panel-95 mt-2 p-2">
              <div className="text-[11px]">
                <div className="mb-1">
                  <strong>Status:</strong> {tfReady ? 'Ready' : 'Loading...'}
                </div>
                <div className="mb-1">
                  <strong>Active Features:</strong> {Object.values(aiSettings).filter(v => v).length}
                </div>
                <div className="text-[10px] text-gray-600">
                  Use the AI button in the toolbar to configure features
                </div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="status-bar-95 flex justify-between text-[10px]">
            <span>Camera: {facingMode === 'user' ? 'Front' : 'Back'}</span>
            <span>Frame Rate: 30 FPS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
