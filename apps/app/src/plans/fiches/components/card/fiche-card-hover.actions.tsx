import { appLabels } from '@/app/labels/catalog';
import { useDuplicateFiche } from '@/app/plans/fiches/duplicate-fiche/data/use-duplicate-fiche';
import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { DeleteOrRemoveFicheSharingModal } from '@/app/plans/fiches/shared/delete-or-remove-fiche-sharing.modal';
import MoveFicheModal from '@/app/plans/plans/show-plan/actions/move-fiche.modal';
import { Button, ButtonMenu } from '@tet/ui';
import { JSX, useState } from 'react';
import { EditFicheModal } from './edit-fiche.modal';

type OpenModal = 'edit' | 'delete' | 'move' | null;

type FicheCardHoverActionsProps = {
  readonly ficheAction: FicheListItem;
  readonly collectivitePlans: NonNullable<FicheListItem['plans']>;
  readonly hasEditMenu: boolean;
  readonly isMoveable: boolean;
  readonly planId?: number;
  readonly axeId?: number;
  readonly onUnlink?: () => void;
  readonly onToggleOpen?: (isOpen: boolean) => void;
};

export const FicheCardHoverActions = ({
  ficheAction,
  collectivitePlans,
  hasEditMenu,
  isMoveable,
  planId,
  axeId,
  onUnlink,
  onToggleOpen,
}: FicheCardHoverActionsProps): JSX.Element => {
  const [openModal, setOpenModal] = useState<OpenModal>(null);

  const { mutate: duplicateFiche } = useDuplicateFiche({
    ficheId: ficheAction.id,
    invalidatePlanId: planId,
  });

  const openEditModal = () => {
    setOpenModal('edit');
    onToggleOpen?.(true);
  };

  const closeEditModal = () => {
    setOpenModal(null);
    onToggleOpen?.(false);
  };

  return (
    <>
      {onUnlink && (
        <Button
          icon="link-unlink"
          title={appLabels.dissocierAction}
          variant="grey"
          size="xs"
          onClick={onUnlink}
        />
      )}
      {hasEditMenu && (
        <>
          {openModal === 'edit' && (
            <EditFicheModal
              initialFiche={ficheAction}
              isOpen
              setIsOpen={closeEditModal}
            />
          )}
          <Button
            icon="edit-line"
            title={appLabels.modifierAction}
            variant="grey"
            size="xs"
            onClick={openEditModal}
          />
          {isMoveable ? (
            <>
              <DeleteOrRemoveFicheSharingModal
                fiche={ficheAction}
                openState={{
                  isOpen: openModal === 'delete',
                  setIsOpen: (isOpen) => setOpenModal(isOpen ? 'delete' : null),
                }}
                hideButton
                planId={planId}
                axeId={axeId}
              />
              {openModal === 'move' && collectivitePlans.length > 0 && (
                <MoveFicheModal
                  fiche={ficheAction}
                  planId={planId ?? collectivitePlans[0].id}
                  isReadonly={false}
                  openState={{
                    isOpen: true,
                    setIsOpen: (isOpen) => setOpenModal(isOpen ? 'move' : null),
                  }}
                />
              )}
              <ButtonMenu
                title={appLabels.ficheOptions}
                icon="more-line"
                variant="grey"
                size="xs"
                menu={{
                  actions: [
                    {
                      label: appLabels.deplacer,
                      icon: 'drag-move-2-line',
                      onClick: () => setOpenModal('move'),
                    },
                    {
                      label: appLabels.dupliquerLAction,
                      icon: 'file-copy-line',
                      onClick: () => duplicateFiche(),
                    },
                    {
                      label: appLabels.supprimer,
                      icon: 'delete-bin-6-line',
                      variant: 'destructive',
                      onClick: () => setOpenModal('delete'),
                    },
                  ],
                }}
              />
            </>
          ) : (
            <DeleteOrRemoveFicheSharingModal
              fiche={ficheAction}
              planId={planId}
              axeId={axeId}
            />
          )}
        </>
      )}
    </>
  );
};
