import { makeCollectivitePreselectionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useCollectiviteId } from '@tet/api/collectivites';
import type { ActionDeReference } from '@tet/domain/shared';
import { useRouter } from 'next/navigation';
import type { Preselection } from '../../use-preselection';

const SAVED_ACTION_TOAST_DURATION_IN_MS = 6000;

type SavedActionControls = Pick<
  Preselection,
  'actions' | 'add' | 'remove' | 'ignore' | 'restore'
>;

export const useSavedActionToasts = (
  preselection: SavedActionControls
): SavedActionControls => {
  const { setToastWithAction } = useToastContext();
  const router = useRouter();
  const collectiviteId = useCollectiviteId();

  const toUndoAction = (
    removedAction: ActionDeReference | undefined
  ): { label: string; onClick: () => void } | undefined => {
    if (removedAction === undefined) {
      return undefined;
    }
    return {
      label: appLabels.annuler,
      onClick: () => preselection.add(removedAction),
    };
  };

  return {
    ...preselection,
    add: (action) => {
      preselection.add(action);
      setToastWithAction({
        status: 'success',
        message: appLabels.actionSauvegardeeSucces,
        autoHideDuration: SAVED_ACTION_TOAST_DURATION_IN_MS,
        action: {
          label: appLabels.voirMesActionsSauvegardees,
          onClick: () =>
            router.push(makeCollectivitePreselectionUrl({ collectiviteId })),
        },
      });
    },
    remove: (actionId) => {
      const removedAction = preselection.actions.find(
        ({ id }) => id === actionId
      );
      preselection.remove(actionId);
      setToastWithAction({
        status: 'success',
        message: appLabels.actionRetireeDesSauvegardeesSucces,
        autoHideDuration: SAVED_ACTION_TOAST_DURATION_IN_MS,
        action: toUndoAction(removedAction),
      });
    },
  };
};
