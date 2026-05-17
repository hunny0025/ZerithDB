export interface DocumentRef {
  __ref: true;
  collection: string;
  id: string;
  createdAt: string;
}
export interface HydratedRef<T extends Record<string, unknown> = Record<string, unknown>> {
  __ref: true;
  __hydrated: true;
  collection: string;
  id: string;
  createdAt: string;
  data: T | null;
  fromCache: boolean;
}
export interface HydrationOptions {
  depth?: number;
  forceNetwork?: boolean;
  p2pTimeoutMs?: number;
}
export type RefChangeCallback<T extends Record<string, unknown> = Record<string, unknown>> = (updatedDoc: T, ref: DocumentRef) => void;
export interface SubscribeOptions {
  onChange: RefChangeCallback;
  depth?: number;
}
