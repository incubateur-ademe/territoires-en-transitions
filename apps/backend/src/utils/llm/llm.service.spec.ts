import { failure, Result, success } from '@tet/backend/utils/result.type';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { recordLlmCalls } from './llm-call-recorder';
import { LlmError } from './llm.errors';
import { LlmCallEvent, LlmObserver } from './llm-observer';
import { LlmService } from './llm.service';
import {
  LlmCompletionRequest,
  LlmRawCompletion,
  LlmRepository,
  LlmRetryOptions,
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
  rateLimitedRetryOptions: LlmRetryOptions | null = null;
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

  async complete(
    request: LlmCompletionRequest
  ): Promise<Result<LlmRawCompletion, LlmError>> {
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

// La pause qui suit un 429 et les relances se jouent sous horloge factice.
const settleWithFakeTimers = async <T>(promise: Promise<T>): Promise<T> => {
  await vi.runAllTimersAsync();
  return promise;
};

describe('LlmService', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

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
    vi.useFakeTimers();
    const repository = new FakeRepository();
    repository.complete = vi
      .fn()
      .mockResolvedValueOnce(failure({ kind: 'rate_limited' }))
      .mockResolvedValueOnce(success({ completed: true, text: '{}', usage }));
    const observer = new CollectingObserver();
    const service = new LlmService(repository, observer);

    await settleWithFakeTimers(
      service.generateStructured({ prompt: 'p', schema: z.object({}) })
    );

    expect(
      observer.events.map((event) => [event.attempt, event.error?.kind ?? null])
    ).toEqual([
      [1, 'rate_limited'],
      [2, null],
    ]);
    expect(observer.events[1].usage).toEqual(usage);
  });

  it('abandonne après 3 tentatives un appel qui expire sans statut HTTP', async () => {
    vi.useFakeTimers();
    const repository = new FakeRepository();
    repository.complete = vi
      .fn()
      .mockResolvedValue(failure({ kind: 'api_error', httpStatus: null }));
    const service = new LlmService(repository);

    const pending = service.generateStructured({
      prompt: 'p',
      schema: z.object({}),
    });
    await vi.runAllTimersAsync();
    const result = await pending;
    vi.useRealTimers();

    expect(result).toEqual(failure({ kind: 'api_error', httpStatus: null }));
    expect(repository.complete).toHaveBeenCalledTimes(3);
  });

  it('réessaie jusqu’à 7 fois un 503', async () => {
    vi.useFakeTimers();
    const repository = new FakeRepository();
    repository.complete = vi
      .fn()
      .mockResolvedValue(failure({ kind: 'rate_limited' }));
    const service = new LlmService(repository);

    const pending = service.generateStructured({
      prompt: 'p',
      schema: z.object({}),
    });
    await vi.runAllTimersAsync();
    await pending;
    vi.useRealTimers();

    expect(repository.complete).toHaveBeenCalledTimes(7);
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

  describe('relances', () => {
    const failingRepository = (error: LlmError) => {
      const repository = new FakeRepository();
      const callTimes: number[] = [];
      repository.complete = vi.fn(async () => {
        callTimes.push(Date.now());
        return failure(error);
      });
      return { repository, callTimes };
    };

    it('relance un 429 selon les options du fournisseur, après la pause du modèle', async () => {
      vi.useFakeTimers();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const { repository, callTimes } = failingRepository({
        kind: 'rate_limited',
      });
      repository.rateLimitedRetryOptions = {
        retries: 8,
        minTimeout: 5_000,
        maxTimeout: 90_000,
      };
      const startedAt = Date.now();

      const result = await settleWithFakeTimers(
        new LlmService(repository).generateStructured({
          prompt: 'p',
          schema: z.object({}),
        })
      );

      expect(result).toEqual(failure({ kind: 'rate_limited' }));
      // Les deux premiers écarts sont ceux de la pause de 15 s, pas du délai.
      expect(callTimes.map((time) => (time - startedAt) / 1000)).toEqual([
        0, 15, 30, 50, 90, 170, 260, 350, 440,
      ]);
    });

    it('garde les relances par défaut pour les autres erreurs passagères', async () => {
      vi.useFakeTimers();
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const { repository, callTimes } = failingRepository({
        kind: 'api_error',
        httpStatus: 500,
      });
      repository.rateLimitedRetryOptions = {
        retries: 8,
        minTimeout: 5_000,
        maxTimeout: 90_000,
      };
      const startedAt = Date.now();

      await settleWithFakeTimers(
        new LlmService(repository).generateStructured({
          prompt: 'p',
          schema: z.object({}),
        })
      );

      expect(callTimes.map((time) => (time - startedAt) / 1000)).toEqual([
        0, 1, 3, 7, 15, 31, 61,
      ]);
    });

    it("arrête d'attendre une relance quand l'appel est annulé", async () => {
      vi.useFakeTimers();
      const { repository } = failingRepository({ kind: 'rate_limited' });
      const controller = new AbortController();

      const pending = new LlmService(repository).generateStructured({
        prompt: 'p',
        schema: z.object({}),
        signal: controller.signal,
      });
      const rejection = expect(pending).rejects.toThrow('stop');
      await vi.advanceTimersByTimeAsync(0);
      controller.abort(new Error('stop'));

      await rejection;
      expect(repository.complete).toHaveBeenCalledTimes(1);
    });
  });

  describe('recordLlmCalls', () => {
    it("rattache chaque tentative, avec palier et modèle, à l'enregistrement en cours", async () => {
      vi.useFakeTimers();
      const repository = new FakeRepository();
      repository.complete = vi
        .fn()
        .mockResolvedValueOnce(failure({ kind: 'rate_limited' }))
        .mockResolvedValueOnce(success({ completed: true, text: '{}', usage }));
      const service = new LlmService(repository);

      const { calls } = await settleWithFakeTimers(
        recordLlmCalls(() =>
          service.generateStructured({
            prompt: 'p',
            tier: 'light',
            schema: z.object({}),
          })
        )
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
