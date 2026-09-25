import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { buildDocument, buildPage } from '../document/document-page';
import { segmentDocument } from '../segment-document/segment-document';
import { ExtractionAction } from './extract-actions.schema';
import { structureUnits } from './structure-units';

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

describe('structureUnits', () => {
  it('structure chaque extrait avec le palier fort, situé et borné, puis recolle dans l’ordre', async () => {
    const { llm, calls } = llmAnswering((call) =>
      call.prompt.includes('Isoler')
        ? [anExtractionAction('1.1.1 Isoler les écoles')]
        : [anExtractionAction('1.1.2 Rénover la mairie')]
    );

    const result = await structureUnits(llm, input);

    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ tier: 'strong', maxOutputTokens: 8000 });
    expect(calls[0].systemInstruction).toContain('2026-09-25');
    expect(calls[0].prompt).toContain(
      'Extrait à structurer (extrait 1 sur 2, pages 1 à 1)'
    );
    expect(calls[0].prompt).toContain('Consigne particulière');
    expect(calls[0].prompt).toContain('Aucun squelette connu');
    expect(calls[1].prompt).toContain('[Extrait 2/2 · page 2]');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions.map((action) => action.titre)).toEqual([
        '1.1.1 Isoler les écoles',
        '1.1.2 Rénover la mairie',
      ]);
      expect(result.data.chunkIndexByAction).toEqual([0, 1]);
      expect(result.data.chunks).toHaveLength(2);
      expect(result.data.tokens.totalTokens).toBe(30);
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

  it('accepte un extrait sans action, mais échoue si aucun n’en contient', async () => {
    const { llm } = llmAnswering(() => []);

    expect(await structureUnits(llm, input)).toMatchObject({
      success: false,
      error: { kind: 'no_actions_extracted' },
    });
  });

  it('propage la première erreur du modèle', async () => {
    const llm = {
      generateStructured: vi.fn(async () => failure({ kind: 'rate_limited' })),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    expect(await structureUnits(llm, input)).toMatchObject({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });
});
