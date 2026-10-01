import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { LlmCallEvent, LlmObserver } from './llm-observer';
import { LlmService } from './llm.service';
import { LlmRawCompletion, LlmRepository } from './repositories/llm.repository';

const usage = {
  promptTokens: 12,
  cachedTokens: 0,
  candidatesTokens: 3,
  thoughtsTokens: 0,
  totalTokens: 15,
};

class FakeRepository extends LlmRepository {
  readonly maxInputTokens = 1000;
  readonly maxConcurrentCalls = 2;

  constructor(private readonly response: LlmRawCompletion) {
    super();
  }

  async complete() {
    return success(this.response);
  }
}

class CollectingObserver extends LlmObserver {
  readonly events: LlmCallEvent[] = [];
  onCall(event: LlmCallEvent): void {
    this.events.push(event);
  }
}

describe('LlmService', () => {
  it("signale à l'observateur une réponse tronquée, avec son usage", async () => {
    const observer = new CollectingObserver();
    const service = new LlmService(
      new FakeRepository({ completed: false, text: '{"ti', usage }),
      observer
    );

    const result = await service.generateStructured({
      prompt: 'p',
      schema: z.object({ titre: z.string() }),
    });

    expect(result.success).toBe(false);
    expect(observer.events).toHaveLength(1);
    expect(observer.events[0]).toMatchObject({
      error: { kind: 'truncated' },
      usage,
    });
  });

  it("signale à l'observateur une réponse hors schéma", async () => {
    const observer = new CollectingObserver();
    const service = new LlmService(
      new FakeRepository({ completed: true, text: '{"autre":1}', usage }),
      observer
    );

    await service.generateStructured({
      prompt: 'p',
      schema: z.object({ titre: z.string() }),
    });

    expect(observer.events[0].error?.kind).toBe('invalid_json');
  });
});
