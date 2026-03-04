import {
  StatutAvancementDetaille,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { ActionListItem } from '../use-list-actions';
import { ActionStatutDetailleALaTacheModal } from './action-statut-detaille-a-la-tache.modal';
import { ActionStatutDetailleAuPourcentageModal } from './action-statut-detaille-au-pourcentage.modal';

type Props = {
  action: ActionListItem;
  statutToOpen: StatutAvancementDetaille | null;
  onClose: () => void;
};

export const OpenActionStatutDetailleModal = ({
  action,
  statutToOpen,
  onClose,
}: Props) => {
  if (statutToOpen === null) {
    return null;
  }

  return (
    <>
      {statutToOpen === StatutAvancementEnum.DETAILLE_A_LA_TACHE && (
        <ActionStatutDetailleALaTacheModal
          action={action}
          openState={{
            isOpen: true,
            setIsOpen: (isOpen) => {
              if (!isOpen) onClose();
            },
          }}
        />
      )}

      {statutToOpen === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE && (
        <ActionStatutDetailleAuPourcentageModal
          key={action.actionId}
          action={action}
          openState={{
            isOpen: true,
            setIsOpen: (isOpen) => {
              if (!isOpen) onClose();
            },
          }}
        />
      )}
    </>
  );
};
