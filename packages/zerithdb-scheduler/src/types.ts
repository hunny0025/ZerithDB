import type { PeerId } from "zerithdb-core";

export interface ScheduledTask {
  id: string;
  name: string;
  cronExpression: string;
  taskType: string;
  enabled: boolean;
  lastRunAt?: number;
  lastRunBy?: PeerId;
  createdAt: number;
}

export interface LeaderState {
  leaderId: PeerId;
  electedAt: number;
  term: number;
}

export type SchedulerEvents = {
  "leader:elected": { leaderId: PeerId };
  "leader:lost": { previousLeader: PeerId };
  "task:executed": { taskId: string; executedBy: PeerId };
  "task:failed": { taskId: string; error: Error };
};
