import { describe, expect, it } from 'vitest';
import { applyClassification } from './apply-classification';
import { FicheClassification } from './classify-fiches.schema';
import { RenderedFiche } from './render-fiches-text';

const rendered: RenderedFiche[] = [
  { index: 0, ficheId: 42, isDescriptionTruncated: false },
  { index: 1, ficheId: 7, isDescriptionTruncated: true },
];

const toFicheClassification = (
  overrides: Partial<FicheClassification> = {}
): FicheClassification => ({
  index: 0,
  justification: 'Le texte décrit une infrastructure de covoiturage.',
  hasNoRelevantLevier: false,
  volets: [{ levier: 'Covoiturage', categories: ['amenagement'] }],
  ...overrides,
});

const toClassificationPerFiche = (): FicheClassification[] => [
  toFicheClassification(),
  toFicheClassification({ index: 1 }),
];

describe('applyClassification', () => {
  it('rattache chaque index de lot à son identifiant de fiche', () => {
    const result = applyClassification(toClassificationPerFiche(), rendered);
    expect(result.success && result.data.map(({ ficheId }) => ficheId)).toEqual(
      [42, 7]
    );
  });

  it("rend les fiches dans l'ordre du lot, quel que soit celui de la réponse", () => {
    const result = applyClassification(
      [
        toFicheClassification({ index: 1 }),
        toFicheClassification({ index: 0 }),
      ],
      rendered
    );
    expect(result.success && result.data.map(({ ficheId }) => ficheId)).toEqual(
      [42, 7]
    );
  });

  it('dérive le secteur du levier annoncé', () => {
    const result = applyClassification(toClassificationPerFiche(), rendered);
    expect(result.success && result.data[0].volets).toEqual([
      {
        levier: 'Covoiturage',
        secteur: 'Transports',
        categorie: 'amenagement',
      },
    ]);
  });

  it('développe un levier portant plusieurs catégories en autant de volets', () => {
    const result = applyClassification(
      [
        toFicheClassification({
          volets: [
            {
              levier: 'Vélo et transport en commun',
              categories: ['amenagement', 'financement'],
            },
          ],
        }),
        toFicheClassification({ index: 1 }),
      ],
      rendered
    );
    expect(
      result.success && result.data[0].volets.map(({ categorie }) => categorie)
    ).toEqual(['amenagement', 'financement']);
  });

  it('dédoublonne un même couple levier x catégorie annoncé deux fois', () => {
    const result = applyClassification(
      [
        toFicheClassification({
          volets: [
            { levier: 'Covoiturage', categories: ['amenagement'] },
            {
              levier: 'Covoiturage',
              categories: ['amenagement', 'financement'],
            },
          ],
        }),
        toFicheClassification({ index: 1 }),
      ],
      rendered
    );
    expect(result.success && result.data[0].volets).toEqual([
      {
        levier: 'Covoiturage',
        secteur: 'Transports',
        categorie: 'amenagement',
      },
      {
        levier: 'Covoiturage',
        secteur: 'Transports',
        categorie: 'financement',
      },
    ]);
  });

  it('reporte la troncature de la description sur la fiche concernée', () => {
    const result = applyClassification(toClassificationPerFiche(), rendered);
    expect(
      result.success &&
        result.data.map(({ isDescriptionTruncated }) => isDescriptionTruncated)
    ).toEqual([false, true]);
  });

  it('accepte une abstention et rend tout de même la fiche', () => {
    const result = applyClassification(
      [
        toFicheClassification({
          hasNoRelevantLevier: true,
          volets: [],
          justification: 'Aucun levier de décarbonation concerné.',
        }),
        toFicheClassification({ index: 1 }),
      ],
      rendered
    );
    expect(result.success && result.data[0]).toEqual({
      ficheId: 42,
      justification: 'Aucun levier de décarbonation concerné.',
      isDescriptionTruncated: false,
      volets: [],
    });
  });

  it('rejette une abstention contredite par des volets', () => {
    expect(
      applyClassification(
        [
          toFicheClassification({ hasNoRelevantLevier: true }),
          toFicheClassification({ index: 1 }),
        ],
        rendered
      )
    ).toEqual({
      success: false,
      error: { kind: 'contradictory_abstention', index: 0 },
    });
  });

  it("rejette une fiche sans volet dont l'abstention n'est pas déclarée", () => {
    expect(
      applyClassification(
        [
          toFicheClassification({ volets: [] }),
          toFicheClassification({ index: 1 }),
        ],
        rendered
      )
    ).toEqual({
      success: false,
      error: { kind: 'undeclared_abstention', index: 0 },
    });
  });

  it('rejette une réponse vide plutôt que de rendre un lot sans classification', () => {
    expect(applyClassification([], rendered)).toEqual({
      success: false,
      error: { kind: 'empty_response' },
    });
  });

  it("rejette un index qui n'a pas été soumis", () => {
    expect(
      applyClassification(
        [
          toFicheClassification(),
          toFicheClassification({ index: 1 }),
          toFicheClassification({ index: 99 }),
        ],
        rendered
      )
    ).toEqual({
      success: false,
      error: { kind: 'unexpected_index', index: 99 },
    });
  });

  it('rejette un index classé deux fois', () => {
    expect(
      applyClassification(
        [
          toFicheClassification(),
          toFicheClassification({ index: 1 }),
          toFicheClassification({ justification: 'doublon' }),
        ],
        rendered
      )
    ).toEqual({
      success: false,
      error: { kind: 'duplicate_index', index: 0 },
    });
  });

  it("rejette un lot dont une fiche n'a pas été classée", () => {
    expect(applyClassification([toFicheClassification()], rendered)).toEqual({
      success: false,
      error: { kind: 'missing_indexes', indexes: [1] },
    });
  });
});
