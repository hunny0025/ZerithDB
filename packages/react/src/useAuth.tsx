"use client";
import { useEffect, useState } from "react";
import { useZerith } from "./useZerith";

/**
 * Hook to manage authentication and identity
 */
export function useAuth() {
  const app = useZerith();
  const [identity, setIdentity] = useState(() => app.auth.identity);

  useEffect(() => {
    const handleIdentityChange = (newIdentity: any) => setIdentity(newIdentity);
    app.auth.on("identity:change", handleIdentityChange);
    // Initialize in case it changed between render and effect
    setIdentity(app.auth.identity);
    return () => {
      app.auth.off("identity:change", handleIdentityChange);
    };
  }, [app]);

  const signIn = async () => {
    const id = await app.auth.signIn();
    // No need to setIdentity here, the event listener will handle it
    return id;
  };

  const signOut = async () => {
    await app.auth.signOut();
  };

  return { identity, signIn, signOut };
}
