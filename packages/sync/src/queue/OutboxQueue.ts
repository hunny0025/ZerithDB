import { BaseQueue } from "./queue-base.js";
import { queueTableNames } from "./queue-db.js";

export class OutboxQueue<TPayload = unknown> extends BaseQueue<TPayload> {
  constructor(appId: string) {
    super(appId, queueTableNames.outbox, "outbox");
  }
}
