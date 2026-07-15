import { type CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import {
  ActionTypeEnum,
  ReferentielIdEnum,
  type ActionType,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { type ActionCible } from '../shared/action-cible';
import { type SwitchToTeContext } from '../shared/switch-to-te-context';
import {
  dedupeServiceTagIds,
  mergeServices,
  mergeServicesForCible,
} from './merge-services.rules';

const hierarchie = [
  ActionTypeEnum.REFERENTIEL,
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
] as const;

const hierarchies = new Map<ReferentielId, ActionType[]>([
  [ReferentielIdEnum.CAE, [...hierarchie]],
  [ReferentielIdEnum.ECI, [...hierarchie]],
]);

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

const servicesByMesureActionId = new Map<string, number[]>([
  ['cae_6.1.3', [10]],
  ['eci_3.3.1', [20]],
  ['cae_1.1.2', [30]],
]);

describe('dedupeServiceTagIds', () => {
  it('filtre les valeurs null ou undefined', () => {
    expect(dedupeServiceTagIds([1, null as unknown as number, 2])).toEqual([
      1, 2,
    ]);
  });

  it('déduplique par serviceTagId', () => {
    expect(dedupeServiceTagIds([1, 1, 2])).toEqual([1, 2]);
  });
});

describe('mergeServicesForCible', () => {
  const merge = (
    originesConcernees: CorrelatedActionWithScore[],
    servicesMap = servicesByMesureActionId,
    hierarchiesMap = hierarchies
  ) =>
    mergeServicesForCible({
      originesConcernees,
      hierarchiesByReferentielId: hierarchiesMap,
      servicesByMesureActionId: servicesMap,
    });

  it('remonte une tâche vers la mesure source pour lire les services', () => {
    expect(
      merge([createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3')])
    ).toEqual([10]);
  });

  it('remonte une sous-action vers la mesure source', () => {
    expect(
      merge([createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.3')])
    ).toEqual([20]);
  });

  it('laisse inchangé une origine déjà au niveau mesure', () => {
    expect(merge([createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3')])).toEqual([
      10,
    ]);
  });

  it('fusionne CAE et ECI vers la même mesure TE', () => {
    expect(
      merge([
        createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
        createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.3'),
      ])
    ).toEqual([10, 20]);
  });

  it('déduplique le même serviceTagId entre CAE et ECI', () => {
    const servicesMap = new Map<string, number[]>([
      ['cae_6.1.3', [42]],
      ['eci_3.3.1', [42]],
    ]);

    expect(
      merge(
        [
          createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
          createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.3'),
        ],
        servicesMap
      )
    ).toEqual([42]);
  });

  it('déduplique entre deux origines pointant vers la même mesure source', () => {
    const servicesMap = new Map<string, number[]>([['cae_6.1.3', [10]]]);

    expect(
      merge(
        [
          createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
          createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.1'),
        ],
        servicesMap
      )
    ).toEqual([10]);
  });

  it('conserve deux serviceTagId distincts', () => {
    const servicesMap = new Map<string, number[]>([['cae_6.1.3', [10, 11]]]);

    expect(
      merge(
        [createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3')],
        servicesMap
      )
    ).toEqual([10, 11]);
  });

  it('retourne un tableau vide sans service sur les mesures sources', () => {
    expect(
      merge([createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3')], new Map())
    ).toEqual([]);
  });

  it('ne lit aucun service si la hiérarchie est absente', () => {
    expect(
      merge(
        [createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3')],
        servicesByMesureActionId,
        new Map()
      )
    ).toEqual([]);
  });

  it('retourne un tableau vide si originesConcernees est vide', () => {
    expect(merge([])).toEqual([]);
  });

  it('fusionne un mapping hétérogène cae_6.1.3.4.3 + eci_3.3.1.3', () => {
    expect(
      merge([
        createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
        createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.3'),
      ])
    ).toEqual([10, 20]);
  });
});

describe('mergeServices', () => {
  const createCible = (
    overrides: Partial<ActionCible> & Pick<ActionCible, 'actionId'>
  ): ActionCible => ({
    actionId: overrides.actionId,
    actionsOrigine: overrides.actionsOrigine ?? [],
    originesConcernees: overrides.originesConcernees ?? [],
    concernee: overrides.concernee ?? true,
  });

  const createCtx = (mesures: ActionCible[]): SwitchToTeContext => ({
    collectiviteId: 1,
    sourceReferentiels: [ReferentielIdEnum.CAE],
    scoreMapsByReferentiel: new Map(),
    referentielTe: {} as SwitchToTeContext['referentielTe'],
    teScoreMap: new Map(),
    hierarchiesByReferentielId: hierarchies,
    pilotesByMesureActionId: new Map(),
    servicesByMesureActionId,
    cibles: { sousActionsEtTaches: [], mesures },
    sourceFicheLinks: [],
  });

  it('ignore les mesures non concernées', () => {
    const ctx = createCtx([
      createCible({
        actionId: 'te_1.1.1',
        concernee: false,
        originesConcernees: [
          createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
        ],
      }),
    ]);

    expect(mergeServices(ctx)).toEqual([]);
  });

  it('agrège les services des mesures concernées', () => {
    const ctx = createCtx([
      createCible({
        actionId: 'te_6.1.4',
        originesConcernees: [
          createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
        ],
      }),
    ]);

    expect(mergeServices(ctx)).toEqual([
      {
        collectiviteId: 1,
        actionId: 'te_6.1.4',
        serviceTagId: 10,
      },
    ]);
  });
});
