import { type CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import {
  ReferentielIdEnum,
  type ActionScore,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { type ActionCible } from './action-cible';
import { hierarchiesByReferentielIdForTests } from './referentiel-hierarchies.test-fixture';
import {
  buildCorrespondanceIndexes,
  resolveCiblesTeDepuisOrigine,
} from './correspondance-origine-cible';

const hierarchies = hierarchiesByReferentielIdForTests;

const buildIndexes = (
  input: Omit<
    Parameters<typeof buildCorrespondanceIndexes>[0],
    'hierarchiesByReferentielId'
  >
) =>
  buildCorrespondanceIndexes({
    ...input,
    hierarchiesByReferentielId: hierarchies,
  });

const createOrigine = (
  referentielId: ReferentielId,
  actionId: string
): CorrelatedActionWithScore => ({
  referentielId,
  actionId,
  ponderation: 1,
  nom: null,
  score: null,
});

const createCible = (
  overrides: Partial<ActionCible> & Pick<ActionCible, 'actionId'>
): ActionCible => ({
  actionId: overrides.actionId,
  actionsOrigine: overrides.actionsOrigine ?? [],
  originesConcernees: overrides.originesConcernees ?? [],
  concernee: overrides.concernee ?? true,
});

describe('buildCorrespondanceIndexes', () => {
  it('peuple directSousActionByOrigineId pour une sous-action directe', () => {
    const indexes = buildIndexes({
      sousActionsEtTaches: [
        createCible({
          actionId: 'te_2.2.2.1',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_2.2.2.1'),
          ],
        }),
      ],
      mesures: [],
    });

    expect(indexes.directSousActionByOrigineId.get('cae_2.2.2.1')).toEqual([
      'te_2.2.2.1',
    ]);
    expect(indexes.mesureByOrigineId.has('cae_2.2.2.1')).toBe(false);
  });

  it('peuple mesureByOrigineId pour une origine tâche agrégée', () => {
    const indexes = buildIndexes({
      sousActionsEtTaches: [],
      mesures: [
        createCible({
          actionId: 'te_6.1.4',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
          ],
        }),
      ],
    });

    expect(indexes.mesureByOrigineId.get('cae_6.1.3.4.3')).toEqual([
      { teActionId: 'te_6.1.4', kind: 'direct' },
    ]);
    expect(indexes.mesureByOrigineId.get('cae_6.1.3')).toEqual([
      { teActionId: 'te_6.1.4', kind: 'indirect' },
    ]);
    expect(indexes.directSousActionByOrigineId.has('cae_6.1.3.4.3')).toBe(
      false
    );
  });

  it('peuple mesureByOrigineId pour une origine tâche ECI agrégée', () => {
    const indexes = buildIndexes({
      sousActionsEtTaches: [],
      mesures: [
        createCible({
          actionId: 'te_6.1.4',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.3'),
          ],
        }),
      ],
    });

    expect(indexes.mesureByOrigineId.get('eci_3.3.1.3')).toEqual([
      { teActionId: 'te_6.1.4', kind: 'direct' },
    ]);
    expect(indexes.mesureByOrigineId.get('eci_3.3')).toEqual([
      { teActionId: 'te_6.1.4', kind: 'indirect' },
    ]);
  });

  it('exclut les cibles non concernées des index', () => {
    const indexes = buildIndexes({
      sousActionsEtTaches: [
        createCible({
          actionId: 'te_2.2.2.1',
          concernee: false,
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_2.2.2.1'),
          ],
        }),
      ],
      mesures: [
        createCible({
          actionId: 'te_6.1.4',
          concernee: false,
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3'),
          ],
        }),
      ],
    });

    expect(indexes.directSousActionByOrigineId.size).toBe(0);
    expect(indexes.mesureByOrigineId.size).toBe(0);
  });

  it('accepte plusieurs origines distinctes vers la même cible TE', () => {
    const indexes = buildIndexes({
      sousActionsEtTaches: [],
      mesures: [
        createCible({
          actionId: 'te_6.1.4',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3'),
            createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4'),
          ],
        }),
      ],
    });

    expect(indexes.mesureByOrigineId.get('cae_6.1.3')).toEqual([
      { teActionId: 'te_6.1.4', kind: 'direct' },
    ]);
    expect(indexes.mesureByOrigineId.get('cae_6.1.3.4')).toEqual([
      { teActionId: 'te_6.1.4', kind: 'direct' },
    ]);
  });

  it('conserve plusieurs cibles TE candidates pour une même origine', () => {
    const indexes = buildIndexes({
      sousActionsEtTaches: [
        createCible({
          actionId: 'te_2.2.2.1',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_2.2.2.1'),
          ],
        }),
        createCible({
          actionId: 'te_2.2.2.2',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_2.2.2.1'),
          ],
        }),
      ],
      mesures: [],
    });

    expect(indexes.directSousActionByOrigineId.get('cae_2.2.2.1')).toEqual([
      'te_2.2.2.1',
      'te_2.2.2.2',
    ]);
  });
});

describe('resolveCiblesTeDepuisOrigine', () => {
  const sousActionIndexes = buildIndexes({
    sousActionsEtTaches: [
      createCible({
        actionId: 'te_2.2.2.1',
        originesConcernees: [
          createOrigine(ReferentielIdEnum.CAE, 'cae_2.2.2.1'),
        ],
      }),
    ],
    mesures: [
      createCible({
        actionId: 'te_6.1.4',
        originesConcernees: [
          createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3'),
          createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4'),
        ],
      }),
    ],
  });

  const teScoreMap = new Map<string, ActionScore>();

  const resolve = (sourceActionId: string, scoreMap = teScoreMap) =>
    resolveCiblesTeDepuisOrigine({
      sourceActionId,
      indexes: sousActionIndexes,
      hierarchiesByReferentielId: hierarchies,
      teScoreMap: scoreMap,
    });

  it('résout une sous-mesure source vers la sous-action TE directe', () => {
    expect(resolve('cae_2.2.2.1')).toEqual(['te_2.2.2.1']);
  });

  it('résout une sous-mesure source vers la mesure TE en fallback', () => {
    expect(resolve('cae_6.1.3.4')).toEqual(['te_6.1.4']);
  });

  it('résout une mesure source vers la mesure TE', () => {
    expect(resolve('cae_6.1.3')).toEqual(['te_6.1.4']);
  });

  it('résout une tâche ECI source vers la mesure TE en fallback', () => {
    const eciIndexes = buildIndexes({
      sousActionsEtTaches: [],
      mesures: [
        createCible({
          actionId: 'te_6.1.4',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.3'),
          ],
        }),
      ],
    });

    expect(
      resolveCiblesTeDepuisOrigine({
        sourceActionId: 'eci_3.3.1.3',
        indexes: eciIndexes,
        hierarchiesByReferentielId: hierarchies,
        teScoreMap,
      })
    ).toEqual(['te_6.1.4']);
  });

  it('retourne une liste vide si la cible TE est non concernée', () => {
    const scoreMap = new Map<string, ActionScore>([
      [
        'te_6.1.4',
        {
          actionId: 'te_6.1.4',
          concerne: false,
        } as ActionScore,
      ],
    ]);

    expect(resolve('cae_6.1.3', scoreMap)).toEqual([]);
  });

  it('retourne une liste vide si l origine est absente des index', () => {
    expect(resolve('cae_99.99')).toEqual([]);
  });

  it('résout vers la seule cible TE concernée quand plusieurs candidates existent', () => {
    const indexes = buildIndexes({
      sousActionsEtTaches: [
        createCible({
          actionId: 'te_2.2.2.1',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_2.2.2.1'),
          ],
        }),
        createCible({
          actionId: 'te_2.2.2.2',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_2.2.2.1'),
          ],
        }),
      ],
      mesures: [],
    });

    const scoreMap = new Map<string, ActionScore>([
      [
        'te_2.2.2.1',
        { actionId: 'te_2.2.2.1', concerne: false } as ActionScore,
      ],
      [
        'te_2.2.2.2',
        { actionId: 'te_2.2.2.2', concerne: true } as ActionScore,
      ],
    ]);

    expect(
      resolveCiblesTeDepuisOrigine({
        sourceActionId: 'cae_2.2.2.1',
        indexes,
        hierarchiesByReferentielId: hierarchies,
        teScoreMap: scoreMap,
      })
    ).toEqual(['te_2.2.2.2']);
  });

  it('retourne toutes les cibles TE directes concernées pour une même origine', () => {
    const indexes = buildIndexes({
      sousActionsEtTaches: [
        createCible({
          actionId: 'te_2.2.2.1',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_2.2.2.1'),
          ],
        }),
        createCible({
          actionId: 'te_2.2.2.2',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_2.2.2.1'),
          ],
        }),
      ],
      mesures: [],
    });

    const scoreMap = new Map<string, ActionScore>([
      [
        'te_2.2.2.1',
        { actionId: 'te_2.2.2.1', concerne: true } as ActionScore,
      ],
      [
        'te_2.2.2.2',
        { actionId: 'te_2.2.2.2', concerne: true } as ActionScore,
      ],
    ]);

    expect(
      resolveCiblesTeDepuisOrigine({
        sourceActionId: 'cae_2.2.2.1',
        indexes,
        hierarchiesByReferentielId: hierarchies,
        teScoreMap: scoreMap,
      })
    ).toEqual(['te_2.2.2.1', 'te_2.2.2.2']);
  });

  it('retourne toutes les mesures TE indirectes concernées pour une origine mesure', () => {
    const indexes = buildIndexes({
      sousActionsEtTaches: [],
      mesures: [
        createCible({
          actionId: 'te_6.1.4',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.3'),
          ],
        }),
        createCible({
          actionId: 'te_6.3.1',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.1'),
            createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.3'),
          ],
        }),
        createCible({
          actionId: 'te_6.5.2',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.2'),
          ],
        }),
      ],
    });

    expect(
      resolveCiblesTeDepuisOrigine({
        sourceActionId: 'eci_3.3',
        indexes,
        hierarchiesByReferentielId: hierarchies,
        teScoreMap,
      })
    ).toEqual(['te_6.1.4', 'te_6.3.1', 'te_6.5.2']);
  });

  it('priorise les correspondances directes mesure aux indirectes', () => {
    const indexes = buildIndexes({
      sousActionsEtTaches: [],
      mesures: [
        createCible({
          actionId: 'te_6.1.4',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3'),
            createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
          ],
        }),
        createCible({
          actionId: 'te_6.5.2',
          originesConcernees: [
            createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.1'),
          ],
        }),
      ],
    });

    expect(
      resolveCiblesTeDepuisOrigine({
        sourceActionId: 'cae_6.1.3',
        indexes,
        hierarchiesByReferentielId: hierarchies,
        teScoreMap,
      })
    ).toEqual(['te_6.1.4']);
  });
});
