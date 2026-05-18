"use client";
import { useContext } from "react";
import type { ZerithDBApp } from "zerithdb-sdk";
import { ZerithContext } from "./context";

/**
 * Access the underlying ZerithDB app client directly.
 */
export const useZerith = (): ZerithDBApp => {
  const context = useContext(ZerithContext);
  if (!context) {
    throw new Error("useZerith must be used within a ZerithProvider");
  }
  return context;
};
