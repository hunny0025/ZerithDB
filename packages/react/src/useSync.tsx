import { useEffect, useState } from "react";
import { useZerith } from "./useZerith";

/**
 * Hook to access and manage P2P sync state
 */
export function useSync() {
  const app = useZerith();
  const [state, setState] = useState(() => app.sync.state);

  useEffect(() => {
    const handleStateChange = (newState: any) => setState(newState);
    app.sync.on("state:change", handleStateChange);
    return () => {
      app.sync.off("state:change", handleStateChange);
    };
  }, [app]);

  return {
    state,
    enable: () => app.sync.enable(),
    disable: () => app.sync.disable(),
  };
}
