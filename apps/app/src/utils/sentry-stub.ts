// Minimal no-op stub for Sentry used in development to avoid loading the library

export type EventId = string | undefined;

export class Scope {
  private tags: Record<string, string> = {};
  // Keep only what we actually use
  setTag(key: string, value: string) {
    this.tags[key] = value;
  }
}

export function init(_options?: any): void {}

export function replayIntegration(): any {
  return {};
}

export function captureException(_error: unknown, _scope?: Scope): EventId {
  return undefined;
}

export function getTraceData(): Record<string, unknown> {
  return {};
}

export function captureRouterTransitionStart(): void {}

// onRequestError is exported and re-exported by instrumentation.ts
// Provide a compatible no-op handler
export function captureRequestError(..._args: any[]): void {}


