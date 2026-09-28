import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { buildDocument, buildPage } from '../document/document-page';
import { segmentDocument } from '../segment-document/segment-document';
import { ExtractionAction } from './extract-actions.schema';
import { packUnits, structureUnits } from './structure-units';

const tokens = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const anExtractionAction = (
  titre: string,
  axe = 'Axe 1 : Bâtiments'
): ExtractionAction => ({
  axe,
  'sous-axe': '1.1 Rénover',
  titre,
  description: '',
  'sous-actions': [],
  objectifs: '',
  'structure pilote': '',
  'direction ou service pilote': '',
  'personne pilote': '',
  budget: '',
  statut: '',
});

const units = segmentDocument(
  buildDocument('pdf', [
    buildPage(0, [
      { text: 'Action 1.1.1 : Isoler les écoles' },
      { text: 'Pilote : Service' },
    ]),
    buildPage(1, [
      { text: 'Action 1.1.2 : Rénover la mairie' },
      { text: 'Budget : 10 000' },
    ]),
  ]),
  { minTokens: 0, maxTokens: 1000, overlapTokens: 0 }
);

const input = {
  units,
  skeleton: null,
  instructions: 'Consigne particulière',
  disabledFields: [],
  currentDate: '2026-09-25',
};

type Call = {
  prompt: string;
  systemInstruction?: string;
  tier?: string;
  maxOutputTokens?: number;
  reasoningEffort?: string;
};

const llmAnswering = (answer: (call: Call) => unknown) => {
  const calls: Call[] = [];
  const llm = {
    generateStructured: vi.fn(async (call: Call) => {
      calls.push(call);
      return success({ data: answer(call), tokens });
    }),
  } as unknown as Pick<LlmService, 'generateStructured'>;
  return { llm, calls };
};

describe('packUnits', () => {
  it('regroupe les unités voisines sous le plafond, dans l’ordre', () => {
    const sized = (tokens: number) => ({ ...units[0], tokenEstimate: tokens });

    const packs = packUnits(
      [sized(4000), sized(4000), sized(4000), sized(9500)],
      9000
    );

    expect(packs.map((pack) => pack.map(({ index }) => index))).toEqual([
      [0, 1],
      [2],
      [3],
    ]);
  });
});

describe('structureUnits', () => {
  it('structure les petites unités en un seul appel au palier fort, situé, puis recolle dans l’ordre', async () => {
    const { llm, calls } = llmAnswering(() => [
      anExtractionAction('1.1.1 Isoler les écoles'),
      anExtractionAction('1.1.2 Rénover la mairie'),
    ]);

    const result = await structureUnits(llm, input);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ tier: 'strong', maxOutputTokens: 32000 });
    expect(calls[0].systemInstruction).toContain('2026-09-25');
    expect(calls[0].prompt).toContain(
      'Extrait à structurer (extraits 1 à 2 sur 2, pages 1 à 2)'
    );
    expect(calls[0].prompt).toContain('[Extrait 1/2 · page 1]');
    expect(calls[0].prompt).toContain('[Extrait 2/2 · page 2]');
    expect(calls[0].prompt).toContain('Consigne particulière');
    expect(calls[0].prompt).toContain('Aucun squelette connu');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions.map((action) => action.titre)).toEqual([
        '1.1.1 Isoler les écoles',
        '1.1.2 Rénover la mairie',
      ]);
      expect(result.data.chunkIndexByAction).toEqual([0, 0]);
      expect(result.data.chunks).toHaveLength(1);
      expect(result.data.warnings).toEqual([]);
    }
  });

  it('cite le squelette quand il est connu', async () => {
    const { llm, calls } = llmAnswering(() => [anExtractionAction('A')]);

    await structureUnits(llm, {
      ...input,
      skeleton: {
        axes: [
          {
            numero: '1',
            titre: 'Bâtiments',
            sousAxes: [{ numero: '1.1', titre: 'Rénover' }],
          },
        ],
      },
    });

    expect(calls[0].prompt).toContain('Axe 1 : Bâtiments\n  1.1 Rénover');
  });

  it('coupe en deux un paquet tronqué au lieu de laisser le modèle écrire plus', async () => {
    const generateStructured = vi.fn(async (call: Call) =>
      call.prompt.includes('Isoler') && call.prompt.includes('Rénover')
        ? failure({ kind: 'truncated' })
        : success({
            data: [
              anExtractionAction(
                call.prompt.includes('Isoler') ? 'Isoler' : 'Rénover'
              ),
            ],
            tokens,
          })
    );
    const llm = { generateStructured } as unknown as Pick<
      LlmService,
      'generateStructured'
    >;

    const result = await structureUnits(llm, input);

    expect(generateStructured).toHaveBeenCalledTimes(3);
    expect(
      generateStructured.mock.calls.map(([call]) => call.maxOutputTokens)
    ).toEqual([32000, 32000, 32000]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions.map((a) => a.titre)).toEqual([
        'Isoler',
        'Rénover',
      ]);
      expect(result.data.chunks).toHaveLength(1);
      expect(result.data.warnings).toEqual([]);
    }
  });

  it('retente une unité seule tronquée en raisonnant moins', async () => {
    const generateStructured = vi
      .fn()
      .mockResolvedValueOnce(failure({ kind: 'truncated' }))
      .mockResolvedValueOnce(
        success({ data: [anExtractionAction('A')], tokens })
      );
    const llm = { generateStructured } as unknown as Pick<
      LlmService,
      'generateStructured'
    >;

    const result = await structureUnits(llm, {
      ...input,
      units: [units[0]],
    });

    expect(result.success).toBe(true);
    expect(
      generateStructured.mock.calls.map(([call]) => call.reasoningEffort)
    ).toEqual([undefined, 'low']);
  });

  it('écarte un paquet qui échoue encore, sans faire échouer l’import', async () => {
    const many = Array.from({ length: 6 }, (_, index) => ({
      ...units[0],
      tokenEstimate: 8000,
      lines: [{ text: `Action ${index}`, pageIndex: index }],
      pageStart: index,
      pageEnd: index,
    }));
    const llm = {
      generateStructured: vi.fn(async ({ prompt }: { prompt: string }) =>
        prompt.includes('extrait 3 sur')
          ? failure({ kind: 'truncated' })
          : success({
              data: [anExtractionAction(`A ${prompt.length}`)],
              tokens,
            })
      ),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    const result = await structureUnits(llm, { ...input, units: many });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chunks).toHaveLength(6);
      expect(result.data.warnings).toEqual([
        'Extrait écarté (extrait 3 sur 6, pages 3 à 3) : truncated',
      ]);
    }
  });

  it('échoue quand trop de paquets sont perdus', async () => {
    const llm = {
      generateStructured: vi.fn(async () => failure({ kind: 'truncated' })),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    expect(await structureUnits(llm, input)).toMatchObject({
      success: false,
      error: { kind: 'truncated' },
    });
  });

  it('accepte un extrait sans action, mais échoue si aucun n’en contient', async () => {
    const { llm } = llmAnswering(() => []);

    expect(await structureUnits(llm, input)).toMatchObject({
      success: false,
      error: { kind: 'no_actions_extracted' },
    });
  });

  it('propage une erreur non récupérable du modèle', async () => {
    const llm = {
      generateStructured: vi.fn(async () => failure({ kind: 'rate_limited' })),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    expect(await structureUnits(llm, input)).toMatchObject({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });
});
