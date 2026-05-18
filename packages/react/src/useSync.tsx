"use client";
import { useEffect, useState, useCallback } from "react";
import { useZerith } from "./useZerith.js";

// roomId must be a non-empty string of alphanumeric chars, hyphens, or underscores.
// This prevents injection of malicious/empty room identifiers into the network layer.
const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

function validateRoomId(roomId: string): void {
  if (!ROOM_ID_PATTERN.test(roomId)) {
    throw new Error(
      `Invalid roomId "${roomId}". Must be 1–128 characters and contain only alphanumeric characters, hyphens, or underscores.`
    );
  }
}

/**
 * Hook to access and manage P2P sync state.
 *
 * @example
 * const { enable, disable, state } = useSync();
 * await enable("my-room-123"); // enables sync AND connects to the network
 */
export function useSync() {
  const app = useZerith();
  const [state, setState] = useState(() => app.sync.state);

  useEffect(() => {
    const handleStateChange = (newState: typeof app.sync.state) => setState(newState);
    app.sync.on("state:change", handleStateChange);
    return () => {
      app.sync.off("state:change", handleStateChange);
    };
  }, [app]);

  const enable = useCallback(
    async (roomId?: string) => {
      if (roomId !== undefined) {
        validateRoomId(roomId);
      }
      app.sync.enable();
      if (roomId !== undefined) {
        await app.network.connect(roomId);
      }
    },
    [app]
  );

  const disable = useCallback(() => {
    app.sync.disable();
  }, [app]);

  return { state, enable, disable };
}
