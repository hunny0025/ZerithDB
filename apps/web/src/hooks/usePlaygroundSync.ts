"use client";

import { useEffect, useState } from "react";
import { mergePlaygroundNotes, type PlaygroundNote } from "@/lib/playground-queries";

export type MergeReview = {
  localNotes: PlaygroundNote[];
  remoteNotes: PlaygroundNote[];
  suggestion: PlaygroundNote[];
};

const INITIAL_NOTE: PlaygroundNote = {
  id: "seed",
  text: "Welcome! Run a query to see CRDT sync.",
  timestamp: Date.now(),
};

export function usePlaygroundSync(initialNote: PlaygroundNote = INITIAL_NOTE) {
  const [isOnline, setIsOnline] = useState(true);
  const [clientA, setClientA] = useState<PlaygroundNote[]>([initialNote]);
  const [clientB, setClientB] = useState<PlaygroundNote[]>([initialNote]);
  const [syncCount, setSyncCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [mergeReview, setMergeReview] = useState<MergeReview | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsPeerConnected(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOnline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- simulate peer disconnect immediately
      setIsPeerConnected(false);
      return;
    }

    setIsPeerConnected(false);
    const timer = setTimeout(() => setIsPeerConnected(true), 600);
    return () => clearTimeout(timer);
  }, [isOnline]);

  const peerStatus = !isOnline
    ? "offline"
    : isLoading || !isPeerConnected
      ? "connecting"
      : "connected";

  useEffect(() => {
    if (!isOnline) return;

    if (mergeReview) return;

    const merged = mergePlaygroundNotes(clientA, clientB);
    const mergedJson = JSON.stringify(merged);
    const changedA = mergedJson !== JSON.stringify(clientA);
    const changedB = mergedJson !== JSON.stringify(clientB);

    if (changedA || changedB) {
      setMergeReview({
        localNotes: clientA,
        remoteNotes: clientB,
        suggestion: merged,
      });
    }
  }, [clientA, clientB, isOnline, mergeReview]);

  const approveMergeReview = () => {
    if (!mergeReview) return;

    setClientA(mergeReview.suggestion);
    setClientB(mergeReview.suggestion);
    setMergeReview(null);
    setSyncCount((prev) => prev + 1);
    setLastSyncedAt(Date.now());
  };

  const dismissMergeReview = () => {
    setMergeReview(null);
  };

  const insertOnClientA = (note: PlaygroundNote) => {
    setClientA((prev) => [...prev, note]);
  };

  return {
    isOnline,
    setIsOnline,
    clientA,
    clientB,
    syncCount,
    isLoading,
    peerStatus,
    lastSyncedAt,
    mergeReview,
    approveMergeReview,
    dismissMergeReview,
    insertOnClientA,
  };
}
