import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LlmCompletionRequest } from '../llm.repository';
import { MistralRepository, toMistralChatParams } from './mistral.repository';

const request: LlmCompletionRequest = {
  prompt: 'Classe les actions',
  tier: 'strong',
  systemInstruction: 'Tu réponds en JSON',
  jsonSchema: { type: 'object' },
  temperature: 0.2,
  maxOutputTokens: 64000,
};

const buildRepository = (overrides: Record<string, unknown> = {}) => {
  const values: Record<string, unknown> = {
    MISTRAL_API_KEY: 'mistral-test',
    ...overrides,
  };
  return new MistralRepository({
    get: (key: string) => values[key],
  } as unknown as ConfigurationService);
};

const sseResponse = (...parts: string[]) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        parts.forEach((part) => controller.enqueue(encoder.encode(part)));
        controller.close();
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream' } }
  );

const chunk = (payload: unknown) => `data: ${JSON.stringify(payload)}\n\n`;

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

describe('toMistralChatParams', () => {
  it('traduit la requête au format de Mistral : max_tokens, sans raisonnement ni stream_options', () => {
    expect(toMistralChatParams('mistral-large-4-0', request)).toEqual({
      model: 'mistral-large-4-0',
      messages: [
        { role: 'system', content: 'Tu réponds en JSON' },
        { role: 'user', content: 'Classe les actions' },
      ],
      temperature: 0.2,
      max_tokens: 16384,
      reasoning_effort: 'none',
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'response', schema: { type: 'object' } },
      },
      stream: true,
    });
  });

  it("plafonne la sortie à ce qu'une analyse peut produire", () => {
    const params = toMistralChatParams('m', {
      ...request,
      maxOutputTokens: 500,
    });

    expect(params.max_tokens).toBe(500);
  });

  it('répond en texte libre sans schéma', () => {
    const params = toMistralChatParams('m', {
      ...request,
      jsonSchema: undefined,
    });

    expect(params).not.toHaveProperty('response_format');
  });
});

describe('MistralRepository', () => {
  it('sert un seul modèle pour tous les paliers, sans OCR', () => {
    const repository = buildRepository();

    expect(repository.modelFor('strong')).toBe('mistral-large-4-0');
    expect(repository.modelFor('light')).toBe('mistral-large-4-0');
    expect(repository.capabilities.ocr).toBe(false);
  });

  it("appelle l'API Mistral avec la clé, recolle le flux et lit l'usage final", async () => {
    const fetchMock = stubFetch(
      sseResponse(
        chunk({
          choices: [{ index: 0, delta: { content: '{"enjeu":' } }],
        }),
        chunk({
          choices: [
            { index: 0, delta: { content: '"ges"}' }, finish_reason: 'stop' },
          ],
          usage: { prompt_tokens: 100, completion_tokens: 30, total_tokens: 130 },
        }),
        'data: [DONE]\n\n'
      )
    );

    const result = await buildRepository().complete(request);

    expect(result).toEqual({
      success: true,
      data: {
        completed: true,
        text: '{"enjeu":"ges"}',
        usage: {
          promptTokens: 100,
          cachedTokens: 0,
          candidatesTokens: 30,
          thoughtsTokens: 0,
          totalTokens: 130,
        },
      },
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit
    ];
    expect(String(url)).toBe('https://api.mistral.ai/v1/chat/completions');
    expect(new Headers(init.headers).get('Authorization')).toBe(
      'Bearer mistral-test'
    );
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: 'mistral-large-4-0',
      max_tokens: 16384,
      reasoning_effort: 'none',
    });
    expect(JSON.parse(String(init.body))).not.toHaveProperty('stream_options');
  });

  it('signale une réponse tronquée par la limite de tokens', async () => {
    stubFetch(
      sseResponse(
        chunk({
          choices: [
            { index: 0, delta: { content: '{"en' }, finish_reason: 'length' },
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
        new Response(JSON.stringify({ message: 'Rate limit exceeded' }), {
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
      new Response(JSON.stringify({ message: 'Unprocessable' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(await buildRepository().complete(request)).toMatchObject({
      success: false,
      error: { kind: 'api_error', httpStatus: 422 },
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
      MISTRAL_API_KEY: undefined,
    }).complete(request);

    expect(result).toMatchObject({ success: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuse les images sans rien appeler', async () => {
    const fetchMock = stubFetch(sseResponse());

    const result = await buildRepository().complete({
      ...request,
      images: [{ mimeType: 'image/png', base64: 'AAAA' }],
    });

    expect(result).toEqual({
      success: false,
      error: { kind: 'unsupported', feature: 'images' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
