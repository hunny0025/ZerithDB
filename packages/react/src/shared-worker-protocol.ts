import type {
  Identity,
  InsertResult,
  PeerInfo,
  QueryFilter,
  SyncState,
  UpdateSpec,
  ZerithDBConfig,
  Document,
} from "zerithdb-sdk";

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
}

export type AppScope = "sync" | "auth" | "network" | "collection";

export interface InitMessage {
  kind: "init";
  appId: string;
  config: ZerithDBConfig;
}

export interface RequestMessage {
  kind: "request";
  id: string;
  appId: string;
  scope: AppScope;
  method: string;
  args: unknown[];
  collectionName?: string;
}

export interface SubscribeMessage {
  kind: "subscribe";
  id: string;
  appId: string;
  collectionName: string;
}

export interface UnsubscribeMessage {
  kind: "unsubscribe";
  id: string;
  appId: string;
  collectionName: string;
}

export interface DisposeMessage {
  kind: "dispose";
  id: string;
  appId: string;
}

export type ClientToWorkerMessage =
  | InitMessage
  | RequestMessage
  | SubscribeMessage
  | UnsubscribeMessage
  | DisposeMessage;

export interface ResponseMessage {
  kind: "response";
  id: string;
  ok: true;
  value: unknown;
}

export interface ResponseErrorMessage {
  kind: "response";
  id: string;
  ok: false;
  error: SerializedError;
}

export interface SubscriptionMessage {
  kind: "subscription";
  appId: string;
  collectionName: string;
  subscriptionId: string;
  documents: unknown[];
}

export interface AppStateMessage {
  kind: "state";
  appId: string;
  scope: "sync" | "network";
  value: unknown;
}

export interface IdentityMessage {
  kind: "identity";
  appId: string;
  identity: Identity | null;
}

export type WorkerToClientMessage =
  | ResponseMessage
  | ResponseErrorMessage
  | SubscriptionMessage
  | AppStateMessage
  | IdentityMessage;

export type CollectionProxy<T extends Record<string, unknown>> = {
  insert(document: T): Promise<InsertResult>;
  insertMany(documents: T[]): Promise<InsertResult[]>;
  find(filter?: QueryFilter<T>): Promise<Document<T>[]>;
  findById(id: string): Promise<Document<T> | undefined>;
  update(filter: QueryFilter<T>, spec: UpdateSpec<T>): Promise<number>;
  delete(target: QueryFilter<T> | string): Promise<number>;
  clearAll(): Promise<void>;
  count(filter?: QueryFilter<T>): Promise<number>;
  subscribe(callback: (documents: Document<T>[]) => void): () => void;
};

export interface SharedWorkerApp {
  db<T extends Record<string, unknown> = Record<string, unknown>>(name: string): CollectionProxy<T>;
  sync: {
    enable(): void;
    disable(): void;
    readonly state: SyncState;
  };
  auth: {
    signIn(): Promise<Identity>;
    generateIdentity(): Promise<Identity>;
    sign(data: Uint8Array): Promise<string>;
    verify(data: Uint8Array, signature: string, publicKey: string): Promise<boolean>;
    signOut(): void;
    readonly identity: Identity | null;
  };
  network: {
    connect(roomId: string): Promise<void>;
    broadcast(message: { type: string; payload: string | Uint8Array }): void;
    sendTo(peerId: string, message: { type: string; payload: string | Uint8Array }): void;
    readonly connectedPeerCount: number;
    readonly connectedPeers: PeerInfo[];
    dispose(): Promise<void>;
  };
  config: Readonly<ZerithDBConfig>;
  dispose(): Promise<void>;
}

export function makeRequestId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: "Error",
    message: typeof error === "string" ? error : "Unknown error",
  };
}
