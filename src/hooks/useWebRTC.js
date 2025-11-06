"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { SignalingService } from "@/services/signaling";

/**
 * WebRTC Hook - Main logic for peer-to-peer video calling
 * 
 * Handles:
 * - Peer connection setup with STUN servers
 * - Signaling via PartyKit
 * - Local and remote media streams
 * - Connection state management
 */
export function useWebRTC(callId, isInitiator, onAISettings = null, onAIResults = null) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("new"); // new, connecting, connected, disconnected, failed
  const [error, setError] = useState(null);

  const peerConnectionRef = useRef(null);
  const signalingRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const isNegotiatingRef = useRef(false); // Prevent multiple simultaneous negotiations
  const hasCreatedOfferRef = useRef(false); // Track if we've already created an offer

  // STUN server configuration (Google's free STUN servers)
  const iceServers = useMemo(() => ({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  }), []);

  /**
   * Initialize media devices (camera and microphone)
   */
  const initializeMedia = useCallback(async () => {
    try {
      console.log("Requesting camera and microphone access...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log("Media access granted");
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setError(`Camera/microphone access denied: ${err.message}`);
      throw err;
    }
  }, []);

  /**
   * Create RTCPeerConnection
   */
  const createPeerConnection = useCallback(() => {
    console.log("Creating peer connection with STUN servers");
    
    const pc = new RTCPeerConnection(iceServers);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("New ICE candidate generated");
        signalingRef.current?.sendIceCandidate(event.candidate);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      setConnectionState(pc.connectionState);
      
      if (pc.connectionState === "failed") {
        setError("Connection failed. Please try again.");
      }
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    // Handle incoming remote tracks (video/audio from other peer)
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      const [stream] = event.streams;
      console.log("Remote stream has", stream.getTracks().length, "tracks");
      setRemoteStream(stream);
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [iceServers]);

  /**
   * Handle incoming signaling messages
   */
  const handleSignalingMessage = useCallback(async (data) => {
    const pc = peerConnectionRef.current;
    
    if (!pc) {
      console.error("Peer connection not initialized");
      return;
    }

    try {
      switch (data.type) {
        case "offer":
          console.log("Received offer from remote peer");
          isNegotiatingRef.current = true;
          
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          
          // Process any pending ICE candidates
          console.log(`Processing ${pendingIceCandidatesRef.current.length} pending ICE candidates`);
          for (const candidate of pendingIceCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingIceCandidatesRef.current = [];
          
          // Create and send answer
          console.log("Creating answer...");
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          signalingRef.current?.sendAnswer(answer);
          console.log("Answer sent");
          isNegotiatingRef.current = false;
          break;

        case "answer":
          console.log("Received answer from remote peer");
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          
          // Process any pending ICE candidates
          console.log(`Processing ${pendingIceCandidatesRef.current.length} pending ICE candidates`);
          for (const candidate of pendingIceCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingIceCandidatesRef.current = [];
          isNegotiatingRef.current = false;
          break;

        case "ice-candidate":
          console.log("Received ICE candidate from remote peer");
          // Queue ICE candidates if remote description not set yet
          if (!pc.remoteDescription) {
            console.log("Queuing ICE candidate (no remote description yet)");
            pendingIceCandidatesRef.current.push(data.candidate);
          } else {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
          break;

        case "peer-joined":
          console.log("Peer joined the room");
          // If we're the initiator and peer joins, create offer
          // But only if we haven't already created one and we're not currently negotiating
          if (isInitiator && !hasCreatedOfferRef.current && !isNegotiatingRef.current) {
            if (pc.signalingState !== "stable") {
              console.log(`Skipping offer creation - signaling state is ${pc.signalingState}`);
              return;
            }
            
            console.log("Initiating offer to new peer...");
            isNegotiatingRef.current = true;
            hasCreatedOfferRef.current = true;
            
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              signalingRef.current?.sendOffer(offer);
              console.log("Offer sent to new peer");
            } catch (err) {
              console.error("Error creating/sending offer:", err);
              isNegotiatingRef.current = false;
              hasCreatedOfferRef.current = false; // Allow retry on error
            }
          } else if (isInitiator) {
            console.log("Skipping duplicate peer-joined (offer already created or negotiating)");
          }
          break;

        case "peer-disconnected":
          console.log("Peer disconnected");
          setConnectionState("disconnected");
          setError("Other party disconnected");
          break;

        case "ai-settings":
          // AI settings handled by parent component
          console.log("AI settings message received (will be handled by parent)");
          break;

        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (err) {
      console.error("Error handling signaling message:", err);
      setError(`Signaling error: ${err.message}`);
    }
  }, [isInitiator]);

  /**
  /**
   * Initialize the WebRTC connection
   */
  const initialize = useCallback(async () => {
    try {
      // Guard against duplicate initialization
      if (peerConnectionRef.current || signalingRef.current) {
        console.log("Initialization skipped: existing connection present");
        return;
      }

      // Get local media stream
      const stream = await initializeMedia();

      // Create peer connection
      const pc = createPeerConnection();

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        console.log(`Adding local ${track.kind} track to peer connection`);
        pc.addTrack(track, stream);
      });

      // Initialize signaling
      console.log("Connecting to signaling server...");
      signalingRef.current = new SignalingService(callId, handleSignalingMessage, onAISettings, onAIResults);
      signalingRef.current.connect();

      // Offer will be created automatically when peer joins (via "peer-joined" event)
      console.log(isInitiator ? "Waiting for peer to join to create offer..." : "Waiting for offer from peer...");
    } catch (err) {
      console.error("Error initializing WebRTC:", err);
      setError(`Initialization failed: ${err && err.message ? err.message : String(err)}`);
    }
  }, [callId, isInitiator, initializeMedia, createPeerConnection, handleSignalingMessage, onAISettings, onAIResults]);
  const cleanup = useCallback(() => {
    console.log("Cleaning up WebRTC connection...");

    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`Stopped local ${track.kind} track`);
      });
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      console.log("Peer connection closed");
    }

    // Close signaling connection
    if (signalingRef.current) {
      signalingRef.current.close();
    }

    // Reset state
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState("new");

    // Reset refs to help GC and avoid stale state
    peerConnectionRef.current = null;
    signalingRef.current = null;
    localStreamRef.current = null;
    pendingIceCandidatesRef.current = [];
    isNegotiatingRef.current = false;
    hasCreatedOfferRef.current = false;
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    // Effect to initialize on mount, but avoid cascading setState calls
    let isActive = true;

    // Run initialize asynchronously to avoid sync setState
    (async () => {
      if (isActive) await initialize();
    })();

    // Cleanup on unmount
    return () => {
      isActive = false;
      cleanup();
    };
  }, [initialize, cleanup]);

  return {
    localStream,
    remoteStream,
    connectionState,
    error,
    cleanup,
    signalingRef, // Expose signaling for AI settings sync
  };
}

