import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "../../packages/core/src/index.js";

describe("EventEmitter", () => {
  it("should emit events to listeners", () => {
    const emitter = new EventEmitter<{ foo: string }>();
    const listener = vi.fn();

    emitter.on("foo", listener);
    emitter.emit("foo", "bar");

    expect(listener).toHaveBeenCalledWith("bar");
  });

  it("should handle multiple listeners", () => {
    const emitter = new EventEmitter<{ foo: string }>();
    const l1 = vi.fn();
    const l2 = vi.fn();

    emitter.on("foo", l1);
    emitter.on("foo", l2);
    emitter.emit("foo", "bar");

    expect(l1).toHaveBeenCalledWith("bar");
    expect(l2).toHaveBeenCalledWith("bar");
  });

  it("should remove listeners with off()", () => {
    const emitter = new EventEmitter<{ foo: string }>();
    const listener = vi.fn();

    emitter.on("foo", listener);
    emitter.off("foo", listener);
    emitter.emit("foo", "bar");

    expect(listener).not.toHaveBeenCalled();
  });

  it("should handle once() listeners", () => {
    const emitter = new EventEmitter<{ foo: string }>();
    const listener = vi.fn();

    emitter.once("foo", listener);
    emitter.emit("foo", "bar");
    emitter.emit("foo", "baz");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("bar");
  });

  it("should remove all listeners for an event", () => {
    const emitter = new EventEmitter<{ foo: string; bar: number }>();
    const l1 = vi.fn();
    const l2 = vi.fn();

    emitter.on("foo", l1);
    emitter.on("bar", l2);
    emitter.removeAllListeners("foo");

    emitter.emit("foo", "hello");
    emitter.emit("bar", 42);

    expect(l1).not.toHaveBeenCalled();
    expect(l2).toHaveBeenCalledWith(42);
  });
});
