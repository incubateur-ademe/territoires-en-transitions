export interface EventTracker {
  capture(params: {
    distinctId: string;
    event: string;
    properties?: Record<string, string | number | boolean | undefined>;
  }): void;

  isEnabled(): boolean;

  shutdown(): Promise<void>;
}
