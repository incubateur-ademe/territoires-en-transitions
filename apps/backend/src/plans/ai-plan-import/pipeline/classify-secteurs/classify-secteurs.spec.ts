import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { createEmptyExtractedAction } from '../../models/extracted-action';
import { wholeDocument } from '../source-chunks/source-chunks';
import { classifySecteurs } from './classify-secteurs';
import {
  effetsAttendusResponseSchema,
  secteursResponseSchema,
} from './classify-secteurs.schema';

const tokens = {
  promptTokens: 10,
  cachedTokens: 0,
  candidatesTokens: 2,
  thoughtsTokens: 0,
  totalTokens: 12,
};

const actions = [
  createEmptyExtractedAction({
    axe: 'Habitat',
    titre: 'Rénover les logements',
  }),
  createEmptyExtractedAction({ axe: 'Pilotage', titre: 'Animer le PCAET' }),
];

const effetsAttendus = [
  {
    id: 9,
    nom: 'Réduction des émissions de gaz à effet de serre',
    notice: null,
  },
  { id: 25, nom: 'Efficacité énergétique', notice: '  ' },
  { id: 10, nom: 'Sobriété ', notice: 'Moins consommer' },
];

const pcaet = { withSecteurs: true, effetsAttendus };

const promptOf = (generateStructured: ReturnType<typeof vi.fn>): string =>
  (generateStructured.mock.calls[0][0] as { prompt: string }).prompt;

describe('classifySecteurs', () => {
  it('rattache à chaque action ses secteurs, sans doublon, sur le palier léger', async () => {
    const generateStructured = vi.fn().mockResolvedValue(
      success({
        data: [
          {
            index: 0,
            secteurs: ['residentiel', 'residentiel'],
            effetsAttendus: [25, 25, 9],
            justification: ' Rénovation des logements. ',
          },
          {
            index: 1,
            secteurs: [],
            effetsAttendus: [],
            justification: 'Pilotage du plan.',
          },
        ],
        tokens,
      })
    );

    const result = await classifySecteurs(
      { generateStructured },
      {
        actions,
        source: wholeDocument('texte source', actions.length),
        ...pcaet,
      }
    );

    expect(result).toMatchObject({
      success: true,
      data: {
        actions: [
          {
            titre: 'Rénover les logements',
            secteurs: {
              secteurs: ['residentiel'],
              justification: 'Rénovation des logements.',
            },
            effetsAttendus: [25, 9],
          },
          {
            titre: 'Animer le PCAET',
            secteurs: { secteurs: [], justification: 'Pilotage du plan.' },
            effetsAttendus: [],
          },
        ],
        tokens,
        warnings: [],
        details: {
          batches: 1,
          classified: 2,
          withoutSecteur: 1,
          withoutEffetAttendu: 1,
          unknownEffetsAttendus: 0,
        },
      },
    });
    expect(generateStructured).toHaveBeenCalledWith(
      expect.objectContaining({
        tier: 'light',
        thinkingLevel: 'low',
        schema: secteursResponseSchema,
      })
    );
    const prompt = promptOf(generateStructured);
    expect(prompt).toContain('plan climat-air-énergie territorial');
    expect(prompt).toContain('"residentiel"');
    expect(prompt).toContain('• 25 : Efficacité énergétique\n');
    expect(prompt).toContain('• 10 : Sobriété (Moins consommer)');
    expect(prompt).toContain('"effetsAttendus"');
  });

  it("laisse sans secteur les actions de lots tous en échec, sans faire échouer l'étape, et le signale", async () => {
    const generateStructured = vi
      .fn()
      .mockResolvedValue(failure({ kind: 'rate_limited' }));

    const result = await classifySecteurs(
      { generateStructured },
      {
        actions,
        source: wholeDocument('texte source', actions.length),
        ...pcaet,
      }
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions.map((action) => action.secteurs)).toEqual([
        undefined,
        undefined,
      ]);
      expect(result.data.warnings).toEqual([
        'Secteurs et effets attendus non proposés pour 2 action(s) : rate_limited',
        'Aucun secteur proposé : les 1 lot(s) ont échoué, la complétion par Communs prendra le relais',
      ]);
    }
  });

  it("ne signale qu'un lot quand un autre a abouti", async () => {
    const many = Array.from({ length: 31 }, (_, index) =>
      createEmptyExtractedAction({ axe: 'Habitat', titre: `Action ${index}` })
    );
    const generateStructured = vi
      .fn()
      .mockResolvedValueOnce(failure({ kind: 'rate_limited' }))
      .mockResolvedValueOnce(success({ data: [], tokens }));

    const result = await classifySecteurs(
      { generateStructured },
      {
        actions: many,
        source: wholeDocument('texte source', many.length),
        ...pcaet,
      }
    );

    expect(result).toMatchObject({
      success: true,
      data: {
        warnings: [
          'Secteurs et effets attendus non proposés pour 30 action(s) : rate_limited',
        ],
      },
    });
  });

  it('ignore un index hors du lot', async () => {
    const generateStructured = vi.fn().mockResolvedValue(
      success({
        data: [
          {
            index: 7,
            secteurs: ['dechets'],
            effetsAttendus: [9],
            justification: '',
          },
        ],
        tokens,
      })
    );

    const result = await classifySecteurs(
      { generateStructured },
      {
        actions,
        source: wholeDocument('texte source', actions.length),
        ...pcaet,
      }
    );

    expect(
      result.success &&
        result.data.actions.every((a) => !a.secteurs && !a.effetsAttendus)
    ).toBe(true);
  });

  it('écarte les effets attendus hors de la liste fournie', async () => {
    const generateStructured = vi.fn().mockResolvedValue(
      success({
        data: [
          {
            index: 0,
            secteurs: ['residentiel'],
            effetsAttendus: [25, 404, 404],
            justification: '',
          },
        ],
        tokens,
      })
    );

    const result = await classifySecteurs(
      { generateStructured },
      {
        actions,
        source: wholeDocument('texte source', actions.length),
        ...pcaet,
      }
    );

    expect(result).toMatchObject({
      success: true,
      data: {
        actions: [{ effetsAttendus: [25] }, {}],
        details: { unknownEffetsAttendus: 1 },
      },
    });
  });

  it('tolère une réponse sans effets attendus', () => {
    expect(
      secteursResponseSchema.parse([
        { index: 0, secteurs: ['dechets'], justification: 'Tri.' },
      ])
    ).toEqual([
      {
        index: 0,
        secteurs: ['dechets'],
        effetsAttendus: [],
        justification: 'Tri.',
      },
    ]);
    expect(effetsAttendusResponseSchema.parse([{ index: 3 }])).toEqual([
      { index: 3, effetsAttendus: [] },
    ]);
  });

  it('hors PCAET, ne demande que les effets attendus et ne pose aucun secteur', async () => {
    const generateStructured = vi.fn().mockResolvedValue(
      success({
        data: [{ index: 0, effetsAttendus: [9] }],
        tokens,
      })
    );

    const result = await classifySecteurs(
      { generateStructured },
      {
        actions,
        source: wholeDocument('texte source', actions.length),
        withSecteurs: false,
        effetsAttendus,
      }
    );

    expect(generateStructured).toHaveBeenCalledWith(
      expect.objectContaining({ schema: effetsAttendusResponseSchema })
    );
    const prompt = promptOf(generateStructured);
    expect(prompt).toContain('un plan d’action territorial');
    expect(prompt).toContain('• 9 : Réduction des émissions');
    expect(prompt).not.toContain('climat-air-énergie');
    expect(prompt).not.toContain('"residentiel"');
    expect(prompt).not.toContain('"secteurs"');
    expect(prompt).not.toContain('"justification"');
    expect(result).toMatchObject({
      success: true,
      data: {
        actions: [{ effetsAttendus: [9] }, {}],
        details: { classified: 1, withoutEffetAttendu: 0 },
      },
    });
    if (result.success) {
      expect(result.data.actions.every((a) => a.secteurs === undefined)).toBe(
        true
      );
      expect(result.data.details).not.toHaveProperty('withoutSecteur');
    }
  });

  it("hors PCAET, n'annonce pas la complétion des secteurs quand tout échoue", async () => {
    const generateStructured = vi
      .fn()
      .mockResolvedValue(failure({ kind: 'rate_limited' }));

    const result = await classifySecteurs(
      { generateStructured },
      {
        actions,
        source: wholeDocument('texte source', actions.length),
        withSecteurs: false,
        effetsAttendus,
      }
    );

    expect(result).toMatchObject({
      success: true,
      data: {
        warnings: [
          'Effets attendus non proposés pour 2 action(s) : rate_limited',
        ],
      },
    });
  });
});
