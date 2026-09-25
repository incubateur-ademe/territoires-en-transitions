import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlbertRepository, toChatCompletionParams } from './albert.repository';
import { LlmCompletionRequest } from '../llm.repository';

const request: LlmCompletionRequest = {
  prompt: 'Extrais les actions',
  systemInstruction: 'Tu réponds en JSON',
  jsonSchema: { type: 'array' },
  temperature: 0.2,
  maxOutputTokens: 64000,
  thinkingBudget: 8192,
};

const buildRepository = (overrides: Record<string, unknown> = {}) => {
  const values: Record<string, unknown> = {
    ALBERT_API_KEY: 'sk-test',
    ALBERT_MODEL: 'gpt-oss-120b',
    ALBERT_API_BASE_URL: 'https://albert.test/v1',
    ALBERT_MAX_INPUT_TOKENS: 60000,
    ALBERT_MAX_CONCURRENT_CALLS: 2,
    ...overrides,
  };
  const configService = {
    get: (key: string) => values[key],
  } as unknown as ConfigurationService;
  return new AlbertRepository(configService);
};

const sseBody = (...parts: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      parts.forEach((part) => controller.enqueue(encoder.encode(part)));
      controller.close();
    },
  });

const chunk = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`;

const sseResponse = (...parts: string[]) =>
  new Response(sseBody(...parts), {
    headers: { 'Content-Type': 'text/event-stream' },
  });

const stubFetch = (response: Response | Error) => {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) {
      throw response;
    }
    return response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('toChatCompletionParams', () => {
  it('traduit la requête au format chat completions, en flux, sortie guidée par le schéma', () => {
    expect(toChatCompletionParams('gpt-oss-120b', request)).toEqual({
      model: 'gpt-oss-120b',
      messages: [
        { role: 'system', content: 'Tu réponds en JSON' },
        { role: 'user', content: 'Extrais les actions' },
      ],
      temperature: 0.2,
      max_completion_tokens: 64000,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'response', schema: { type: 'array' } },
      },
      stream: true,
      stream_options: { include_usage: true },
    });
  });

  it("n'envoie pas de message système vide", () => {
    const params = toChatCompletionParams('m', {
      ...request,
      systemInstruction: undefined,
    });
    expect(params.messages).toEqual([
      { role: 'user', content: 'Extrais les actions' },
    ]);
  });
});

describe('AlbertRepository', () => {
  it('appelle chat/completions avec la clé, recolle le flux et lit l’usage final', async () => {
    const first = chunk({
      choices: [{ index: 0, delta: { content: '[{"titre":' } }],
    });
    const fetchMock = stubFetch(
      sseResponse(
        first.slice(0, 10),
        first.slice(10),
        chunk({
          choices: [
            { index: 0, delta: { content: '"A"}]' }, finish_reason: 'stop' },
          ],
        }),
        chunk({
          choices: [],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 30,
            total_tokens: 130,
            completion_tokens_details: { reasoning_tokens: 12 },
          },
        }),
        'data: [DONE]\n\n'
      )
    );

    const result = await buildRepository().complete(request);

    expect(result).toEqual({
      success: true,
      data: {
        completed: true,
        text: '[{"titre":"A"}]',
        usage: {
          promptTokens: 100,
          cachedTokens: 0,
          candidatesTokens: 18,
          thoughtsTokens: 12,
          totalTokens: 130,
        },
      },
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit
    ];
    expect(String(url)).toBe('https://albert.test/v1/chat/completions');
    expect(new Headers(init.headers).get('Authorization')).toBe(
      'Bearer sk-test'
    );
  });

  it('signale une réponse tronquée par la limite de tokens', async () => {
    stubFetch(
      sseResponse(
        chunk({
          choices: [
            { index: 0, delta: { content: '[{' }, finish_reason: 'length' },
          ],
        })
      )
    );

    const result = await buildRepository().complete(request);

    expect(result).toMatchObject({ success: true, data: { completed: false } });
  });

  it.each([429, 503])(
    'traite le statut %i comme un quota dépassé',
    async (status) => {
      stubFetch(
        new Response(JSON.stringify({ detail: 'Model is too busy' }), {
          status,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      expect(await buildRepository().complete(request)).toEqual({
        success: false,
        error: { kind: 'rate_limited' },
      });
    }
  );

  it('rend le statut HTTP des autres erreurs', async () => {
    stubFetch(
      new Response(JSON.stringify({ detail: 'Bad request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(await buildRepository().complete(request)).toMatchObject({
      success: false,
      error: { kind: 'api_error', httpStatus: 400 },
    });
  });

  it("rend une erreur sans statut quand l'appel n'aboutit pas", async () => {
    stubFetch(new TypeError('fetch failed'));

    expect(await buildRepository().complete(request)).toMatchObject({
      success: false,
      error: { kind: 'api_error', httpStatus: null },
    });
  });

  it("n'appelle rien sans clé d'API", async () => {
    const fetchMock = stubFetch(sseResponse());

    const result = await buildRepository({
      ALBERT_API_KEY: undefined,
    }).complete(request);

    expect(result).toMatchObject({ success: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
