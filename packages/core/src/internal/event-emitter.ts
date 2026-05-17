type Listener<T> = (event: T) => void;

/**
 * Strictly typed event emitter.
 * `T` should be a discriminated union or a record of event-name to payload.
 *
 * @example
 * ```typescript
 * type DbEvents = {
 *   "document:inserted": { collection: string; id: string };
 *   "document:deleted": { collection: string; id: string };
 * };
 *
 * const emitter = new EventEmitter<DbEvents>();
 * emitter.on("document:inserted", ({ collection, id }) => { ... });
 * ```
 */
export class EventEmitter<TEvents extends Record<string, unknown>> {
  private readonly listeners = new Map<keyof TEvents, Set<Listener<TEvents[keyof TEvents]>>>();
  private readonly onceWrappers = new WeakMap<Listener<any>, Listener<any>>();

  on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this {
    let set = this.listeners.get(event);
    if (set === undefined) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<TEvents[keyof TEvents]>);
    return this;
  }

  once<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this {
    const wrapper = (payload: TEvents[K]) => {
      this.off(event, wrapper);
      listener(payload);
    };
    this.onceWrappers.set(listener, wrapper);
    return this.on(event, wrapper);
  }

  off<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): this {
    const wrapper = this.onceWrappers.get(listener);
    if (wrapper !== undefined) {
      this.onceWrappers.delete(listener);
      this.listeners.get(event)?.delete(wrapper as Listener<TEvents[keyof TEvents]>);
    } else {
      this.listeners.get(event)?.delete(listener as Listener<TEvents[keyof TEvents]>);
    }
    return this;
  }

  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    const set = this.listeners.get(event);
    if (set === undefined) return;
    for (const listener of set) {
      listener(payload);
    }
  }

  removeAllListeners(event?: keyof TEvents): void {
    if (event !== undefined) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
