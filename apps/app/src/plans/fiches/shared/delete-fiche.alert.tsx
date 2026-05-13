import { appLabels } from '@/app/labels/catalog';
import { useDeleteFiche } from '@/app/plans/fiches/data/use-delete-fiche';
import DeleteButton from '@/app/ui/buttons/DeleteButton';
import { Alert, Event, useEventTracker } from '@tet/ui';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
import { OpenState } from '@tet/ui/utils/types';
import {
  FicheListItem,
  useListFiches,
} from '../list-all-fiches/data/use-list-fiches';

type DeleteFicheModalProps = {
  openState?: OpenState;
  fiche: FicheListItem;
  buttonVariant?: 'white' | 'grey';
  buttonClassName?: string;
  onDeleteCallback?: () => void;
  onClose?: () => void;
  hideButton?: boolean;
  planId?: number;
  axeId?: number;
};

export const DeleteFicheModal = ({
  openState,
  fiche,
  buttonVariant,
  buttonClassName,
  onDeleteCallback,
  onClose,
  hideButton = false,
  planId,
  axeId,
}: DeleteFicheModalProps) => {
  const { id, titre, plans } = fiche;

  const tracker = useEventTracker();

  const { mutate: deleteFiche } = useDeleteFiche({
    onDeleteCallback,
    planId,
    axeId,
  });

  const { count: countSousActions } = useListFiches(
    fiche.collectiviteId,
    {
      filters: { parentsId: [fiche.id] },
      queryOptions: { limit: 1, page: 1 },
    },
    openState?.isOpen
  );

  const isInMultipleAxes = !!plans && plans.length > 1;
  const hasSousActions = countSousActions > 0;

  return (
    <AlertModal
      openState={{
        isOpen: openState?.isOpen ?? false,
        setIsOpen: (open) => {
          openState?.setIsOpen(open);
          if (!open) onClose?.();
        },
      }}
    >
      {!hideButton && (
        <AlertModal.Trigger>
          <DeleteButton
            title={appLabels.supprimerAction}
            variant={buttonVariant}
            size="xs"
            className={buttonClassName}
          />
        </AlertModal.Trigger>
      )}
      <AlertModal.Header>
        <AlertModal.Title>{appLabels.supprimerAction}</AlertModal.Title>
        <AlertModal.Subtitle>
          {titre || appLabels.actionSansTitre}
        </AlertModal.Subtitle>
      </AlertModal.Header>
      <AlertModal.Body>
        <AlertModal.Description>
          {appLabels.souhaitezVousVraimentSupprimerAction}
        </AlertModal.Description>
        {isInMultipleAxes && (
          <Alert
            state="warning"
            description={appLabels.actionPartageeEntreMultiplePlans}
          />
        )}
        {hasSousActions && (
          <Alert
            state="warning"
            description={appLabels.actionContientSousActions}
          />
        )}
      </AlertModal.Body>
      <AlertModal.Footer>
        <AlertModal.Cancel>{appLabels.annuler}</AlertModal.Cancel>
        <AlertModal.Action
          onClick={() => {
            deleteFiche({ ficheId: id });
            tracker(Event.fiches.deleteModaleValidation);
          }}
        >
          {appLabels.valider}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
};
