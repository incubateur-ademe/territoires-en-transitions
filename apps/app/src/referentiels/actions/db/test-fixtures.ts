import {
  BasicIndex,
  createCollection,
  localOnlyCollectionOptions,
} from '@tanstack/react-db';
import {
  ActionDynamicState,
  ActionStaticDefinition,
  ReferentielId,
} from '@tet/domain/referentiels';
import {
  ActionStatesCollection,
  ActionStateRow,
} from './action-states.collection';

export const buildDefinition = (
  actionId: string,
  {
    exprScore = null,
    referentielVersion = '1.0.0',
  }: { exprScore?: string | null; referentielVersion?: string } = {}
) =>
  ({
    actionId,
    referentielId: actionId.split('_')[0] as ReferentielId,
    referentielVersion,
    identifiant: actionId.split('_')[1],
    nom: `Nom ${actionId}`,
    description: `Description ${actionId}`,
    exprScore,
    labels: [],
  } as unknown as ActionStaticDefinition);

export const buildState = (
  actionId: string,
  {
    parentId = null,
    childrenIds = [],
  }: { parentId?: string | null; childrenIds?: string[] } = {}
) =>
  ({
    actionId,
    parentId,
    childrenIds,
    nextId: null,
    previousId: null,
    pilotes: [],
    services: [],
    scoresTag: {},
    score: { actionId, explication: `Explication ${actionId}` },
  } as unknown as ActionDynamicState);

export const toStateRows = (states: ActionDynamicState[]): ActionStateRow[] =>
  states.map((state, position) => ({ ...state, position }));

/** Collection d'état en mémoire, à la place de la collection adossée à tRPC */
export const createLocalStatesCollection = (rows: ActionStateRow[]) =>
  createCollection(
    localOnlyCollectionOptions<ActionStateRow, string>({
      getKey: (row) => row.actionId,
      initialData: rows,
      autoIndex: 'eager',
      defaultIndexType: BasicIndex,
    })
  ) as unknown as ActionStatesCollection;
