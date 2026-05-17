export type QueuedMutationStatus = "pending" | "acknowledged" | "failed";
export type QueuedMutationDirection = "outbox" | "inbox";

export interface QueuedMutation<TPayload = unknown> {
  id: string;
  type: string;
  collection: string;
  payload: TPayload;
  timestamp: number;
  status: QueuedMutationStatus;
  retries: number;
  direction: QueuedMutationDirection;
}

export interface QueueChange<TPayload = unknown> {
  action: "enqueue" | "acknowledge" | "failed";
  mutation: QueuedMutation<TPayload>;
}
