import { isActionHidden } from '@tet/domain/referentiels';
import { useReferentielTeEnabled } from '../../use-referentiel-te-enabled';
import { ActionListItem } from '../use-list-actions';

export const useHideAction = (action: ActionListItem) => {
  const referentielTeEnabled = useReferentielTeEnabled();

  return isActionHidden(action.score.desactive, referentielTeEnabled);
};
