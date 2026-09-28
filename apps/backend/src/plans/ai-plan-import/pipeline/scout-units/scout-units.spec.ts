import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { buildUnit, numberUnits } from '../segment-document/document-unit';
import { classifyUnits } from './classify-units';
import { extractSkeleton } from './extract-skeleton';
import { scoutUnits } from './scout-units';

const tokens = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 4,
  thoughtsTokens: 1,
  totalTokens: 15,
};

const unit = (
  text: string,
  kind: 'fiche' | 'section' | 'unknown',
  headingPath: string[] = [],
  section?: string
) => buildUnit([{ text, pageIndex: 0 }], headingPath, kind, { section });

const units = numberUnits([
  unit('Sommaire : Axe 1 Bâtiments, Axe 2 Mobilité', 'section'),
  unit('Le territoire compte 12 000 habitants et émet 80 ktCO2.', 'section', [
    '1 Bâtiments',
  ]),
  unit('Action 1.1.1 : Isoler les écoles. Pilote : Service', 'fiche', [
    '1 Bâtiments',
  ]),
  unit('Développer le covoiturage. Budget 20 000 €', 'unknown', ['2 Mobilité']),
]);

type Call = { prompt: string; tier?: string; schema: unknown };

const llmRouting = (
  classify: (call: Call) => unknown,
  skeleton: (call: Call) => unknown = () => ({ axes: [] })
) => {
  const calls: Call[] = [];
  const llm = {
    generateStructured: vi.fn(async (call: Call) => {
      calls.push(call);
      const data = call.prompt.includes('agent de tri documentaire')
        ? classify(call)
        : skeleton(call);
      return success({ data, tokens });
    }),
  } as unknown as Pick<LlmService, 'generateStructured'>;
  return { llm, calls };
};

describe('classifyUnits', () => {
  it('trie par lots avec le palier léger et ne garde que les index demandés', async () => {
    const { llm, calls } = llmRouting(() => [
      { index: 0, type: 'structure' },
      { index: 1, type: 'diagnostic' },
      { index: 99, type: 'autre' },
    ]);

    const result = await classifyUnits(llm, { units });

    expect(calls[0]).toMatchObject({ tier: 'light' });
    expect(calls[0].prompt).toContain(
      '#2 | pages 1–1 | 1 Bâtiments | Action 1.1.1'
    );
    expect(calls[0].prompt).toContain('#0 | pages 1–1 | - | Sommaire');
    expect(result.success).toBe(true);
    if (result.success) {
      expect([...result.data.categories.entries()]).toEqual([
        [0, 'structure'],
        [1, 'diagnostic'],
      ]);
    }
  });
});

describe('extractSkeleton', () => {
  it('ne demande rien sans titre ni extrait de structure', async () => {
    const { llm } = llmRouting(() => []);

    const result = await extractSkeleton(llm, {
      units: [unit('Texte', 'unknown')],
      structureUnits: [],
    });

    expect(result).toEqual(
      success({ skeleton: null, tokens: expect.anything() })
    );
    expect(llm.generateStructured).not.toHaveBeenCalled();
  });

  it('cite les titres relevés et les extraits de structure au palier fort', async () => {
    const { llm, calls } = llmRouting(
      () => [],
      () => ({ axes: [{ numero: '1', titre: 'Bâtiments', sousAxes: [] }] })
    );

    const result = await extractSkeleton(llm, {
      units,
      structureUnits: [units[0]],
    });

    expect(calls[0]).toMatchObject({ tier: 'strong' });
    expect(calls[0].prompt).toContain('1 Bâtiments\n2 Mobilité');
    expect(calls[0].prompt).toContain('Sommaire : Axe 1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skeleton?.axes[0].titre).toBe('Bâtiments');
    }
  });
});

describe('extractSkeleton, avec des parties titrées', () => {
  it('range les titres sous leur partie du document', async () => {
    const { llm, calls } = llmRouting(
      () => [],
      () => ({ axes: [] })
    );

    await extractSkeleton(llm, {
      units: [
        unit('Bilan', 'section', ['I BILAN ÉNERGÉTIQUE'], 'ÉTAT DES LIEUX'),
        unit('Ancrer', 'fiche', ['I TOUS HÉROS'], "PLAN D'ACTIONS"),
      ],
      structureUnits: [],
    });

    expect(calls[0].prompt).toContain(
      "Partie « ÉTAT DES LIEUX »\n  I BILAN ÉNERGÉTIQUE\nPartie « PLAN D'ACTIONS »\n  I TOUS HÉROS"
    );
  });
});

describe('scoutUnits', () => {
  it('écarte sans les trier les engagements des partenaires, fiches comprises', async () => {
    const { llm, calls } = llmRouting(() => [
      { index: 0, type: 'fiche_action' },
    ]);

    const result = await scoutUnits(llm, {
      units: [
        unit('Action 1 : Isoler', 'fiche', [], "PLAN D'ACTIONS"),
        unit(
          'ACTION 14 : nos bornes',
          'fiche',
          [],
          'ENGAGEMENT DES PARTENAIRES'
        ),
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keptUnits.map((u) => u.text)).toEqual([
        'Action 1 : Isoler',
      ]);
      expect(result.data.discardedCount).toBe(1);
    }
    expect(calls[0].prompt).not.toContain('nos bornes');
  });

  it('écarte un engagement de partenaire repéré par le tri, sauf une fiche', async () => {
    const { llm } = llmRouting(() => [
      { index: 0, type: 'engagement_partenaire' },
      { index: 1, type: 'engagement_partenaire' },
    ]);

    const result = await scoutUnits(llm, {
      units: [
        unit('La société X s’engage à…', 'section'),
        unit('Action 2 : Covoiturage', 'fiche'),
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keptUnits.map((u) => u.text)).toEqual([
        'Action 2 : Covoiturage',
      ]);
    }
  });

  it('écarte le diagnostic, garde fiches, structure, tables et unités oubliées', async () => {
    const { llm } = llmRouting(() => [
      { index: 0, type: 'structure' },
      { index: 1, type: 'diagnostic' },
      { index: 2, type: 'autre' }, // une fiche reconnue au découpage reste
      // l'index 3 est oublié par le modèle : il reste
    ]);

    const result = await scoutUnits(llm, { units });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keptUnits.map((u) => u.id)).toEqual([
        'u0001',
        'u0003',
        'u0004',
      ]);
      expect(result.data.discardedCount).toBe(1);
      expect(result.data.tokens.totalTokens).toBe(30);
    }
  });

  it('lit tout plutôt que rien quand le tri écarte toutes les unités', async () => {
    const only = [unit('Diagnostic', 'unknown'), unit('Contexte', 'unknown')];
    const { llm } = llmRouting(() => [
      { index: 0, type: 'diagnostic' },
      { index: 1, type: 'autre' },
    ]);

    const result = await scoutUnits(llm, { units: only });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keptUnits).toHaveLength(2);
      expect(result.data.discardedCount).toBe(0);
    }
  });

  it('propage une erreur du tri', async () => {
    const llm = {
      generateStructured: vi.fn(async () => failure({ kind: 'rate_limited' })),
    } as unknown as Pick<LlmService, 'generateStructured'>;

    expect(await scoutUnits(llm, { units })).toMatchObject({
      success: false,
      error: { kind: 'rate_limited' },
    });
  });
});
