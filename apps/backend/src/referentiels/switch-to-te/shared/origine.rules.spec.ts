import { type CorrelatedAction } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine.dto';
import { type CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import {
  type ActionScore,
  ReferentielIdEnum,
  type ReferentielId,
} from '@tet/domain/referentiels';
import {
  dedupeOrigines,
  filterOriginesConcernees,
  isCibleConcernee,
  sortByReferentielOrder,
} from './origine.rules';

const createActionScore = (overrides: Partial<ActionScore> = {}): ActionScore =>
  ({
    concerne: true,
    pointReferentiel: 1,
    ...overrides,
  } as ActionScore);

const createCorrelatedAction = (
  referentielId: ReferentielId,
  actionId: string
): CorrelatedActionWithScore => ({
  referentielId,
  actionId,
  ponderation: 1,
  nom: null,
  score: null,
});

const createOrigine = (
  actionId: string,
  referentielId: ReferentielId = ReferentielIdEnum.CAE
): CorrelatedAction => ({
  actionId,
  referentielId,
  ponderation: 1,
  nom: null,
});

describe('dedupeOrigines', () => {
  it('conserve la première occurrence pour un même actionId', () => {
    const first = createOrigine('cae_1.1.1', ReferentielIdEnum.CAE);
    const duplicate = {
      ...createOrigine('cae_1.1.1', ReferentielIdEnum.CAE),
      ponderation: 2,
    };

    expect(dedupeOrigines([first, duplicate])).toEqual([first]);
  });

  it('conserve des actionId distincts même cross-référentiel', () => {
    const cae = createOrigine('cae_1.1.1', ReferentielIdEnum.CAE);
    const eci = createOrigine('eci_1.1.1', ReferentielIdEnum.ECI);

    expect(dedupeOrigines([cae, eci])).toEqual([cae, eci]);
  });
});

describe('filterOriginesConcernees', () => {
  it('conserve une source concernée présente dans le snapshot', () => {
    const caeScoreMap = new Map<string, ActionScore>([
      ['cae_1', createActionScore({ concerne: true })],
    ]);
    const scoreMapsByReferentiel = new Map<
      ReferentielId,
      Map<string, ActionScore>
    >([[ReferentielIdEnum.CAE, caeScoreMap]]);

    expect(
      filterOriginesConcernees(
        [createCorrelatedAction(ReferentielIdEnum.CAE, 'cae_1')],
        scoreMapsByReferentiel
      )
    ).toHaveLength(1);
  });

  it('exclut une source non_concerne', () => {
    const caeScoreMap = new Map<string, ActionScore>([
      ['cae_1', createActionScore({ concerne: false })],
    ]);
    const scoreMapsByReferentiel = new Map<
      ReferentielId,
      Map<string, ActionScore>
    >([[ReferentielIdEnum.CAE, caeScoreMap]]);

    expect(
      filterOriginesConcernees(
        [createCorrelatedAction(ReferentielIdEnum.CAE, 'cae_1')],
        scoreMapsByReferentiel
      )
    ).toHaveLength(0);
  });

  it('exclut une origine dont le référentiel n a pas de snapshot (ex. ECI archivé)', () => {
    const caeScoreMap = new Map<string, ActionScore>([
      ['cae_1', createActionScore()],
    ]);
    const scoreMapsByReferentiel = new Map<
      ReferentielId,
      Map<string, ActionScore>
    >([[ReferentielIdEnum.CAE, caeScoreMap]]);

    expect(
      filterOriginesConcernees(
        [createCorrelatedAction(ReferentielIdEnum.ECI, 'eci_1')],
        scoreMapsByReferentiel
      )
    ).toHaveLength(0);
  });

  it('exclut une origine absente du snapshot de son référentiel', () => {
    const caeScoreMap = new Map<string, ActionScore>([
      ['cae_1', createActionScore()],
    ]);
    const scoreMapsByReferentiel = new Map<
      ReferentielId,
      Map<string, ActionScore>
    >([[ReferentielIdEnum.CAE, caeScoreMap]]);

    expect(
      filterOriginesConcernees(
        [createCorrelatedAction(ReferentielIdEnum.CAE, 'cae_inconnue')],
        scoreMapsByReferentiel
      )
    ).toHaveLength(0);
  });
});

describe('sortByReferentielOrder', () => {
  it('ignore une origine hors CAE/ECI', () => {
    const cae = { referentielId: ReferentielIdEnum.CAE, id: 'cae_1' };
    const te = { referentielId: ReferentielIdEnum.TE, id: 'te_1' };

    expect(sortByReferentielOrder([te, cae]).map((item) => item.id)).toEqual([
      'cae_1',
    ]);
  });

  it('trie CAE avant ECI en conservant l ordre d entrée', () => {
    const eciFirst = {
      referentielId: ReferentielIdEnum.ECI,
      id: 'eci_4.1',
    };
    const caeSecond = {
      referentielId: ReferentielIdEnum.CAE,
      id: 'cae_1.1',
    };
    const caeFirst = {
      referentielId: ReferentielIdEnum.CAE,
      id: 'cae_1.0',
    };

    expect(
      sortByReferentielOrder([eciFirst, caeSecond, caeFirst]).map(
        (item) => item.id
      )
    ).toEqual(['cae_1.1', 'cae_1.0', 'eci_4.1']);
  });
});

describe('isCibleConcernee', () => {
  it('retourne true si le score est absent', () => {
    expect(isCibleConcernee(new Map(), 'te_1')).toBe(true);
  });

  it('retourne true si concerne est true', () => {
    const scoreMap = new Map<string, ActionScore>([
      ['te_1', createActionScore({ concerne: true })],
    ]);

    expect(isCibleConcernee(scoreMap, 'te_1')).toBe(true);
  });

  it('retourne false si concerne est false (personnalisation / désactivation)', () => {
    const scoreMap = new Map<string, ActionScore>([
      ['te_1', createActionScore({ concerne: false, pointPotentiel: 0 })],
    ]);

    expect(isCibleConcernee(scoreMap, 'te_1')).toBe(false);
  });
});
