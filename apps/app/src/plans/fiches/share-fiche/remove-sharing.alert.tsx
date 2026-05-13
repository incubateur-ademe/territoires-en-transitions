import { Fiche } from '@/app/plans/fiches/data/use-get-fiche';
import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Alert, Button, cn } from '@tet/ui';
import { AlertModal } from '@tet/ui/design-system/AlertModal/index';
import { OpenState } from '@tet/ui/utils/types';
import { useUpdateFiche } from '../update-fiche/data/use-update-fiche';

type RemoveSharingModalProps = {
  openState?: OpenState;
  fiche: Pick<Fiche, 'titre'> & FicheShareProperties;
  buttonVariant?: 'white' | 'grey';
  buttonClassName?: string;
  onDeleteCallback?: () => void;
  onClose?: () => void;
  hideButton?: boolean;
};

export const RemoveSharingModal = ({
  openState,
  fiche,
  buttonVariant,
  buttonClassName,
  onDeleteCallback,
  onClose,
  hideButton = false,
}: RemoveSharingModalProps) => {
  const { id, titre, collectiviteNom } = fiche;
  const collectiviteId = useCollectiviteId();
  const { mutate: updateFiche } = useUpdateFiche({
    onUpdateCallback: onDeleteCallback,
  });

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
          <Button
            title={appLabels.retirerPartage}
            size="xs"
            icon="indeterminate-circle-line"
            variant={buttonVariant ?? 'grey'}
            className={cn('text-error-1 hover:text-[#db4f4f]', buttonClassName)}
          />
        </AlertModal.Trigger>
      )}
      <AlertModal.Header>
        <AlertModal.Title>{appLabels.retirerPartage}</AlertModal.Title>
        <AlertModal.Subtitle>
          {titre || appLabels.actionSansTitre}
        </AlertModal.Subtitle>
      </AlertModal.Header>
      <AlertModal.Body>
        <Alert
          state="warning"
          title={appLabels.retirerPartageDescription({
            collectiviteNom: collectiviteNom ?? '',
          })}
        />
      </AlertModal.Body>
      <AlertModal.Footer>
        <AlertModal.Cancel>{appLabels.annuler}</AlertModal.Cancel>
        <AlertModal.Action
          onClick={() => {
            const sharingWithoutCollectiviteId =
              fiche.sharedWithCollectivites?.filter(
                (sharing) => sharing.id !== collectiviteId
              ) || [];
            updateFiche({
              ficheId: id,
              ficheFields: {
                sharedWithCollectivites: sharingWithoutCollectiviteId,
              },
            });
          }}
        >
          {appLabels.valider}
        </AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal>
  );
};
