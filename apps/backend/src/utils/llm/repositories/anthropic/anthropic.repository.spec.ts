import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LlmCompletionRequest } from '../llm.repository';
import {
  AnthropicRepository,
  toAnthropicMessageParams,
} from './anthropic.repository';

const jsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: { leviers: { type: 'array' } },
  required: ['leviers'],
};

const request: LlmCompletionRequest = {
  prompt: 'Titre : Expérimenter l’autopartage',
  tier: 'strong',
  systemInstruction: 'Tu classes les fiches',
  jsonSchema,
  maxOutputTokens: 1024,
};

const buildRepository = (overrides: Record<string, unknown> = {}) => {
  const values: Record<string, unknown> = {
    ANTHROPIC_API_KEY: 'anthropic-test',
    ...overrides,
  };
  return new AnthropicRepository({
    get: (key: string) => values[key],
  } as unknown as ConfigurationService);
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const messageBody = (overrides: Record<string, unknown> = {}) => ({
  id: 'msg_1',
  type: 'message',
  role: 'assistant',
  model: 'claude-haiku-5-5',
  stop_reason: 'tool_use',
  stop_sequence: null,
  content: [
    {
      type: 'tool_use',
      id: 'toolu_1',
      name: 'repondre',
      input: { leviers: [{ levier: 'covoiturage', categories: [1] }] },
    },
  ],
  usage: {
    input_tokens: 50,
    output_tokens: 20,
    cache_read_input_tokens: 11000,
    cache_creation_input_tokens: 0,
  },
  ...overrides,
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

describe('toAnthropicMessageParams', () => {
  it('met le prompt système en cache, force un outil strict et retire $schema du schéma', () => {
    expect(toAnthropicMessageParams('claude-haiku-5-5', request)).toEqual({
      model: 'claude-haiku-5-5',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: 'Tu classes les fiches',
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: 'Titre : Expérimenter l’autopartage' }],
      tools: [
        {
          name: 'repondre',
          description: 'Renvoie la réponse structurée.',
          input_schema: {
            type: 'object',
            properties: { leviers: { type: 'array' } },
            required: ['leviers'],
          },
          strict: true,
        },
      ],
      tool_choice: { type: 'tool', name: 'repondre' },
    });
  });

  it('ne fixe pas la température', () => {
    const params = toAnthropicMessageParams('m', {
      ...request,
      temperature: 0.2,
    });

    expect(params).not.toHaveProperty('temperature');
  });

  it("plafonne la sortie à ce qu'une réponse peut produire", () => {
    const params = toAnthropicMessageParams('m', {
      ...request,
      maxOutputTokens: 64000,
    });

    expect(params.max_tokens).toBe(16384);
  });

  it('répond en texte libre, sans outil ni système, quand ni schéma ni instruction ne sont donnés', () => {
    const params = toAnthropicMessageParams('m', {
      ...request,
      jsonSchema: undefined,
      systemInstruction: undefined,
    });

    expect(params).not.toHaveProperty('tools');
    expect(params).not.toHaveProperty('tool_choice');
    expect(params).not.toHaveProperty('system');
  });
});

describe('AnthropicRepository', () => {
  it('sert un seul modèle pour tous les paliers, sans OCR', () => {
    const repository = buildRepository();

    expect(repository.modelFor('strong')).toBe('claude-haiku-5-5');
    expect(repository.modelFor('light')).toBe('claude-haiku-5-5');
    expect(repository.capabilities.ocr).toBe(false);
  });

  it("appelle l'API avec la clé, rend l'entrée de l'outil en JSON et compte le cache dans l'usage", async () => {
    const fetchMock = stubFetch(jsonResponse(messageBody()));

    const result = await buildRepository().complete(request);

    expect(result).toEqual({
      success: true,
      data: {
        completed: true,
        text: '{"leviers":[{"levier":"covoiturage","categories":[1]}]}',
        usage: {
          promptTokens: 11050,
          cachedTokens: 11000,
          candidatesTokens: 20,
          thoughtsTokens: 0,
          totalTokens: 11070,
        },
      },
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit
    ];
    expect(String(url)).toBe('https://api.anthropic.com/v1/messages');
    expect(new Headers(init.headers).get('Authorization')).toBe(
      'Bearer anthropic-test'
    );
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: 'claude-haiku-5-5',
      tool_choice: { type: 'tool', name: 'repondre' },
    });
  });

  it("additionne l'écriture du cache au prompt", async () => {
    stubFetch(
      jsonResponse(
        messageBody({
          usage: {
            input_tokens: 50,
            output_tokens: 20,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 11000,
          },
        })
      )
    );

    const result = await buildRepository().complete(request);

    expect(result).toMatchObject({
      success: true,
      data: { usage: { promptTokens: 11050, cachedTokens: 0 } },
    });
  });

  it('rend le texte de la réponse sans schéma', async () => {
    stubFetch(
      jsonResponse(
        messageBody({
          stop_reason: 'end_turn',
          content: [{ type: 'text', text: 'Bonjour' }],
        })
      )
    );

    const result = await buildRepository().complete({
      ...request,
      jsonSchema: undefined,
    });

    expect(result).toMatchObject({
      success: true,
      data: { completed: true, text: 'Bonjour' },
    });
  });

  it('signale une réponse tronquée par la limite de tokens', async () => {
    stubFetch(
      jsonResponse(
        messageBody({
          stop_reason: 'max_tokens',
          content: [{ type: 'text', text: '{"lev' }],
        })
      )
    );

    const result = await buildRepository().complete(request);

    expect(result).toMatchObject({ success: true, data: { completed: false } });
  });

  it.each([429, 503, 529])(
    'traite le statut %i comme un quota dépassé',
    async (status) => {
      stubFetch(
        jsonResponse(
          { type: 'error', error: { type: 'overloaded_error', message: 'x' } },
          status
        )
      );

      expect(await buildRepository().complete(request)).toEqual({
        success: false,
        error: { kind: 'rate_limited' },
      });
    }
  );

  it('rend le statut HTTP des autres erreurs', async () => {
    stubFetch(
      jsonResponse(
        { type: 'error', error: { type: 'invalid_request_error', message: 'x' } },
        400
      )
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
    const fetchMock = stubFetch(jsonResponse(messageBody()));

    const result = await buildRepository({
      ANTHROPIC_API_KEY: undefined,
    }).complete(request);

    expect(result).toMatchObject({ success: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuse les images sans rien appeler', async () => {
    const fetchMock = stubFetch(jsonResponse(messageBody()));

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
