import { describe, expect, it } from 'vitest';
import { ClassifyBatchOutcome } from '../classify-batch/classify-batch.service';
import { toClassificationOutcome } from './generate-analysis.adapter';

const toTokens = (promptTokens: number) => ({
  promptTokens,
  cachedTokens: 0,
  candidatesTokens: 1,
  thoughtsTokens: 0,
  totalTokens: promptTokens + 1,
});

const classifications: ClassifyBatchOutcome[] = [
  {
    classified: [
      {
        ficheId: 1,
        justification: 'Piste cyclable protégée',
        isDescriptionTruncated: false,
        volets: [{ levier: 'Covoiturage', categorie: 'amenagement' }],
      },
      {
        ficheId: 2,
        justification: 'Aucun levier pertinent',
        isDescriptionTruncated: false,
        volets: [],
      },
    ],
    sources: [
      { ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' },
      { ficheId: 2, titre: 'Bulletin municipal', description: null },
    ],
    tokens: toTokens(10),
  },
  {
    classified: [],
    sources: [],
    tokens: toTokens(20),
  },
];

describe('toClassificationOutcome', () => {
  it('traduit les leviers nommes en identifiants pour la mobilisation', () => {
    expect(toClassificationOutcome(classifications).volets).toEqual([
      { ficheId: 1, levierId: 'covoiturage', categorie: 'amenagement' },
    ]);
  });

  it('rend les fiches sources pour que la mobilisation nourrisse son prompt', () => {
    expect(toClassificationOutcome(classifications).fiches).toEqual([
      { ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' },
      { ficheId: 2, titre: 'Bulletin municipal', description: null },
    ]);
  });

  it('rassemble le brouillon de tous les lots, fiches non classees comprises', () => {
    expect(
      toClassificationOutcome(classifications).draft.fiches.map(
        ({ ficheId, volets }) => ({ ficheId, voletCount: volets.length })
      )
    ).toEqual([
      { ficheId: 1, voletCount: 1 },
      { ficheId: 2, voletCount: 0 },
    ]);
  });
});
