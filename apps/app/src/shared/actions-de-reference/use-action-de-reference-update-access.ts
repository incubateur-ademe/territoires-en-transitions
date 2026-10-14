import { useUser } from '@tet/api/users';
import { hasPermission } from '@tet/domain/users';
import type { ActionDeReferenceUpdateAccess } from './actions-de-reference.contract';
import { useUpdateActionDeReferenceSidePanel } from './use-update-action-de-reference-side-panel';

export const useActionDeReferenceUpdateAccess =
  (): ActionDeReferenceUpdateAccess => {
    const user = useUser();
    const { open } = useUpdateActionDeReferenceSidePanel();
    const canUpdateActionsDeReference = hasPermission(
      user,
      'shared.actions-de-reference.mutate'
    );

    if (!canUpdateActionsDeReference) {
      return { status: 'forbidden' };
    }
    return { status: 'allowed', onUpdate: open };
  };
