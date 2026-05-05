import {
  getReferentielIdFromActionId,
  ReferentielIdEnum,
} from '@tet/domain/referentiels';
import { ActionListItem } from '../use-list-actions';

export const useHideAction = (action: ActionListItem) => {
  const referentielId = getReferentielIdFromActionId(action.actionId);
  const isHidden =
    Boolean(action.score.desactive) && referentielId === ReferentielIdEnum.TE;

  return isHidden;
};
