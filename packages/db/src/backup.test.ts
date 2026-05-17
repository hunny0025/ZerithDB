import { describe, expect, it, vi } from "vitest";
import "fake-indexeddb/auto";
import { DbClient } from "./db-client.js";
import {
  DropboxBackupTarget,
  GoogleDriveBackupTarget,
  LocalCloudBackupAdapter,
  type BackupUploadInput,
  type CloudBackupTarget,
} from "./backup.js";

function createDb(): DbClient {
  return new DbClient({ appId: "backup-test-" + Math.random().toString(36).slice(2) });
}

describe("LocalCloudBackupAdapter", () => {
  it("exports configured collections and uploads a JSON snapshot", async () => {
    const db = createDb();
    const todos = db.collection<{ text: string; done: boolean }>("todos");
    await todos.insert({ text: "ship backups", done: false });

    const uploads: BackupUploadInput[] = [];
    const target: CloudBackupTarget = {
      provider: "memory",
      async uploadBackup(input) {
        uploads.push(input);
        return {
          provider: "memory",
          fileName: input.fileName,
          uploadedAt: "2026-05-15T00:00:00.000Z",
          location: "memory://latest",
        };
      },
    };

    const adapter = new LocalCloudBackupAdapter(db, target, {
      collections: ["todos"],
      fileName: "snapshot.json",
    });

    const result = await adapter.backupNow();
    const snapshot = JSON.parse(uploads[0]?.content ?? "{}");

    expect(result.location).toBe("memory://latest");
    expect(uploads[0]?.fileName).toBe("snapshot.json");
    expect(snapshot.format).toBe("zerithdb.local-backup.v1");
    expect(snapshot.collections.todos).toHaveLength(1);
    expect(snapshot.collections.todos[0].text).toBe("ship backups");

    await db.dispose();
  });

  it("uses opened collections when no explicit collection list is provided", async () => {
    const db = createDb();
    await db.collection<{ name: string }>("notes").insert({ name: "daily note" });

    const snapshot = await db.exportSnapshot();

    expect(Object.keys(snapshot.collections)).toEqual(["notes"]);
    expect(snapshot.collections.notes).toHaveLength(1);

    await db.dispose();
  });

  it("does not start duplicate timers", async () => {
    vi.useFakeTimers();
    const db = createDb();
    const target: CloudBackupTarget = {
      provider: "memory",
      uploadBackup: vi.fn(),
    };
    const adapter = new LocalCloudBackupAdapter(db, target, { intervalMs: 1000 });

    adapter.start();
    adapter.start();
    expect(adapter.running).toBe(true);

    await adapter.stop();
    expect(adapter.running).toBe(false);
    await db.dispose();
    vi.useRealTimers();
  });
});

describe("cloud backup targets", () => {
  it("uploads backups with the Google Drive multipart endpoint", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(JSON.stringify({ id: "file-1", webViewLink: "https://drive/file-1" }), {
        status: 200,
      });
    });
    const target = new GoogleDriveBackupTarget({
      accessToken: "token",
      folderId: "folder-1",
      fetchImpl,
    });

    const result = await target.uploadBackup({
      fileName: "backup.json",
      content: "{}",
      contentType: "application/json",
      snapshot: {
        format: "zerithdb.local-backup.v1",
        appId: "app",
        generatedAt: "2026-05-15T00:00:00.000Z",
        collections: {},
      },
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      })
    );
    expect(result.location).toBe("https://drive/file-1");
  });

  it("uploads backups to Dropbox with overwrite semantics", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(JSON.stringify({ path_display: "/zerithdb/backup.json" }), {
        status: 200,
      });
    });
    const target = new DropboxBackupTarget({
      accessToken: "token",
      folderPath: "/zerithdb",
      fetchImpl,
    });

    const result = await target.uploadBackup({
      fileName: "backup.json",
      content: "{}",
      contentType: "application/json",
      snapshot: {
        format: "zerithdb.local-backup.v1",
        appId: "app",
        generatedAt: "2026-05-15T00:00:00.000Z",
        collections: {},
      },
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://content.dropboxapi.com/2/files/upload",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": JSON.stringify({
            path: "/zerithdb/backup.json",
            mode: "overwrite",
            autorename: false,
            mute: true,
          }),
        }),
      })
    );
    expect(result.location).toBe("/zerithdb/backup.json");
  });
});
