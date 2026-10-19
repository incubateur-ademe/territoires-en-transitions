import {
  registerTelemetryShutdown,
  shutdownTelemetry,
} from './telemetry-shutdown';

describe('Telemetry shutdown', () => {
  afterEach(() => registerTelemetryShutdown(async () => undefined));

  test('shares a pending flush and does not flush twice after completion', async () => {
    let finish!: () => void;
    const callback = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    registerTelemetryShutdown(callback);
    const first = shutdownTelemetry();
    expect(shutdownTelemetry()).toBe(first);
    expect(callback).toHaveBeenCalledTimes(1);
    finish();
    await first;
    expect(shutdownTelemetry()).toBe(first);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('propagates a flush failure without invoking the provider repeatedly', async () => {
    const error = new Error('collector unavailable');
    const callback = vi.fn().mockRejectedValue(error);
    registerTelemetryShutdown(callback);
    await expect(shutdownTelemetry()).rejects.toBe(error);
    await expect(shutdownTelemetry()).rejects.toBe(error);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
