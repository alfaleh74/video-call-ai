// Lightweight loader for the MediaPipe Hands browser build via CDN.
// Returns the global Hands class from window after injecting the script once.

let handsScriptLoadingPromise = null;

export async function loadMediaPipeHands() {
  if (typeof window === "undefined") {
    throw new Error("MediaPipe Hands can only be loaded in the browser.");
  }

  // If already present, return immediately
  if (window.Hands) {
    return window.Hands;
  }

  // Load the script once
  if (!handsScriptLoadingPromise) {
    handsScriptLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        if (window.Hands) {
          resolve(window.Hands);
        } else {
          reject(new Error("MediaPipe Hands failed to load (no global Hands)."));
        }
      };
      script.onerror = () => {
        reject(new Error("Failed to load MediaPipe Hands script."));
      };
      document.head.appendChild(script);
    });
  }

  return handsScriptLoadingPromise;
}


