import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { createEmptyExtractedAction } from '../../models/extracted-action';
import { wholeDocument } from '../source-chunks/source-chunks';
import { classifySecteurs } from './classify-secteurs';

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

describe('classifySecteurs', () => {
  it('rattache à chaque action ses secteurs, sans doublon, sur le palier léger', async () => {
    const generateStructured = vi.fn().mockResolvedValue(
      success({
        data: [
          {
            index: 0,
            secteurs: ['residentiel', 'residentiel'],
            justification: ' Rénovation des logements. ',
          },
          { index: 1, secteurs: [], justification: 'Pilotage du plan.' },
        ],
        tokens,
      })
    );

    const result = await classifySecteurs(
      { generateStructured },
      { actions, source: wholeDocument('texte source', actions.length) }
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
          },
          {
            titre: 'Animer le PCAET',
            secteurs: { secteurs: [], justification: 'Pilotage du plan.' },
          },
        ],
        tokens,
        warnings: [],
        details: { batches: 1, classified: 2, withoutSecteur: 1 },
      },
    });
    expect(generateStructured).toHaveBeenCalledWith(
      expect.objectContaining({ tier: 'light' })
    );
  });

  it("laisse sans secteur les actions d'un lot en échec, sans faire échouer l'étape", async () => {
    const generateStructured = vi
      .fn()
      .mockResolvedValue(failure({ kind: 'rate_limited' }));

    const result = await classifySecteurs(
      { generateStructured },
      { actions, source: wholeDocument('texte source', actions.length) }
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actions.map((action) => action.secteurs)).toEqual([
        undefined,
        undefined,
      ]);
      expect(result.data.warnings).toHaveLength(1);
    }
  });

  it('ignore un index hors du lot', async () => {
    const generateStructured = vi.fn().mockResolvedValue(
      success({
        data: [{ index: 7, secteurs: ['dechets'], justification: '' }],
        tokens,
      })
    );

    const result = await classifySecteurs(
      { generateStructured },
      { actions, source: wholeDocument('texte source', actions.length) }
    );

    expect(
      result.success && result.data.actions.every((a) => !a.secteurs)
    ).toBe(true);
  });
});
