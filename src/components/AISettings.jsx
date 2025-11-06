"use client";

import { useState, useEffect, useRef } from "react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

/**
 * AI Features Configuration Component
 * Shows all available ml5.js features with enable/disable toggles
 */
export default function AISettings({ onSettingsChange, isInitiator }) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    objectDetection: false,
    imageClassification: false,
  });
  
  const deviceInfo = useDeviceDetection();
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // AI feature definitions with status
  const aiFeatures = [
    {
      id: "objectDetection",
      name: "Object Detection",
      description: "Detect 90 object types (person, car, phone, etc.)",
      icon: "🎯",
      status: "ready", // ready, disabled, planned
    },
    {
      id: "imageClassification",
      name: "Image Classification",
      description: "Identify overall scene/subject (1000+ categories)",
      icon: "🏷️",
      status: "ready",
    },
  ];

  // Handle toggle change
  const handleToggle = (featureId) => {
    const newSettings = {
      ...settings,
      [featureId]: !settings[featureId],
    };
    setSettings(newSettings);
    
    // Notify parent component
    onSettingsChange(newSettings);
  };

  // Toggle all features (only enable ready features)
  const handleToggleAll = (enable) => {
    const newSettings = {};
    Object.keys(settings).forEach((key) => {
      const feature = aiFeatures.find(f => f.id === key);
      newSettings[key] = enable && feature?.status === "ready" ? true : false;
    });
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  // Count enabled features
  const enabledCount = Object.values(settings).filter((v) => v).length;

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      // Check if click is outside both the panel and the button
      if (
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    // Add event listener with a slight delay to avoid immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="btn-95 flex items-center gap-1"
      >
        <span className="text-[10px]">AI Config</span>
        {enabledCount > 0 && (
          <span className="text-[10px]">({enabledCount})</span>
        )}
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          {deviceInfo.isMobile && (
            <div 
              className="fixed inset-0 bg-black/50 z-[190]"
              onClick={() => setIsOpen(false)}
            />
          )}
          
          <div
            ref={panelRef}
            className={`
              window-95
              ${deviceInfo.isMobile 
                ? "fixed inset-x-2 bottom-2 w-auto max-h-[60vh]" 
                : "absolute top-full right-0 mt-1 w-72 max-h-[500px]"
              }
              z-[200] flex flex-col
            `}
          >
          {/* Header */}
            <div className="title-bar-95">
                <span>AI Configuration</span>
              <button
                onClick={() => setIsOpen(false)}
                className="window-btn-95"
              >
                ×
              </button>
            </div>
            
            <div className="p-2 bg-[#c0c0c0] border-b border-white text-[10px]">
              <p>
                {isInitiator ? "Host Mode: Settings Active" : "Client Mode: Settings Locked"}
            </p>
          </div>

          {/* Quick Actions */}
            <div className="p-2 bg-[#c0c0c0] border-b border-white flex gap-2 flex-shrink-0">
            <button
              onClick={() => handleToggleAll(true)}
                className="btn-95 flex-1 text-[11px]"
            >
              Enable All
            </button>
            <button
              onClick={() => handleToggleAll(false)}
                className="btn-95 flex-1 text-[11px]"
            >
              Disable All
            </button>
          </div>

            {/* Feature List - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-white p-2 min-h-0">
            {aiFeatures.map((feature) => (
              <div
                key={feature.id}
                  className="mb-2 p-2 panel-95"
              >
                  <div className="flex items-start gap-2">
                    {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={settings[feature.id]}
                          onChange={() => handleToggle(feature.id)}
                          disabled={!isInitiator || feature.status !== "ready"}
                      className="checkbox-95 mt-0.5 flex-shrink-0"
                        />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold mb-0.5">
                        {feature.name}
                    </div>
                      <div className="text-[10px] text-gray-600">
                      {feature.description}
                      </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

            {/* Status Bar */}
            <div className="status-bar-95 text-[10px]">
              Local processing only
          </div>
        </div>
        </>
      )}
    </div>
  );
}

