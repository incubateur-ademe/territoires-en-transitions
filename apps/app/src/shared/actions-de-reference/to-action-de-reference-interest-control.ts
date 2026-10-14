import type {
  ActionDeReference,
  ActionDeReferenceId,
} from '@tet/domain/shared';
import type {
  ActionDeReferenceInterestControl,
  ActionDeReferenceInterestStatus,
} from './actions-de-reference.contract';

type InterestActions = {
  readonly add: (action: ActionDeReference) => void;
  readonly remove: (actionId: ActionDeReferenceId) => void;
  readonly ignore: (actionId: ActionDeReferenceId) => void;
  readonly restore: (actionId: ActionDeReferenceId) => void;
};

export const toInterestControl = (
  action: ActionDeReference,
  status: ActionDeReferenceInterestStatus,
  actions: InterestActions
): ActionDeReferenceInterestControl => {
  if (status === 'ignoree') {
    return { status, onRestore: () => actions.restore(action.id) };
  }
  return {
    status,
    onToggleSaved: () =>
      status === 'preselectionnee'
        ? actions.remove(action.id)
        : actions.add(action),
    onDismiss: () => actions.ignore(action.id),
  };
};
