import type * as Party from "partykit/server";

/**
 * WebRTC Signaling Server
 * 
 * Each "room" represents one call between two parties.
 * Room ID = Call ID shared between Party A and B.
 * 
 * This server:
 * 1. Accepts WebSocket connections from both parties
 * 2. Forwards signaling messages (offers, answers, ICE candidates)
 * 3. Notifies when a peer disconnects
 */
export default class WebRTCRoom implements Party.Server {
  constructor(readonly room: Party.Room) {}

  /**
   * Called when a new connection joins the room
   */
  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const connectionsArray = Array.from(this.room.getConnections());
    console.log(
      `[Room ${this.room.id}] User ${conn.id} connected. Total connections: ${connectionsArray.length}`
    );

    // Only notify existing peers about the new connection
    // The new user will wait for an offer (if they're not the initiator)
    // or create an offer themselves (if they are the initiator)
    this.room.broadcast(
      JSON.stringify({
        type: 'peer-joined',
        peerId: conn.id
      }),
      [conn.id] // Exclude the new connection itself
    );
  }

  /**
   * Called when a connection sends a message
   * We broadcast to all OTHER connections in the room
   */
  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);
      
      console.log(
        `[Room ${this.room.id}] Message from ${sender.id}: ${data.type}`
      );

      // Forward the message to all other peers (including AI settings)
      this.room.broadcast(message, [sender.id]);
    } catch (error) {
      console.error(`[Room ${this.room.id}] Error parsing message:`, error);
    }
  }

  /**
   * Called when a connection closes
   */
  onClose(conn: Party.Connection) {
    console.log(
      `[Room ${this.room.id}] User ${conn.id} disconnected`
    );

    // Notify remaining peers
    this.room.broadcast(
      JSON.stringify({
        type: 'peer-disconnected',
        peerId: conn.id
      }),
      [conn.id]
    );
  }

  /**
   * Called when there's an error
   */
  onError(conn: Party.Connection, error: Error) {
    console.error(`[Room ${this.room.id}] Error for ${conn.id}:`, error);
  }
}

