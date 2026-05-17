import type { PeerId } from "zerithdb-core";
import type { ScheduledTask } from "./types.js";

export class TaskRunner {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly localPeerId: PeerId,
    private readonly getTasks: () => ScheduledTask[],
    private readonly onTaskComplete: (taskId: string) => void,
    private readonly onTaskFailed: (taskId: string, error: Error) => void = (id, err) => {
      console.error("Task failed:", id, err);
    }
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, 60_000);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick(): Promise<void> {
    const now = Date.now();
    const tasks = this.getTasks().filter((t) => t.enabled);
    for (const task of tasks) {
      if (this.shouldRun(task, now)) {
        await this.runTask(task);
      }
    }
  }

  private shouldRun(task: ScheduledTask, now: number): boolean {
    if (!task.lastRunAt) return true;
    const interval = parseCronToMs(task.cronExpression);
    return now - task.lastRunAt >= interval;
  }

  private async runTask(task: ScheduledTask): Promise<void> {
    try {
      this.onTaskComplete(task.id);
    } catch (err) {
      this.onTaskFailed(task.id, err instanceof Error ? err : new Error(String(err)));
    }
  }
}

function parseCronToMs(cron: string): number {
  const parts = cron.split(" ");
  const minutePart = parts[0];
  if (minutePart?.startsWith("*/")) {
    const n = parseInt(minutePart.slice(2), 10);
    if (!isNaN(n)) return n * 60_000;
  }
  return 60_000;
}
