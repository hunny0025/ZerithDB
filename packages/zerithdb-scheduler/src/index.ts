import type { PeerId } from "zerithdb-core";
import type { NetworkManager } from "zerithdb-network";
import { LeaderElection } from "./LeaderElection.js";
import { TaskRunner } from "./TaskRunner.js";
import type { ScheduledTask } from "./types.js";

export { LeaderElection } from "./LeaderElection.js";
export { TaskRunner } from "./TaskRunner.js";
export type { ScheduledTask, LeaderState, SchedulerEvents } from "./types.js";

export class Scheduler {
  private readonly election: LeaderElection;
  private readonly runner: TaskRunner;
  private tasks: Map<string, ScheduledTask> = new Map();

  constructor(
    private readonly localPeerId: PeerId,
    private readonly network: NetworkManager
  ) {
    this.election = new LeaderElection(localPeerId, network);
    this.runner = new TaskRunner(
      localPeerId,
      () => [...this.tasks.values()],
      (taskId) => this.markTaskComplete(taskId)
    );
  }

  start(): void {
    this.election.start();

    // Leader bana toh runner shuru karo
    this.election.on("leader:elected", () => {
      if (this.election.isLeader) {
        this.runner.start();
      }
    });

    // Leader gaya toh runner band karo
    this.election.on("leader:lost", () => {
      this.runner.stop();
    });
  }

  addTask(task: ScheduledTask): void {
    this.tasks.set(task.id, task);
  }

  removeTask(taskId: string): void {
    this.tasks.delete(taskId);
  }

  get isLeader(): boolean {
    return this.election.isLeader;
  }

  dispose(): void {
    this.runner.stop();
    this.election.dispose();
  }

  private markTaskComplete(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task) {
      this.tasks.set(taskId, {
        ...task,
        lastRunAt: Date.now(),
        lastRunBy: this.localPeerId,
      });
    }
  }
}
