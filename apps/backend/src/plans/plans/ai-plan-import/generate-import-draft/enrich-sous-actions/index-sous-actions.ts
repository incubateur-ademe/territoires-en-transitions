import {
  ExtractedAction,
  ExtractedSousAction,
} from '../../models/extracted-action';

export type IndexedSousAction = {
  index: number;
  actionIndex: number;
  sousActionIndex: number;
  parentTitre: string;
  sousAction: ExtractedSousAction;
};

export const indexSousActions = (
  actions: ExtractedAction[]
): IndexedSousAction[] =>
  actions
    .flatMap((action, actionIndex) =>
      action.sousActions.map((sousAction, sousActionIndex) => ({
        actionIndex,
        sousActionIndex,
        parentTitre: action.titre,
        sousAction,
      }))
    )
    .map((entry, index) => ({ index, ...entry }));

export const renderSousActionsToEnrich = (batch: IndexedSousAction[]): string =>
  batch
    .map(
      ({ index, parentTitre, sousAction }) =>
        `${index} | [Action parente : ${parentTitre}] ${sousAction.titre}`
    )
    .join('\n');
