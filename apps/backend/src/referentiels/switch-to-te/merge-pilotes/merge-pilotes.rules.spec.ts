import { type CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import { type PersonneId } from '@tet/domain/collectivites';
import {
  ActionTypeEnum,
  ReferentielIdEnum,
  type ActionType,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { type ActionCible } from '../shared/action-cible';
import { type SwitchToTeContext } from '../shared/switch-to-te-context';
import {
  dedupePilotes,
  mergePilotes,
  mergePilotesForCible,
  piloteDedupKey,
} from './merge-pilotes.rules';

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

const userPilote = (userId: string): PersonneId => ({
  userId,
  tagId: null,
});

const tagPilote = (tagId: number): PersonneId => ({
  userId: null,
  tagId,
});

const pilotesByMesureActionId = new Map<string, PersonneId[]>([
  ['cae_6.1.3', [userPilote('user-cae')]],
  ['eci_3.3.1', [tagPilote(7)]],
  ['cae_1.1.2', [userPilote('user-cae-only')]],
]);

describe('piloteDedupKey', () => {
  it('utilise userId en priorité', () => {
    expect(piloteDedupKey({ userId: 'user-1', tagId: 42 })).toBe('user-1');
  });

  it('utilise tagId si userId absent', () => {
    expect(piloteDedupKey({ userId: null, tagId: 42 })).toBe('tag:42');
  });
});

describe('dedupePilotes', () => {
  it('filtre les lignes sans userId ni tagId', () => {
    expect(
      dedupePilotes([{ userId: null, tagId: null }, userPilote('user-1')])
    ).toEqual([userPilote('user-1')]);
  });

  it('déduplique par userId', () => {
    expect(dedupePilotes([userPilote('user-1'), userPilote('user-1')])).toEqual(
      [userPilote('user-1')]
    );
  });

  it('déduplique par tagId', () => {
    expect(dedupePilotes([tagPilote(1), tagPilote(1)])).toEqual([tagPilote(1)]);
  });

  it('conserve userId et tagId distincts comme deux lignes', () => {
    expect(dedupePilotes([userPilote('user-1'), tagPilote(1)])).toEqual([
      userPilote('user-1'),
      tagPilote(1),
    ]);
  });
});

describe('mergePilotesForCible', () => {
  const merge = (
    originesConcernees: CorrelatedActionWithScore[],
    pilotesMap = pilotesByMesureActionId,
    hierarchiesMap = hierarchies
  ) =>
    mergePilotesForCible({
      originesConcernees,
      hierarchiesByReferentielId: hierarchiesMap,
      pilotesByMesureActionId: pilotesMap,
    });

  it('remonte une tâche vers la mesure source pour lire les pilotes', () => {
    expect(
      merge([createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3')])
    ).toEqual([userPilote('user-cae')]);
  });

  it('remonte une sous-action vers la mesure source', () => {
    expect(
      merge([createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.3')])
    ).toEqual([tagPilote(7)]);
  });

  it('laisse inchangé une origine déjà au niveau mesure', () => {
    expect(merge([createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3')])).toEqual([
      userPilote('user-cae'),
    ]);
  });

  it('fusionne CAE et ECI vers la même mesure TE', () => {
    expect(
      merge([
        createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
        createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.3'),
      ])
    ).toEqual([userPilote('user-cae'), tagPilote(7)]);
  });

  it('déduplique le même userId entre CAE et ECI', () => {
    const pilotesMap = new Map<string, PersonneId[]>([
      ['cae_6.1.3', [userPilote('shared-user')]],
      ['eci_3.3.1', [userPilote('shared-user')]],
    ]);

    expect(
      merge(
        [
          createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
          createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.3'),
        ],
        pilotesMap
      )
    ).toEqual([userPilote('shared-user')]);
  });

  it('déduplique entre deux origines pointant vers la même mesure source', () => {
    const pilotesMap = new Map<string, PersonneId[]>([
      ['cae_6.1.3', [userPilote('user-cae')]],
    ]);

    expect(
      merge(
        [
          createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
          createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.1'),
        ],
        pilotesMap
      )
    ).toEqual([userPilote('user-cae')]);
  });

  it('conserve userId CAE et tagId ECI comme deux lignes distinctes', () => {
    const pilotesMap = new Map<string, PersonneId[]>([
      ['cae_6.1.3', [userPilote('user-cae')]],
      ['eci_3.3.1', [tagPilote(7)]],
    ]);

    expect(
      merge(
        [
          createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
          createOrigine(ReferentielIdEnum.ECI, 'eci_3.3.1.3'),
        ],
        pilotesMap
      )
    ).toEqual([userPilote('user-cae'), tagPilote(7)]);
  });

  it('retourne un tableau vide sans pilote sur les mesures sources', () => {
    expect(
      merge([createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3')], new Map())
    ).toEqual([]);
  });

  it('ne lit aucun pilote si la hiérarchie est absente', () => {
    expect(
      merge(
        [createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3')],
        pilotesByMesureActionId,
        new Map()
      )
    ).toEqual([]);
  });

  it('retourne un tableau vide si originesConcernees est vide', () => {
    expect(merge([])).toEqual([]);
  });
});

describe('mergePilotes', () => {
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
    pilotesByMesureActionId,
    cibles: { sousActionsEtTaches: [], mesures },
    servicesByMesureActionId: new Map(),
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

    expect(mergePilotes(ctx)).toEqual([]);
  });

  it('agrège les pilotes des mesures concernées', () => {
    const ctx = createCtx([
      createCible({
        actionId: 'te_6.1.4',
        originesConcernees: [
          createOrigine(ReferentielIdEnum.CAE, 'cae_6.1.3.4.3'),
        ],
      }),
    ]);

    expect(mergePilotes(ctx)).toEqual([
      {
        collectiviteId: 1,
        actionId: 'te_6.1.4',
        userId: 'user-cae',
        tagId: null,
      },
    ]);
  });
});
