import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LlmCallEvent, LoggingLlmObserver } from './llm-observer';

const event: LlmCallEvent = {
  tier: 'strong',
  model: 'gemini-test',
  attempt: 2,
  durationMs: 1_500,
  promptChars: 800,
  usage: null,
  error: null,
};

describe('LoggingLlmObserver', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('signale en warn une tentative en échec, avec son statut HTTP', () => {
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const debug = vi
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => undefined);

    new LoggingLlmObserver().onCall({
      ...event,
      error: { kind: 'api_error', httpStatus: 500 },
    });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('attempt 2 to gemini-test: error api_error 500')
    );
    expect(debug).not.toHaveBeenCalled();
  });

  it('garde en debug une tentative réussie', () => {
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const debug = vi
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => undefined);

    new LoggingLlmObserver().onCall(event);

    expect(debug).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });
});
