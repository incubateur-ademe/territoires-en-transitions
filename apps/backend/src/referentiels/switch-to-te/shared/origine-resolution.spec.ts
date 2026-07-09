import { type CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import {
  type ActionScore,
  ReferentielIdEnum,
  type ReferentielId,
} from '@tet/domain/referentiels';
import {
  filterOriginesConcernees,
  isCibleConcernee,
} from '../shared/origine-resolution';

const createActionScore = (
  overrides: Partial<ActionScore> = {}
): ActionScore =>
  ({
    concerne: true,
    pointReferentiel: 1,
    ...overrides,
  }) as ActionScore;

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

describe('filterOriginesConcernees', () => {
  it('conserve une source concernée présente dans le snapshot', () => {
    const caeScoreMap = new Map<string, ActionScore>([
      ['cae_1', createActionScore({ concerne: true })],
    ]);
    const scoreMapsByReferentiel = new Map<ReferentielId, Map<string, ActionScore>>([
      [ReferentielIdEnum.CAE, caeScoreMap],
    ]);

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
    const scoreMapsByReferentiel = new Map<ReferentielId, Map<string, ActionScore>>([
      [ReferentielIdEnum.CAE, caeScoreMap],
    ]);

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
    const scoreMapsByReferentiel = new Map<ReferentielId, Map<string, ActionScore>>([
      [ReferentielIdEnum.CAE, caeScoreMap],
    ]);

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
    const scoreMapsByReferentiel = new Map<ReferentielId, Map<string, ActionScore>>([
      [ReferentielIdEnum.CAE, caeScoreMap],
    ]);

    expect(
      filterOriginesConcernees(
        [createCorrelatedAction(ReferentielIdEnum.CAE, 'cae_inconnue')],
        scoreMapsByReferentiel
      )
    ).toHaveLength(0);
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
