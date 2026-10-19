import type { Preselection } from '@/app/collectivites/priorisation-leviers/use-preselection';
import type { ActionDeReference } from '@tet/domain/shared';
import type {
  ActionDeReferenceInterestControl,
  ActionDeReferenceInterestStatus,
} from './actions-de-reference.contract';

export const toActionDeReferenceInterestControl = (
  action: ActionDeReference,
  status: ActionDeReferenceInterestStatus,
  actions: Pick<Preselection, 'add' | 'remove' | 'ignore' | 'restore'>,
  savedActionLabel?: string
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
    savedActionLabel,
  };
};
