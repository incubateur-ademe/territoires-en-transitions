import { GenerateStructuredArgs } from '@tet/backend/utils/llm/llm.service';
import { success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { ZodType } from 'zod';
import {
  calculateMobilisation,
  MOBILISATION_THINKING_BUDGET,
  UNKNOWN_POPULATION_LABEL,
} from './calculate-mobilisation';
import { LevierVolets } from './group-volets-by-levier';
import { FicheToScore } from './render-volet-actions';

const tokens = {
  promptTokens: 10,
  candidatesTokens: 5,
  thoughtsTokens: 1,
  totalTokens: 16,
};

const toScoringLlm = (notes: Record<string, number>) => ({
  generateStructured: vi.fn(async (_args: GenerateStructuredArgs<ZodType>) =>
    success({ data: notes, tokens })
  ),
});

const toLevierVolets = (
  ficheIdsByCategorie: Partial<LevierVolets['ficheIdsByCategorie']> = {}
): LevierVolets => ({
  levierId: 'velo_transport_commun',
  ficheIdsByCategorie: {
    amenagement: [],
    planification: [],
    financement: [],
    gouvernance: [],
    exemplarite: [],
    sensibilisation: [],
    ...ficheIdsByCategorie,
  },
});

const fichesById = new Map<number, FicheToScore>([
  [1, { ficheId: 1, titre: 'Pistes cyclables', description: 'Dix km' }],
]);

const allNotesAtThree = { '1': 3, '2': 3, '3': 3, '4': 3, '5': 3, '6': 3 };

describe('calculateMobilisation', () => {
  it('force à 0 une catégorie sans fiche, même si le modèle la note plus haut', async () => {
    const llm = toScoringLlm(allNotesAtThree);

    const result = await calculateMobilisation(llm as never, {
      levierVolets: toLevierVolets({ amenagement: [1] }),
      fichesById,
      collectiviteNom: 'Ville de test',
      population: 3000,
    });

    expect(
      result.success &&
        result.data.volets.map(({ categorie, note }) => ({ categorie, note }))
    ).toEqual([
      { categorie: 'amenagement', note: 3 },
      { categorie: 'planification', note: 0 },
      { categorie: 'financement', note: 0 },
      { categorie: 'gouvernance', note: 0 },
      { categorie: 'exemplarite', note: 0 },
      { categorie: 'sensibilisation', note: 0 },
    ]);
  });

  it('rend les six volets avec les fiches qui les ont nourris', async () => {
    const llm = toScoringLlm(allNotesAtThree);

    const result = await calculateMobilisation(llm as never, {
      levierVolets: toLevierVolets({ amenagement: [1] }),
      fichesById,
      collectiviteNom: 'Ville de test',
      population: 3000,
    });

    expect(
      result.success && result.data.volets.map(({ ficheIds }) => ficheIds)
    ).toEqual([[1], [], [], [], [], []]);
  });

  it("annonce une population inconnue plutôt qu'un zéro", async () => {
    const llm = toScoringLlm(allNotesAtThree);

    await calculateMobilisation(llm as never, {
      levierVolets: toLevierVolets({ amenagement: [1] }),
      fichesById,
      collectiviteNom: 'Ville de test',
      population: null,
    });

    const [{ prompt }] = llm.generateStructured.mock.calls[0];

    expect({
      hasPopulationInconnue: prompt.includes(
        `Population : ${UNKNOWN_POPULATION_LABEL}`
      ),
      hasZero: prompt.includes('Population : 0'),
    }).toEqual({ hasPopulationInconnue: true, hasZero: false });
  });

  it('nomme le levier par son libellé et non par son identifiant', async () => {
    const llm = toScoringLlm(allNotesAtThree);

    await calculateMobilisation(llm as never, {
      levierVolets: toLevierVolets({ amenagement: [1] }),
      fichesById,
      collectiviteNom: 'Ville de test',
      population: 3000,
    });

    const [{ prompt }] = llm.generateStructured.mock.calls[0];

    expect(prompt).toContain('Levier évalué : Vélo et transport en commun');
  });

  it("garde le budget de raisonnement de l'étape 1", async () => {
    const llm = toScoringLlm(allNotesAtThree);

    await calculateMobilisation(llm as never, {
      levierVolets: toLevierVolets({ amenagement: [1] }),
      fichesById,
      collectiviteNom: 'Ville de test',
      population: 3000,
    });

    const [{ thinkingBudget }] = llm.generateStructured.mock.calls[0];

    expect(thinkingBudget).toBe(MOBILISATION_THINKING_BUDGET);
  });
});
