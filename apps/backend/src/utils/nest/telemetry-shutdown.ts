let shutdown: (() => Promise<void>) | undefined;
let pending: Promise<void> | undefined;

export function registerTelemetryShutdown(callback: () => Promise<void>) {
  shutdown = callback;
  pending = undefined;
}

export function shutdownTelemetry(): Promise<void> {
  return (pending ??= shutdown?.() ?? Promise.resolve());
}
