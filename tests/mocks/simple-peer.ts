import { EventEmitter } from "events";

export class MockSimplePeer extends EventEmitter {
  public initiator: boolean;
  public trickle: boolean;
  public config: any;
  public connected = false;
  public destroyed = false;

  public static instances = new Set<MockSimplePeer>();

  constructor(opts: { initiator?: boolean; trickle?: boolean; config?: any } = {}) {
    super();
    this.initiator = opts.initiator ?? false;
    this.trickle = opts.trickle ?? true;
    this.config = opts.config;

    MockSimplePeer.instances.add(this);

    console.log(`[MockSimplePeer] constructor, initiator: ${this.initiator}`);

    if (this.initiator) {
      setTimeout(() => {
        if (!this.destroyed) {
          console.log(`[MockSimplePeer] emitting offer signal`);
          this.emit("signal", { type: "offer", sdp: "mock-sdp-offer" });
        }
      }, 10);
    }
  }

  public signal(data: any) {
    if (this.destroyed) return;
    console.log(`[MockSimplePeer] signal received, type: ${data?.type}`);

    if (data.type === "offer") {
      // Responder responds with an answer
      setTimeout(() => {
        if (!this.destroyed) {
          console.log(`[MockSimplePeer] responder emitting answer signal & connecting`);
          this.emit("signal", { type: "answer", sdp: "mock-sdp-answer" });
          if (!this.connected) {
            this.connected = true;
            this.emit("connect");
          }
        }
      }, 10);
    } else if (data.type === "answer") {
      // Initiator receives the answer and connects
      setTimeout(() => {
        if (!this.destroyed && !this.connected) {
          console.log(`[MockSimplePeer] initiator connecting`);
          this.connected = true;
          this.emit("connect");
        }
      }, 10);
    }
  }

  public send(data: string) {
    if (this.destroyed || !this.connected) {
      throw new Error("Connection is closed");
    }
  }

  public destroy() {
    if (this.destroyed) return;
    console.log(`[MockSimplePeer] destroy called`);
    this.destroyed = true;
    this.connected = false;
    MockSimplePeer.instances.delete(this);
    this.emit("close");

    // Simulate real-world P2P: closing one side closes the other
    for (const other of Array.from(MockSimplePeer.instances)) {
      if (!other.destroyed) {
        setTimeout(() => other.destroy(), 5);
      }
    }
  }
}

export default MockSimplePeer;
