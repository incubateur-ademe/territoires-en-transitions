import {
  ExtractedAction,
  ExtractedSousAction,
  isPinnedAction,
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
    // Les sous-actions d'un tableur lu par le code y ont déjà leur statut et
    // leurs dates.
    .flatMap((action, actionIndex) =>
      (isPinnedAction(action) ? [] : action.sousActions).map(
        (sousAction, sousActionIndex) => ({
          actionIndex,
          sousActionIndex,
          parentTitre: action.titre,
          sousAction,
        })
      )
    )
    .map((entry, index) => ({ index, ...entry }));

export const renderSousActionsToEnrich = (batch: IndexedSousAction[]): string =>
  batch
    .map(
      ({ index, parentTitre, sousAction }) =>
        `${index} | [Action parente : ${parentTitre}] ${sousAction.titre}`
    )
    .join('\n');
