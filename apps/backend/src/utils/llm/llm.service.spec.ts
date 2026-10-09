import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { recordLlmCalls } from './llm-call-recorder';
import { LlmCallEvent, LlmObserver } from './llm-observer';
import { LlmService } from './llm.service';
import {
  LlmCompletionRequest,
  LlmRawCompletion,
  LlmRepository,
} from './repositories/llm.repository';

const usage = {
  promptTokens: 12,
  cachedTokens: 0,
  candidatesTokens: 3,
  thoughtsTokens: 0,
  totalTokens: 15,
};

class FakeRepository extends LlmRepository {
  readonly maxConcurrentCalls = 2;
  readonly maxInputTokensPerMinute = null;
  readonly maxRequestsPerMinute = null;
  readonly capabilities = { ocr: true, strategy: 'segmented' as const };
  readonly requests: LlmCompletionRequest[] = [];
  private readonly responses: LlmRawCompletion[];

  constructor(...responses: LlmRawCompletion[]) {
    super();
    this.responses = responses;
  }

  maxInputTokensFor(): number {
    return 1000;
  }

  modelFor(): string {
    return 'fake';
  }

  async complete(request: LlmCompletionRequest) {
    this.requests.push(request);
    return success(
      this.responses.shift() ?? { completed: true, text: '{}', usage }
    );
  }
}

class CollectingObserver extends LlmObserver {
  readonly events: LlmCallEvent[] = [];
  onCall(event: LlmCallEvent): void {
    this.events.push(event);
  }
}

describe('LlmService', () => {
  it('appelle le palier fort par défaut, avec le schéma JSON du zod', async () => {
    const repository = new FakeRepository({
      completed: true,
      text: '{"titre":"A"}',
      usage,
    });
    const service = new LlmService(repository);

    const result = await service.generateStructured({
      prompt: 'p',
      schema: z.object({ titre: z.string() }),
    });

    expect(result).toEqual({
      success: true,
      data: { data: { titre: 'A' }, tokens: usage },
    });
    expect(repository.requests[0]).toMatchObject({
      tier: 'strong',
      jsonSchema: expect.objectContaining({ type: 'object' }),
    });
  });

  it('transmet le palier et les images, et rend le texte libre', async () => {
    const repository = new FakeRepository({
      completed: true,
      text: '# Page 1',
      usage,
    });
    const service = new LlmService(repository);

    const result = await service.generateText({
      prompt: 'Transcris',
      tier: 'ocr',
      images: [{ mimeType: 'image/jpeg', base64: 'AAAA' }],
    });

    expect(result).toEqual({
      success: true,
      data: { text: '# Page 1', tokens: usage },
    });
    expect(repository.requests[0]).toMatchObject({
      tier: 'ocr',
      images: [{ mimeType: 'image/jpeg', base64: 'AAAA' }],
    });
    expect(repository.requests[0].jsonSchema).toBeUndefined();
  });

  it('signale un texte tronqué', async () => {
    const service = new LlmService(
      new FakeRepository({ completed: false, text: '# Pa', usage })
    );

    expect(await service.generateText({ prompt: 'p' })).toEqual(
      failure({ kind: 'truncated' })
    );
  });

  it("prévient l'observateur à chaque tentative", async () => {
    const repository = new FakeRepository();
    repository.complete = vi
      .fn()
      .mockResolvedValueOnce(failure({ kind: 'rate_limited' }))
      .mockResolvedValueOnce(success({ completed: true, text: '{}', usage }));
    const observer = new CollectingObserver();
    const service = new LlmService(repository, observer);

    await service.generateStructured({ prompt: 'p', schema: z.object({}) });

    expect(
      observer.events.map((event) => [event.attempt, event.error?.kind ?? null])
    ).toEqual([
      [1, 'rate_limited'],
      [2, null],
    ]);
    expect(observer.events[1].usage).toEqual(usage);
  });

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

  it("signale à l'observateur un texte libre tronqué", async () => {
    const observer = new CollectingObserver();
    const service = new LlmService(
      new FakeRepository({ completed: false, text: '# Pa', usage }),
      observer
    );

    await service.generateText({ prompt: 'p' });

    expect(observer.events[0].error?.kind).toBe('truncated');
  });

  describe('recordLlmCalls', () => {
    it("rattache chaque tentative, avec palier et modèle, à l'enregistrement en cours", async () => {
      const repository = new FakeRepository();
      repository.complete = vi
        .fn()
        .mockResolvedValueOnce(failure({ kind: 'rate_limited' }))
        .mockResolvedValueOnce(success({ completed: true, text: '{}', usage }));
      const service = new LlmService(repository);

      const { calls } = await recordLlmCalls(() =>
        service.generateStructured({
          prompt: 'p',
          tier: 'light',
          schema: z.object({}),
        })
      );

      expect(calls).toEqual([
        expect.objectContaining({
          tier: 'light',
          model: 'fake',
          attempt: 1,
          usage: null,
          error: { kind: 'rate_limited' },
        }),
        expect.objectContaining({ attempt: 2, usage, error: null }),
      ]);
    });

    it('sépare deux enregistrements concurrents et ignore les appels hors enregistrement', async () => {
      const service = new LlmService(new FakeRepository());
      const call = () =>
        service.generateStructured({ prompt: 'p', schema: z.object({}) });

      const [first, second] = await Promise.all([
        recordLlmCalls(async () => {
          await call();
          await call();
        }),
        recordLlmCalls(() => call()),
        call(),
      ]);

      expect(first.calls).toHaveLength(2);
      expect(second.calls).toHaveLength(1);
    });
  });
});
