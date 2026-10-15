import { Logger } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeminiRepository } from './gemini.repository';

const NINE_MINUTES_MS = 9 * 60 * 1000;

const buildRepository = () =>
  new GeminiRepository({
    get: (key: string) =>
      ({ GEMINI_MODEL: 'gemini-3.5-flash' }[key as 'GEMINI_MODEL']),
  } as unknown as ConfigurationService);

const buildRepositoryWithFakeClient = () => {
  const generateContentStream = vi.fn().mockResolvedValue(emptyStream());
  const repository = buildRepository();
  Object.assign(repository, {
    client: { models: { generateContentStream } },
  });
  return { repository, generateContentStream };
};

const emptyStream = async function* () {
  yield { text: '{}', candidates: [{ finishReason: 'STOP' }] };
};

const spyOnLogs = () => ({
  log: vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined),
  debug: vi
    .spyOn(Logger.prototype, 'debug')
    .mockImplementation(() => undefined),
  warn: vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined),
  error: vi
    .spyOn(Logger.prototype, 'error')
    .mockImplementation(() => undefined),
});

const loggedMessages = (spy: {
  mock: { calls: readonly unknown[][] };
}): string[] => spy.mock.calls.map(([message]) => String(message));

const abortError = () =>
  new DOMException('This operation was aborted', 'AbortError');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GeminiRepository', () => {
  it('lit un document entier avec un seul modèle, sans OCR', () => {
    const repository = buildRepository();

    expect(repository.capabilities).toEqual({
      ocr: false,
      strategy: 'whole-document',
    });
    expect(repository.maxInputTokensPerMinute).toBeNull();
    expect(repository.modelFor('light')).toBe('gemini-3.5-flash');
    expect(repository.maxInputTokensFor('ocr')).toBe(repository.maxInputTokens);
  });

  it('refuse les images sans appeler le modèle', async () => {
    const result = await buildRepository().complete({
      prompt: 'Transcris',
      tier: 'ocr',
      images: [{ mimeType: 'image/png', base64: 'AAAA' }],
    });

    expect(result).toEqual({
      success: false,
      error: { kind: 'unsupported', feature: 'images' },
    });
  });

  it("abandonne un appel au bout du délai demandé plutôt qu'après 9 minutes", async () => {
    const { repository, generateContentStream } =
      buildRepositoryWithFakeClient();

    await repository.complete({
      prompt: 'Classe',
      tier: 'strong',
      timeoutMs: 120_000,
    });

    expect(generateContentStream).toHaveBeenLastCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          httpOptions: { timeout: 120_000 },
        }),
      })
    );
  });

  it('demande le niveau de réflexion et jamais un budget de tokens', async () => {
    const { repository, generateContentStream } =
      buildRepositoryWithFakeClient();

    await repository.complete({
      prompt: 'Classe',
      tier: 'strong',
      thinkingLevel: 'minimal',
    });

    const [{ config }] = generateContentStream.mock.calls[0];
    expect(config.thinkingConfig).toEqual({ thinkingLevel: 'MINIMAL' });
  });

  it("laisse le modèle choisir son niveau de réflexion quand aucun n'est demandé", async () => {
    const { repository, generateContentStream } =
      buildRepositoryWithFakeClient();

    await repository.complete({ prompt: 'Lis', tier: 'strong' });

    const [{ config }] = generateContentStream.mock.calls[0];
    expect(config.thinkingConfig).toBeUndefined();
  });

  it("n'envoie pas de température, ignorée par Gemini 3", async () => {
    const { repository, generateContentStream } =
      buildRepositoryWithFakeClient();

    await repository.complete({
      prompt: 'Classe',
      tier: 'strong',
      temperature: 0.2,
    });

    const [{ config }] = generateContentStream.mock.calls[0];
    expect(config).not.toHaveProperty('temperature');
  });

  it("nomme un appel resté sans réponse un délai dépassé, pas une erreur de l'API", async () => {
    const logs = spyOnLogs();
    const { repository, generateContentStream } =
      buildRepositoryWithFakeClient();
    generateContentStream.mockRejectedValue(abortError());

    const result = await repository.complete({
      prompt: 'Classe',
      tier: 'strong',
      timeoutMs: 45_000,
    });

    expect(result).toEqual({
      success: false,
      error: { kind: 'api_error', httpStatus: null },
    });
    expect(loggedMessages(logs.warn)).toEqual([
      expect.stringMatching(
        /^Gemini call [0-9a-f]{8} timed out after \d+ ms \(limit 45000 ms, no response received\)$/
      ),
    ]);
    expect(logs.error).not.toHaveBeenCalled();
  });

  it('distingue un flux interrompu en cours de route', async () => {
    const logs = spyOnLogs();
    const { repository, generateContentStream } =
      buildRepositoryWithFakeClient();
    generateContentStream.mockResolvedValue(
      (async function* () {
        yield { text: '{"a"' };
        throw abortError();
      })()
    );

    await repository.complete({ prompt: 'Classe', tier: 'strong' });

    expect(loggedMessages(logs.warn)).toEqual([
      expect.stringMatching(/timed out after \d+ ms .*stalled after 1 chunk/),
    ]);
  });

  it("nomme un appel annulé par l'appelant, sans parler de délai", async () => {
    const logs = spyOnLogs();
    const { repository, generateContentStream } =
      buildRepositoryWithFakeClient();
    generateContentStream.mockRejectedValue(abortError());

    await repository.complete({
      prompt: 'Classe',
      tier: 'strong',
      signal: AbortSignal.abort(),
    });

    expect(loggedMessages(logs.warn)).toEqual([
      expect.stringMatching(
        /^Gemini call [0-9a-f]{8} cancelled by caller after \d+ ms$/
      ),
    ]);
  });

  it("relie le début et la fin d'un appel par un identifiant, et mesure le premier octet", async () => {
    const logs = spyOnLogs();
    const { repository } = buildRepositoryWithFakeClient();

    await repository.complete({ prompt: 'Classe', tier: 'strong' });

    const [start] = loggedMessages(logs.log);
    const [end] = loggedMessages(logs.debug);
    const callId = /^Gemini call ([0-9a-f]{8}) /.exec(start)?.[1];
    expect(callId).toBeDefined();
    expect(end).toMatch(
      new RegExp(
        `^Gemini response ${callId} \\(first chunk after \\d+ ms, total \\d+ ms, 1 chunk, finishReason STOP\\)$`
      )
    );
  });

  it("identifie un prompt par une empreinte stable, sans l'écrire dans les logs", async () => {
    const logs = spyOnLogs();
    const { repository } = buildRepositoryWithFakeClient();
    const prompt = 'Texte confidentiel de la fiche';

    await repository.complete({ prompt, tier: 'strong' });
    await repository.complete({ prompt, tier: 'strong' });
    await repository.complete({ prompt: 'Un autre prompt', tier: 'strong' });

    const fingerprints = loggedMessages(logs.log).map(
      (message) => /prompt \d+ chars #([0-9a-f]{8})/.exec(message)?.[1]
    );
    expect(fingerprints[0]).toBeDefined();
    expect(fingerprints[1]).toBe(fingerprints[0]);
    expect(fingerprints[2]).not.toBe(fingerprints[0]);
    expect(loggedMessages(logs.log).join('\n')).not.toContain('confidentiel');
  });

  it('garde 9 minutes quand aucun délai n’est demandé', async () => {
    const { repository, generateContentStream } =
      buildRepositoryWithFakeClient();

    await repository.complete({ prompt: 'Lis', tier: 'strong' });

    expect(generateContentStream).toHaveBeenLastCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          httpOptions: { timeout: NINE_MINUTES_MS },
        }),
      })
    );
  });
});
