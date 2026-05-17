import { BaseQueue } from "./queue-base.js";
import { queueTableNames } from "./queue-db.js";

export class InboxQueue<TPayload = unknown> extends BaseQueue<TPayload> {
  constructor(appId: string) {
    super(appId, queueTableNames.inbox, "inbox");
  }
}
