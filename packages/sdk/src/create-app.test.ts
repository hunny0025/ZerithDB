import "fake-indexeddb/auto";
import { describe, it, expect, afterAll } from "vitest";
import { createApp } from "./create-app.js";

describe("createApp", () => {
  const apps: any[] = [];

  afterAll(async () => {
    // Ensure all apps are disposed to avoid leaking async tasks or IndexedDB handles
    await Promise.all(apps.map((app) => app.dispose().catch(() => { })));
  });

  it("should create a ZerithDBApp instance with valid config", () => {
    const app = createApp({
      appId: "test-app",
      sync: { signalingUrl: "ws://localhost:4000" },
    });
    apps.push(app);

    expect(app).toBeDefined();
    expect(app.config.appId).toBe("test-app");
    expect(app.db).toBeDefined();
    expect("sync" in app).toBe(true);
    expect(app.auth).toBeDefined();
    expect(app.network).toBeDefined();
    expect(app.dispose).toBeDefined();
  });

  it("should have default config values if not provided", () => {
    const app = createApp({ appId: "test-defaults" });
    apps.push(app);

    expect(app.config.logLevel).toBe("warn");
    expect(app.config.sync?.signalingUrl).toBe("wss://signal.zerithdb.dev");
    expect(app.config.network?.autoReconnect).toBe(true);
  });

  it("should throw an error if appId is missing", () => {
    // @ts-expect-error- testing invalid config
    expect(() => createApp({})).toThrow('createApp requires a non-empty "appId" in config');
  });

  it("should provide access to collections via app.db()", () => {
    const app = createApp({ appId: "test-app-db" });
    apps.push(app);
    const todos = app.db("todos");
    expect(todos).toBeDefined();
    // CollectionClient methods
    expect(todos.insert).toBeDefined();
    expect(todos.find).toBeDefined();
    expect(todos.subscribe).toBeDefined();
  });

  it("should allow disposing the app", async () => {
    const app = createApp({ appId: "test-app-dispose" });
    await expect(app.dispose()).resolves.toBeUndefined();
  });
});
