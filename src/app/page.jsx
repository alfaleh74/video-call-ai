"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

export default function Home() {
  const [callId, setCallId] = useState("");
  const router = useRouter();
  const deviceInfo = useDeviceDetection();

  const generateCallId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const handleCreateCall = () => {
    const newCallId = generateCallId();
    router.push(`/call/${newCallId}?initiator=true`);
  };

  const handleJoinCall = () => {
    if (callId.trim()) {
      router.push(`/call/${callId}?initiator=false`);
    }
  };

  const handleTestCamera = () => {
    router.push("/test-camera");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#008080' }}>
      <main className={`${deviceInfo.isMobile ? 'w-full max-w-sm' : 'w-full max-w-md'}`}>
        <div className="window-95">
          {/* Title Bar */}
          <div className="title-bar-95">
            <span>WebRTC Video Call v1.0</span>
            <div className="flex gap-0.5">
              <button className="window-btn-95">_</button>
              <button className="window-btn-95">□</button>
              <button className="window-btn-95">×</button>
            </div>
          </div>

          {/* Menu Bar */}
          <div className="bg-[#c0c0c0] border-b border-white flex text-[11px]">
            <button className="px-3 py-1 hover:bg-[#000080] hover:text-white">File</button>
            <button className="px-3 py-1 hover:bg-[#000080] hover:text-white">Help</button>
          </div>

          {/* Content */}
          <div className="p-3">
            {/* Test Camera Section */}
            <div className="panel-95 mb-3">
              <div className="text-[11px] font-bold mb-2">AI Features Test</div>
            <button
              onClick={handleTestCamera}
                className="btn-95 w-full mb-1"
            >
                Test Camera & AI
            </button>
              <div className="text-[10px] text-gray-600">
                Test object detection and image classification
          </div>
            </div>

            <div className="separator-95 my-3"></div>

          {/* Create Call Section */}
            <div className="panel-95 mb-3">
              <div className="text-[11px] font-bold mb-2">Create New Call</div>
            <button
              onClick={handleCreateCall}
                className="btn-95 w-full"
            >
                Create Call
            </button>
            </div>

            <div className="separator-95 my-3"></div>

          {/* Join Call Section */}
            <div className="panel-95">
              <div className="text-[11px] font-bold mb-2">Join Existing Call</div>
              <div className="mb-1">
                <label className="text-[11px] block mb-1">Call ID:</label>
              <input
                type="text"
                value={callId}
                onChange={(e) => setCallId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleJoinCall()}
                  className="input-95 w-full"
                placeholder="Enter call ID"
              />
              </div>
              <button
                onClick={handleJoinCall}
                disabled={!callId.trim()}
                className="btn-95 w-full"
              >
                Join
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="status-bar-95 flex justify-between text-[10px]">
            <span>Ready</span>
          </div>
        </div>

        {/* Credits */}
        <div className="mt-3 window-95">
          <div className="title-bar-95">About</div>
          <div className="p-2 text-[10px]">
            <div className="mb-2">
              <div className="font-bold mb-1">Technology Stack:</div>
              <div className="pl-2">
                <div>• <strong>WebRTC</strong> - P2P video communication</div>
                <div className="text-[9px] text-gray-600 pl-2">
                  Enables peer-to-peer video and audio streaming between browsers
                </div>
                <div className="mt-1">• <strong>TensorFlow.js</strong> - AI detection models</div>
                <div className="text-[9px] text-gray-600 pl-2">
                  Runs machine learning models directly in the browser for real-time object detection
                </div>
                <div className="mt-1">• <strong>COCO-SSD</strong> - Object detection model</div>
                <div className="text-[9px] text-gray-600 pl-2">
                  Pre-trained model for detecting common objects in images and video streams
                </div>
                <div className="mt-1">• <strong>Next.js 16</strong> - React framework</div>
                <div className="text-[9px] text-gray-600 pl-2">
                  Server-side rendering and modern React development framework
                </div>
              </div>
            </div>
            <div className="separator-95 my-2"></div>
            <div className="mb-2">
              <div className="font-bold mb-1">Powered By:</div>
              <div className="pl-2">
                <div>• <strong>PartyKit</strong> - Real-time signaling server</div>
                <div className="text-[9px] text-gray-600 pl-2">
                  Without PartyKit, WebRTC peers couldn't exchange connection info
                </div>
                <div className="mt-1">• <strong>Google STUN</strong> - NAT traversal</div>
                <div className="text-[9px] text-gray-600 pl-2">
                  stun.l.google.com:19302 - Free public STUN servers
                </div>
              </div>
            </div>
            <div className="separator-95 my-2"></div>
            <div className="text-[9px] text-gray-600 text-center">
              Version 1.0.0 | Build 19970815 | © 1997
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
