import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "../internal/event-emitter.js";

type TestEvents = {
  data: { value: number };
  error: { message: string };
  done: undefined;
  ping: string;
};

// ─── Method chaining ──────────────────────────────────────────────────────────

describe("EventEmitter — method chaining", () => {
  it("on() returns `this` for chaining", () => {
    const emitter = new EventEmitter<TestEvents>();
    const handler = vi.fn();
    const result = emitter.on("data", handler);
    expect(result).toBe(emitter);
  });

  it("once() returns `this` for chaining", () => {
    const emitter = new EventEmitter<TestEvents>();
    const result = emitter.once("data", vi.fn());
    expect(result).toBe(emitter);
  });

  it("off() returns `this` for chaining", () => {
    const emitter = new EventEmitter<TestEvents>();
    const handler = vi.fn();
    emitter.on("data", handler);
    const result = emitter.off("data", handler);
    expect(result).toBe(emitter);
  });

  it("supports chained on() calls", () => {
    const emitter = new EventEmitter<TestEvents>();
    const calls: string[] = [];
    emitter
      .on("data", () => calls.push("a"))
      .on("data", () => calls.push("b"))
      .on("error", () => calls.push("e"));
    emitter.emit("data", { value: 1 });
    expect(calls).toEqual(["a", "b"]);
  });
});

// ─── Edge cases — off() ───────────────────────────────────────────────────────

describe("EventEmitter — off() edge cases", () => {
  it("off() with an unregistered listener is a no-op", () => {
    const emitter = new EventEmitter<TestEvents>();
    const stranger = vi.fn();
    expect(() => emitter.off("data", stranger)).not.toThrow();
  });

  it("off() on an event that has never been subscribed to is a no-op", () => {
    const emitter = new EventEmitter<TestEvents>();
    expect(() => emitter.off("ping", vi.fn())).not.toThrow();
  });

  it("removing one listener does not affect other listeners on the same event", () => {
    const emitter = new EventEmitter<TestEvents>();
    const keep = vi.fn();
    const remove = vi.fn();
    emitter.on("data", keep);
    emitter.on("data", remove);
    emitter.off("data", remove);
    emitter.emit("data", { value: 7 });
    expect(keep).toHaveBeenCalledOnce();
    expect(remove).not.toHaveBeenCalled();
  });
});

// ─── Edge cases — once() ──────────────────────────────────────────────────────

describe("EventEmitter — once() edge cases", () => {
  it("once() wrapper is removed after first emission — second emit is silent", () => {
    const emitter = new EventEmitter<TestEvents>();
    const fn = vi.fn();
    emitter.once("data", fn);
    emitter.emit("data", { value: 1 });
    emitter.emit("data", { value: 2 });
    emitter.emit("data", { value: 3 });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({ value: 1 });
  });

  it("once() receives the correct payload on the first call", () => {
    const emitter = new EventEmitter<TestEvents>();
    let received: { value: number } | null = null;
    emitter.once("data", (payload) => {
      received = payload;
    });
    emitter.emit("data", { value: 99 });
    expect(received).toEqual({ value: 99 });
  });

  it("multiple once() listeners each fire exactly once", () => {
    const emitter = new EventEmitter<TestEvents>();
    const a = vi.fn();
    const b = vi.fn();
    emitter.once("data", a);
    emitter.once("data", b);
    emitter.emit("data", { value: 1 });
    emitter.emit("data", { value: 2 });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});

// ─── removeAllListeners() ─────────────────────────────────────────────────────

describe("EventEmitter — removeAllListeners()", () => {
  it("with no argument clears ALL events", () => {
    const emitter = new EventEmitter<TestEvents>();
    const dataFn = vi.fn();
    const errorFn = vi.fn();
    emitter.on("data", dataFn);
    emitter.on("error", errorFn);
    emitter.removeAllListeners();
    emitter.emit("data", { value: 1 });
    emitter.emit("error", { message: "oops" });
    expect(dataFn).not.toHaveBeenCalled();
    expect(errorFn).not.toHaveBeenCalled();
  });

  it("with an event key clears only that event's listeners", () => {
    const emitter = new EventEmitter<TestEvents>();
    const dataFn = vi.fn();
    const errorFn = vi.fn();
    emitter.on("data", dataFn);
    emitter.on("error", errorFn);
    emitter.removeAllListeners("data");
    emitter.emit("data", { value: 1 });
    emitter.emit("error", { message: "alive" });
    expect(dataFn).not.toHaveBeenCalled();
    expect(errorFn).toHaveBeenCalledOnce();
  });

  it("calling removeAllListeners() twice does not throw", () => {
    const emitter = new EventEmitter<TestEvents>();
    emitter.on("data", vi.fn());
    expect(() => {
      emitter.removeAllListeners();
      emitter.removeAllListeners();
    }).not.toThrow();
  });
});

// ─── Cross-event isolation ────────────────────────────────────────────────────

describe("EventEmitter — cross-event isolation", () => {
  it("emitting one event does not trigger listeners for a different event", () => {
    const emitter = new EventEmitter<TestEvents>();
    const dataFn = vi.fn();
    const errorFn = vi.fn();
    emitter.on("data", dataFn);
    emitter.on("error", errorFn);
    emitter.emit("data", { value: 5 });
    expect(dataFn).toHaveBeenCalledOnce();
    expect(errorFn).not.toHaveBeenCalled();
  });

  it("multiple distinct event types can coexist and fire independently", () => {
    const emitter = new EventEmitter<TestEvents>();
    const results: string[] = [];
    emitter.on("data", ({ value }) => results.push(`data:${value}`));
    emitter.on("error", ({ message }) => results.push(`error:${message}`));
    emitter.on("ping", (msg) => results.push(`ping:${msg}`));
    emitter.emit("data", { value: 1 });
    emitter.emit("error", { message: "bad" });
    emitter.emit("ping", "hello");
    expect(results).toEqual(["data:1", "error:bad", "ping:hello"]);
  });
});

// ─── Undefined payload ────────────────────────────────────────────────────────

describe("EventEmitter — undefined payload", () => {
  it("can emit and receive an event with undefined payload", () => {
    const emitter = new EventEmitter<TestEvents>();
    const fn = vi.fn();
    emitter.on("done", fn);
    emitter.emit("done", undefined);
    expect(fn).toHaveBeenCalledWith(undefined);
  });
});

// ─── No listeners ─────────────────────────────────────────────────────────────

describe("EventEmitter — emitting with no listeners", () => {
  it("does not throw when no listeners are registered", () => {
    const emitter = new EventEmitter<TestEvents>();
    expect(() => emitter.emit("data", { value: 1 })).not.toThrow();
  });

  it("does not throw after all listeners are removed", () => {
    const emitter = new EventEmitter<TestEvents>();
    const fn = vi.fn();
    emitter.on("data", fn);
    emitter.removeAllListeners("data");
    expect(() => emitter.emit("data", { value: 2 })).not.toThrow();
    expect(fn).not.toHaveBeenCalled();
  });
});
