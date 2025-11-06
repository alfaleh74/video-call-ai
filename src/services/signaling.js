import PartySocket from "partysocket";

/**
 * PartyKit Signaling Service
 * 
 * Manages WebSocket connection to PartyKit room for WebRTC signaling.
 * Handles sending/receiving offers, answers, and ICE candidates.
 */
export class SignalingService {
  constructor(callId, onMessage, onAISettings = null, onAIResults = null) {
    this.callId = callId;
    this.socket = null;
    this.onMessageCallback = onMessage;
    this.onAISettingsCallback = onAISettings;
    this.onAIResultsCallback = onAIResults;
    this.isConnected = false;
    this.messageQueue = []; // Queue messages until connected
    
    // Get PartyKit host from environment or use default for dev
    this.host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";
  }

  /**
   * Connect to PartyKit room
   */
  connect() {
    if (this.socket) {
      console.log("Already connected to signaling server");
      return;
    }

    console.log(`Connecting to PartyKit room: ${this.callId}`);

    this.socket = new PartySocket({
      host: this.host,
      room: this.callId,
    });

    // Connection opened
    this.socket.addEventListener("open", () => {
      console.log(`Connected to PartyKit room: ${this.callId}`);
      this.isConnected = true;
      
      // Send any queued messages
      if (this.messageQueue.length > 0) {
        console.log(`Sending ${this.messageQueue.length} queued messages`);
        this.messageQueue.forEach(msg => this.socket.send(msg));
        this.messageQueue = [];
      }
    });

    // Listen for messages from server (forwarded from other peer)
    this.socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received signaling message:", data.type);
        
        // Handle AI settings separately if callback exists
        if (data.type === "ai-settings" && this.onAISettingsCallback) {
          this.onAISettingsCallback(data.settings);
        } else if (data.type === "ai-results" && this.onAIResultsCallback) {
          this.onAIResultsCallback(data.results);
        } else if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
      } catch (error) {
        console.error("Error parsing signaling message:", error);
      }
    });

    // Connection error
    this.socket.addEventListener("error", (error) => {
      console.error("PartyKit connection error:", error);
    });

    // Connection closed
    this.socket.addEventListener("close", () => {
      console.log("Disconnected from PartyKit room");
      this.isConnected = false;
    });
  }

  /**
   * Send a message or queue it if not connected yet
   */
  _sendOrQueue(message) {
    const msgString = JSON.stringify(message);
    
    if (this.isConnected && this.socket) {
      this.socket.send(msgString);
    } else {
      console.log(`Queuing message: ${message.type}`);
      this.messageQueue.push(msgString);
    }
  }

  /**
   * Send WebRTC offer to remote peer
   */
  sendOffer(offer) {
    console.log("Sending offer to remote peer");
    this._sendOrQueue({
      type: "offer",
      offer: offer
    });
  }

  /**
   * Send WebRTC answer to remote peer
   */
  sendAnswer(answer) {
    console.log("Sending answer to remote peer");
    this._sendOrQueue({
      type: "answer",
      answer: answer
    });
  }

  /**
   * Send ICE candidate to remote peer
   */
  sendIceCandidate(candidate) {
    this._sendOrQueue({
      type: "ice-candidate",
      candidate: candidate
    });
  }

  /**
   * Send AI settings to remote peer
   */
  sendAISettings(settings) {
    console.log("Sending AI settings to remote peer:", settings);
    this._sendOrQueue({
      type: "ai-settings",
      settings: settings
    });
  }

  /**
   * Send AI detection results to remote peer (normalized coordinates)
   */
  sendAIResults(results) {
    this._sendOrQueue({
      type: "ai-results",
      results
    });
  }

  /**
   * Close the signaling connection
   */
  close() {
    if (this.socket) {
      console.log("Closing signaling connection");
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

